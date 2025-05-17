import { useState, useEffect, useCallback } from 'react';
import { searchCards, getAutocompleteSuggestions } from '../utils/scryfallAPI';
import { getCachedSearchResults, cacheSearchResults } from '../utils/cardCache';

/**
 * Custom hook for card search functionality
 * @param {Object} initialOptions - Initial search options
 * @returns {Object} Search state and functions
 */
const useCardSearch = (initialOptions = {}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCards, setTotalCards] = useState(0);
  const [searchOptions, setSearchOptions] = useState(initialOptions);

  // Fetch autocomplete suggestions
  const fetchSuggestions = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await getAutocompleteSuggestions(searchQuery);
      setSuggestions(response.data || []);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setSuggestions([]);
    }
  }, []);

  // Debounced suggestion fetching
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuggestions(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, fetchSuggestions]);

  // Perform the search with the current query and options
  const performSearch = useCallback(async (searchQuery, page = 1) => {
    if (!searchQuery) {
      setResults([]);
      setHasMore(false);
      setTotalCards(0);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check cache first
      const cacheKey = `${searchQuery}_page${page}_${JSON.stringify(searchOptions)}`;
      const cachedResults = getCachedSearchResults(cacheKey);
      
      if (cachedResults) {
        setResults(page === 1 ? cachedResults.data : [...results, ...cachedResults.data]);
        setHasMore(cachedResults.has_more);
        setTotalCards(cachedResults.total_cards || 0);
      } else {
        // Fetch from API if not in cache
        const options = {
          ...searchOptions,
          page
        };
        
        const response = await searchCards(searchQuery, options);
        
        // Cache the results
        cacheSearchResults(cacheKey, response);
        
        // Update state with results
        if (page === 1) {
          setResults(response.data || []);
        } else {
          setResults(prevResults => [...prevResults, ...(response.data || [])]);
        }
        
        setHasMore(response.has_more || false);
        setTotalCards(response.total_cards || 0);
      }
    } catch (err) {
      setError(err.message || 'Error searching for cards');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [results, searchOptions]);

  // Execute search when query changes
  useEffect(() => {
    if (query) {
      performSearch(query, 1);
      setPage(1);
    }
  }, [query, searchOptions, performSearch]);

  // Function to load more results (next page)
  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;
    
    const nextPage = page + 1;
    setPage(nextPage);
    performSearch(query, nextPage);
  }, [isLoading, hasMore, page, query, performSearch]);

  // Update search options
  const updateSearchOptions = useCallback((newOptions) => {
    setSearchOptions(prevOptions => ({
      ...prevOptions,
      ...newOptions
    }));
  }, []);

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    loadMore,
    hasMore,
    totalCards,
    suggestions,
    searchOptions,
    updateSearchOptions,
    performSearch
  };
};

export default useCardSearch; 
import React, { useState, useEffect, useCallback } from 'react';
import { parseManaSymbols } from '../../utils/manaSymbols';
import { getOptimalImageUrl, IMAGE_CONTEXTS } from '../../utils/imageUtils.jsx';
import { useSubscription } from '../../context/SubscriptionContext';
import axios from 'axios'; // Import axios for API calls

const CardDetailModal = ({ card, onClose }) => {
  if (!card) return null;

  const { isPremium } = useSubscription();

  const [allArtworks, setAllArtworks] = useState([]);
  const [currentArtIndex, setCurrentArtIndex] = useState(0);
  const [artLoading, setArtLoading] = useState(false);
  const [currentFace, setCurrentFace] = useState(0);
  const [hasLoadedArtworks, setHasLoadedArtworks] = useState(false);

  // Add a simple cache to avoid refetching the same card's artworks
  const [artworkCache] = useState(new Map());

  // AI Strategic Overview states
  const [aiOverview, setAiOverview] = useState('');
  const [aiOverviewLoading, setAiOverviewLoading] = useState(false);
  const [hasLoadedAiOverview, setHasLoadedAiOverview] = useState(false);
  const [showAiOverview, setShowAiOverview] = useState(false);
  const [aiOverviewCache] = useState(new Map());

  // Enhanced function to get all card face images
  const getAllCardFaceImages = (card) => {
    if (!card) return [];

    try {
      const faces = [];

      // Single-faced card with direct image_uris
      if (card.image_uris && !card.card_faces) {
        const imageUrl = getOptimalImageUrl(card, 'DETAIL_MODAL');
        if (imageUrl) {
          faces.push({
            name: card.name,
            imageUrl: imageUrl,
            uris: card.image_uris,
            faceIndex: 0
          });
        }
      }
      // Multi-faced card
      else if (card.card_faces && card.card_faces.length > 0) {
        card.card_faces.forEach((face, index) => {
          const imageUrl = getOptimalImageUrl(card, 'DETAIL_MODAL', index);
          if (imageUrl) {
            faces.push({
              name: face.name || `${card.name} (Face ${index + 1})`,
              imageUrl: imageUrl,
              uris: face.image_uris,
              faceIndex: index,
              oracle_text: face.oracle_text,
              mana_cost: face.mana_cost,
              type_line: face.type_line,
              power: face.power,
              toughness: face.toughness,
              loyalty: face.loyalty
            });
          }
        });
      }

      return faces;
    } catch (error) {
      console.error('CardDetailModal: Error processing card face images:', error, card);
      return [];
    }
  };

  const cardFaces = getAllCardFaceImages(card);
  const isDoubleFaced = cardFaces.length > 1;
  const currentFaceData = cardFaces[currentFace] || cardFaces[0];

  const toggleFace = () => {
    if (isDoubleFaced) {
      setCurrentFace(prev => (prev + 1) % cardFaces.length);
    }
  };

  // Optimized artwork fetching with caching and lazy loading
  const fetchArtworks = useCallback(async () => {
    if (!card) return;

    // Create cache key based on card and current face
    const cacheKey = `${card.id}_${currentFace}`;
    
    // Check cache first
    if (artworkCache.has(cacheKey)) {
      console.log("Using cached artwork data for", card.name);
      const cachedData = artworkCache.get(cacheKey);
      setAllArtworks(cachedData.artworks);
      setCurrentArtIndex(cachedData.initialIndex);
      return;
    }

    setArtLoading(true);

    // For cards without oracle_id, use current card image only (fast path)
    if (!card.oracle_id) {
      console.log("Card has no oracle_id, using single artwork:", card.name);
      let initialArtUri;
      if (isDoubleFaced && currentFaceData) {
        initialArtUri = currentFaceData.imageUrl;
      } else {
        initialArtUri = card.image_uris?.png || card.image_uris?.large || card.image_uris?.normal;
      }
      
      if (initialArtUri) {
        const singleArtwork = [{
          uri: initialArtUri,
          setName: card.set_name,
          artist: card.artist,
          collector_number: card.collector_number,
          cardData: card
        }];
        setAllArtworks(singleArtwork);
        setCurrentArtIndex(0);
        artworkCache.set(cacheKey, { artworks: singleArtwork, initialIndex: 0 });
      }
      setArtLoading(false);
      return;
    }

    try {
      console.log("Fetching optimized artworks for card:", card.name, "Oracle ID:", card.oracle_id);
      
      const cardName = card.name.replace(/^A-/, ''); // Remove A- prefix for Arena cards
      
      // Optimized search strategy - limit results and prioritize efficiency
      let allPrints = [];
      
      // Single optimized search with limited results
          try {
        console.log("Primary search: Limited oracle-based search...");
        const response = await axios.get(`https://api.scryfall.com/cards/search?order=released&q=oracleid:${card.oracle_id}&include_extras=true&unique=prints`);
            
            if (response.data && response.data.data) {
          // Limit to first 20 results for performance
          allPrints = response.data.data.slice(0, 20);
          console.log(`Primary search: ${allPrints.length} prints found (limited)`);
        }
      } catch (e) {
        console.log("Primary search failed, trying name-based fallback...");
        
        // Fallback: Name-based search with even stricter limits
        try {
          const response = await axios.get(`https://api.scryfall.com/cards/search?order=released&q=name:"${encodeURIComponent(cardName)}"&include_extras=false&unique=prints`);
          if (response.data && response.data.data) {
            allPrints = response.data.data.slice(0, 10); // Even more limited fallback
            console.log(`Fallback search: ${allPrints.length} prints found (limited)`);
          }
        } catch (e2) {
          console.log("All searches failed, using current card only");
          allPrints = [card];
        }
      }
      
      console.log("Processing", allPrints.length, "total prints for", card.name);
      
      const uniqueArtworks = [];
      const seenImages = new Set(); // Simplified deduplication

      // Process prints with simplified logic for speed
      allPrints.forEach(print => {
        let artUri = null;

        // For single-faced cards
        if (print.image_uris && !isDoubleFaced) {
          artUri = print.image_uris.png || print.image_uris.large || print.image_uris.normal;
        }
        // For double-faced cards
        else if (print.card_faces && isDoubleFaced && print.card_faces[currentFace]?.image_uris) {
            artUri = print.card_faces[currentFace].image_uris.png || 
                     print.card_faces[currentFace].image_uris.large || 
                     print.card_faces[currentFace].image_uris.normal;
        }

        if (artUri && !seenImages.has(artUri)) {
          seenImages.add(artUri);
          
          // Determine treatment type (simplified)
          let treatmentType = 'Regular';
          if (print.frame_effects?.includes('extendedart')) {
            treatmentType = 'Extended Art';
          } else if (print.border_color === 'borderless') {
            treatmentType = 'Borderless';
          } else if (print.set_type === 'art_series') {
            treatmentType = 'Art Series';
          } else if (print.promo) {
            treatmentType = 'Promo';
          }

          uniqueArtworks.push({
            uri: artUri,
            setName: print.set_name,
            artist: print.artist,
            collector_number: print.collector_number,
            set: print.set,
            artId: print.illustration_id || `card_${print.id}`,
            oracleId: print.oracle_id,
            released_at: print.released_at,
            treatmentType: treatmentType,
            frameEffects: print.frame_effects,
            borderColor: print.border_color,
            setType: print.set_type,
            cardData: print
          });
        }
      });

      // Sort by release date (newest first)
      uniqueArtworks.sort((a, b) => new Date(b.released_at || 0) - new Date(a.released_at || 0));

      console.log("Found", uniqueArtworks.length, "unique artworks after processing");
      
      // Find initial index
      const currentCardImageUri = !isDoubleFaced 
        ? (card.image_uris?.png || card.image_uris?.large || card.image_uris?.normal)
        : (currentFaceData?.imageUrl);
      
      const initialIndex = uniqueArtworks.findIndex(art => art.uri === currentCardImageUri);
      const finalIndex = initialIndex !== -1 ? initialIndex : 0;
      
      setAllArtworks(uniqueArtworks);
      setCurrentArtIndex(finalIndex);
      
      // Cache the results
      artworkCache.set(cacheKey, { artworks: uniqueArtworks, initialIndex: finalIndex });

    } catch (error) {
      console.error("Error fetching card artworks:", error);
      
      // Final fallback to current card only
        const fallbackArtUri = isDoubleFaced && currentFaceData 
          ? currentFaceData.imageUrl 
          : card.image_uris?.png || card.image_uris?.large || card.image_uris?.normal;
        
        if (fallbackArtUri) {
        const fallbackArtwork = [{
            uri: fallbackArtUri,
            setName: card.set_name,
            artist: card.artist,
          collector_number: card.collector_number,
          cardData: card
        }];
        setAllArtworks(fallbackArtwork);
          setCurrentArtIndex(0);
        artworkCache.set(cacheKey, { artworks: fallbackArtwork, initialIndex: 0 });
      }
    }
    setArtLoading(false);
  }, [card?.id, card?.oracle_id, isDoubleFaced, currentFace, currentFaceData?.imageUrl]);

  // Lazy loading - only fetch artwork data when user wants to see other prints
  const handleLoadArtworks = () => {
    console.log("Loading artworks button clicked, hasLoadedArtworks:", hasLoadedArtworks);
    if (!hasLoadedArtworks) {
      setHasLoadedArtworks(true);
      fetchArtworks();
    }
  };

  // AI Strategic Overview fetch function
  const handleLoadAiOverview = async () => {
    if (!card) return;

    // Check if card is a commander or user has premium
    const isCommander = card.type_line?.toLowerCase().includes('legendary') && card.type_line?.toLowerCase().includes('creature');
    if (!isPremium && !isCommander) {
      setShowAiOverview(prev => !prev);
      setAiOverview('');
      setHasLoadedAiOverview(true);
      return;
    }

    // Toggle visibility state
    setShowAiOverview(prev => !prev);

    // If we already have data, no need to fetch again
    const cacheKey = `${card.id}_${currentFace}`;
    if (aiOverviewCache.has(cacheKey)) {
      setAiOverview(aiOverviewCache.get(cacheKey));
      setHasLoadedAiOverview(true);
      return;
    }

    setAiOverviewLoading(true);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [{
            role: 'user',
            content: `Analyze this Magic: The Gathering card for Commander/EDH format. Consider its strategic value, common use cases, and synergies:

Card Name: ${card.name}
Type: ${card.type_line}
Mana Cost: ${card.mana_cost || 'N/A'}
Oracle Text: ${card.oracle_text || 'N/A'}
Color Identity: ${card.color_identity?.join('') || 'Colorless'}

Please provide a concise strategic overview focusing on:
1. Key strengths and potential weaknesses
2. Notable synergies and combos
3. Types of decks that commonly use this card
4. Power level assessment for Commander format`
          }],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch AI overview');
      }

      const data = await response.json();
      const overview = data.choices[0]?.message?.content;

      if (overview) {
        setAiOverview(overview);
        aiOverviewCache.set(cacheKey, overview);
      }
    } catch (error) {
      console.error('Error fetching AI overview:', error);
      setAiOverview('Failed to generate AI overview. Please try again later.');
    } finally {
      setAiOverviewLoading(false);
      setHasLoadedAiOverview(true);
    }
  };

  // Initial setup - just use current card data
  useEffect(() => {
    if (card) {
      console.log("Initial setup for card:", card.name);
      
      // Reset lazy loading state for new card
      setHasLoadedArtworks(false);
      setArtLoading(false);
      
      // Reset AI overview state for new card
      setHasLoadedAiOverview(false);
      setAiOverviewLoading(false);
      setShowAiOverview(false);
      setAiOverview('');
      
      // Initialize with current card data only for fast loading
      const currentArtUri = isDoubleFaced && currentFaceData 
        ? currentFaceData.imageUrl 
        : card.image_uris?.png || card.image_uris?.large || card.image_uris?.normal;
      
      if (currentArtUri) {
        setAllArtworks([{
          uri: currentArtUri,
          setName: card.set_name,
          artist: card.artist,
          collector_number: card.collector_number,
          cardData: card
        }]);
        setCurrentArtIndex(0);
      }
    }
  }, [card?.id]); // Only depend on card ID, not other derived state

  // Only refetch artworks when face changes for double-faced cards, and only if already loaded
  useEffect(() => {
    if (isDoubleFaced && hasLoadedArtworks) {
      // Debounce face changes to avoid rapid API calls
      const timer = setTimeout(() => {
        console.log("Face changed, refetching artworks for face:", currentFace);
      fetchArtworks();
      }, 300); // 300ms debounce
      
      return () => clearTimeout(timer);
    }
  }, [currentFace, isDoubleFaced, hasLoadedArtworks, fetchArtworks]);
  
  const currentArtwork = allArtworks[currentArtIndex] || {};
  // For double-faced cards, prioritize current face data, otherwise use artwork or card image
  const mainImageUrl = isDoubleFaced && currentFaceData 
    ? (currentArtwork.uri || currentFaceData.imageUrl)
    : (currentArtwork.uri || card.image_uris?.png || card.image_uris?.large || card.image_uris?.normal);
  
  // Get the current printing's data for pricing and set-specific information
  const currentPrintingData = currentArtwork.cardData || card;
  
  // Use current face data for card details if it's a double-faced card
  const displayCard = isDoubleFaced && currentFaceData ? {
    ...card,
    name: currentFaceData.name,
    oracle_text: currentFaceData.oracle_text || card.oracle_text,
    mana_cost: currentFaceData.mana_cost || card.mana_cost,
    type_line: currentFaceData.type_line || card.type_line,
    power: currentFaceData.power || card.power,
    toughness: currentFaceData.toughness || card.toughness,
    loyalty: currentFaceData.loyalty || card.loyalty
  } : card;
  
  const cardText = displayCard.oracle_text || displayCard.description;

  const formatsToShow = [
    { key: 'standard', name: 'Standard' }, { key: 'pioneer', name: 'Pioneer' },
    { key: 'modern', name: 'Modern' }, { key: 'legacy', name: 'Legacy' },
    { key: 'vintage', name: 'Vintage' }, { key: 'commander', name: 'Commander' },
    { key: 'duel', name: 'Duel Cmdr' }, { key: 'paupercommander', name: 'Pauper EDH'},
    { key: 'brawl', name: 'Brawl' }, { key: 'historic', name: 'Historic' },
    { key: 'pauper', name: 'Pauper' }, { key: 'penny', name: 'Penny' },
    { key: 'historicbrawl', name: 'Historic Brawl' }, { key: 'alchemy', name: 'Alchemy' },
    { key: 'explorer', name: 'Explorer' }, { key: 'predh', name: 'PreDH'}
  ];

  const getLegalityClass = (status) => {
    switch (status) {
      case 'legal': return 'text-green-400';
      case 'not_legal': return 'text-red-400';
      case 'banned': return 'text-red-500 font-semibold';
      case 'restricted': return 'text-yellow-400';
      default: return 'text-gray-500';
    }
  };

  const PriceDisplay = ({ prices, printingInfo, isLoading }) => {
    if (isLoading) {
      return (
        <div className="mt-2 pt-2 border-t border-gray-700">
          <h4 className="text-sm font-semibold mb-1 text-gray-100">Prices:</h4>
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent mr-2"></div>
            <span className="text-xs text-gray-400">Loading pricing data...</span>
          </div>
        </div>
      );
    }
    
    if (!prices) return null;
    const { usd, usd_foil, usd_etched, tix } = prices;
    if (!usd && !usd_foil && !usd_etched && !tix) return null;
    return (
      <div className="mt-2 pt-2 border-t border-gray-700">
        <h4 className="text-sm font-semibold mb-1 text-gray-100">
          Prices:
          {printingInfo && allArtworks.length > 1 && (
            <span className="text-xs font-normal text-gray-400 ml-2">
              ({printingInfo.setName} #{printingInfo.collector_number})
            </span>
          )}
        </h4>
        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs text-gray-300">
          {usd && <p>USD: <span className="font-semibold text-gray-100">${usd}</span></p>}
          {usd_foil && <p>Foil: <span className="font-semibold text-gray-100">${usd_foil}</span></p>}
          {usd_etched && <p>Etched: <span className="font-semibold text-gray-100">${usd_etched}</span></p>}
          {tix && <p>Tix: <span className="font-semibold text-gray-100">{tix}</span></p>}
        </div>
      </div>
    );
  };

  const handlePrevArt = () => setCurrentArtIndex(prev => (prev - 1 + allArtworks.length) % allArtworks.length);
  const handleNextArt = () => setCurrentArtIndex(prev => (prev + 1) % allArtworks.length);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[70] p-2 sm:p-4 backdrop-blur-md overflow-y-auto" onClick={onClose}>
      <div className="bg-gray-800 p-3 sm:p-4 rounded-lg shadow-2xl max-w-4xl w-full max-h-[95vh] flex flex-col md:flex-row gap-3 sm:gap-4 relative text-gray-200 border border-gray-700" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-yellow-400 transition-colors z-20 p-1 bg-gray-700 hover:bg-gray-600 rounded-full"
          aria-label="Close modal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {/* Card Image Section */} 
        <div className="md:w-[40%] flex-shrink-0 flex flex-col justify-center items-center relative">
          <div className="relative">
            {mainImageUrl ? (
              <img 
                src={mainImageUrl} 
                alt={`Art for ${displayCard.name} - ${currentArtwork.setName || card.set_name}`}
                className="rounded-md max-w-full max-h-[75vh] md:max-h-[85vh] object-contain shadow-xl border-2 border-gray-600"
              />
            ) : (
              <div className="w-full aspect-[5/7] bg-gray-700 flex items-center justify-center text-gray-400 rounded-lg border-2 border-gray-600">
                {artLoading ? (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent mx-auto mb-2"></div>
                    <span className="text-xs">Loading Art...</span>
                  </div>
                ) : (
                  'No Image Available'
                )}
              </div>
            )}
            
            {/* Loading Overlay for Image */}
            {artLoading && mainImageUrl && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-md">
                <div className="text-center text-white">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mx-auto mb-2"></div>
                  <span className="text-xs">Loading artwork data...</span>
                </div>
              </div>
            )}
            
            {/* Double-faced card indicator on image */}
            {isDoubleFaced && (
              <div className="absolute top-2 left-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs px-2 py-1 rounded-full font-semibold shadow-lg z-10">
                DFC - Face {currentFace + 1}/{cardFaces.length}
              </div>
            )}
          </div>
          
          {/* Prominent Flip Button for Double-Faced Cards */}
          {isDoubleFaced && (
            <div className="mt-3 w-full flex justify-center">
              <button
                onClick={toggleFace}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center space-x-2 shadow-lg transition-all duration-200 transform hover:scale-105"
                title={`Flip to ${cardFaces[(currentFace + 1) % cardFaces.length]?.name || 'other side'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Flip to Face {(currentFace + 1) % cardFaces.length + 1}</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                  {currentFace + 1}/{cardFaces.length}
                </span>
              </button>
            </div>
          )}
          
          {allArtworks.length > 1 && (
            <div className="mt-2 w-full flex justify-between items-center px-1 z-10">
              <button 
                onClick={handlePrevArt} 
                disabled={artLoading}
                className={`bg-gray-600 hover:bg-gray-500 text-white text-xs py-1 px-2 rounded-md transition-colors ${artLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Prev Art
              </button>
              <p className="text-xs text-gray-400 mx-2 text-center">
                {artLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-3 w-3 border border-gray-400 border-t-transparent mr-1"></div>
                    <span>Loading...</span>
                  </div>
                ) : (
                  <>
                {currentArtIndex + 1} of {allArtworks.length}<br/>
                {isDoubleFaced && <span className="block text-yellow-400 font-semibold">{currentFaceData?.name}</span>}
                <span className="block truncate max-w-[120px]" title={`${currentArtwork.setName} #${currentArtwork.collector_number}`}>{currentArtwork.setName} #{currentArtwork.collector_number}</span>
                {currentArtwork.treatmentType && currentArtwork.treatmentType !== 'Regular' && (
                  <span className="block text-blue-300 font-semibold text-2xs">{currentArtwork.treatmentType}</span>
                )}
                <span className="block truncate max-w-[120px] italic" title={currentArtwork.artist}>by {currentArtwork.artist}</span>
                  </>
                )}
              </p>
              <button 
                onClick={handleNextArt} 
                disabled={artLoading}
                className={`bg-gray-600 hover:bg-gray-500 text-white text-xs py-1 px-2 rounded-md transition-colors ${artLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Next Art
              </button>
            </div>
          )}

          {/* Load More Versions Button - Show when only current card is loaded */}
          {allArtworks.length === 1 && !hasLoadedArtworks && !artLoading && card.oracle_id && (
            <div className="mt-3 w-full flex justify-center">
              <button
                onClick={handleLoadArtworks}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-4 rounded-md transition-colors flex items-center space-x-2"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Load Other Versions</span>
              </button>
            </div>
          )}

           {allArtworks.length === 1 && currentArtwork.setName && !artLoading && (hasLoadedArtworks || !card.oracle_id) && (
             <p className="text-xs text-gray-400 mt-2 text-center">
                {isDoubleFaced && <span className="block text-yellow-400 font-semibold truncate max-w-[180px]">{currentFaceData?.name}</span>}
                <span className="block truncate max-w-[180px]" title={`${currentArtwork.setName} #${currentArtwork.collector_number}`}>{currentArtwork.setName} #{currentArtwork.collector_number}</span>
                {currentArtwork.treatmentType && currentArtwork.treatmentType !== 'Regular' && (
                  <span className="block text-blue-300 font-semibold text-2xs">{currentArtwork.treatmentType}</span>
                )}
                <span className="block truncate max-w-[180px] italic" title={currentArtwork.artist}>by {currentArtwork.artist}</span>
                {hasLoadedArtworks && allArtworks.length === 1 && <span className="block text-gray-500 text-2xs mt-1">(Only version found)</span>}
              </p>
           )}
        </div>

        {/* Card Info Section */} 
        <div className="md:w-[60%] flex flex-col overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 pr-1 sm:pr-1.5 flex-grow">
          <h2 className="text-xl sm:text-2xl font-bold text-yellow-400 tracking-wide mb-0.5 sm:mb-1 pr-6">{displayCard.name}</h2>
          <div className="flex justify-between items-baseline mb-1 sm:mb-1.5">
            <span className="text-gray-300 text-sm sm:text-base">{displayCard.type_line || displayCard.type}</span>
            {displayCard.mana_cost && <span className="text-yellow-400 font-mono text-sm sm:text-base">{parseManaSymbols(displayCard.mana_cost)}</span>}
          </div>
          
          {cardText && (
            <div className="bg-gray-700 p-2 sm:p-3 rounded-md mb-1.5 sm:mb-2 text-xs sm:text-sm text-gray-200 leading-normal whitespace-pre-wrap border border-gray-600">
              {cardText.split('\n').map((line, index) => (
                <p key={index} className="mb-1 last:mb-0">{parseManaSymbols(line)}</p>
              ))}
            </div>
          )}

          {(displayCard.flavor_text || card.flavor_text) && (
            <div className="italic text-2xs sm:text-xs text-gray-400 border-t border-gray-700 pt-1.5 mt-1.5 mb-1.5 sm:mb-2">
              {(displayCard.flavor_text || card.flavor_text).split('\n').map((line, index) => <p key={index} className="mb-0.5 last:mb-0">{line}</p>)}
            </div>
          )}

          {/* AI Strategic Overview Section */}
          <div className="my-1.5 sm:my-2 py-1.5 sm:py-2 border-t border-b border-gray-700">
            <button
              onClick={handleLoadAiOverview}
              className="w-full flex items-center justify-between text-left hover:bg-gray-700/30 p-2 rounded-md transition-colors"
            >
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 rounded bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h4 className="text-sm font-semibold text-purple-300">AI Strategic Overview</h4>
                {!isPremium && (
                  <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-2xs px-2 py-0.5 rounded-full font-semibold">
                    PREMIUM
                  </span>
                )}
                {aiOverviewLoading && isPremium && (
                  <div className="animate-spin rounded-full h-3 w-3 border border-purple-400 border-t-transparent"></div>
                )}
              </div>
              <svg 
                className={`w-4 h-4 text-gray-400 transition-transform ${showAiOverview ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showAiOverview && isPremium && (
              <div className="mt-3 px-2">
                {aiOverviewLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-400 border-t-transparent mr-3"></div>
                    <span className="text-sm text-gray-300">Generating strategic analysis...</span>
                  </div>
                ) : aiOverview ? (
                  <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-4">
                    <div className="text-xs sm:text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
                      {aiOverview.split('\n').map((paragraph, index) => (
                        paragraph.trim() && <p key={index} className="mb-3 last:mb-0">{paragraph.trim()}</p>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 text-center py-4">
                    Click to load AI strategic overview
                  </div>
                )}
              </div>
            )}

            {!isPremium && !isCommander && (
              <div className="mt-3 px-2">
                <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-500/30 rounded-lg p-4 text-center">
                  <div className="mb-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center mx-auto mb-2">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <h5 className="text-sm font-semibold text-yellow-300 mb-1">Premium Feature</h5>
                    <p className="text-xs text-gray-300 mb-3">
                      AI Strategic Overview is available for commanders in the free plan. Upgrade to Premium to get AI analysis for all cards!
                    </p>
                  </div>
                  <a
                    href={getPaymentUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-modern btn-modern-primary btn-modern-xs"
                  >
                    Upgrade to Premium
                  </a>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-x-2 sm:gap-x-3 gap-y-0.5 text-2xs sm:text-xs mb-1.5 sm:mb-2 text-gray-300">
            {(displayCard.power || displayCard.toughness) && (<p><strong>P/T:</strong> {displayCard.power}/{displayCard.toughness}</p>)}
            {displayCard.loyalty && (<p><strong>Loyalty:</strong> {displayCard.loyalty}</p>)}
            {currentPrintingData.rarity && (<p><strong>Rarity:</strong> <span className="capitalize">{currentPrintingData.rarity}</span></p>)}
            {/* Artist is now shown under the image with art navigation */}
          </div>
          
          {(card.edhrec_rank || card.game_changer) && (
            <div className="my-1 sm:my-1.5 py-1 sm:py-1.5 border-t border-b border-gray-700 text-2xs sm:text-xs">
              {card.edhrec_rank && (<p className="text-gray-300">EDHREC Rank: <span className="font-semibold text-gray-100">{card.edhrec_rank.toLocaleString()}</span></p>)}
              {card.game_changer && (
                <>
                  <p className="text-green-400 font-semibold mt-0.5 flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Game Changer
                  </p>
                  <div className="mt-1 text-2xs text-gray-400 bg-gray-700/50 rounded-md p-2 border border-gray-600/50">
                    <p>Based on EDHREC data analysis, this card has been identified as a high-impact card that significantly influences deck performance and win rates. Game changers often provide exceptional value or create powerful synergies within their archetypes.</p>
                  </div>
                </>
              )}
            </div>
          )}

          <PriceDisplay prices={currentPrintingData.prices} printingInfo={currentPrintingData} isLoading={artLoading} />

          {currentPrintingData.legalities && (
            <div className="mt-2 pt-2 border-t border-gray-700 flex-grow flex flex-col min-h-[80px]">
              <h4 className="text-xs sm:text-sm font-semibold mb-1 text-gray-100">Format Legalities:</h4>
              <div className="grid grid-cols-2 gap-x-2 sm:gap-x-3 gap-y-0 text-2xs sm:text-xs flex-grow overflow-y-auto max-h-28 sm:max-h-32 scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-700 pr-0.5">
                {formatsToShow.sort((a,b) => a.name.localeCompare(b.name)).map(format => {
                  const status = currentPrintingData.legalities[format.key];
                  return (
                    <div key={format.key} className="flex justify-between items-center">
                      <span className="text-gray-300">{format.name}:</span>
                      <span className={`${getLegalityClass(status)} capitalize font-medium`}>{status ? status.replace('_', ' ') : '???'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          <div className="mt-auto pt-2 space-x-3 text-center">
            {currentPrintingData.scryfall_uri && <a href={currentPrintingData.scryfall_uri} target="_blank" rel="noopener noreferrer" className="text-2xs sm:text-xs text-blue-400 hover:text-blue-300 underline">Scryfall</a>}
            {currentPrintingData.related_uris?.edhrec && <a href={currentPrintingData.related_uris.edhrec} target="_blank" rel="noopener noreferrer" className="text-2xs sm:text-xs text-purple-400 hover:text-purple-300 underline">EDHREC</a>}
          </div>

          <p className="text-2xs sm:text-xs text-gray-500 mt-1.5 text-center">
            {artLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-3 w-3 border border-gray-500 border-t-transparent mr-1"></div>
                <span>Loading printing info...</span>
              </div>
            ) : (
              <>
                Current Printing: {currentPrintingData.set_name} ({currentPrintingData.set?.toUpperCase()}) — #{currentPrintingData.collector_number || 'N/A'}
                {allArtworks.length > 1 && <span className="block mt-1">Use arrow buttons above to view different printings</span>}
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CardDetailModal; 
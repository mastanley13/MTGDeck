import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { blogService } from '../services/blogService';

const BlogPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const categories = ['All', 'Blog', 'Guides', 'Strategy', 'Deck Ideas', 'News'];

  useEffect(() => {
    fetchPosts();
  }, [selectedCategory]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let fetchedPosts;
      if (selectedCategory === 'All') {
        fetchedPosts = await blogService.getAllPosts();
      } else {
        fetchedPosts = await blogService.getPostsByCategory(selectedCategory);
      }
      
      setPosts(fetchedPosts);
    } catch (err) {
      setError('Failed to load blog posts. Please try again later.');
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Blog': 'bg-blue-500/20 text-blue-300',
      'Guides': 'bg-green-500/20 text-green-300',
      'Strategy': 'bg-purple-500/20 text-purple-300',
      'Deck Ideas': 'bg-orange-500/20 text-orange-300',
      'News': 'bg-red-500/20 text-red-300'
    };
    return colors[category] || 'bg-primary-500/20 text-primary-300';
  };

  return (
    <div className="min-h-screen bg-slate-900 overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-blue-500/8 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-primary-600/6 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6">
            <span className="text-gradient-primary">MTG Commander</span> Blog
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
            Discover strategies, deck guides, and insights from the Commander community
          </p>
          
          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-primary-500 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Blog Posts Grid */}
        {loading && (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-slate-400">Loading blog posts...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-16">
            <div className="mb-8">
              <svg className="w-16 h-16 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Error Loading Posts</h3>
            <p className="text-red-400 mb-8">{error}</p>
            <button 
              onClick={fetchPosts}
              className="btn-modern btn-modern-primary btn-modern-md"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && posts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {posts.map((post) => (
              <Link 
                key={post.id}
                to={`/blog/${encodeURIComponent(post.slug)}`}
                className="card-modern hover-glow group"
              >
                <div className="overflow-hidden rounded-t-3xl">
                  {post.image && (
                    <img 
                      src={post.image} 
                      alt={post.title}
                      className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  )}
                  {(!post.image || !post.image.trim()) && (
                    <div className="w-full h-48 bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                      <img 
                        src="/public/images/aitutoricon.png" 
                        alt="AI Deck Tutor"
                        className="w-16 h-16 object-contain opacity-60"
                      />
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-3 py-1 rounded-full text-sm ${getCategoryColor(post.category)}`}>
                      {post.category}
                    </span>
                    <span className="text-slate-400 text-sm">{post.readTime}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary-300 transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-slate-400 mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-300 text-sm">{post.author.name}</span>
                    </div>
                    <span className="text-slate-500 text-sm">{formatDate(post.date)}</span>
                  </div>
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {post.tags.slice(0, 3).map((tag) => (
                        <span 
                          key={tag}
                          className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-xs"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && !error && posts.length === 0 && (
          <div className="text-center py-16">
            <div className="mb-8">
              <svg className="w-16 h-16 mx-auto text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">No Blog Posts Yet</h3>
            <p className="text-slate-400 mb-8">
              {selectedCategory === 'All' 
                ? 'Blog posts will appear here once they are published.'
                : `No posts found in the "${selectedCategory}" category.`
              }
            </p>
            {selectedCategory !== 'All' && (
              <button
                onClick={() => setSelectedCategory('All')}
                className="btn-modern btn-modern-primary btn-modern-md"
              >
                View All Posts
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogPage; 
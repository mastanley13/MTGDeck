import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const BlogPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const categories = ['All', 'Guides', 'Strategy', 'Deck Ideas', 'News', 'Other'];

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
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Discover strategies, deck guides, and insights from the Commander community
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2 rounded-full transition-all duration-300 ${
                selectedCategory === category
                  ? 'bg-primary-500 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Empty State */}
        <div className="text-center py-16">
          <div className="mb-8">
            <svg className="w-16 h-16 mx-auto text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path>
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">No Blog Posts Yet</h3>
          <p className="text-slate-400 mb-8">Blog posts will appear here once they are published.</p>
        </div>

        {/* Newsletter Section */}
        <div className="mt-24 relative card-modern p-8 sm:p-12 hover-glow animate-fade-in text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-blue-500/20 rounded-3xl blur-xl transition-all duration-500"></div>
          <div className="relative">
            <h3 className="text-3xl font-bold text-white mb-4">Stay Updated</h3>
            <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
              Subscribe to our newsletter to receive the latest Commander strategies, deck tech, and MTG insights directly in your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-6 py-3 rounded-xl bg-slate-800 text-white border border-slate-700 focus:border-primary-500 focus:outline-none"
              />
              <button className="btn-modern btn-modern-primary btn-modern-md whitespace-nowrap">
                Subscribe Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogPage; 
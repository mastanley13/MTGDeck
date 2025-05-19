import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="container mx-auto px-4">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-xl mb-16">
        <div className="absolute inset-0 bg-logoScheme-darkGray opacity-90"></div>
        <div className="relative z-10 px-6 py-16 sm:px-8 sm:py-24 lg:py-32 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            <span className="block">Build Powerful</span>
            <span className="block text-logoScheme-gold">Commander Decks</span>
          </h1>
          <p className="mt-6 max-w-lg mx-auto text-xl text-gray-300 opacity-90 mb-10">
            Create, optimize, and share your Magic: The Gathering decks with AI-powered recommendations
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              to="/builder" 
              className="btn-primary px-8 py-4 shadow-lg hover:shadow-xl transform hover:-translate-y-1 duration-200"
            >
              Start Building
            </Link>
            <Link 
              to="/decks" 
              className="btn-outline px-8 py-4 shadow-lg hover:shadow-xl transform hover:-translate-y-1 duration-200"
            >
              View Your Decks
            </Link>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="max-w-7xl mx-auto mb-20">
        <h2 className="text-3xl font-bold text-logoScheme-gold text-center mb-12">
          Powerful Tools for Commander Brewers
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl shadow-card p-6 transform transition duration-300 hover:shadow-card-hover hover:-translate-y-1">
            <div className="h-14 w-14 rounded-lg bg-logoScheme-brown flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-7 h-7 text-logoScheme-gold">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-logoScheme-darkGray mb-2">Comprehensive Search</h3>
            <p className="text-gray-700">
              Access the entire Scryfall database, with powerful filtering tools to find exactly what your deck needs.
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-card p-6 transform transition duration-300 hover:shadow-card-hover hover:-translate-y-1">
            <div className="h-14 w-14 rounded-lg bg-logoScheme-brown flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-7 h-7 text-logoScheme-gold">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-logoScheme-darkGray mb-2">AI Recommendations</h3>
            <p className="text-gray-700">
              Get intelligent card suggestions based on your commander and existing deck composition.
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-card p-6 transform transition duration-300 hover:shadow-card-hover hover:-translate-y-1">
            <div className="h-14 w-14 rounded-lg bg-logoScheme-brown flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-7 h-7 text-logoScheme-gold">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-logoScheme-darkGray mb-2">Deck Analytics</h3>
            <p className="text-gray-700">
              Visualize your deck's mana curve, color distribution, and card type breakdown to ensure a balanced strategy.
            </p>
          </div>
        </div>
      </div>
      
      {/* Color Identity Section */}
      <div className="max-w-7xl mx-auto bg-logoScheme-darkGray rounded-xl p-6 lg:p-10 shadow-sm mb-20 border border-logoScheme-gold">
        <h2 className="text-2xl font-bold text-center mb-6 text-logoScheme-gold">Build Decks for Any Color Identity</h2>
        <div className="flex flex-wrap justify-center gap-6">
          <div className="color-badge white w-14 h-14 hover:scale-110 transition-transform cursor-pointer"></div>
          <div className="color-badge blue w-14 h-14 hover:scale-110 transition-transform cursor-pointer"></div>
          <div className="color-badge black w-14 h-14 hover:scale-110 transition-transform cursor-pointer"></div>
          <div className="color-badge red w-14 h-14 hover:scale-110 transition-transform cursor-pointer"></div>
          <div className="color-badge green w-14 h-14 hover:scale-110 transition-transform cursor-pointer"></div>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="text-center py-12 my-10 bg-logoScheme-darkGray rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-logoScheme-gold mb-6">Ready to Build Your Next Commander Deck?</h2>
        <p className="text-xl text-gray-300 opacity-90 mb-8 max-w-3xl mx-auto px-4">
          Join thousands of players using our AI-powered deck builder to create optimized Commander decks
        </p>
        <Link 
          to="/builder" 
          className="btn-primary px-8 py-4 shadow-lg inline-block"
        >
          Start Building Now
        </Link>
      </div>
    </div>
  );
};

export default HomePage; 
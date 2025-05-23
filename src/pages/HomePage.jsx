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
              className="btn-primary px-10 py-5 text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 duration-200"
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
            <div className="h-14 w-14 rounded-lg bg-logoScheme-gold flex items-center justify-center mb-4">
              <img src="/images/cards.png" alt="Deck Builder AI Icon" className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-logoScheme-darkGray mb-2">Deck Builder AI</h3>
            <p className="text-gray-700">
              Leverage AI to intelligently construct and refine your decks, drawing from the comprehensive Scryfall database with advanced filtering.
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-card p-6 transform transition duration-300 hover:shadow-card-hover hover:-translate-y-1">
            <div className="h-14 w-14 rounded-lg bg-logoScheme-gold flex items-center justify-center mb-4">
              <img src="/images/Flashicon.png" alt="Commander AI Icon" className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-logoScheme-darkGray mb-2">Commander AI</h3>
            <p className="text-gray-700">
              Receive AI-driven insights and card recommendations tailored specifically to your chosen commander and overall deck strategy.
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-card p-6 transform transition duration-300 hover:shadow-card-hover hover:-translate-y-1">
            <div className="h-14 w-14 rounded-lg bg-logoScheme-gold flex items-center justify-center mb-4">
              <img src="/images/aitutoricon.png" alt="Tutor AI Icon" className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-logoScheme-darkGray mb-2">Tutor AI</h3>
            <p className="text-gray-700">
              Utilize AI-powered tutoring to efficiently search and discover the perfect cards from your deck or the vast card library to complete your combos or answer threats.
            </p>
          </div>
        </div>
      </div>
      
      {/* Color Identity Section */}
      <div className="max-w-7xl mx-auto bg-logoScheme-darkGray rounded-xl p-6 lg:p-10 shadow-sm mb-20 border border-logoScheme-gold">
        <h2 className="text-2xl font-bold text-center mb-6 text-logoScheme-gold">Build Decks for Any Color Identity</h2>
        <div className="flex flex-wrap justify-center gap-6 text-5xl">
          <i className="ms ms-w ms-cost hover:scale-110 transition-transform cursor-pointer"></i>
          <i className="ms ms-u ms-cost hover:scale-110 transition-transform cursor-pointer"></i>
          <i className="ms ms-b ms-cost hover:scale-110 transition-transform cursor-pointer"></i>
          <i className="ms ms-r ms-cost hover:scale-110 transition-transform cursor-pointer"></i>
          <i className="ms ms-g ms-cost hover:scale-110 transition-transform cursor-pointer"></i>
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
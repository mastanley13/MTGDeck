import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl mb-20 glassmorphism-card">
          {/* Background gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 via-blue-600/20 to-primary-700/20"></div>
          
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-4 -left-4 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-4 -right-4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>
          
          <div className="relative z-10 px-8 py-20 sm:px-12 sm:py-28 lg:py-36 text-center">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-8 leading-tight">
              <span className="block animate-fade-in">Build Powerful</span>
              <span className="block text-gradient-primary animate-fade-in delay-200">Commander Decks</span>
            </h1>
            <p className="mt-8 max-w-2xl mx-auto text-xl sm:text-2xl text-slate-300 mb-12 leading-relaxed animate-fade-in delay-300">
              Create, optimize, and share your Magic: The Gathering decks with AI-powered recommendations and professional-grade tools
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6 animate-fade-in delay-500">
              <Link 
                to="/builder" 
                className="btn-modern btn-modern-primary btn-modern-lg transform hover:scale-105 transition-all duration-300 shadow-modern-primary premium-glow"
              >
                <span className="flex items-center space-x-2">
                  <span>Start Building</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </Link>
              <Link 
                to="/decks" 
                className="btn-modern btn-modern-outline btn-modern-lg transform hover:scale-105 transition-all duration-300 glassmorphism"
              >
                <span className="flex items-center space-x-2">
                  <span>View Your Decks</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </span>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Features Section */}
        <div className="max-w-7xl mx-auto mb-24">
          <h2 className="text-4xl lg:text-5xl font-bold text-gradient-primary text-center mb-6 animate-fade-in">
            Powerful Tools for Commander Brewers
          </h2>
          <p className="text-xl text-slate-400 text-center mb-16 max-w-3xl mx-auto animate-fade-in delay-200">
            Leverage cutting-edge AI technology to build, optimize, and perfect your Commander decks
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Deck Builder AI Card */}
            <div className="card-modern card-modern-interactive p-8 hover-glow animate-fade-in delay-300">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary-500 to-blue-500 flex items-center justify-center mb-6 shadow-modern-primary">
                <img src="/images/cards.png" alt="Deck Builder AI Icon" className="w-8 h-8 filter brightness-0 invert" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Deck Builder AI</h3>
              <p className="text-slate-300 leading-relaxed mb-6">
                Leverage AI to intelligently construct and refine your decks, drawing from the comprehensive Scryfall database with advanced filtering and smart recommendations.
              </p>
              <Link to="/builder" className="btn-modern btn-modern-ghost btn-modern-sm group">
                <span>Try Builder</span>
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
            
            {/* Commander AI Card */}
            <div className="card-modern card-modern-interactive p-8 hover-glow animate-fade-in delay-400">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary-500 to-blue-500 flex items-center justify-center mb-6 shadow-modern-primary">
                <img src="/images/Flashicon.png" alt="Commander AI Icon" className="w-8 h-8 filter brightness-0 invert" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Commander AI</h3>
              <p className="text-slate-300 leading-relaxed mb-6">
                Receive AI-driven insights and card recommendations tailored specifically to your chosen commander and overall deck strategy for optimal synergy.
              </p>
              <Link to="/commander-ai" className="btn-modern btn-modern-ghost btn-modern-sm group">
                <span>Try Commander AI</span>
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
            
            {/* Tutor AI Card */}
            <div className="card-modern card-modern-interactive p-8 hover-glow animate-fade-in delay-500">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary-500 to-blue-500 flex items-center justify-center mb-6 shadow-modern-primary">
                <img src="/images/aitutoricon.png" alt="Tutor AI Icon" className="w-8 h-8 filter brightness-0 invert" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Tutor AI</h3>
              <p className="text-slate-300 leading-relaxed mb-6">
                Utilize AI-powered tutoring to efficiently search and discover the perfect cards from your deck or the vast card library to complete combos and answer threats.
              </p>
              <Link to="/tutor-ai" className="btn-modern btn-modern-ghost btn-modern-sm group">
                <span>Try Tutor AI</span>
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Color Identity Section */}
        <div className="max-w-5xl mx-auto glassmorphism-card p-10 lg:p-16 mb-24 border-modern-primary animate-fade-in">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-8 text-gradient-primary">
            Build Decks for Any Color Identity
          </h2>
          <p className="text-lg text-slate-400 text-center mb-10 max-w-2xl mx-auto">
            Master all five colors of mana with intelligent suggestions and synergy analysis
          </p>
          <div className="flex flex-wrap justify-center gap-8 text-6xl lg:text-7xl">
            <div className="group cursor-pointer">
              <i className="ms ms-w ms-cost hover:scale-125 transition-all duration-300 filter drop-shadow-lg group-hover:drop-shadow-xl"></i>
            </div>
            <div className="group cursor-pointer">
              <i className="ms ms-u ms-cost hover:scale-125 transition-all duration-300 filter drop-shadow-lg group-hover:drop-shadow-xl"></i>
            </div>
            <div className="group cursor-pointer">
              <i className="ms ms-b ms-cost hover:scale-125 transition-all duration-300 filter drop-shadow-lg group-hover:drop-shadow-xl"></i>
            </div>
            <div className="group cursor-pointer">
              <i className="ms ms-r ms-cost hover:scale-125 transition-all duration-300 filter drop-shadow-lg group-hover:drop-shadow-xl"></i>
            </div>
            <div className="group cursor-pointer">
              <i className="ms ms-g ms-cost hover:scale-125 transition-all duration-300 filter drop-shadow-lg group-hover:drop-shadow-xl"></i>
            </div>
          </div>
        </div>
        
        {/* Stats Section */}
        <div className="max-w-6xl mx-auto mb-24 animate-fade-in">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-gradient-primary mb-2">10K+</div>
              <div className="text-slate-400 text-lg">Decks Created</div>
            </div>
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-gradient-primary mb-2">50K+</div>
              <div className="text-slate-400 text-lg">Cards Analyzed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-gradient-primary mb-2">99%</div>
              <div className="text-slate-400 text-lg">User Satisfaction</div>
            </div>
          </div>
        </div>
        
        {/* Final CTA Section */}
        <div className="relative overflow-hidden glassmorphism-card p-12 lg:p-20 text-center shadow-modern animate-fade-in">
          {/* Background effects */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary-600/10 via-blue-600/10 to-primary-700/10"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <h2 className="text-4xl lg:text-5xl font-bold text-gradient-primary mb-6">
              Ready to Build Your Next Commander Deck?
            </h2>
            <p className="text-xl lg:text-2xl text-slate-300 mb-10 max-w-4xl mx-auto leading-relaxed">
              Join thousands of players using our AI-powered deck builder to create optimized Commander decks that dominate the battlefield
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <Link 
                to="/builder" 
                className="btn-modern btn-modern-primary btn-modern-xl premium-glow transform hover:scale-105 transition-all duration-300"
              >
                <span className="flex items-center space-x-3">
                  <span>Start Building Now</span>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </Link>
              <Link 
                to="/register" 
                className="btn-modern btn-modern-outline btn-modern-xl transform hover:scale-105 transition-all duration-300"
              >
                <span className="flex items-center space-x-3">
                  <span>Create Free Account</span>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 
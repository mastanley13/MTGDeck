import React from 'react';
import { Link } from 'react-router-dom';
import { Seo } from '../components/Seo';

const HomePage = () => {
  return (
    <>
      <Seo 
        title="AI Deck Tutor - Build Powerful MTG Commander Decks with AI"
        description="Create, optimize, and share your Magic: The Gathering Commander decks with AI-powered recommendations and professional-grade tools. Build better decks with AI assistance."
      />
      
      <div className="min-h-screen bg-slate-900 overflow-hidden">
        {/* Background effects */}
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-blue-500/8 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-primary-600/6 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        {/* Content */}
        <div className="relative z-10">
          {/* Hero Section */}
          <section className="relative min-h-screen flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-gradient-to-b from-primary-600/10 via-transparent to-blue-600/10"></div>
            
            <div className="relative z-10 text-center max-w-5xl mx-auto">
              {/* Logo */}
              <div className="mb-12 animate-fade-in">
                <img 
                  src="https://storage.googleapis.com/msgsndr/zKZ8Zy6VvGR1m7lNfRkY/media/6830e4ad6417b23718765500.png" 
                  alt="MTG Commander Deck Builder Logo" 
                  className="h-24 sm:h-32 lg:h-40 mx-auto drop-shadow-2xl hover:scale-105 transition-transform duration-300"
                />
              </div>
              
              <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold text-white mb-8 leading-tight">
                <span className="block animate-fade-in">Build Powerful</span>
                <span className="block text-gradient-primary animate-fade-in delay-200">Commander Decks</span>
              </h1>
              
              <p className="mt-8 max-w-3xl mx-auto text-2xl sm:text-3xl text-slate-300 mb-16 leading-relaxed animate-fade-in delay-300">
                Create, optimize, and share your Magic: The Gathering decks with AI-powered recommendations and professional-grade tools
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-8 animate-fade-in delay-500">
                <Link 
                  to="/builder" 
                  className="btn-modern btn-modern-primary btn-modern-xl premium-glow transform hover:scale-105 transition-all duration-300"
                >
                  <span className="flex items-center space-x-3">
                    <span>Start Building</span>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </Link>
                
                <Link 
                  to="/decks" 
                  className="btn-modern btn-modern-outline btn-modern-xl glassmorphism transform hover:scale-105 transition-all duration-300"
                >
                  <span className="flex items-center space-x-3">
                    <span>View Your Decks</span>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </span>
                </Link>
              </div>
            </div>

            {/* Transition */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-slate-900/50"></div>
          </section>

          {/* Features Section */}
          <section className="relative py-32 px-4">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-800/30 to-slate-900/50"></div>
            
            <div className="relative z-10 max-w-7xl mx-auto">
              <div className="text-center mb-20">
                <h2 className="text-5xl lg:text-6xl font-bold text-gradient-primary mb-8 animate-fade-in">
                  Powerful Tools for Commander Brewers
                </h2>
                <p className="text-2xl text-slate-400 max-w-4xl mx-auto animate-fade-in delay-200">
                  Leverage cutting-edge AI technology to build, optimize, and perfect your Commander decks
                </p>
              </div>
              
              <div className="grid lg:grid-cols-3 gap-12">
                {/* Deck Builder AI Card */}
                <div className="group relative h-full deck-builder-section">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-blue-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-0 group-hover:opacity-100"></div>
                  <div className="relative card-modern p-10 hover-glow animate-fade-in delay-300 border-primary-500/20 group-hover:border-primary-400/30 transition-all duration-500 h-full flex flex-col">
                    <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-primary-500 to-blue-500 flex items-center justify-center mb-8 shadow-modern-primary group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}>
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                        <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.77 3.77z" />
                      </svg>
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-6">Deck Builder AI</h3>
                    <p className="text-slate-300 leading-relaxed mb-8 text-lg flex-grow">
                      Leverage AI to intelligently construct and refine your decks, drawing from the comprehensive Scryfall database with advanced filtering and smart recommendations.
                    </p>
                    <Link to="/builder" className="btn-modern btn-modern-ghost btn-modern-md group/btn mt-auto">
                      <span>Try Builder</span>
                      <svg className="w-5 h-5 ml-2 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Link>
                  </div>
                </div>

                {/* Commander AI Card */}
                <div className="group relative h-full commander-ai-section">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-blue-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-0 group-hover:opacity-100"></div>
                  <div className="relative card-modern p-10 hover-glow animate-fade-in delay-400 border-primary-500/20 group-hover:border-primary-400/30 transition-all duration-500 h-full flex flex-col">
                    <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-primary-500 to-blue-500 flex items-center justify-center mb-8 shadow-modern-primary group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}>
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-6">Commander AI</h3>
                    <p className="text-slate-300 leading-relaxed mb-8 text-lg flex-grow">
                      Get personalized commander suggestions and deck recommendations based on your playstyle and preferences.
                    </p>
                    <Link to="/commander-ai" className="btn-modern btn-modern-ghost btn-modern-md group/btn mt-auto">
                      <span>Explore AI</span>
                      <svg className="w-5 h-5 ml-2 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Link>
                  </div>
                </div>

                {/* Card Search Card */}
                <div className="group relative h-full card-search-section">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-blue-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-0 group-hover:opacity-100"></div>
                  <div className="relative card-modern p-10 hover-glow animate-fade-in delay-500 border-primary-500/20 group-hover:border-primary-400/30 transition-all duration-500 h-full flex flex-col">
                    <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-primary-500 to-blue-500 flex items-center justify-center mb-8 shadow-modern-primary group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}>
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-6">Advanced Search</h3>
                    <p className="text-slate-300 leading-relaxed mb-8 text-lg flex-grow">
                      Search through thousands of cards with advanced filters, price tracking, and detailed card information.
                    </p>
                    <Link to="/card-search" className="btn-modern btn-modern-ghost btn-modern-md group/btn mt-auto">
                      <span>Search Cards</span>
                      <svg className="w-5 h-5 ml-2 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Color Identity Section */}
          <section className="relative py-32 px-4">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-primary-900/10 to-slate-900/50"></div>
            
            <div className="relative z-10 max-w-6xl mx-auto text-center">
              <h2 className="text-4xl lg:text-5xl font-bold text-gradient-primary mb-8 animate-fade-in">
                Master All Five Colors
              </h2>
              <p className="text-xl text-slate-400 mb-16 max-w-3xl mx-auto animate-fade-in delay-200">
                Build decks for any color identity with intelligent suggestions and synergy analysis
              </p>
              <div className="flex flex-wrap justify-center gap-12 text-7xl lg:text-8xl animate-fade-in delay-300">
                <div className="group cursor-pointer transform hover:scale-125 transition-all duration-500">
                  <i className="ms ms-w ms-cost filter drop-shadow-2xl group-hover:drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]"></i>
                </div>
                <div className="group cursor-pointer transform hover:scale-125 transition-all duration-500">
                  <i className="ms ms-u ms-cost filter drop-shadow-2xl group-hover:drop-shadow-[0_0_30px_rgba(59,130,246,0.7)]"></i>
                </div>
                <div className="group cursor-pointer transform hover:scale-125 transition-all duration-500">
                  <i className="ms ms-b ms-cost filter drop-shadow-2xl group-hover:drop-shadow-[0_0_30px_rgba(0,0,0,0.8)]"></i>
                </div>
                <div className="group cursor-pointer transform hover:scale-125 transition-all duration-500">
                  <i className="ms ms-r ms-cost filter drop-shadow-2xl group-hover:drop-shadow-[0_0_30px_rgba(239,68,68,0.7)]"></i>
                </div>
                <div className="group cursor-pointer transform hover:scale-125 transition-all duration-500">
                  <i className="ms ms-g ms-cost filter drop-shadow-2xl group-hover:drop-shadow-[0_0_30px_rgba(34,197,94,0.7)]"></i>
                </div>
              </div>
            </div>
          </section>

          {/* Everything You Need Section */}
          <section className="relative py-32 px-4">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-primary-900/5 to-slate-900/80"></div>
            
            <div className="relative z-10 max-w-7xl mx-auto">
              <div className="text-center mb-20">
                <h2 className="text-4xl lg:text-5xl font-bold text-gradient-primary mb-8 animate-fade-in">
                  Everything You Need to Build Perfect Decks
                </h2>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* AI-Powered Building */}
                <div className="group text-center animate-fade-in delay-300 px-2">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary-500 to-blue-500 flex items-center justify-center mx-auto mb-6 shadow-modern-primary group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 leading-tight">AI-Powered Building</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Intelligent deck construction with AI recommendations tailored to your strategy
                  </p>
                </div>

                {/* Scryfall Integration */}
                <div className="group text-center animate-fade-in delay-400 px-2">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary-500 to-blue-500 flex items-center justify-center mx-auto mb-6 shadow-modern-primary group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 leading-tight">Scryfall Integration</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Access the complete Magic card database with advanced filtering and search
                  </p>
                </div>

                {/* Instant Optimization */}
                <div className="group text-center animate-fade-in delay-500 px-2">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary-500 to-blue-500 flex items-center justify-center mx-auto mb-6 shadow-modern-primary group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 leading-tight">Instant Optimization</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Real-time deck analysis and suggestions to improve your mana curve and synergies
                  </p>
                </div>

                {/* Commander-Focused */}
                <div className="group text-center animate-fade-in delay-600 px-2">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary-500 to-blue-500 flex items-center justify-center mx-auto mb-6 shadow-modern-primary group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 leading-tight">Commander-Focused</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Built specifically for Commander format with specialized tools and recommendations for 100-card singleton decks.
                  </p>
                </div>

                {/* Advanced Analytics */}
                <div className="group text-center animate-fade-in delay-700 px-2 deck-analytics-section">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary-500 to-blue-500 flex items-center justify-center mx-auto mb-6 shadow-modern-primary group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 leading-tight">Advanced Analytics</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Get detailed insights into your deck's performance with mana curve analysis, card type distribution, and synergy scoring.
                  </p>
                </div>

                {/* Easy Deck Management */}
                <div className="group text-center animate-fade-in delay-800 px-2 import-export-section">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary-500 to-blue-500 flex items-center justify-center mx-auto mb-6 shadow-modern-primary group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 leading-tight">Easy Deck Management</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Save, organize, and share your decks with a clean, intuitive interface
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Blog & Resources Section */}
          <section className="relative py-32 px-4">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-800/30 to-slate-900/50"></div>
            
            <div className="relative z-10 max-w-7xl mx-auto">
              <div className="text-center mb-20">
                <h2 className="text-5xl lg:text-6xl font-bold text-gradient-primary mb-8 animate-fade-in">
                  Learn & Improve Your Game
                </h2>
                <p className="text-2xl text-slate-400 max-w-4xl mx-auto animate-fade-in delay-200">
                  Access expert insights, strategy guides, and the latest Commander meta analysis
                </p>
              </div>
              
              <div className="grid lg:grid-cols-2 gap-12">
                {/* Blog Section */}
                <div className="group relative h-full blog-section">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-blue-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-0 group-hover:opacity-100"></div>
                  <div className="relative card-modern p-10 hover-glow animate-fade-in delay-300 border-primary-500/20 group-hover:border-primary-400/30 transition-all duration-500 h-full flex flex-col">
                    <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-primary-500 to-blue-500 flex items-center justify-center mb-8 shadow-modern-primary group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-6">MTG Blog & Resources</h3>
                    <p className="text-slate-300 leading-relaxed mb-8 text-lg flex-grow">
                      Stay updated with the latest Commander strategies, card reviews, and meta analysis from our expert team.
                    </p>
                    <Link to="/blog" className="btn-modern btn-modern-ghost btn-modern-md group/btn mt-auto">
                      <span>Read Blog</span>
                      <svg className="w-5 h-5 ml-2 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Link>
                  </div>
                </div>

                {/* Tutor AI Section */}
                <div className="group relative h-full tutor-ai-section">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-blue-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-0 group-hover:opacity-100"></div>
                  <div className="relative card-modern p-10 hover-glow animate-fade-in delay-400 border-primary-500/20 group-hover:border-primary-400/30 transition-all duration-500 h-full flex flex-col">
                    <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-primary-500 to-blue-500 flex items-center justify-center mb-8 shadow-modern-primary group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-6">AI Gameplay Tutor</h3>
                    <p className="text-slate-300 leading-relaxed mb-8 text-lg flex-grow">
                      Learn advanced strategies and get real-time advice during your games with our AI tutor.
                    </p>
                    <Link to="/tutor-ai" className="btn-modern btn-modern-ghost btn-modern-md group/btn mt-auto">
                      <span>Get Tutored</span>
                      <svg className="w-5 h-5 ml-2 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Final CTA Section */}
          <section className="relative py-40 px-4">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-primary-900/10 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-radial from-primary-500/5 via-transparent to-transparent"></div>
            
            <div className="relative z-10 max-w-6xl mx-auto text-center">
              <h2 className="text-5xl lg:text-6xl font-bold text-gradient-primary mb-10 animate-fade-in">
                Ready to Build Your Next Commander Deck?
              </h2>
              <p className="text-2xl lg:text-3xl text-slate-300 mb-16 max-w-5xl mx-auto leading-relaxed animate-fade-in delay-200">
                Join thousands of players using our AI-powered deck builder to create optimized Commander decks that dominate the battlefield
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-8 animate-fade-in delay-400">
                <Link 
                  to="/builder" 
                  className="btn-modern btn-modern-primary btn-modern-xl premium-glow transform hover:scale-105 transition-all duration-300 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  <span className="relative flex items-center space-x-3">
                    <span>Start Building Now</span>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </Link>
                <Link 
                  to="/register" 
                  className="btn-modern btn-modern-outline btn-modern-xl glassmorphism transform hover:scale-105 transition-all duration-300 group"
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
          </section>
        </div>
      </div>
    </>
  );
};

export default HomePage; 
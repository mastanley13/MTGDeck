import React from 'react';

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Background effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/8 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 space-y-12">
        {/* Hero Header */}
        <div className="text-center">
          <h1 className="text-5xl lg:text-6xl font-bold text-gradient-primary mb-6">
            🎯 About MTG Deck Builder
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Empowering Magic: The Gathering players with AI-driven deck building tools and comprehensive card analysis
          </p>
        </div>
        
        {/* Mission Section */}
        <div className="glassmorphism-card p-8 lg:p-12 border-primary-500/20">
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-primary-500 to-blue-500 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white">Our Mission</h2>
          </div>
          <div className="space-y-6 text-lg text-slate-300 leading-relaxed">
            <p>
              MTG Commander Deck Builder combines the power of <span className="text-primary-400 font-semibold">cutting-edge AI</span> with 
              comprehensive Magic: The Gathering card data to help players create optimized Commander decks. Our tool makes deck building 
              easier, more intuitive, and more exciting by suggesting synergistic cards based on your commander and theme.
            </p>
            <p>
              Whether you're a seasoned Commander player looking to refine your strategies or a newcomer trying to build your first deck, 
              our platform provides <span className="text-primary-400 font-semibold">valuable insights and recommendations</span> to enhance 
              your Magic: The Gathering experience.
            </p>
          </div>
        </div>
        
        {/* Features Section */}
        <div className="glassmorphism-card p-8 lg:p-12 border-primary-500/20">
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-primary-500 to-blue-500 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white">Features</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z", text: "Intelligent card suggestions powered by AI" },
              { icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z", text: "Commander-specific synergy analysis" },
              { icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z", text: "Comprehensive search capabilities" },
              { icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", text: "Deck validation against Commander format rules" },
              { icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", text: "Mana curve and color distribution visualization" },
              { icon: "M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", text: "Export options for popular platforms" },
              { icon: "M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z", text: "Deck sharing capabilities" }
            ].map((feature, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:border-primary-500/30 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary-500 to-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} />
                  </svg>
                </div>
                <span className="text-slate-300 text-lg">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* How It Works Section */}
        <div className="glassmorphism-card p-8 lg:p-12 border-primary-500/20">
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-primary-500 to-blue-500 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white">How It Works</h2>
          </div>
          <div className="space-y-8">
            {[
              { step: 1, title: "Choose Your Commander", description: "Select from thousands of legendary creatures to lead your deck.", icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" },
              { step: 2, title: "Define Your Theme", description: "Tell us what strategy or theme you're going for with your deck.", icon: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4 4 4 0 004-4V5z" },
              { step: 3, title: "Get AI Suggestions", description: "Our AI will analyze your commander and theme to suggest synergistic cards.", icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" },
              { step: 4, title: "Build & Refine", description: "Add cards to your deck and use our tools to refine and optimize it.", icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" },
              { step: 5, title: "Export & Share", description: "Export your deck to your preferred format or share it with friends.", icon: "M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" }
            ].map((step, index) => (
              <div key={index} className="flex items-start space-x-6 p-6 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:border-primary-500/30 transition-colors">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-primary-500 to-blue-500 flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-lg">{step.step}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white flex items-center space-x-3">
                    <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={step.icon} />
                    </svg>
                    <span>{step.title}</span>
                  </h3>
                  <p className="text-slate-300 text-lg leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Credits Section */}
        <div className="glassmorphism-card p-8 lg:p-12 border-primary-500/20">
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-primary-500 to-blue-500 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white">Credits & Acknowledgments</h2>
          </div>
          <div className="space-y-6">
            <p className="text-lg text-slate-300 leading-relaxed">
              MTG Commander Deck Builder is powered by industry-leading technologies and comprehensive data sources:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:border-primary-500/30 transition-colors text-center">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Card Data</h3>
                <p className="text-slate-400 mb-3">Comprehensive card information</p>
                <a href="https://scryfall.com/docs/api" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">
                  Scryfall API →
                </a>
              </div>
              
              <div className="p-6 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:border-primary-500/30 transition-colors text-center">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">AI Power</h3>
                <p className="text-slate-400 mb-3">Intelligent recommendations</p>
                <a href="https://openai.com" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">
                  OpenAI →
                </a>
              </div>
              
              <div className="p-6 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:border-primary-500/30 transition-colors text-center">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Technology</h3>
                <p className="text-slate-400 mb-3">Modern web development</p>
                <span className="text-primary-400 font-semibold">React • TailwindCSS • Node.js</span>
              </div>
            </div>
            
            <div className="mt-8 p-6 rounded-xl bg-slate-800/20 border border-slate-700/30">
              <p className="text-sm text-slate-500 leading-relaxed">
                <strong className="text-slate-400">Legal Notice:</strong> Magic: The Gathering and all related properties are owned by Wizards of the Coast. 
                This application is not affiliated with, endorsed, sponsored, or specifically approved by Wizards of the Coast. 
                All card images and data are used under fair use for educational and deck building purposes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About; 
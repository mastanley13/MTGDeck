import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const HowToPlayPage = () => {
  const [activeSection, setActiveSection] = useState('basics');
  const [expandedSections, setExpandedSections] = useState({});
  const observerRef = useRef(null);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  useEffect(() => {
    // Auto-expand the active section
    setExpandedSections(prev => ({
      ...prev,
      [activeSection]: true
    }));

    // Set up intersection observer for section highlighting
    const options = {
      root: null,
      rootMargin: '-20% 0px -75% 0px', // Adjust these values to control when sections become "active"
      threshold: 0
    };

    const callback = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    observerRef.current = new IntersectionObserver(callback, options);

    // Observe all section elements
    document.querySelectorAll('section[id]').forEach(section => {
      observerRef.current.observe(section);
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const sections = [
    { id: 'basics', title: 'Magic Basics', icon: '🎲' },
    { id: 'commander', title: 'Commander Format', icon: '👑' },
    { id: 'deckbuilding', title: 'Deck Building', icon: '🔨' },
    { id: 'gameplay', title: 'Gameplay Tips', icon: '⚔️' },
    { id: 'politics', title: 'Politics & Strategy', icon: '🤝' },
    { id: 'advanced', title: 'Advanced Play', icon: '🧠' },
    { id: 'resources', title: 'Resources', icon: '📚' }
  ];

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Fixed background - matches other pages */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900">
        {/* Animated background orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/8 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-primary-600/6 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary-400 via-primary-500 to-blue-500 bg-clip-text text-transparent mb-4">
            How to Play Magic: The Gathering
          </h1>
          <h2 className="text-2xl text-slate-300 mb-6">
            Commander Format Guide
          </h2>
          <p className="text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Whether you're a total beginner or a seasoned Magic player looking to dive into Commander, 
            this guide will walk you through everything from basic rules to advanced strategies. 
            Commander is currently MTG's most popular format – a casual, multiplayer experience 
            centered around legendary leaders, huge decks, and epic plays.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Table of Contents - Sidebar */}
          <div className="lg:w-1/4">
            <div className="sticky top-24 bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-700/30 p-6">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                <span className="mr-3">📋</span>
                Table of Contents
              </h3>
              <nav className="space-y-3">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all duration-300 flex items-center ${
                      activeSection === section.id
                        ? 'bg-gradient-to-r from-primary-500/20 to-blue-500/20 text-primary-400 border border-primary-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/50 border border-transparent hover:border-slate-600/30'
                    }`}
                  >
                    <span className="mr-3">{section.icon}</span>
                    <span className="font-medium">{section.title}</span>
                  </button>
                ))}
              </nav>

              {/* Quick Action Buttons */}
              <div className="mt-8 space-y-3">
                <Link
                  to="/builder"
                  className="w-full inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-primary-500 to-blue-500 text-white rounded-xl font-semibold hover:from-primary-600 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <span className="mr-2">🔨</span>
                  Start Building
                </Link>
                <Link
                  to="/commander-ai"
                  className="w-full inline-flex items-center justify-center px-4 py-2 bg-slate-900/60 text-slate-200 rounded-xl font-medium hover:bg-slate-800/60 transition-all duration-300 border border-slate-600/40"
                >
                  <span className="mr-2">⚔️</span>
                  Commander AI
                </Link>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            <div className="space-y-12">
              {/* Magic Basics Section */}
              <section id="basics" className="bg-slate-950/60 backdrop-blur-xl rounded-2xl border border-slate-600/40 p-8">
                <div className="flex items-center mb-6">
                  <span className="text-4xl mr-4">🎲</span>
                  <h2 className="text-3xl font-bold text-white">Magic: The Gathering Basics</h2>
                </div>
                
                <div className="space-y-6">
                  <div className="bg-slate-950/80 rounded-xl p-6 border border-slate-600/30">
                    <h3 className="text-xl font-semibold text-primary-400 mb-4">🎯 Objective of the Game</h3>
                    <p className="text-slate-300 leading-relaxed mb-4">
                      Magic: The Gathering is a strategic card game where each player assumes the role of a powerful wizard (planeswalker) 
                      battling others. In Commander, each player starts at <strong className="text-primary-400">40 life</strong> instead of 20. 
                      The goal is to eliminate all opponents by:
                    </p>
                    <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                      <li>Reducing their life to 0</li>
                      <li>Dealing 21+ combat damage with your Commander</li>
                      <li>Making them draw from an empty library</li>
                      <li>Special win conditions from specific cards</li>
                    </ul>
                  </div>

                  <div className="bg-slate-950/80 rounded-xl p-6 border border-slate-600/30">
                    <h3 className="text-xl font-semibold text-primary-400 mb-4">🃏 Types of Cards</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <div className="bg-slate-950/60 rounded-lg p-4">
                          <h4 className="font-semibold text-white mb-2">🏔️ Land Cards</h4>
                          <p className="text-sm text-slate-300">Your primary resource cards that produce mana to cast spells. You can play one per turn.</p>
                        </div>
                        <div className="bg-slate-950/60 rounded-lg p-4">
                          <h4 className="font-semibold text-white mb-2">🐉 Creature Cards</h4>
                          <p className="text-sm text-slate-300">Permanents that fight for you with power (attack) and toughness (defense).</p>
                        </div>
                        <div className="bg-slate-950/60 rounded-lg p-4">
                          <h4 className="font-semibold text-white mb-2">📜 Sorcery Cards</h4>
                          <p className="text-sm text-slate-300">One-time spell effects you can only cast on your turn during main phase.</p>
                        </div>
                        <div className="bg-slate-950/60 rounded-lg p-4">
                          <h4 className="font-semibold text-white mb-2">⚡ Instant Cards</h4>
                          <p className="text-sm text-slate-300">Spells you can cast anytime, perfect for reacting to opponents' plays.</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="bg-slate-950/60 rounded-lg p-4">
                          <h4 className="font-semibold text-white mb-2">✨ Enchantment Cards</h4>
                          <p className="text-sm text-slate-300">Permanents with ongoing magical effects that stay on the battlefield.</p>
                        </div>
                        <div className="bg-slate-950/60 rounded-lg p-4">
                          <h4 className="font-semibold text-white mb-2">⚙️ Artifact Cards</h4>
                          <p className="text-sm text-slate-300">Objects or equipment that any color deck can use, often providing utility.</p>
                        </div>
                        <div className="bg-slate-950/60 rounded-lg p-4">
                          <h4 className="font-semibold text-white mb-2">🔮 Planeswalker Cards</h4>
                          <p className="text-sm text-slate-300">Powerful allies with loyalty abilities that act like a second player on your side.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 rounded-xl p-6 border border-slate-600/30">
                    <h3 className="text-xl font-semibold text-primary-400 mb-4">🔄 Turn Structure</h3>
                    <div className="space-y-3">
                      <div className="flex items-center p-3 bg-slate-950/60 rounded-lg">
                        <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-sm font-bold mr-4">1</div>
                        <div>
                          <strong className="text-white">Beginning Phase:</strong>
                          <span className="text-slate-300 ml-2">Untap → Upkeep → Draw</span>
                        </div>
                      </div>
                      <div className="flex items-center p-3 bg-slate-950/60 rounded-lg">
                        <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-sm font-bold mr-4">2</div>
                        <div>
                          <strong className="text-white">Main Phase:</strong>
                          <span className="text-slate-300 ml-2">Play lands, cast spells</span>
                        </div>
                      </div>
                      <div className="flex items-center p-3 bg-slate-950/60 rounded-lg">
                        <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-sm font-bold mr-4">3</div>
                        <div>
                          <strong className="text-white">Combat Phase:</strong>
                          <span className="text-slate-300 ml-2">Declare attackers → Declare blockers → Damage</span>
                        </div>
                      </div>
                      <div className="flex items-center p-3 bg-slate-950/60 rounded-lg">
                        <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-sm font-bold mr-4">4</div>
                        <div>
                          <strong className="text-white">Second Main Phase:</strong>
                          <span className="text-slate-300 ml-2">Cast more spells after combat</span>
                        </div>
                      </div>
                      <div className="flex items-center p-3 bg-slate-950/60 rounded-lg">
                        <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-sm font-bold mr-4">5</div>
                        <div>
                          <strong className="text-white">End Phase:</strong>
                          <span className="text-slate-300 ml-2">End step → Cleanup</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Commander Format Section */}
              <section id="commander" className="bg-slate-950/60 backdrop-blur-xl rounded-2xl border border-slate-600/40 p-8">
                <div className="flex items-center mb-6">
                  <span className="text-4xl mr-4">👑</span>
                  <h2 className="text-3xl font-bold text-white">What Is Commander?</h2>
                </div>
                
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-primary-500/10 to-blue-500/10 rounded-xl p-6 border border-primary-500/20">
                    <p className="text-lg text-slate-200 leading-relaxed">
                      Commander is a casual multiplayer format with special deckbuilding rules that set it apart from traditional Magic. 
                      It's all about big plays, social interaction, and creative decks built around legendary creatures.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-slate-950/80 rounded-xl p-6 border border-slate-600/30">
                      <h3 className="text-xl font-semibold text-primary-400 mb-4 flex items-center">
                        <span className="mr-3">📊</span>
                        Deck Requirements
                      </h3>
                      <ul className="space-y-4 text-slate-300">
                        <li className="flex items-start">
                          <span className="w-2 h-2 bg-primary-400 rounded-full mr-3 mt-2"></span>
                          <span><strong>100 Cards Exactly: </strong>99 cards in the main deck plus 1 Commander</span>
                        </li>
                        <li className="flex items-start">
                          <span className="w-2 h-2 bg-primary-400 rounded-full mr-3 mt-2"></span>
                          <span><strong>Singleton Format: </strong>Only 1 copy of each card allowed (except basic lands)</span>
                        </li>
                        <li className="flex items-start">
                          <span className="w-2 h-2 bg-primary-400 rounded-full mr-3 mt-2"></span>
                          <span><strong>Commander Requirements: </strong>Must be a legendary creature or a planeswalker that specifically states it can be your commander</span>
                        </li>
                        <li className="flex items-start">
                          <span className="w-2 h-2 bg-primary-400 rounded-full mr-3 mt-2"></span>
                          <span><strong>Color Identity: </strong>All cards in your deck must match your commander's color identity</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-slate-950/80 rounded-xl p-6 border border-slate-600/30">
                      <h3 className="text-xl font-semibold text-primary-400 mb-4 flex items-center">
                        <span className="mr-3">🎮</span>
                        Game Rules
                      </h3>
                      <ul className="space-y-4 text-slate-300">
                        <li className="flex items-start">
                          <span className="w-2 h-2 bg-blue-400 rounded-full mr-3 mt-2"></span>
                          <span><strong>Starting Life Total: </strong>40 life points instead of the usual 20</span>
                        </li>
                        <li className="flex items-start">
                          <span className="w-2 h-2 bg-blue-400 rounded-full mr-3 mt-2"></span>
                          <span><strong>Player Count: </strong>Usually played with 3-4 players in a free-for-all format</span>
                        </li>
                        <li className="flex items-start">
                          <span className="w-2 h-2 bg-blue-400 rounded-full mr-3 mt-2"></span>
                          <span><strong>Commander Damage: </strong>A player loses if they take 21 or more combat damage from a single commander</span>
                        </li>
                        <li className="flex items-start">
                          <span className="w-2 h-2 bg-blue-400 rounded-full mr-3 mt-2"></span>
                          <span><strong>Command Zone: </strong>Your commander starts here and costs 2 more mana each time it's cast from this zone</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 rounded-xl p-6 border border-slate-600/30">
                    <h3 className="text-xl font-semibold text-primary-400 mb-4">🎯 The Command Zone & Commander Tax</h3>
                    <p className="text-slate-300 leading-relaxed mb-4">
                      Your Commander doesn't start in your deck - it begins in the <strong>Command Zone</strong>, face-up for all to see. 
                      You can cast it from there as if it were in your hand, but each time you've cast it before, 
                      it costs <strong className="text-primary-400">2 more colorless mana</strong> (the "Commander Tax").
                    </p>
                    <div className="bg-slate-950/60 rounded-lg p-4">
                      <h4 className="font-semibold text-white mb-2">Example:</h4>
                      <p className="text-sm text-slate-300">
                        If your Commander normally costs {"{3}{G}{G}"} (5 mana total):
                      </p>
                      <ul className="text-sm text-slate-300 mt-2 space-y-1 ml-4">
                        <li>• 1st cast: {"{3}{G}{G}"} (5 mana)</li>
                        <li>• 2nd cast: {"{5}{G}{G}"} (7 mana)</li>
                        <li>• 3rd cast: {"{7}{G}{G}"} (9 mana)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              {/* Deck Building Section */}
              <section id="deckbuilding" className="bg-slate-950/60 backdrop-blur-xl rounded-2xl border border-slate-600/40 p-8">
                <div className="flex items-center mb-6">
                  <span className="text-4xl mr-4">🔨</span>
                  <h2 className="text-3xl font-bold text-white">Building Your Commander Deck</h2>
                </div>
                
                <div className="space-y-6">
                  <div className="bg-slate-950/80 rounded-xl p-6 border border-slate-600/30">
                    <h3 className="text-xl font-semibold text-primary-400 mb-4">👑 Choosing a Commander</h3>
                    <p className="text-slate-300 leading-relaxed mb-4">
                      Your Commander defines your entire deck's strategy and colors. Consider these factors:
                    </p>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-slate-950/60 rounded-lg p-4">
                        <h4 className="font-semibold text-white mb-2">🎨 Colors</h4>
                        <p className="text-sm text-slate-300">What colors do you enjoy? Your commander's colors determine your entire deck.</p>
                      </div>
                      <div className="bg-slate-950/60 rounded-lg p-4">
                        <h4 className="font-semibold text-white mb-2">⚡ Abilities</h4>
                        <p className="text-sm text-slate-300">Look for commanders that enable strategies or serve as win conditions.</p>
                      </div>
                      <div className="bg-slate-950/60 rounded-lg p-4">
                        <h4 className="font-semibold text-white mb-2">💝 Personal Appeal</h4>
                        <p className="text-sm text-slate-300">Pick something you love! Art, lore, or mechanics that excite you.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 rounded-xl p-6 border border-slate-600/30">
                    <h3 className="text-xl font-semibold text-primary-400 mb-4">📋 Deck Composition Guidelines</h3>
                    <p className="text-slate-300 leading-relaxed mb-4">
                      A well-balanced Commander deck needs several key categories. Here are the recommended numbers:
                    </p>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="bg-slate-950/60 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-white">🏔️ Lands</h4>
                            <span className="text-primary-400 font-bold">35-38 cards</span>
                          </div>
                          <p className="text-sm text-slate-300">Your mana base. Include color fixing for multicolor decks.</p>
                        </div>
                        <div className="bg-slate-950/60 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-white">🚀 Ramp</h4>
                            <span className="text-primary-400 font-bold">8-12 cards</span>
                          </div>
                          <p className="text-sm text-slate-300">Mana rocks, land ramp, creature accelerants. Get ahead on mana!</p>
                        </div>
                        <div className="bg-slate-950/60 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-white">📚 Card Draw</h4>
                            <span className="text-primary-400 font-bold">8-10 cards</span>
                          </div>
                          <p className="text-sm text-slate-300">Keep your hand full! Draw spells, card advantage engines.</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="bg-slate-950/60 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-white">🗡️ Removal</h4>
                            <span className="text-primary-400 font-bold">8-10 cards</span>
                          </div>
                          <p className="text-sm text-slate-300">Spot removal, board wipes. Answer opponent threats.</p>
                        </div>
                        <div className="bg-slate-950/60 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-white">🎯 Win Conditions</h4>
                            <span className="text-primary-400 font-bold">2-3 cards</span>
                          </div>
                          <p className="text-sm text-slate-300">Big finishers, combos, or overwhelming threats.</p>
                        </div>
                        <div className="bg-slate-950/60 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-white">⭐ Synergy/Theme</h4>
                            <span className="text-primary-400 font-bold">15-20 cards</span>
                          </div>
                          <p className="text-sm text-slate-300">Cards that work with your commander and strategy.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-primary-500/10 to-blue-500/10 rounded-xl p-6 border border-primary-500/20">
                    <h3 className="text-xl font-semibold text-primary-400 mb-4 flex items-center">
                      <span className="mr-3">💡</span>
                      Pro Tips for New Builders
                    </h3>
                    <ul className="space-y-3 text-slate-300">
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-primary-400 rounded-full mr-3 mt-2"></span>
                        <span><strong>Start with a precon:</strong> Commander preconstructed decks are great for beginners and provide a solid base to modify.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-primary-400 rounded-full mr-3 mt-2"></span>
                        <span><strong>Mind your mana curve:</strong> Include plenty of early-game plays alongside your big spells.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-primary-400 rounded-full mr-3 mt-2"></span>
                        <span><strong>Have a plan:</strong> Know how your deck wants to win and build around that strategy.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-primary-400 rounded-full mr-3 mt-2"></span>
                        <span><strong>Test and iterate:</strong> Play games, see what works, and adjust accordingly.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Gameplay Tips Section */}
              <section id="gameplay" className="bg-slate-950/60 backdrop-blur-xl rounded-2xl border border-slate-600/40 p-8">
                <div className="flex items-center mb-6">
                  <span className="text-4xl mr-4">⚔️</span>
                  <h2 className="text-3xl font-bold text-white">Gameplay Tips: From Early Turns to Endgame</h2>
                </div>
                
                <div className="space-y-6">
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-slate-950/80 rounded-xl p-6 border border-slate-600/30">
                      <h3 className="text-xl font-semibold text-green-400 mb-4">🌅 Early Game</h3>
                      <ul className="space-y-3 text-slate-300 text-sm">
                        <li>• <strong>Mulligan wisely:</strong> Look for 2-3 lands and some early plays</li>
                        <li>• <strong>Develop mana:</strong> Prioritize land drops and ramp spells</li>
                        <li>• <strong>Don't overextend:</strong> Avoid becoming the early threat</li>
                        <li>• <strong>Be patient:</strong> You have time to set up engines</li>
                      </ul>
                    </div>
                    <div className="bg-slate-950/80 rounded-xl p-6 border border-slate-600/30">
                      <h3 className="text-xl font-semibold text-yellow-400 mb-4">🌞 Mid Game</h3>
                      <ul className="space-y-3 text-slate-300 text-sm">
                        <li>• <strong>Assess threats:</strong> Who's the biggest danger right now?</li>
                        <li>• <strong>Use politics:</strong> Make deals and temporary alliances</li>
                        <li>• <strong>Time your commander:</strong> Cast when you can protect it</li>
                        <li>• <strong>Hold up answers:</strong> Keep mana for instant responses</li>
                      </ul>
                    </div>
                    <div className="bg-slate-950/80 rounded-xl p-6 border border-slate-600/30">
                      <h3 className="text-xl font-semibold text-red-400 mb-4">🌙 Late Game</h3>
                      <ul className="space-y-3 text-slate-300 text-sm">
                        <li>• <strong>Time big moves:</strong> Wait for the right moment to strike</li>
                        <li>• <strong>Watch for answers:</strong> Consider who can stop your plays</li>
                        <li>• <strong>Track commander damage:</strong> Don't forget the 21-damage rule</li>
                        <li>• <strong>Adapt to eliminations:</strong> Game dynamics shift when players leave</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 rounded-xl p-6 border border-slate-600/30">
                    <h3 className="text-xl font-semibold text-primary-400 mb-4">🎯 Threat Assessment</h3>
                    <p className="text-slate-300 leading-relaxed mb-4">
                      Learning to correctly identify the biggest threats is crucial in multiplayer games. Consider:
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-slate-950/60 rounded-lg p-4">
                        <h4 className="font-semibold text-white mb-2">🚨 Immediate Threats</h4>
                        <p className="text-sm text-slate-300">Cards or players that can win or cause major damage right now.</p>
                      </div>
                      <div className="bg-slate-950/60 rounded-lg p-4">
                        <h4 className="font-semibold text-white mb-2">📈 Growing Threats</h4>
                        <p className="text-sm text-slate-300">Players building up resources or card advantage that will be scary later.</p>
                      </div>
                      <div className="bg-slate-950/60 rounded-lg p-4">
                        <h4 className="font-semibold text-white mb-2">🎭 Hidden Threats</h4>
                        <p className="text-sm text-slate-300">Players with full hands, open mana, or known combo pieces.</p>
                      </div>
                      <div className="bg-slate-950/60 rounded-lg p-4">
                        <h4 className="font-semibold text-white mb-2">🛡️ Personal Threats</h4>
                        <p className="text-sm text-slate-300">Cards that specifically shut down your strategy, even if they don't bother others.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Politics & Strategy Section */}
              <section id="politics" className="bg-slate-950/60 backdrop-blur-xl rounded-2xl border border-slate-600/40 p-8">
                <div className="flex items-center mb-6">
                  <span className="text-4xl mr-4">🤝</span>
                  <h2 className="text-3xl font-bold text-white">Politics & The Social Game</h2>
                </div>
                
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-purple-500/20">
                    <p className="text-lg text-slate-200 leading-relaxed">
                      Commander isn't just about the cards you play—it's about the <strong>social dynamics</strong> at the table. 
                      Mastering the political aspect can often win you games you'd otherwise lose through card power alone.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-slate-950/80 rounded-xl p-6 border border-slate-600/30">
                      <h3 className="text-xl font-semibold text-primary-400 mb-4">🗣️ Making Deals</h3>
                      <div className="space-y-4">
                        <div className="bg-slate-950/60 rounded-lg p-4">
                          <h4 className="font-semibold text-green-400 mb-2">✅ Good Deal Examples</h4>
                          <ul className="text-sm text-slate-300 space-y-1">
                            <li>• "I won't attack you this turn if you don't counter my spell"</li>
                            <li>• "Help me deal with that threat and I'll remove yours"</li>
                            <li>• "Let's both attack the player in the lead"</li>
                          </ul>
                        </div>
                        <div className="bg-slate-950/60 rounded-lg p-4">
                          <h4 className="font-semibold text-red-400 mb-2">❌ Avoid These Deals</h4>
                          <ul className="text-sm text-slate-300 space-y-1">
                            <li>• Long-term binding agreements ("never attack me")</li>
                            <li>• Deals that only benefit one player</li>
                            <li>• Promises you can't or won't keep</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-950/80 rounded-xl p-6 border border-slate-600/30">
                      <h3 className="text-xl font-semibold text-primary-400 mb-4">🎭 Table Dynamics</h3>
                      <div className="space-y-4">
                        <div className="bg-slate-950/60 rounded-lg p-4">
                          <h4 className="font-semibold text-white mb-2">👁️ Managing Threat Level</h4>
                          <p className="text-sm text-slate-300">
                            Sometimes it's better to appear weaker than you are. Don't always play your best card immediately.
                          </p>
                        </div>
                        <div className="bg-slate-950/60 rounded-lg p-4">
                          <h4 className="font-semibold text-white mb-2">🤝 Temporary Alliances</h4>
                          <p className="text-sm text-slate-300">
                            Team up against the leader, but remember these alliances can (and should) shift as the game evolves.
                          </p>
                        </div>
                        <div className="bg-slate-950/60 rounded-lg p-4">
                          <h4 className="font-semibold text-white mb-2">🎯 Kingmaking</h4>
                          <p className="text-sm text-slate-300">
                            When you can't win, try to play fairly rather than picking favorites. Your reputation matters!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 rounded-xl p-6 border border-slate-600/30">
                    <h3 className="text-xl font-semibold text-primary-400 mb-4">🎪 Table Etiquette</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-green-400 mb-3">Do These Things:</h4>
                        <ul className="space-y-2 text-slate-300 text-sm">
                          <li>• Communicate clearly about phases and targets</li>
                          <li>• Be patient with new players</li>
                          <li>• Congratulate the winner</li>
                          <li>• Keep deals within reasonable scope</li>
                          <li>• Help explain complex interactions</li>
                          <li>• Play at a reasonable pace</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-red-400 mb-3">Avoid These Things:</h4>
                        <ul className="space-y-2 text-slate-300 text-sm">
                          <li>• Taking excessively long turns</li>
                          <li>• Being salty when you lose</li>
                          <li>• Breaking deals trivially</li>
                          <li>• Targeting players personally (vs. strategically)</li>
                          <li>• Dragging games out when you have lethal</li>
                          <li>• Being overly competitive in casual games</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Advanced Play Section */}
              <section id="advanced" className="bg-slate-950/60 backdrop-blur-xl rounded-2xl border border-slate-600/40 p-8">
                <div className="flex items-center mb-6">
                  <span className="text-4xl mr-4">🧠</span>
                  <h2 className="text-3xl font-bold text-white">Advanced Play & cEDH</h2>
                </div>
                
                <div className="space-y-6">
                  <div className="bg-slate-950/80 rounded-xl p-6 border border-slate-600/30">
                    <h3 className="text-xl font-semibold text-primary-400 mb-4">⚡ The Stack & Priority</h3>
                    <p className="text-slate-300 leading-relaxed mb-4">
                      Advanced players master the intricacies of Magic's timing rules:
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-slate-950/60 rounded-lg p-4">
                        <h4 className="font-semibold text-white mb-2">🎯 Strategic Sequencing</h4>
                        <p className="text-sm text-slate-300">
                          Cast less important spells first to "bait out" counterspells before playing your real threats.
                        </p>
                      </div>
                      <div className="bg-slate-950/60 rounded-lg p-4">
                        <h4 className="font-semibold text-white mb-2">⏰ End Step Actions</h4>
                        <p className="text-sm text-slate-300">
                          Use mana and abilities right before your turn to minimize the time opponents can react.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 rounded-xl p-6 border border-slate-600/30">
                    <h3 className="text-xl font-semibold text-primary-400 mb-4">🏆 Competitive EDH (cEDH)</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-white mb-3">What is cEDH?</h4>
                        <p className="text-slate-300 text-sm leading-relaxed mb-4">
                          Competitive EDH is a high-power variant where players use optimized decks built to win as quickly as possible, 
                          typically turns 3-5. It features fast mana, efficient tutors, and compact infinite combos.
                        </p>
                        <div className="bg-slate-950/60 rounded-lg p-3">
                          <h5 className="font-semibold text-green-400 text-sm mb-2">cEDH Characteristics:</h5>
                          <ul className="text-xs text-slate-300 space-y-1">
                            <li>• Fast mana (Moxen, fast lands)</li>
                            <li>• Efficient tutors and card selection</li>
                            <li>• Compact win conditions</li>
                            <li>• Heavy interaction and counterspells</li>
                            <li>• Optimized mana bases</li>
                          </ul>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-white mb-3">Important Considerations</h4>
                        <div className="space-y-3">
                          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                            <h5 className="font-semibold text-yellow-400 text-sm mb-1">⚠️ Power Level Matching</h5>
                            <p className="text-xs text-slate-300">
                              Don't bring cEDH decks to casual tables - it ruins the fun for everyone.
                            </p>
                          </div>
                          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                            <h5 className="font-semibold text-blue-400 text-sm mb-1">💬 Rule 0 Conversations</h5>
                            <p className="text-xs text-slate-300">
                              Always discuss power levels and expectations before starting games.
                            </p>
                          </div>
                          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                            <h5 className="font-semibold text-green-400 text-sm mb-1">🎯 Know Your Meta</h5>
                            <p className="text-xs text-slate-300">
                              Understanding common strategies helps you prepare and adapt your gameplay.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 rounded-xl p-6 border border-slate-600/30">
                    <h3 className="text-xl font-semibold text-primary-400 mb-4">📊 Resource Management</h3>
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="bg-slate-950/60 rounded-lg p-4 text-center">
                        <div className="text-2xl mb-2">🃏</div>
                        <h4 className="font-semibold text-white text-sm mb-2">Cards</h4>
                        <p className="text-xs text-slate-300">Hand size, card advantage, card quality</p>
                      </div>
                      <div className="bg-slate-950/60 rounded-lg p-4 text-center">
                        <div className="text-2xl mb-2">💎</div>
                        <h4 className="font-semibold text-white text-sm mb-2">Mana</h4>
                        <p className="text-xs text-slate-300">Lands, artifacts, acceleration, efficiency</p>
                      </div>
                      <div className="bg-slate-950/60 rounded-lg p-4 text-center">
                        <div className="text-2xl mb-2">❤️</div>
                        <h4 className="font-semibold text-white text-sm mb-2">Life</h4>
                        <p className="text-xs text-slate-300">40 life is a big cushion - use it wisely</p>
                      </div>
                      <div className="bg-slate-950/60 rounded-lg p-4 text-center">
                        <div className="text-2xl mb-2">🛡️</div>
                        <h4 className="font-semibold text-white text-sm mb-2">Board</h4>
                        <p className="text-xs text-slate-300">Permanents, board presence, positioning</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Resources Section */}
              <section id="resources" className="bg-slate-950/60 backdrop-blur-xl rounded-2xl border border-slate-600/40 p-8">
                <div className="flex items-center mb-6">
                  <span className="text-4xl mr-4">📚</span>
                  <h2 className="text-3xl font-bold text-white">Resources & Next Steps</h2>
                </div>
                
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-primary-500/10 to-blue-500/10 rounded-xl p-6 border border-primary-500/20">
                    <p className="text-lg text-slate-200 leading-relaxed">
                      Ready to dive deeper into Commander? Here are the best resources to continue your journey 
                      and improve your gameplay.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-slate-950/80 rounded-xl p-6 border border-slate-600/30">
                      <h3 className="text-xl font-semibold text-primary-400 mb-4">🌐 Essential Websites</h3>
                      <div className="space-y-3">
                        <div className="bg-slate-950/60 rounded-lg p-4">
                          <h4 className="font-semibold text-white mb-2">EDHREC.com</h4>
                          <p className="text-sm text-slate-300">
                            The ultimate deckbuilding resource. See popular cards for any commander and strategy guides.
                          </p>
                        </div>
                        <div className="bg-slate-950/60 rounded-lg p-4">
                          <h4 className="font-semibold text-white mb-2">MTGCommander.net</h4>
                          <p className="text-sm text-slate-300">
                            Official Commander rules and banlist from the Rules Committee.
                          </p>
                        </div>
                        <div className="bg-slate-950/60 rounded-lg p-4">
                          <h4 className="font-semibold text-white mb-2">Scryfall.com</h4>
                          <p className="text-sm text-slate-300">
                            Advanced card search engine. Perfect for finding cards that fit your strategy.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-950/80 rounded-xl p-6 border border-slate-600/30">
                      <h3 className="text-xl font-semibold text-primary-400 mb-4">📺 Video Content</h3>
                      <div className="space-y-3">
                        <div className="bg-slate-950/60 rounded-lg p-4">
                          <h4 className="font-semibold text-white mb-2">Game Knights</h4>
                          <p className="text-sm text-slate-300">
                            High-production Commander gameplay videos. Great for seeing strategies in action.
                          </p>
                        </div>
                        <div className="bg-slate-950/60 rounded-lg p-4">
                          <h4 className="font-semibold text-white mb-2">The Command Zone</h4>
                          <p className="text-sm text-slate-300">
                            Podcast and videos covering strategy, deck techs, and Commander news.
                          </p>
                        </div>
                        <div className="bg-slate-950/60 rounded-lg p-4">
                          <h4 className="font-semibold text-white mb-2">Commander's Quarters</h4>
                          <p className="text-sm text-slate-300">
                            Budget-focused deck builds and excellent beginner tutorials.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 rounded-xl p-6 border border-slate-600/30">
                    <h3 className="text-xl font-semibold text-primary-400 mb-4">🛠️ Deckbuilding Tools</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-slate-950/60 rounded-lg p-4">
                        <h4 className="font-semibold text-white mb-2">Moxfield</h4>
                        <p className="text-sm text-slate-300">Modern deck builder with great analysis tools and playtest features.</p>
                      </div>
                      <div className="bg-slate-950/60 rounded-lg p-4">
                        <h4 className="font-semibold text-white mb-2">Archidekt</h4>
                        <p className="text-sm text-slate-300">Visual deck builder with beautiful card displays and categories.</p>
                      </div>
                      <div className="bg-slate-950/60 rounded-lg p-4">
                        <h4 className="font-semibold text-white mb-2">TappedOut</h4>
                        <p className="text-sm text-slate-300">Long-standing community with deck sharing and feedback features.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 rounded-xl p-6 border border-slate-600/30">
                    <h3 className="text-xl font-semibold text-primary-400 mb-4">🎯 Playing Online</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-slate-950/60 rounded-lg p-4">
                        <h4 className="font-semibold text-white mb-2">SpellTable</h4>
                        <p className="text-sm text-slate-300">
                          Official Wizards tool for playing with physical cards over webcam. Great for remote games with friends.
                        </p>
                      </div>
                      <div className="bg-slate-950/60 rounded-lg p-4">
                        <h4 className="font-semibold text-white mb-2">MTGO</h4>
                        <p className="text-sm text-slate-300">
                          Magic Online supports full Commander gameplay, including 4-player multiplayer matches.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-xl p-6 border border-green-500/20">
                    <h3 className="text-xl font-semibold text-primary-400 mb-4 flex items-center">
                      <span className="mr-3">🚀</span>
                      Ready to Start Playing?
                    </h3>
                    <p className="text-slate-300 leading-relaxed mb-6">
                      Now that you understand the fundamentals, it's time to jump in! Remember, Commander is ultimately 
                      about having fun with friends and creating memorable moments. Don't worry about making mistakes - 
                      every game is a learning opportunity.
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Link
                        to="/builder"
                        className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-primary-500 to-blue-500 text-white rounded-xl font-semibold hover:from-primary-600 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        <span className="mr-2">🔨</span>
                        Build Your First Deck
                      </Link>
                      <Link
                        to="/commander-ai"
                        className="inline-flex items-center justify-center px-6 py-3 bg-slate-900/60 text-slate-200 rounded-xl font-semibold hover:bg-slate-800/60 transition-all duration-300 border border-slate-600/40"
                      >
                        <span className="mr-2">⚔️</span>
                        Get AI Recommendations
                      </Link>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="bg-slate-950/70 backdrop-blur-xl rounded-2xl border border-slate-600/40 p-8">
            <h3 className="text-2xl font-bold text-white mb-4">
              Ready to Become a Commander Master?
            </h3>
            <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
              Join thousands of players using our AI-powered tools to build better decks, 
              find perfect commanders, and dominate the battlefield.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-primary-500 to-blue-500 text-white rounded-xl font-bold hover:from-primary-600 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Get Started Free
              </Link>
              <Link
                to="/card-search"
                className="inline-flex items-center justify-center px-8 py-4 bg-slate-900/60 text-slate-200 rounded-xl font-semibold hover:bg-slate-800/60 transition-all duration-300 border border-slate-600/40"
              >
                <span className="mr-2">🔍</span>
                Explore Cards
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowToPlayPage; 
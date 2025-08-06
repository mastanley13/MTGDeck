import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTutorial } from '../../context/TutorialContext';
import TutorialTrigger from '../tutorial/TutorialTrigger.jsx';


// Placeholder - replace with the same ID used in UserProfilePage.jsx
const PROFILE_PIC_CUSTOM_FIELD_ID = "hPIWnTEsvK1pVbATGLS5";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isAiDropdownOpen, setIsAiDropdownOpen] = useState(false);
  const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, logout, loadingAuth } = useAuth();
  const { startTutorial } = useTutorial();
  
  const profileDropdownRef = useRef(null);
  const aiDropdownRef = useRef(null);
  const toolsDropdownRef = useRef(null);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    setIsProfileDropdownOpen(false);
    setIsAiDropdownOpen(false);
    setIsToolsDropdownOpen(false);
    navigate('/');
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
      if (aiDropdownRef.current && !aiDropdownRef.current.contains(event.target)) {
        setIsAiDropdownOpen(false);
      }
      if (toolsDropdownRef.current && !toolsDropdownRef.current.contains(event.target)) {
        setIsToolsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (loadingAuth) {
    return (
      <header className="relative z-50">
        <nav className="bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl border-b border-slate-700/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center">
                <Link to="/" className="flex items-center space-x-3">
                  <img src="https://storage.googleapis.com/msgsndr/zKZ8Zy6VvGR1m7lNfRkY/media/6830e4ad6417b23718765500.png" alt="Logo" className="h-10 w-auto" />
                  <span className="font-bold text-xl bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600 bg-clip-text text-transparent">
                    Deck Tutor AI
                  </span>
                </Link>
              </div>
              <div className="flex items-center space-x-2">
                <div className="animate-pulse flex space-x-2">
                  <div className="h-4 bg-slate-700 rounded w-20"></div>
                  <div className="h-4 bg-slate-700 rounded w-16"></div>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </header>
    );
  }

  return (
    <header className="relative z-[100]">
      <nav className="bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl relative z-[60]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and primary navigation */}
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center space-x-3 group">
                <img 
                  src="https://storage.googleapis.com/msgsndr/zKZ8Zy6VvGR1m7lNfRkY/media/6830e4ad6417b23718765500.png" 
                  alt="Logo" 
                  className="h-10 w-auto transition-all duration-300 group-hover:scale-110 drop-shadow-lg" 
                />
                <span className="font-bold text-xl bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600 bg-clip-text text-transparent">
                  Deck Tutor AI
                </span>
              </Link>
              
              {/* Primary navigation - clean and uncluttered */}
              <div className="hidden xl:flex items-center space-x-3">
                <Link 
                  to="/" 
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 relative overflow-hidden group whitespace-nowrap ${
                    isActive('/') 
                      ? 'bg-gradient-to-r from-primary-500/20 to-blue-500/20 text-primary-400 shadow-lg shadow-primary-500/10 border border-primary-500/20' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/60 border border-transparent hover:border-slate-600/50'
                  }`}
                >
                  <span className="relative z-10">Home</span>
                  {!isActive('/') && (
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-700/0 via-slate-600/50 to-slate-700/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  )}
                </Link>
                
                {isAuthenticated && (
                  <Link 
                    to="/decks" 
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 relative overflow-hidden group whitespace-nowrap ${
                      isActive('/decks') 
                        ? 'bg-gradient-to-r from-primary-500/20 to-blue-500/20 text-primary-400 shadow-lg shadow-primary-500/10 border border-primary-500/20' 
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/60 border border-transparent hover:border-slate-600/50'
                    }`}
                  >
                    <span className="relative z-10">My Decks</span>
                    {!isActive('/decks') && (
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-700/0 via-slate-600/50 to-slate-700/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    )}
                  </Link>
                )}
                
                {/* AI Tools Dropdown */}
                <div className="relative" ref={aiDropdownRef}>
                  <button
                    onClick={() => setIsAiDropdownOpen(!isAiDropdownOpen)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 relative overflow-hidden group whitespace-nowrap flex items-center ${
                      (isActive('/commander-ai') || isActive('/tutor-ai') || isActive('/builder'))
                        ? 'bg-gradient-to-r from-primary-500/20 to-blue-500/20 text-primary-400 shadow-lg shadow-primary-500/10 border border-primary-500/20'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/60 border border-transparent hover:border-slate-600/50'
                    }`}
                  >
                    <span className="relative z-10 mr-1">AI Tools</span>
                    <svg 
                      className={`w-4 h-4 transition-transform duration-300 ${isAiDropdownOpen ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    {!(isActive('/commander-ai') || isActive('/tutor-ai') || isActive('/builder')) && (
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-700/0 via-slate-600/50 to-slate-700/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    )}
                  </button>

                  {isAiDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 py-2 z-[100]">
                      <Link
                        to="/builder"
                        onClick={() => setIsAiDropdownOpen(false)}
                        className={`block w-full text-left px-4 py-3 text-sm transition-all duration-200 rounded-lg mx-2 ${
                          isActive('/builder')
                            ? 'bg-gradient-to-r from-primary-500/20 to-blue-500/20 text-primary-400'
                            : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span>Deck Builder</span>
                        </div>
                      </Link>
                      <Link
                        to="/commander-ai"
                        onClick={() => setIsAiDropdownOpen(false)}
                        className={`block w-full text-left px-4 py-3 text-sm transition-all duration-200 rounded-lg mx-2 ${
                          isActive('/commander-ai')
                            ? 'bg-gradient-to-r from-primary-500/20 to-blue-500/20 text-primary-400'
                            : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span>Commander AI</span>
                        </div>
                      </Link>
                      <Link
                        to="/tutor-ai"
                        onClick={() => setIsAiDropdownOpen(false)}
                        className={`block w-full text-left px-4 py-3 text-sm transition-all duration-200 rounded-lg mx-2 ${
                          isActive('/tutor-ai')
                            ? 'bg-gradient-to-r from-primary-500/20 to-blue-500/20 text-primary-400'
                            : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span>Tutor AI</span>
                        </div>
                      </Link>
                    </div>
                  )}
                </div>
                
                {/* Resources Dropdown */}
                <div className="relative" ref={toolsDropdownRef}>
                  <button
                    onClick={() => setIsToolsDropdownOpen(!isToolsDropdownOpen)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 relative overflow-hidden group whitespace-nowrap flex items-center ${
                      (isActive('/card-search') || isActive('/how-to-play') || isActive('/contact') || isActive('/socials'))
                        ? 'bg-gradient-to-r from-primary-500/20 to-blue-500/20 text-primary-400 shadow-lg shadow-primary-500/10 border border-primary-500/20'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/60 border border-transparent hover:border-slate-600/50'
                    }`}
                  >
                    <span className="relative z-10 mr-1">Resources</span>
                    <svg 
                      className={`w-4 h-4 transition-transform duration-300 ${isToolsDropdownOpen ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    {!(isActive('/card-search') || isActive('/how-to-play') || isActive('/affiliate') || isActive('/contact') || isActive('/socials')) && (
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-700/0 via-slate-600/50 to-slate-700/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    )}
                  </button>

                  {isToolsDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 py-2 z-[100]">
                      <Link
                        to="/how-to-play"
                        onClick={() => setIsToolsDropdownOpen(false)}
                        className={`block w-full text-left px-4 py-3 text-sm transition-all duration-200 rounded-lg mx-2 ${
                          isActive('/how-to-play')
                            ? 'bg-gradient-to-r from-primary-500/20 to-blue-500/20 text-primary-400'
                            : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span>How to Play</span>
                        </div>
                      </Link>

                      <Link
                        to="/contact"
                        onClick={() => setIsToolsDropdownOpen(false)}
                        className={`block w-full text-left px-4 py-3 text-sm transition-all duration-200 rounded-lg mx-2 ${
                          isActive('/contact')
                            ? 'bg-gradient-to-r from-primary-500/20 to-blue-500/20 text-primary-400'
                            : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span>Contact Us</span>
                        </div>
                      </Link>
                      <Link
                        to="/socials"
                        onClick={() => setIsToolsDropdownOpen(false)}
                        className={`block w-full text-left px-4 py-3 text-sm transition-all duration-200 rounded-lg mx-2 ${
                          isActive('/socials')
                            ? 'bg-gradient-to-r from-primary-500/20 to-blue-500/20 text-primary-400'
                            : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span>Socials</span>
                        </div>
                      </Link>
                      <Link
                        to="/blog"
                        onClick={() => setIsToolsDropdownOpen(false)}
                        className={`block w-full text-left px-4 py-3 text-sm transition-all duration-200 rounded-lg mx-2 ${
                          isActive('/blog')
                            ? 'bg-gradient-to-r from-primary-500/20 to-blue-500/20 text-primary-400'
                            : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span>Blog</span>
                        </div>
                      </Link>
                    </div>
                  )}
                </div>

                <Link 
                  to="/card-search" 
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 relative overflow-hidden group whitespace-nowrap ${
                    isActive('/card-search') 
                      ? 'bg-gradient-to-r from-primary-500/20 to-blue-500/20 text-primary-400 shadow-lg shadow-primary-500/10 border border-primary-500/20' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/60 border border-transparent hover:border-slate-600/50'
                  }`}
                >
                  <span className="relative z-10">Card Search</span>
                  {!isActive('/card-search') && (
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-700/0 via-slate-600/50 to-slate-700/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  )}
                </Link>
              </div>
            </div>
            
            {/* Right side - Actions and user menu */}
            <div className="flex items-center space-x-4">
              {/* Tutorial Trigger */}
              <TutorialTrigger 
                variant="navbar" 
                showText={false}
                className="hidden lg:flex"
              />
              <div className="hidden xl:flex items-center">
                {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  {/* User profile dropdown */}
                  <div className="relative" ref={profileDropdownRef}>
                    <button
                      onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                      className="flex items-center space-x-3 p-2 rounded-xl hover:bg-slate-700/50 transition-all duration-300 border border-transparent hover:border-slate-600/50"
                    >
                      {(() => {
                        const profilePicUrl = currentUser?.customFields?.find(cf => cf.id === PROFILE_PIC_CUSTOM_FIELD_ID)?.value;
                        if (profilePicUrl) {
                          return (
                            <img 
                              src={profilePicUrl} 
                              alt="Profile" 
                              className="h-9 w-9 rounded-full object-cover border-2 border-primary-500/50 shadow-lg"
                            />
                          );
                        } else {
                          return (
                            <div className="h-9 w-9 rounded-full bg-gradient-to-r from-primary-500 to-blue-500 flex items-center justify-center shadow-lg border border-primary-400/30">
                              <span className="text-sm font-semibold text-slate-900">
                                {currentUser?.firstName?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
                              </span>
                            </div>
                          );
                        }
                      })()}
                      <div className="hidden md:block text-left">
                        <div className="text-sm font-medium text-white">
                          {currentUser?.firstName || 'User'}
                        </div>
                        <div className="text-xs text-slate-400">
                          {currentUser?.email}
                        </div>
                      </div>
                      <svg 
                        className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isProfileDropdownOpen ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {isProfileDropdownOpen && (
                      <div className="absolute top-full right-0 mt-2 w-64 bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 py-2 z-[100] animate-in slide-in-from-top-2 duration-200">
                        <div className="px-4 py-3 border-b border-slate-700/50">
                          <div className="flex items-center space-x-3">
                            {(() => {
                              const profilePicUrl = currentUser?.customFields?.find(cf => cf.id === PROFILE_PIC_CUSTOM_FIELD_ID)?.value;
                              if (profilePicUrl) {
                                return (
                                  <img 
                                    src={profilePicUrl} 
                                    alt="Profile" 
                                    className="h-10 w-10 rounded-full object-cover border-2 border-primary-500/50"
                                  />
                                );
                              } else {
                                return (
                                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary-500 to-blue-500 flex items-center justify-center">
                                    <span className="text-lg font-semibold text-slate-900">
                                      {currentUser?.firstName?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
                                    </span>
                                  </div>
                                );
                              }
                            })()}
                            <div>
                              <div className="font-medium text-white">
                                {currentUser?.firstName || 'User'}
                              </div>
                              <div className="text-sm text-slate-400">
                                {currentUser?.email}
                              </div>
                            </div>
                          </div>
                        </div>
                        <Link
                          to="/profile"
                          onClick={() => setIsProfileDropdownOpen(false)}
                          className="block w-full text-left px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all duration-200 rounded-lg mx-2"
                        >
                          <div className="flex items-center space-x-3">
                            <span>View Profile</span>
                          </div>
                        </Link>

                        <div className="border-t border-slate-700/50 mt-2 pt-2">
                          <button 
                            onClick={handleLogout}
                            className="block w-full text-left px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 rounded-lg mx-2"
                          >
                            <div className="flex items-center space-x-3">
                              <span>Sign out</span>
                            </div>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link 
                    to="/login"
                    className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-all duration-200"
                  >
                    Sign in
                  </Link>
                  <Link 
                    to="/register"
                    className="px-6 py-3 bg-gradient-to-r from-primary-500 to-blue-500 text-white text-sm font-semibold rounded-xl hover:from-primary-600 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border border-primary-400/30"
                  >
                    Get Started
                  </Link>
                </div>
              )}
              </div>
            </div>
            
            {/* Mobile menu button */}
            <div className="xl:hidden flex items-center space-x-2">
              {/* Tutorial Trigger for mobile */}
              <TutorialTrigger 
                variant="navbar" 
                showText={false}
                className="lg:hidden"
              />
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all duration-200 border border-transparent hover:border-slate-600/50"
              >
                <span className="sr-only">Open main menu</span>
                {isMenuOpen ? (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="xl:hidden bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/50">
          <div className="px-4 py-6 space-y-3">
            {/* User section for mobile */}
            {isAuthenticated && (
              <div className="pb-4 mb-4 border-b border-slate-700/50">
                <div className="flex items-center space-x-3">
                  {(() => {
                    const profilePicUrl = currentUser?.customFields?.find(cf => cf.id === PROFILE_PIC_CUSTOM_FIELD_ID)?.value;
                    if (profilePicUrl) {
                      return (
                        <img 
                          src={profilePicUrl} 
                          alt="Profile" 
                          className="h-12 w-12 rounded-full object-cover border-2 border-primary-500/50"
                        />
                      );
                    } else {
                      return (
                        <div className="h-12 w-12 rounded-full bg-gradient-to-r from-primary-500 to-blue-500 flex items-center justify-center">
                          <span className="text-lg font-semibold text-slate-900">
                            {currentUser?.firstName?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
                          </span>
                        </div>
                      );
                    }
                  })()}
                  <div>
                    <div className="font-medium text-white">
                      {currentUser?.firstName || 'User'}
                    </div>
                    <div className="text-sm text-slate-400">
                      {currentUser?.email}
                    </div>
                  </div>
                </div>
              </div>
            )}


            
            {/* Navigation links with site colors */}
            <div className="space-y-2">
              <Link
                to="/"
                onClick={() => setIsMenuOpen(false)}
                className={`block w-full p-3 rounded-xl transition-all duration-200 ${
                  isActive('/')
                    ? 'bg-gradient-to-r from-primary-500/20 to-blue-500/20 text-primary-400 border border-primary-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50 border border-transparent hover:border-slate-600/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span>Home</span>
                </div>
              </Link>
              {isAuthenticated && (
                <Link
                  to="/decks"
                  onClick={() => setIsMenuOpen(false)}
                  className={`block w-full p-3 rounded-xl transition-all duration-200 ${
                    isActive('/decks')
                      ? 'bg-gradient-to-r from-primary-500/20 to-blue-500/20 text-primary-400 border border-primary-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50 border border-transparent hover:border-slate-600/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span>My Decks</span>
                  </div>
                </Link>
              )}
              
              {/* AI Tools section */}
              <div className="pt-2">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3 px-3">
                  AI Tools
                </div>
                <Link
                  to="/builder"
                  onClick={() => setIsMenuOpen(false)}
                  className={`block w-full p-3 rounded-xl transition-all duration-200 ${
                    isActive('/builder')
                      ? 'bg-gradient-to-r from-primary-500/20 to-blue-500/20 text-primary-400 border border-primary-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50 border border-transparent hover:border-slate-600/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span>Deck Builder</span>
                  </div>
                </Link>
                <Link
                  to="/commander-ai"
                  onClick={() => setIsMenuOpen(false)}
                  className={`block w-full p-3 rounded-xl transition-all duration-200 ${
                    isActive('/commander-ai')
                      ? 'bg-gradient-to-r from-primary-500/20 to-blue-500/20 text-primary-400 border border-primary-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50 border border-transparent hover:border-slate-600/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span>Commander AI</span>
                  </div>
                </Link>
                <Link
                  to="/tutor-ai"
                  onClick={() => setIsMenuOpen(false)}
                  className={`block w-full p-3 rounded-xl transition-all duration-200 ${
                    isActive('/tutor-ai')
                      ? 'bg-gradient-to-r from-primary-500/20 to-blue-500/20 text-primary-400 border border-primary-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50 border border-transparent hover:border-slate-600/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span>Tutor AI</span>
                  </div>
                </Link>
              </div>

              {/* Resources section */}
              <div className="pt-2">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3 px-3">
                  Resources
                </div>
                <Link
                  to="/how-to-play"
                  onClick={() => setIsMenuOpen(false)}
                  className={`block w-full p-3 rounded-xl transition-all duration-200 ${
                    isActive('/how-to-play')
                      ? 'bg-gradient-to-r from-primary-500/20 to-blue-500/20 text-primary-400 border border-primary-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50 border border-transparent hover:border-slate-600/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span>How to Play</span>
                  </div>
                </Link>

                <Link
                  to="/contact"
                  onClick={() => setIsMenuOpen(false)}
                  className={`block w-full p-3 rounded-xl transition-all duration-200 ${
                    isActive('/contact')
                      ? 'bg-gradient-to-r from-primary-500/20 to-blue-500/20 text-primary-400 border border-primary-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50 border border-transparent hover:border-slate-600/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span>Contact Us</span>
                  </div>
                </Link>
                <Link
                  to="/socials"
                  onClick={() => setIsMenuOpen(false)}
                  className={`block w-full p-3 rounded-xl transition-all duration-200 ${
                    isActive('/socials')
                      ? 'bg-gradient-to-r from-primary-500/20 to-blue-500/20 text-primary-400 border border-primary-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50 border border-transparent hover:border-slate-600/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span>Socials</span>
                  </div>
                </Link>
                <Link
                  to="/blog"
                  onClick={() => setIsMenuOpen(false)}
                  className={`block w-full p-3 rounded-xl transition-all duration-200 ${
                    isActive('/blog')
                      ? 'bg-gradient-to-r from-primary-500/20 to-blue-500/20 text-primary-400 border border-primary-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50 border border-transparent hover:border-slate-600/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span>Blog</span>
                  </div>
                </Link>
              </div>

              {/* Card Search section */}
              <div className="pt-2">
                <Link
                  to="/card-search"
                  onClick={() => setIsMenuOpen(false)}
                  className={`block w-full p-3 rounded-xl transition-all duration-200 ${
                    isActive('/card-search')
                      ? 'bg-gradient-to-r from-primary-500/20 to-blue-500/20 text-primary-400 border border-primary-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50 border border-transparent hover:border-slate-600/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span>Card Search</span>
                  </div>
                </Link>
              </div>
            </div>

            {/* Tutorial section for mobile */}
            <div className="pt-2">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3 px-3">
                Help & Learning
              </div>
              

              
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  startTutorial();
                }}
                className="block w-full p-3 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all duration-200 text-left border border-transparent hover:border-slate-600/50"
              >
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Take Tutorial Tour</span>
                </div>
              </button>
            </div>

            {/* Mobile auth actions */}
            <div className="pt-4 mt-4 border-t border-slate-700/50 space-y-2">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full p-3 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all duration-200 border border-transparent hover:border-slate-600/50"
                  >
                    <div className="flex items-center space-x-3">
                      <span>View Profile</span>
                    </div>
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="block w-full p-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 text-left border border-transparent hover:border-red-500/30"
                  >
                    <div className="flex items-center space-x-3">
                      <span>Sign out</span>
                    </div>
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full p-3 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all duration-200 text-center border border-transparent hover:border-slate-600/50"
                  >
                    Sign in
                  </Link>
                  <Link 
                    to="/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full p-3 bg-gradient-to-r from-primary-500 to-blue-500 text-white rounded-xl font-medium hover:from-primary-600 hover:to-blue-600 transition-all duration-200 text-center border border-primary-400/30"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar; 
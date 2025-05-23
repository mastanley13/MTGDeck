import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../context/SubscriptionContext';

// Placeholder - replace with the same ID used in UserProfilePage.jsx
const PROFILE_PIC_CUSTOM_FIELD_ID = "hPIWnTEsvK1pVbATGLS5";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, logout, loadingAuth } = useAuth();
  const { isPremium } = useSubscription();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    navigate('/');
  };

  if (loadingAuth) {
    return (
      <nav className="bg-logoScheme-darkGray shadow-md border-b border-logoScheme-brown">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <img src="https://storage.googleapis.com/msgsndr/zKZ8Zy6VvGR1m7lNfRkY/media/682a1f02bac5a0c4a0465b4f.png" alt="Logo" className="h-8 w-auto mr-3" />
                <span className="font-bold text-lg text-logoScheme-gold">Deck Tutor AI</span>
              </Link>
            </div>
            <div className="text-sm text-gray-300">Loading...</div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-logoScheme-darkGray shadow-md border-b border-logoScheme-brown">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img src="https://storage.googleapis.com/msgsndr/zKZ8Zy6VvGR1m7lNfRkY/media/682a1f02bac5a0c4a0465b4f.png" alt="Logo" className="h-8 w-auto mr-3" />
              <span className="font-bold text-lg text-logoScheme-gold">Deck Tutor AI</span>
            </Link>
            
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              <Link 
                to="/" 
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/') 
                    ? 'border-logoScheme-gold text-gray-100 bg-logoScheme-brown' 
                    : 'border-transparent text-gray-300 hover:border-logoScheme-gold hover:text-gray-100'
                }`}
              >
                Home
              </Link>
              <Link 
                to="/builder" 
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/builder') 
                    ? 'border-logoScheme-gold text-gray-100 bg-logoScheme-brown' 
                    : 'border-transparent text-gray-300 hover:border-logoScheme-gold hover:text-gray-100'
                }`}
              >
                Deck Builder AI
              </Link>
              {isAuthenticated && (
                <Link 
                  to="/decks" 
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive('/decks') 
                      ? 'border-logoScheme-gold text-gray-100 bg-logoScheme-brown' 
                      : 'border-transparent text-gray-300 hover:border-logoScheme-gold hover:text-gray-100'
                  }`}
                >
                  My Decks
                </Link>
              )}
              <Link 
                to="/commander-ai" 
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/commander-ai') 
                    ? 'border-logoScheme-gold text-gray-100 bg-logoScheme-brown' 
                    : 'border-transparent text-gray-300 hover:border-logoScheme-gold hover:text-gray-100'
                }`}
              >
                Commander AI
              </Link>
              <Link 
                to="/tutor-ai" 
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/tutor-ai') 
                    ? 'border-logoScheme-gold text-gray-100 bg-logoScheme-brown' 
                    : 'border-transparent text-gray-300 hover:border-logoScheme-gold hover:text-gray-100'
                }`}
              >
                Tutor AI
              </Link>
              <Link 
                to="/card-search" 
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/card-search') 
                    ? 'border-logoScheme-gold text-gray-100 bg-logoScheme-brown' 
                    : 'border-transparent text-gray-300 hover:border-logoScheme-gold hover:text-gray-100'
                }`}
              >
                Card Search
              </Link>
            </div>
          </div>
          
          <div className="hidden sm:flex sm:items-center">
            {/* Clean subscription badge */}
            <Link 
              to="/subscription" 
              className={`mr-4 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                isPremium 
                  ? 'bg-gradient-to-r from-theme-accent-blue to-theme-accent-purple text-white hover:opacity-90'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {isPremium ? (
                <>
                  <span className="mr-1">⭐</span>
                  Premium
                </>
              ) : (
                <>
                  <span className="mr-1">🆓</span>
                  Free Plan
                </>
              )}
            </Link>

            {isAuthenticated ? (
              <>
                {currentUser && <span className="text-sm text-gray-200 mr-4">Welcome, {currentUser.firstName || currentUser.email}!</span>}
                
                {(() => {
                  const profilePicUrl = currentUser?.customFields?.find(cf => cf.id === PROFILE_PIC_CUSTOM_FIELD_ID)?.value;
                  if (profilePicUrl) {
                    return (
                      <Link to="/profile" className="mr-3">
                        <img 
                          src={profilePicUrl} 
                          alt="Profile" 
                          className="h-8 w-8 rounded-full object-cover border-2 border-logoScheme-gold hover:opacity-80 transition-opacity"
                        />
                      </Link>
                    );
                  } else {
                    // Generic User Icon as fallback, linking to profile
                    return (
                      <Link to="/profile" className="mr-3 p-1 rounded-full hover:bg-logoScheme-brown transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-gray-300">
                          <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" />
                        </svg>
                      </Link>
                    );
                  }
                })()}

                <Link 
                  to="/builder"
                  className="bg-logoScheme-gold text-logoScheme-darkGray px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-logoScheme-gold"
                >
                  New Deck
                </Link>
                <button 
                  onClick={handleLogout}
                  className="ml-3 bg-logoScheme-red text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-logoScheme-red"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/builder"
                  className="bg-logoScheme-gold text-logoScheme-darkGray px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-logoScheme-gold"
                >
                  New Deck
                </Link>
                <Link 
                  to="/login"
                  className="ml-3 border border-logoScheme-gold text-logoScheme-gold px-4 py-2 rounded-md text-sm font-medium hover:bg-logoScheme-gold hover:text-logoScheme-darkGray focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-logoScheme-gold"
                >
                  Login
                </Link>
                <Link 
                  to="/register"
                  className="ml-3 bg-logoScheme-gold text-logoScheme-darkGray px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-logoScheme-gold"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-300 hover:text-gray-100 hover:bg-logoScheme-brown focus:outline-none focus:ring-2 focus:ring-inset focus:ring-logoScheme-gold"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden bg-logoScheme-darkGray border-t border-logoScheme-brown">
          <div className="pt-2 pb-3 space-y-1">
            {/* Clean subscription link in mobile menu */}
            <Link
              to="/subscription"
              onClick={() => setIsMenuOpen(false)}
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                isActive('/subscription')
                  ? 'bg-logoScheme-brown border-logoScheme-gold text-gray-100'
                  : 'border-transparent text-gray-300 hover:bg-logoScheme-brown hover:border-logoScheme-gold hover:text-gray-100'
              }`}
            >
              {isPremium ? '⭐ Premium Plan' : '🆓 Free Plan'}
            </Link>
            
            <Link
              to="/"
              onClick={() => setIsMenuOpen(false)}
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                isActive('/')
                  ? 'bg-logoScheme-brown border-logoScheme-gold text-gray-100'
                  : 'border-transparent text-gray-300 hover:bg-logoScheme-brown hover:border-logoScheme-gold hover:text-gray-100'
              }`}
            >
              Home
            </Link>
            <Link
              to="/builder"
              onClick={() => setIsMenuOpen(false)}
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                isActive('/builder')
                  ? 'bg-logoScheme-brown border-logoScheme-gold text-gray-100'
                  : 'border-transparent text-gray-300 hover:bg-logoScheme-brown hover:border-logoScheme-gold hover:text-gray-100'
              }`}
            >
              Deck Builder AI
            </Link>
            {isAuthenticated && (
              <Link
                to="/decks"
                onClick={() => setIsMenuOpen(false)}
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActive('/decks')
                    ? 'bg-logoScheme-brown border-logoScheme-gold text-gray-100'
                    : 'border-transparent text-gray-300 hover:bg-logoScheme-brown hover:border-logoScheme-gold hover:text-gray-100'
                }`}
              >
                My Decks
              </Link>
            )}
            <Link
              to="/commander-ai"
              onClick={() => setIsMenuOpen(false)}
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                isActive('/commander-ai')
                  ? 'bg-logoScheme-brown border-logoScheme-gold text-gray-100'
                  : 'border-transparent text-gray-300 hover:bg-logoScheme-brown hover:border-logoScheme-gold hover:text-gray-100'
              }`}
            >
              Commander AI
            </Link>
            <Link
              to="/tutor-ai"
              onClick={() => setIsMenuOpen(false)}
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                isActive('/tutor-ai')
                  ? 'bg-logoScheme-brown border-logoScheme-gold text-gray-100'
                  : 'border-transparent text-gray-300 hover:bg-logoScheme-brown hover:border-logoScheme-gold hover:text-gray-100'
              }`}
            >
              Tutor AI
            </Link>
            <Link
              to="/card-search"
              onClick={() => setIsMenuOpen(false)}
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                isActive('/card-search')
                  ? 'bg-logoScheme-brown border-logoScheme-gold text-gray-100'
                  : 'border-transparent text-gray-300 hover:bg-logoScheme-brown hover:border-logoScheme-gold hover:text-gray-100'
              }`}
            >
              Card Search
            </Link>
            <div className="mt-4 pt-4 border-t border-logoScheme-brown">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center pl-3 pr-4 py-2">
                    {(() => {
                      const profilePicUrl = currentUser?.customFields?.find(cf => cf.id === PROFILE_PIC_CUSTOM_FIELD_ID)?.value;
                      if (profilePicUrl) {
                        return (
                          <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="mr-3 flex-shrink-0">
                            <img 
                              src={profilePicUrl} 
                              alt="Profile" 
                              className="h-10 w-10 rounded-full object-cover border-2 border-logoScheme-gold"
                            />
                          </Link>
                        );
                      } else {
                        return (
                          <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="mr-3 p-1 rounded-full hover:bg-logoScheme-brown transition-colors flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-gray-300">
                              <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" />
                            </svg>
                          </Link>
                        );
                      }
                    })()}
                    <span className="block text-base font-medium text-gray-200">Hi, {currentUser.firstName || currentUser.email}!</span>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full text-left pl-3 pr-4 py-2 text-base font-medium text-gray-300 hover:bg-logoScheme-brown hover:text-gray-100"
                  >
                    View Profile
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="block w-full text-left pl-3 pr-4 py-2 text-base font-medium text-logoScheme-red hover:bg-red-700 hover:text-white"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full text-left pl-3 pr-4 py-2 text-base font-medium text-gray-300 hover:bg-logoScheme-brown hover:text-gray-100"
                  >
                    Login
                  </Link>
                  <Link 
                    to="/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full text-left pl-3 pr-4 py-2 mt-1 text-base font-medium text-gray-300 hover:bg-logoScheme-brown hover:text-gray-100"
                  >
                    Sign Up
                  </Link>
                </>
              )}
               <Link 
                to="/builder"
                className="block w-full mt-2 text-center bg-logoScheme-gold text-logoScheme-darkGray px-4 py-2 rounded-md text-base font-medium hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-logoScheme-gold"
                onClick={() => setIsMenuOpen(false)}
              >
                New Deck
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 
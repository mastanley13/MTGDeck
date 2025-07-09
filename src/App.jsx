import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './App.css';
import HomePage from './pages/HomePage.jsx';
import DeckBuilderPage from './pages/DeckBuilder.jsx';
import DeckViewer from './pages/DeckViewer.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import UserProfilePage from './pages/UserProfilePage.jsx';
import CommanderAiPage from './pages/CommanderAiPage.jsx';
import TutorAiPage from './pages/TutorAiPage.jsx';
import CardSearchPage from './pages/CardSearchPage.jsx';
import SubscriptionPage from './pages/SubscriptionPage.jsx';
import HowToPlayPage from './pages/HowToPlayPage.jsx';
import BlogPage from './pages/BlogPage.jsx';
import AffiliatePage from './pages/AffiliatePage.jsx';
import BlogPostPage from './pages/BlogPostPage.jsx';
import ContactPage from './pages/ContactPage.jsx';
import SocialsPage from './pages/SocialsPage.jsx';
import PaymentSuccessPage from './pages/PaymentSuccessPage.jsx';
import CardDebugger from './components/debug/CardDebugger.jsx';
import { DeckProvider } from './context/DeckContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { SubscriptionProvider } from './context/SubscriptionContext.jsx';
import Navbar from './components/ui/Navbar.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';

function App() {
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Add error handling for missing client ID
  if (!GOOGLE_CLIENT_ID) {
    console.error('Missing GOOGLE_CLIENT_ID environment variable');
  }

  return (
    <GoogleOAuthProvider 
      clientId={GOOGLE_CLIENT_ID}
      onScriptLoadError={(err) => console.error('Google OAuth Script Load Error:', err)}
      onScriptLoadSuccess={() => console.log('Google OAuth Script Loaded Successfully')}
    >
      <AuthProvider>
        <SubscriptionProvider>
          <DeckProvider>
            <Router>
            <div className="app min-h-screen bg-slate-900 flex flex-col">
              <Navbar />
              <main className="flex-1 px-4 md:px-6 lg:px-8 pb-12 max-w-7xl mx-auto w-full">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/card-search" element={<CardSearchPage />} />
                  <Route path="/subscription" element={<SubscriptionPage />} />
                  <Route path="/payment-success" element={<PaymentSuccessPage />} />
                  <Route path="/how-to-play" element={<HowToPlayPage />} />
                  <Route path="/blog" element={<BlogPage />} />
                  <Route path="/blog/:slug" element={<BlogPostPage />} />
                  <Route path="/debug" element={<CardDebugger />} />
                  <Route path="/affiliate" element={<AffiliatePage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/socials" element={<SocialsPage />} />

                  <Route path="/commander-ai" element={<CommanderAiPage />} />
                  <Route path="/tutor-ai" element={<TutorAiPage />} />
                  <Route path="/builder" element={<DeckBuilderPage />} />

                  <Route element={<ProtectedRoute />}>
                    <Route path="/decks" element={<DeckViewer />} />
                    <Route path="/decks/:deckId" element={<DeckViewer />} />
                    <Route path="/profile" element={<UserProfilePage />} />
                  </Route>

                  <Route path="*" element={<HomePage />} />
                </Routes>
              </main>
              <footer className="bg-slate-800/90 backdrop-blur-xl border-t border-slate-700/50 py-8 mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex flex-col lg:flex-row justify-between items-center space-y-6 lg:space-y-0">
                    <div className="text-center lg:text-left">
                      <div className="flex items-center justify-center lg:justify-start space-x-3 mb-3">
                        <img 
                          src="https://storage.googleapis.com/msgsndr/zKZ8Zy6VvGR1m7lNfRkY/media/6830e4ad6417b23718765500.png" 
                          alt="Logo" 
                          className="h-8 w-auto" 
                        />
                        <h3 className="text-xl font-bold bg-gradient-to-r from-primary-400 via-primary-500 to-blue-500 bg-clip-text text-transparent">
                          Deck Tutor AI
                        </h3>
                      </div>
                      <p className="text-slate-400 text-sm max-w-md">
                        Build better Magic: The Gathering Commander decks with AI assistance. 
                        Get personalized recommendations and optimize your gameplay.
                      </p>
                    </div>
                    
                    <div className="flex flex-col lg:flex-row items-center space-y-4 lg:space-y-0 lg:space-x-8">
                      {/* Quick Links */}
                      <div className="flex flex-wrap justify-center gap-6 text-sm">
                        <a href="/builder" className="text-slate-300 hover:text-primary-400 transition-colors">Deck Builder</a>
                        <a href="/card-search" className="text-slate-300 hover:text-primary-400 transition-colors">Card Search</a>
                        <a href="/how-to-play" className="text-slate-300 hover:text-primary-400 transition-colors">How to Play</a>
                        <a href="/contact" className="text-slate-300 hover:text-primary-400 transition-colors">Contact</a>
                      </div>
                      
                      {/* Social Links */}
                      <div className="flex space-x-4">
                        <a 
                          href="https://discord.gg/Exg5dxqgVP" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-indigo-400 transition-colors"
                          title="Join our Discord"
                        >
                          <span className="sr-only">Discord</span>
                          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                          </svg>
                        </a>
                        <a 
                          href="https://www.reddit.com/r/AIDeckTuor/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-orange-400 transition-colors"
                          title="Visit our Subreddit"
                        >
                          <span className="sr-only">Reddit</span>
                          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                          </svg>
                        </a>

                      </div>
                    </div>
                  </div>
                  
                  {/* Copyright */}
                  <div className="border-t border-slate-700/50 mt-8 pt-6 text-center">
                    <p className="text-slate-500 text-sm">
                      © {new Date().getFullYear()} Deck Tutor AI. All rights reserved. 
                      <span className="mx-2">•</span>
                      Magic: The Gathering is a trademark of Wizards of the Coast LLC.
                    </p>
                    <p className="text-slate-600 text-xs mt-2">
                      Powered by StrategixAI & Scryfall
                    </p>
                  </div>
                </div>
              </footer>
              <ToastContainer
                position="bottom-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
              />
            </div>
          </Router>
        </DeckProvider>
      </SubscriptionProvider>
    </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App; 
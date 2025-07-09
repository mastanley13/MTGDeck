import React from 'react';
import { Link } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';

const LoginPage = () => {
  return (
    <div className="min-h-screen bg-slate-900 overflow-hidden relative">
      {/* Continuous background with flowing gradients */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Animated background orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/8 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-primary-600/6 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo/Brand Section */}
          <div className="text-center mb-10">
            <Link to="/" className="inline-flex items-center space-x-3 group">
              <img 
                src="https://storage.googleapis.com/msgsndr/zKZ8Zy6VvGR1m7lNfRkY/media/6830e4ad6417b23718765500.png" 
                alt="Logo" 
                className="h-12 w-auto transition-all duration-300 group-hover:scale-110 drop-shadow-lg" 
              />
              <span className="font-bold text-2xl text-gradient-primary">
                Deck Tutor AI
              </span>
            </Link>
          </div>

          {/* Main Login Card */}
          <div className="relative">
            {/* Card glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-blue-500/20 rounded-3xl blur-xl opacity-60"></div>
            
            <div className="relative glassmorphism-card p-8 lg:p-10 shadow-modern border-primary-500/20">
              <div className="text-center mb-8">
                <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3">
                  Welcome Back
                </h1>
                <p className="text-slate-400 text-lg">
                  Sign in to continue building amazing decks
                </p>
              </div>

              <LoginForm />

              <div className="mt-8 text-center">
                <p className="text-slate-400">
                  Don't have an account?{' '}
                  <Link 
                    to="/register" 
                    className="font-semibold text-gradient-primary hover:text-primary-300 transition-colors duration-300"
                  >
                    Create one here
                  </Link>
                </p>
              </div>

              {/* Additional features hint */}
              <div className="mt-8 pt-6 border-t border-slate-700/50">
                <div className="text-center">
                  <p className="text-slate-500 text-sm mb-4">Unlock powerful features:</p>
                  <div className="flex justify-center space-x-6 text-xs text-slate-400">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                      <span>AI Deck Building</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Commander AI</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                      <span>Deck Analytics</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Return to home link */}
          <div className="text-center mt-8">
            <Link 
              to="/" 
              className="inline-flex items-center space-x-2 text-slate-400 hover:text-white transition-colors duration-300 group"
            >
              <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 
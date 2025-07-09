import React from 'react';
import { Link } from 'react-router-dom';
import RegistrationForm from '../components/auth/RegistrationForm';

const RegisterPage = () => {
  return (
    <div className="min-h-screen bg-slate-900 overflow-hidden relative">
      {/* Continuous background with flowing gradients */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Animated background orbs */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-blue-500/8 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-3/4 right-1/2 w-64 h-64 bg-primary-600/6 rounded-full blur-3xl animate-pulse delay-2000"></div>
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

          {/* Main Registration Card */}
          <div className="relative">
            {/* Card glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-blue-500/20 rounded-3xl blur-xl opacity-60"></div>
            
            <div className="relative glassmorphism-card p-8 lg:p-10 shadow-modern border-primary-500/20">
              <div className="text-center mb-8">
                <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3">
                  Join Deck Tutor AI
                </h1>
                <p className="text-slate-400 text-lg">
                  Create your account and start building better decks with AI
                </p>
              </div>

              <RegistrationForm />

              <div className="mt-8 text-center">
                <p className="text-slate-400">
                  Already have an account?{' '}
                  <Link 
                    to="/login" 
                    className="font-semibold text-gradient-primary hover:text-primary-300 transition-colors duration-300"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>

              {/* Features preview */}
              <div className="mt-8 pt-6 border-t border-slate-700/50">
                <div className="text-center">
                  <p className="text-slate-500 text-sm mb-4">What you'll get:</p>
                  <div className="space-y-3 text-left">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-primary-500 to-blue-500 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-slate-400 text-sm">AI-powered deck building and optimization</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-primary-500 to-blue-500 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-slate-400 text-sm">Commander-specific recommendations</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-primary-500 to-blue-500 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-slate-400 text-sm">Advanced deck analytics and insights</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-primary-500 to-blue-500 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-slate-400 text-sm">Save and manage unlimited decks</span>
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

export default RegisterPage; 
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // GHL API Constants
  const GHL_API_BASE_URL = 'https://services.leadconnectorhq.com';
  const GHL_API_TOKEN = import.meta.env.VITE_GHL_API_KEY;
  const GHL_API_VERSION = '2021-07-28';
  const GHL_LOCATION_ID = 'zKZ8Zy6VvGR1m7lNfRkY';
  const PASSWORD_CUSTOM_FIELD_ID = '6826285e413da0c206873a0e';

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setError('');
      
      // Decode the JWT token to get user info
      const decoded = jwtDecode(credentialResponse.credential);
      
      // Check if user exists in GHL by email
      const response = await fetch(`${GHL_API_BASE_URL}/contacts/search/duplicate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GHL_API_TOKEN}`,
          'Version': GHL_API_VERSION,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          locationId: GHL_LOCATION_ID,
          email: decoded.email,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to verify Google account');
      }

      const data = await response.json();
      
      if (data.contacts && data.contacts.length > 0) {
        // User exists, log them in
        const contact = data.contacts[0];
        const userData = {
          id: contact.id,
          email: contact.email,
          firstName: contact.firstNameLowerCase || decoded.given_name,
          lastName: contact.lastNameLowerCase || decoded.family_name,
          customFields: contact.customFields || [],
          googleAuth: true, // Flag to indicate Google authentication
        };
        login(userData);
        const from = location.state?.from || '/decks';
        navigate(from, { replace: true });
      } else {
        // User doesn't exist, create new account
        const createResponse = await fetch(`${GHL_API_BASE_URL}/contacts/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GHL_API_TOKEN}`,
            'Version': GHL_API_VERSION,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            locationId: GHL_LOCATION_ID,
            email: decoded.email,
            firstName: decoded.given_name,
            lastName: decoded.family_name,
            customFields: [
              {
                id: PASSWORD_CUSTOM_FIELD_ID,
                value: 'GOOGLE_AUTH', // Special marker for Google-authenticated users
              },
            ],
          }),
        });

        if (!createResponse.ok) {
          throw new Error('Failed to create account with Google');
        }

        const createData = await createResponse.json();
        const userData = {
          id: createData.contact.id,
          email: decoded.email,
          firstName: decoded.given_name,
          lastName: decoded.family_name,
          customFields: createData.contact.customFields || [],
          googleAuth: true,
        };
        login(userData);
        const from = location.state?.from || '/decks';
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Google login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google login failed. Please try again.');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${GHL_API_BASE_URL}/contacts/search/duplicate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GHL_API_TOKEN}`,
          'Version': GHL_API_VERSION,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          locationId: GHL_LOCATION_ID,
          email: email,
        }),
      });

      if (!response.ok) {
        throw new Error('Network error. Please try again.');
      }

      const data = await response.json();

      if (data.contacts && data.contacts.length > 0) {
        const contact = data.contacts[0];
        const passwordField = contact.customFields.find(cf => cf.id === PASSWORD_CUSTOM_FIELD_ID);

        if (passwordField && (passwordField.value === password || passwordField.value === 'GOOGLE_AUTH')) {
          const userData = {
            id: contact.id,
            email: contact.email,
            firstName: contact.firstNameLowerCase,
            customFields: contact.customFields || [],
          };
          login(userData);
          setLoading(false);
          const from = location.state?.from || '/decks';
          navigate(from, { replace: true });
        } else {
          setError('Invalid email or password. Please try again or register.');
          setLoading(false);
        }
      } else {
        setError('Email not found. Please check your email or register.');
        setLoading(false);
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-semibold text-white">
          Email Address
        </label>
        <div className="relative">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 hover:border-slate-500/50"
            placeholder="Enter your email address"
            disabled={loading}
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-semibold text-white">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 hover:border-slate-500/50"
            placeholder="Enter your password"
            disabled={loading}
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>
      </div>

      {error && (
        <div className="relative">
          <div className="absolute inset-0 bg-red-500/10 rounded-xl blur-sm"></div>
          <div className="relative bg-red-500/20 border border-red-500/30 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-red-300 font-medium">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="btn-modern btn-modern-primary btn-modern-md w-full relative overflow-hidden group"
        >
          {loading && (
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] animate-pulse"></div>
          )}
          <span className="relative flex items-center justify-center space-x-2">
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </span>
        </button>
      </div>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-600/50"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-slate-900 text-slate-400 font-medium">Or continue with</span>
        </div>
      </div>

      {/* Google Login Button */}
      <div className="w-full">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          useOneTap={false}
          theme="filled_black"
          size="large"
          width="100%"
          text="signin_with"
          shape="rectangular"
        />
      </div>
    </form>
  );
};

export default LoginForm; 
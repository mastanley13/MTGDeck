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
  const PASSWORD_CUSTOM_FIELD_ID = '7GbpQNKTkpS3Od2U0xEl';
  const BACKUP_PASSWORD_FIELD_ID = 'jlDlXSAPDElE3BaA9Usa';

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setError('');
      
      // Decode the JWT token to get user info
      const decoded = jwtDecode(credentialResponse.credential);
      
      // Use upsert to create or update user automatically
      console.log('Processing Google user with upsert:', decoded.email);
      
      const upsertResponse = await fetch(`${GHL_API_BASE_URL}/contacts/upsert`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GHL_API_TOKEN}`,
          'Version': GHL_API_VERSION,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          locationId: GHL_LOCATION_ID,
          firstName: decoded.given_name,
          lastName: decoded.family_name,
          email: decoded.email,
          source: 'Google OAuth',
          customFields: [
            {
              id: PASSWORD_CUSTOM_FIELD_ID,
              value: 'GOOGLE_AUTH', // Special marker for Google-authenticated users
            },
          ],
        }),
      });

      console.log('GHL Upsert Response Status:', upsertResponse.status);
      if (!upsertResponse.ok) {
        const errorText = await upsertResponse.text();
        console.error('GHL Upsert Error Response:', errorText);
        throw new Error(`Failed to process Google account: ${upsertResponse.status} - ${errorText}`);
      }

      const upsertData = await upsertResponse.json();
      console.log('GHL upsert response:', upsertData);
      
      const userData = {
        id: upsertData.contact.id,
        email: upsertData.contact.email,
        firstName: upsertData.contact.firstName || decoded.given_name,
        lastName: upsertData.contact.lastName || decoded.family_name,
        customFields: upsertData.contact.customFields || [],
        googleAuth: true,
      };
      
      console.log('Logging in Google user:', userData);
      login(userData);
      const from = location.state?.from || '/decks';
      navigate(from, { replace: true });
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
      // Search for contacts by email using the correct endpoint
      const response = await fetch(`${GHL_API_BASE_URL}/contacts/search/duplicate?locationId=${GHL_LOCATION_ID}&email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${GHL_API_TOKEN}`,
          'Version': GHL_API_VERSION,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('GHL API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          email: email
        });
        
        if (response.status === 422) {
          throw new Error('Invalid email format or missing required fields.');
        } else if (response.status === 403) {
          throw new Error('Authentication failed. Please check your credentials.');
        } else if (response.status === 404) {
          throw new Error('Email not found. Please check your email or register.');
        } else {
          throw new Error('Network error. Please try again.');
        }
      }

      const data = await response.json();
      console.log('Login search response:', data);

      if (data.contact) {
        const contact = data.contact;
        const passwordField = contact.customFields?.find(cf => 
          cf.id === PASSWORD_CUSTOM_FIELD_ID || cf.id === BACKUP_PASSWORD_FIELD_ID
        );

        console.log('Found password field:', passwordField); // Debug log

        if (passwordField && (passwordField.value === password || passwordField.value === 'GOOGLE_AUTH')) {
          const userData = {
            id: contact.id,
            email: contact.email,
            firstName: contact.firstName || contact.firstNameLowerCase,
            lastName: contact.lastName || contact.lastNameLowerCase,
            customFields: contact.customFields || [],
          };
          login(userData);
          setLoading(false);
          const from = location.state?.from || '/decks';
          navigate(from, { replace: true });
        } else {
          console.log('Password mismatch:', {
            provided: password,
            stored: passwordField?.value,
            isGoogleAuth: passwordField?.value === 'GOOGLE_AUTH'
          }); // Debug log
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
        {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap={false}
            theme="filled_black"
            size="large"
            text="signin_with"
            shape="rectangular"
            width={400}
          />
        ) : (
          <div className="w-full p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-xl text-center">
            <p className="text-yellow-300 text-sm">
              Google login not configured. Please set VITE_GOOGLE_CLIENT_ID environment variable.
            </p>
          </div>
        )}
      </div>
    </form>
  );
};

export default LoginForm; 
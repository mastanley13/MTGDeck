import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { setInitialSubscriptionStatus } from '../../utils/ghlSubscriptionAPI';
import { useAuth } from '../../context/AuthContext';

const RegistrationForm = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear errors when user starts typing
    if (error) setError('');
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setError('');
      
      // Decode the JWT token to get user info
      const decoded = jwtDecode(credentialResponse.credential);
      
      // Create account with Google info
      const userData = {
        firstName: decoded.given_name,
        lastName: decoded.family_name,
        email: decoded.email,
        password: 'GOOGLE_AUTH', // Special marker for Google-authenticated users
      };
      
      const result = await upsertGHLContact(userData);
      
      if (result.success) {
        // Log the user in immediately
        const loginData = {
          id: result.contactId,
          email: decoded.email,
          firstName: decoded.given_name,
          lastName: decoded.family_name,
          customFields: result.customFields || [],
          googleAuth: true,
        };
        login(loginData);
        navigate('/decks');
      }
    } catch (err) {
      setError(err.message || 'Google registration failed. Please try again.');
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google registration failed. Please try again.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match. Please make sure both password fields are identical.");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    await upsertGHLContact(formData);
  };

  const upsertGHLContact = async (userData) => {
    const GHL_API_BASE_URL = 'https://services.leadconnectorhq.com';
    const GHL_API_TOKEN = import.meta.env.VITE_GHL_API_KEY; 
    const GHL_API_VERSION = '2021-07-28';
    const GHL_LOCATION_ID = 'zKZ8Zy6VvGR1m7lNfRkY';

    const apiEndpoint = `${GHL_API_BASE_URL}/contacts/upsert`;

    const contactData = {
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      locationId: GHL_LOCATION_ID,
      customFields: [
        {
          id: "7GbpQNKTkpS3Od2U0xEl",
          value: userData.password,
        },
        {
          id: "zi3peZjkU9rZmf5j41Et",
          field_value: "no",
        },
      ],
    };

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GHL_API_TOKEN}`,
          'Version': GHL_API_VERSION,
        },
        body: JSON.stringify(contactData),
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.contact && result.contact.id) {
          try {
            await setInitialSubscriptionStatus(result.contact.id, false);
            // Add Reflio signup tracking
            if (typeof Reflio !== 'undefined') {
              await Reflio.signup(userData.email);
            }
          } catch (error) {
            console.error('Failed to set initial subscription status or track Reflio signup:', error);
          }
        }
        
        // Return success data for Google registration
        if (userData.password === 'GOOGLE_AUTH') {
          return {
            success: true,
            contactId: result.contact.id,
            customFields: result.contact.customFields || []
          };
        }
        
        setSuccess(true);
        setLoading(false);
        
        // Show success message for 2 seconds then redirect
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        const errorResult = await response.json();
        const errorMessage = errorResult.message || 'Registration failed. Please try again.';
        if (userData.password === 'GOOGLE_AUTH') {
          throw new Error(errorMessage);
        }
        setError(errorMessage);
        setLoading(false);
      }
    } catch (error) {
      const errorMessage = 'Registration failed: Network error. Please check your connection and try again.';
      if (userData.password === 'GOOGLE_AUTH') {
        throw error;
      }
      setError(errorMessage);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-500/20 mb-4">
          <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Account Created Successfully!</h3>
        <p className="text-slate-400">Redirecting you to login...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name Fields */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="firstName" className="block text-sm font-semibold text-white">
            First Name
          </label>
          <div className="relative">
            <input
              type="text"
              name="firstName"
              id="firstName"
              autoComplete="given-name"
              required
              value={formData.firstName}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 hover:border-slate-500/50"
              placeholder="Enter first name"
              disabled={loading}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="lastName" className="block text-sm font-semibold text-white">
            Last Name
          </label>
          <div className="relative">
            <input
              type="text"
              name="lastName"
              id="lastName"
              autoComplete="family-name"
              required
              value={formData.lastName}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 hover:border-slate-500/50"
              placeholder="Enter last name"
              disabled={loading}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Email Field */}
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
            value={formData.email}
            onChange={handleChange}
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

      {/* Password Fields */}
      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-semibold text-white">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 hover:border-slate-500/50"
              placeholder="Create a password (min. 6 characters)"
              disabled={loading}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="block text-sm font-semibold text-white">
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 hover:border-slate-500/50"
              placeholder="Confirm your password"
              disabled={loading}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
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
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
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

      {/* Google Registration Button */}
      <div className="w-full">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          useOneTap={false}
          theme="filled_black"
          size="large"
          width="100%"
          text="signup_with"
          shape="rectangular"
        />
      </div>
    </form>
  );
};

export default RegistrationForm; 
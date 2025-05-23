import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Access environment variables using import.meta.env for Vite
  const GHL_API_KEY = import.meta.env.VITE_GHL_API_KEY;
  const LOCATION_ID = import.meta.env.VITE_LOCATION_ID;
  const PASSWORD_CUSTOM_FIELD_ID = "7GbpQNKTkpS3Od2U0xEl";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!GHL_API_KEY || !LOCATION_ID) {
      setError('API key or Location ID is not configured. Please contact support.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('https://services.leadconnectorhq.com/contacts/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          locationId: LOCATION_ID,
          pageLimit: 1, // Only need to find one contact
          filters: [
            {
              field: "email",
              operator: "eq",
              value: email
            }
          ]
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Login failed. Please try again.' }));
        throw new Error(errorData.message || 'Login failed due to server error.');
      }

      const data = await response.json();

      if (data.contacts && data.contacts.length > 0) {
        const contact = data.contacts[0];
        const passwordField = contact.customFields.find(cf => cf.id === PASSWORD_CUSTOM_FIELD_ID);

        if (passwordField && passwordField.value === password) {
          // Login successful
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
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700">
          Email address
        </label>
        <div className="mt-1">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-logoScheme-gold focus:border-logoScheme-gold sm:text-sm bg-slate-100 text-slate-800"
            disabled={loading}
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-700">
          Password
        </label>
        <div className="mt-1">
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-logoScheme-gold focus:border-logoScheme-gold sm:text-sm bg-slate-100 text-slate-800"
            disabled={loading}
          />
        </div>
      </div>

      {error && (
        <div>
          <p className="text-sm text-logoScheme-red">{error}</p>
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-logoScheme-gold hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-logoScheme-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </div>
    </form>
  );
};

export default LoginForm; 
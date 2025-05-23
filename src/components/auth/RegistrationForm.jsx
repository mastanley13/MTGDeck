import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const RegistrationForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords don't match!"); // Replace with a proper notification later
      return;
    }
    // TODO: Implement GoHighLevel API call for registration
    console.log('Registration attempt with:', formData);
    upsertGHLContact(formData); // Call the GHL upsert contact function
  };

  // Function to handle GHL API call for upserting a contact
  const upsertGHLContact = async (userData) => {
    // IMPORTANT: Replace with your actual GHL API details if different
    const GHL_API_BASE_URL = 'https://services.leadconnectorhq.com'; // Or your specific GHL API URL
    // Consistent API token usage from environment variables
    const GHL_API_TOKEN = import.meta.env.VITE_GHL_API_KEY; 
    const GHL_API_VERSION = '2021-07-28'; // Replace with the API version you are using
    const GHL_LOCATION_ID = 'zKZ8Zy6VvGR1m7lNfRkY'; // The locationId you provided

    const apiEndpoint = `${GHL_API_BASE_URL}/contacts/upsert`; // Changed to upsert endpoint

    const contactData = {
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      locationId: GHL_LOCATION_ID, // Added locationId
      customFields: [
        {
          id: "7GbpQNKTkpS3Od2U0xEl", // ID for the 'Password' custom field
          value: userData.password,
        },
      ],
      // Add other relevant fields from UpsertContactDto as needed
      // e.g., phone: userData.phone, source: 'Website Registration', etc.
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
        console.log('GHL Contact upserted successfully:', result);
        navigate('/login');
      } else {
        const errorResult = await response.json();
        console.error('GHL API Error (Upsert):', response.status, errorResult);
        alert(`Registration failed: ${errorResult.message || 'Unknown error'}`); // Replace with a proper notification
        // TODO: Handle API error (e.g., show error message to user)
      }
    } catch (error) {
      console.error('Error during GHL API call (Upsert):', error);
      alert('Registration failed: An unexpected error occurred.'); // Replace with a proper notification
      // TODO: Handle network or other unexpected errors
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-slate-700">
            First name
          </label>
          <div className="mt-1">
            <input
              type="text"
              name="firstName"
              id="firstName"
              autoComplete="given-name"
              required
              value={formData.firstName}
              onChange={handleChange}
              className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-logoScheme-gold focus:border-logoScheme-gold sm:text-sm bg-slate-100 text-slate-800"
            />
          </div>
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-slate-700">
            Last name
          </label>
          <div className="mt-1">
            <input
              type="text"
              name="lastName"
              id="lastName"
              autoComplete="family-name"
              required
              value={formData.lastName}
              onChange={handleChange}
              className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-logoScheme-gold focus:border-logoScheme-gold sm:text-sm bg-slate-100 text-slate-800"
            />
          </div>
        </div>
      </div>

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
            value={formData.email}
            onChange={handleChange}
            className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-logoScheme-gold focus:border-logoScheme-gold sm:text-sm bg-slate-100 text-slate-800"
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
            autoComplete="new-password"
            required
            value={formData.password}
            onChange={handleChange}
            className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-logoScheme-gold focus:border-logoScheme-gold sm:text-sm bg-slate-100 text-slate-800"
          />
        </div>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
          Confirm Password
        </label>
        <div className="mt-1">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={formData.confirmPassword}
            onChange={handleChange}
            className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-logoScheme-gold focus:border-logoScheme-gold sm:text-sm bg-slate-100 text-slate-800"
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-logoScheme-gold hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-logoScheme-gold transition-colors"
        >
          Create account
        </button>
      </div>
    </form>
  );
};

export default RegistrationForm; 
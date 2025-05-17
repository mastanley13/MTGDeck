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

  // Password custom field ID from GoHighLevel
  const PASSWORD_CUSTOM_FIELD_ID = "7GbpQNKTkpS3Od2U0xEl";

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
    const GHL_API_BASE_URL = 'https://services.leadconnectorhq.com';
    const GHL_API_TOKEN = import.meta.env.VITE_GHL_API_KEY;
    const GHL_API_VERSION = '2021-07-28';
    const GHL_LOCATION_ID = 'zKZ8Zy6VvGR1m7lNfRkY';

    // First, verify if the password custom field exists
    try {
      const customFieldResponse = await fetch(`${GHL_API_BASE_URL}/custom-fields/${PASSWORD_CUSTOM_FIELD_ID}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${GHL_API_TOKEN}`,
          'Version': GHL_API_VERSION,
          'Content-Type': 'application/json',
        }
      });

      // If custom field doesn't exist, create it
      if (!customFieldResponse.ok) {
        const createFieldResponse = await fetch(`${GHL_API_BASE_URL}/custom-fields`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GHL_API_TOKEN}`,
            'Version': GHL_API_VERSION,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            locationId: GHL_LOCATION_ID,
            name: 'Password',
            fieldKey: 'password',
            dataType: 'TEXT',
            showInForms: false,
            objectKey: 'contact'
          })
        });

        if (!createFieldResponse.ok) {
          throw new Error('Failed to create password field');
        }
      }

      // Now proceed with contact creation/update
      const contactData = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        locationId: GHL_LOCATION_ID,
        customFields: [
          {
            id: PASSWORD_CUSTOM_FIELD_ID,
            field_value: userData.password
          }
        ]
      };

      const response = await fetch(`${GHL_API_BASE_URL}/contacts/upsert`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GHL_API_TOKEN}`,
          'Version': GHL_API_VERSION,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to register user');
      }

      const data = await response.json();
      console.log('Registration successful:', data);
      navigate('/login');
    } catch (error) {
      console.error('Registration error:', error);
      alert('Failed to register. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-300">
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
              className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-gray-700 text-white"
            />
          </div>
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-300">
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
              className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-gray-700 text-white"
            />
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-300">
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
            className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-gray-700 text-white"
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-300">
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
            className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-gray-700 text-white"
          />
        </div>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
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
            className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-gray-700 text-white"
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-primary-500 transition-colors"
        >
          Create account
        </button>
      </div>
    </form>
  );
};

export default RegistrationForm; 
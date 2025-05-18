import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const UserProfilePage = () => {
  const { currentUser, updateCurrentUserData } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState('');

  // Profile Picture State
  const [scryfallQuery, setScryfallQuery] = useState('');
  const [scryfallResults, setScryfallResults] = useState([]);
  const [scryfallLoading, setScryfallLoading] = useState(false);
  const [scryfallError, setScryfallError] = useState('');
  const [selectedProfilePic, setSelectedProfilePic] = useState('');
  const [profilePicUpdateLoading, setProfilePicUpdateLoading] = useState(false);
  const [profilePicUpdateSuccess, setProfilePicUpdateSuccess] = useState('');
  const [profilePicUpdateError, setProfilePicUpdateError] = useState('');

  // Environment variables and constants
  const GHL_API_KEY = import.meta.env.VITE_GHL_API_KEY;
  const PASSWORD_CUSTOM_FIELD_ID = "7GbpQNKTkpS3Od2U0xEl";
  const PROFILE_PIC_CUSTOM_FIELD_ID = "hPIWnTEsvK1pVbATGLS5"; // Updated with actual ID

  useEffect(() => {
    if (currentUser && currentUser.customFields) {
      const profilePicField = currentUser.customFields.find(cf => cf.id === PROFILE_PIC_CUSTOM_FIELD_ID);
      if (profilePicField && profilePicField.value) {
        setSelectedProfilePic(profilePicField.value);
      }
    } else if (currentUser && !selectedProfilePic) {
        // Fallback if customFields might not be populated initially but currentUser exists
        // This depends on how currentUser is structured and updated by AuthContext
    }
  }, [currentUser]);

  if (!currentUser) {
    return <p>Loading user information...</p>;
  }

  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    setPasswordChangeError('');
    setPasswordChangeSuccess('');

    if (newPassword !== confirmNewPassword) {
      setPasswordChangeError("New passwords don't match.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordChangeError("New password must be at least 6 characters long.");
      return;
    }
    if (!GHL_API_KEY) {
        setPasswordChangeError("API key is not configured. Please contact support.");
        return;
    }
    if (!currentUser || !currentUser.id) {
        setPasswordChangeError("User ID not found. Cannot update password.");
        return;
    }
    setPasswordChangeLoading(true);
    const payload = {
      customFields: [
        { id: PASSWORD_CUSTOM_FIELD_ID, value: newPassword }
      ]
    };
    try {
      const response = await fetch(`https://services.leadconnectorhq.com/contacts/${currentUser.id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Version': '2021-07-28',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );
      if (!response.ok) {
        let errorData = { message: 'Failed to update password. Please try again.' };
        try {
            errorData = await response.json();
        } catch (parseError) {
            console.error("Could not parse error response from GHL:", parseError);
        }
        throw new Error(errorData.message || 'Failed to update password due to a server error.');
      }
      setPasswordChangeSuccess('Password updated successfully!');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error) {
      console.error("Password change error:", error);
      setPasswordChangeError(error.message || 'An unexpected error occurred while updating password.');
    }
    setPasswordChangeLoading(false);
  };

  const handleScryfallSearch = async (e) => {
    e.preventDefault();
    if (!scryfallQuery.trim()) return;
    setScryfallLoading(true);
    setScryfallError('');
    setScryfallResults([]);
    try {
      const response = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(scryfallQuery)}&unique=art`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Error searching Scryfall.');
      }
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        setScryfallResults(data.data);
      } else {
        setScryfallError('No card art found for your query.');
      }
    } catch (error) {
      setScryfallError(error.message || 'Failed to fetch from Scryfall.');
    }
    setScryfallLoading(false);
  };

  const handleSelectProfilePic = async (imageUrl) => {
    setSelectedProfilePic(imageUrl);
    setProfilePicUpdateLoading(true);
    setProfilePicUpdateError('');
    setProfilePicUpdateSuccess('');

    if (!GHL_API_KEY || !PROFILE_PIC_CUSTOM_FIELD_ID || PROFILE_PIC_CUSTOM_FIELD_ID === "YOUR_GHL_PROFILE_PIC_CUSTOM_FIELD_ID") {
        setProfilePicUpdateError("Profile picture custom field ID is not configured correctly. Please update it in the code.");
        setProfilePicUpdateLoading(false);
        return;
    }
     if (!currentUser || !currentUser.id) {
        setProfilePicUpdateError("User ID not found. Cannot update profile picture.");
        setProfilePicUpdateLoading(false);
        return;
    }

    const payload = {
      customFields: [
        { id: PROFILE_PIC_CUSTOM_FIELD_ID, value: imageUrl }
      ]
    };

    try {
      const response = await fetch(`https://services.leadconnectorhq.com/contacts/${currentUser.id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Version': '2021-07-28',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );
      if (!response.ok) {
        let errorData = { message: 'Failed to update profile picture. Please try again.' };
        try { errorData = await response.json(); } catch (e) { /* ignore */ }
        throw new Error(errorData.message || 'Server error updating profile picture.');
      }
      setProfilePicUpdateSuccess('Profile picture updated!');
      
      // Update AuthContext so Navbar and other components reflect the change immediately
      const updatedCustomFields = currentUser.customFields ? 
        currentUser.customFields.map(cf => 
          cf.id === PROFILE_PIC_CUSTOM_FIELD_ID ? { ...cf, value: imageUrl } : cf
        ) : [];
      
      // Ensure the field is added if it doesn't exist
      if (!updatedCustomFields.find(cf => cf.id === PROFILE_PIC_CUSTOM_FIELD_ID)) {
        updatedCustomFields.push({ id: PROFILE_PIC_CUSTOM_FIELD_ID, value: imageUrl });
      }

      updateCurrentUserData({ customFields: updatedCustomFields });

    } catch (error) {
      setProfilePicUpdateError(error.message || 'An unexpected error occurred.');
    }
    setProfilePicUpdateLoading(false);
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">User Profile</h1>
      
      <div className="mb-8 p-6 border border-gray-200 rounded-lg shadow-md bg-white">
        <h2 className="text-2xl font-semibold mb-3 text-gray-700">Account Information</h2>
        <div className="flex items-center space-x-4">
            {selectedProfilePic && (
                <img src={selectedProfilePic} alt="Profile" className="w-20 h-20 rounded-full object-cover border-2 border-indigo-500" />
            )}
            <p className="text-gray-600">Email: <span className="font-medium text-gray-800">{currentUser.email || 'N/A'}</span></p>
        </div>
      </div>

      <div className="mb-8 p-6 border border-gray-200 rounded-lg shadow-md bg-white">
        <h2 className="text-2xl font-semibold mb-3 text-gray-700">Profile Picture</h2>
        
        {selectedProfilePic && (
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-700 mb-2">Current Picture:</h3>
            <img src={selectedProfilePic} alt="Selected Profile" className="w-32 h-32 rounded-md object-cover border shadow" />
          </div>
        )}
        {profilePicUpdateLoading && <p className="text-sm text-indigo-600">Updating profile picture...</p>}
        {profilePicUpdateSuccess && <p className="text-sm text-green-600 bg-green-100 p-3 rounded-md">{profilePicUpdateSuccess}</p>}
        {profilePicUpdateError && <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md">{profilePicUpdateError}</p>}

        <form onSubmit={handleScryfallSearch} className="mb-4 flex space-x-2">
          <input 
            type="text" 
            value={scryfallQuery}
            onChange={(e) => setScryfallQuery(e.target.value)}
            placeholder="Search Scryfall for card art (e.g., 'Sol Ring')"
            className="flex-grow mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            disabled={scryfallLoading || profilePicUpdateLoading}
          />
          <button 
            type="submit"
            className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={scryfallLoading || profilePicUpdateLoading}
          >
            {scryfallLoading ? 'Searching...' : 'Search Art'}
          </button>
        </form>

        {scryfallError && <p className="text-sm text-red-500">{scryfallError}</p>}

        {scryfallResults.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-medium text-gray-700 mb-2">Select an Image:</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-96 overflow-y-auto p-2 border rounded">
              {scryfallResults.map(card => (
                card.image_uris && card.image_uris.art_crop ? (
                  <img 
                    key={card.id}
                    src={card.image_uris.art_crop}
                    alt={card.name}
                    title={`Select ${card.name} art`}
                    className={`w-full h-auto object-cover rounded-md cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all ${selectedProfilePic === card.image_uris.art_crop ? 'ring-4 ring-green-500' : ''}`}
                    onClick={() => !profilePicUpdateLoading && handleSelectProfilePic(card.image_uris.art_crop)}
                  />
                ) : null
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-6 border border-gray-200 rounded-lg shadow-md bg-white">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Change Password</h2>
        <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">New Password</label>
            <input 
              type="password" 
              id="newPassword" 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required 
              disabled={passwordChangeLoading}
              placeholder="Enter your new password (min. 6 characters)"
            />
          </div>
          <div>
            <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700">Confirm New Password</label>
            <input 
              type="password" 
              id="confirmNewPassword" 
              value={confirmNewPassword} 
              onChange={(e) => setConfirmNewPassword(e.target.value)} 
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required 
              disabled={passwordChangeLoading}
              placeholder="Confirm your new password"
            />
          </div>

          {passwordChangeError && <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md">{passwordChangeError}</p>}
          {passwordChangeSuccess && <p className="text-sm text-green-600 bg-green-100 p-3 rounded-md">{passwordChangeSuccess}</p>}

          <button 
            type="submit" 
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors duration-150 ease-in-out"
            disabled={passwordChangeLoading}
          >
            {passwordChangeLoading ? (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : null}
            {passwordChangeLoading ? 'Updating Password...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserProfilePage; 
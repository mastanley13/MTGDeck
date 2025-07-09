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
  const PROFILE_PIC_CUSTOM_FIELD_ID = "hPIWnTEsvK1pVbATGLS5";

  useEffect(() => {
    if (currentUser && currentUser.customFields) {
      const profilePicField = currentUser.customFields.find(cf => cf.id === PROFILE_PIC_CUSTOM_FIELD_ID);
      if (profilePicField && profilePicField.value) {
        setSelectedProfilePic(profilePicField.value);
      }
    }
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="glassmorphism-card p-8 text-center">
          <div className="animate-spin h-12 w-12 border-3 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading user information...</p>
        </div>
      </div>
    );
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
      const response = await fetch(`https://services.leadconnectorhq.com/contacts/${currentUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

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

    if (!GHL_API_KEY || !PROFILE_PIC_CUSTOM_FIELD_ID) {
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
      const response = await fetch(`https://services.leadconnectorhq.com/contacts/${currentUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        let errorData = { message: 'Failed to update profile picture. Please try again.' };
        try { 
          errorData = await response.json(); 
        } catch (e) { /* ignore */ }
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
    <div className="min-h-screen bg-slate-900">
      {/* Background effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/8 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12 space-y-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gradient-primary mb-4">
            👤 User Profile
          </h1>
          <p className="text-xl text-slate-400">
            Manage your account settings and customize your profile
          </p>
        </div>
        
        {/* Account Information Card */}
        <div className="glassmorphism-card p-8 border-primary-500/20">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary-500 to-blue-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span>Account Information</span>
          </h2>
          
          <div className="flex items-center space-x-6">
            {selectedProfilePic ? (
              <img 
                src={selectedProfilePic} 
                alt="Profile" 
                className="w-24 h-24 rounded-2xl object-cover border-2 border-primary-500/50 shadow-lg shadow-primary-500/20" 
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-r from-primary-500 to-blue-500 flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-white">
                  {currentUser?.firstName?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
                </span>
              </div>
            )}
            <div className="space-y-2">
              <p className="text-slate-300 text-lg">
                <span className="text-slate-500">Email:</span> 
                <span className="font-semibold text-white ml-2">{currentUser.email || 'N/A'}</span>
              </p>
              <p className="text-slate-300 text-lg">
                <span className="text-slate-500">Name:</span> 
                <span className="font-semibold text-white ml-2">{currentUser.firstName || 'Not set'}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Profile Picture Card */}
        <div className="glassmorphism-card p-8 border-slate-700/50">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary-500 to-blue-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span>Profile Picture</span>
          </h2>
          
          {selectedProfilePic && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">Current Picture:</h3>
              <img 
                src={selectedProfilePic} 
                alt="Selected Profile" 
                className="w-40 h-40 rounded-2xl object-cover border-2 border-primary-500/50 shadow-lg shadow-primary-500/20" 
              />
            </div>
          )}

          {/* Status Messages */}
          {profilePicUpdateLoading && (
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4 mb-6">
              <div className="flex items-center space-x-3">
                <div className="animate-spin h-5 w-5 border-2 border-blue-400 border-t-transparent rounded-full"></div>
                <p className="text-blue-300">Updating profile picture...</p>
              </div>
            </div>
          )}

          {profilePicUpdateSuccess && (
            <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 mb-6">
              <div className="flex items-center space-x-3">
                <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-green-300 font-medium">{profilePicUpdateSuccess}</p>
              </div>
            </div>
          )}

          {profilePicUpdateError && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 mb-6">
              <div className="flex items-center space-x-3">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-300 font-medium">{profilePicUpdateError}</p>
              </div>
            </div>
          )}

          {/* Search Form */}
          <form onSubmit={handleScryfallSearch} className="space-y-4 mb-8">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-white">
                Search Magic Card Art
              </label>
              <div className="flex space-x-4">
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    value={scryfallQuery}
                    onChange={(e) => setScryfallQuery(e.target.value)}
                    placeholder="Search Scryfall for card art (e.g., 'Sol Ring')"
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 hover:border-slate-500/50"
                    disabled={scryfallLoading || profilePicUpdateLoading}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                <button 
                  type="submit"
                  className="btn-modern btn-modern-primary btn-modern-md"
                  disabled={scryfallLoading || profilePicUpdateLoading}
                >
                  {scryfallLoading ? (
                    <span className="flex items-center space-x-2">
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>Searching...</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-2">
                      <span>Search Art</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </span>
                  )}
                </button>
              </div>
            </div>
          </form>

          {scryfallError && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 mb-6">
              <p className="text-red-300">{scryfallError}</p>
            </div>
          )}

          {/* Search Results */}
          {scryfallResults.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center space-x-2">
                <span>🎨</span>
                <span>Select an Image:</span>
              </h3>
              <div className="glassmorphism-card p-6 max-h-96 overflow-y-auto border-slate-700/50">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                  {scryfallResults.map(card => (
                    card.image_uris && card.image_uris.art_crop ? (
                      <div key={card.id} className="group relative">
                        <img 
                          src={card.image_uris.art_crop}
                          alt={card.name}
                          title={`Select ${card.name} art`}
                          className={`w-full h-auto aspect-square object-cover rounded-xl cursor-pointer transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg ${
                            selectedProfilePic === card.image_uris.art_crop 
                              ? 'ring-4 ring-green-500 shadow-lg shadow-green-500/30' 
                              : 'hover:ring-2 hover:ring-primary-500 hover:shadow-primary-500/30'
                          }`}
                          onClick={() => !profilePicUpdateLoading && handleSelectProfilePic(card.image_uris.art_crop)}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-xl transition-all duration-300 flex items-center justify-center">
                          {selectedProfilePic === card.image_uris.art_crop && (
                            <div className="bg-green-500 rounded-full p-2 shadow-lg">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Change Password Card */}
        <div className="glassmorphism-card p-8 border-slate-700/50">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary-500 to-blue-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <span>Change Password</span>
          </h2>
          
          <form onSubmit={handlePasswordChangeSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="newPassword" className="block text-sm font-semibold text-white">
                New Password
              </label>
              <div className="relative">
                <input 
                  type="password" 
                  id="newPassword" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 hover:border-slate-500/50"
                  required 
                  disabled={passwordChangeLoading}
                  placeholder="Enter your new password (min. 6 characters)"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmNewPassword" className="block text-sm font-semibold text-white">
                Confirm New Password
              </label>
              <div className="relative">
                <input 
                  type="password" 
                  id="confirmNewPassword" 
                  value={confirmNewPassword} 
                  onChange={(e) => setConfirmNewPassword(e.target.value)} 
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 hover:border-slate-500/50"
                  required 
                  disabled={passwordChangeLoading}
                  placeholder="Confirm your new password"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Status Messages */}
            {passwordChangeError && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-300 font-medium">{passwordChangeError}</p>
                </div>
              </div>
            )}

            {passwordChangeSuccess && (
              <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-green-300 font-medium">{passwordChangeSuccess}</p>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              className="btn-modern btn-modern-primary btn-modern-md w-full"
              disabled={passwordChangeLoading}
            >
              {passwordChangeLoading ? (
                <span className="flex items-center justify-center space-x-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Updating Password...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center space-x-2">
                  <span>Change Password</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage; 
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true); // To check localStorage on initial load

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('ghlLoggedInUser');
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Error parsing stored user from localStorage:", error);
      localStorage.removeItem('ghlLoggedInUser'); // Clear corrupted data
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    localStorage.setItem('ghlLoggedInUser', JSON.stringify(userData));
    setCurrentUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('ghlLoggedInUser');
    setCurrentUser(null);
    // Optionally, redirect to login page or home page
    // navigate('/login'); 
  };

  const updateCurrentUserData = (updatedData) => {
    // Merges updatedData with currentUser. Ensure customFields are handled correctly.
    const newUserData = { ...currentUser, ...updatedData };
    
    // If updatedData specifically includes customFields, we need to merge them carefully
    if (updatedData.customFields && currentUser.customFields) {
        const existingCustomFields = currentUser.customFields.filter(
            updatedField => !updatedData.customFields.some(newField => newField.id === updatedField.id)
        );
        newUserData.customFields = [...existingCustomFields, ...updatedData.customFields];
    } else if (updatedData.customFields) {
        newUserData.customFields = updatedData.customFields;
    }
    // If only one custom field is updated (e.g. profile picture URL)
    // We assume `updatedData` might look like { customFields: [{id: 'fieldId', value: 'newValue'}] } when passed from UserProfilePage

    localStorage.setItem('ghlLoggedInUser', JSON.stringify(newUserData));
    setCurrentUser(newUserData);
  };

  const isAuthenticated = !!currentUser;

  const value = {
    currentUser,
    isAuthenticated,
    login,
    logout,
    updateCurrentUserData,
    loadingAuth: loading // Renamed to avoid conflict if consuming component also has 'loading'
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children} 
    </AuthContext.Provider>
  );
}; 
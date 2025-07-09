import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = () => {
  const { isAuthenticated, loadingAuth } = useAuth();

  if (loadingAuth) {
    // You can render a loading spinner here if you have one
    // For now, returning null to prevent rendering children until auth state is known
    return null; 
  }

  if (!isAuthenticated) {
    // User not authenticated, redirect to login page
    // 'replace' prevents the login page from being added to history,
    // so the user doesn't go back to login after logging in and hitting back.
    return <Navigate to="/login" replace />;
  }

  // User is authenticated, render the child routes
  return <Outlet />;
};

export default ProtectedRoute; 
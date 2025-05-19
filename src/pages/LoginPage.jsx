import React from 'react';
import { Link } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';

const LoginPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-logoScheme-darkGray p-8 rounded-xl shadow-2xl">
        <h1 className="text-3xl font-bold text-center text-logoScheme-gold mb-8">Login to Your Account</h1>
        <LoginForm />
        <p className="mt-6 text-center text-sm text-gray-300">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-logoScheme-gold hover:text-yellow-400">
            Sign up here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage; 
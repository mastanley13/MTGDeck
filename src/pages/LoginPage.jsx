import React from 'react';
import { Link } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';

const LoginPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-2xl border border-slate-200">        <h1 className="text-3xl font-bold text-center text-logoScheme-gold mb-8">Login to Your Account</h1>        <LoginForm />        <p className="mt-6 text-center text-sm text-slate-600">          Don't have an account?{' '}          <Link to="/register" className="font-medium text-logoScheme-gold hover:text-sky-700">            Sign up here          </Link>        </p>
      </div>
    </div>
  );
};

export default LoginPage; 
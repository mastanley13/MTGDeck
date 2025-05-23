import React from 'react';
import { Link } from 'react-router-dom';
import RegistrationForm from '../components/auth/RegistrationForm';

const RegisterPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-2xl border border-slate-200">        <h1 className="text-3xl font-bold text-center text-logoScheme-gold mb-8">Create Your Account</h1>        <RegistrationForm />        <p className="mt-6 text-center text-sm text-slate-600">          Already have an account?{' '}          <Link to="/login" className="font-medium text-logoScheme-gold hover:text-sky-700">            Log in here          </Link>        </p>
      </div>
    </div>
  );
};

export default RegisterPage; 
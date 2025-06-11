import React, { useState } from 'react';
import { PublicClientApplication } from '@azure/msal-browser';

interface SignInProps {
  onSignIn: (role: 'student' | 'teacher') => void;
}

const SignIn: React.FC<SignInProps> = ({ onSignIn }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStudentSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // For now, we'll just simulate a successful sign-in
      // Later we can add actual authentication logic
      onSignIn('student');
    } catch (err) {
      setError('Failed to sign in as student. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTeacherSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // For now, we'll just simulate a successful sign-in
      // Later we can add actual authentication logic
      onSignIn('teacher');
    } catch (err) {
      setError('Failed to sign in as teacher. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome to FocusFriend
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please select your role to continue
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <div className="mt-8 space-y-4">
          <button
            onClick={handleStudentSignIn}
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Sign in as Student'}
          </button>

          <button
            onClick={handleTeacherSignIn}
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Sign in as Teacher'}
          </button>
        </div>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                FocusFriend - Your Learning Companion
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn; 
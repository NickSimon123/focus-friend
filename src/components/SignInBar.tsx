import React, { useState } from 'react';
import { PublicClientApplication } from '@azure/msal-browser';
import { signInWithGoogle, signInWithEmail, signUpWithEmail, signOut } from '../services/auth';

interface SignInBarProps {
  isAuthenticated: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  msalInstance: PublicClientApplication;
}

const SignInBar: React.FC<SignInBarProps> = ({ isAuthenticated, onSignIn, onSignOut, msalInstance }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await signInWithGoogle();
      onSignIn();
    } catch (error) {
      console.error('Error signing in with Google:', error);
      setError('Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicrosoftSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Ensure MSAL is initialized
      if (!msalInstance.getActiveAccount()) {
        await msalInstance.initialize();
      }

      const result = await msalInstance.loginPopup({
        scopes: ['user.read', 'Calendars.Read']
      });

      if (result.account) {
        msalInstance.setActiveAccount(result.account);
        onSignIn();
      }
    } catch (error) {
      console.error('Error signing in with Microsoft:', error);
      setError('Failed to sign in with Microsoft');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);
      const formData = new FormData(e.currentTarget);
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;

      await signInWithEmail(email, password);
      onSignIn();
    } catch (error) {
      console.error('Error signing in with email:', error);
      setError('Failed to sign in with email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await signOut();
      await msalInstance.logoutPopup();
      onSignOut();
    } catch (error) {
      console.error('Error signing out:', error);
      setError('Failed to sign out');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <span className="text-lg font-semibold text-gray-900">Focus Friend</span>
          </div>
          <div className="flex items-center space-x-4">
            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}
            {isAuthenticated ? (
              <button
                onClick={handleSignOut}
                disabled={isLoading}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md disabled:opacity-50"
              >
                {isLoading ? 'Signing out...' : 'Sign Out'}
              </button>
            ) : (
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md disabled:opacity-50"
                >
                  {isLoading ? 'Signing in...' : 'Sign in with Google'}
                </button>
                <button
                  onClick={handleMicrosoftSignIn}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md disabled:opacity-50"
                >
                  {isLoading ? 'Signing in...' : 'Sign in with Microsoft'}
                </button>
                <form onSubmit={handleEmailSignIn} className="flex items-center space-x-2">
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    className="px-3 py-2 text-sm border rounded-md"
                    required
                    disabled={isLoading}
                  />
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    className="px-3 py-2 text-sm border rounded-md"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
                  >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default SignInBar; 
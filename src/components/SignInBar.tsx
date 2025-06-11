import React, { useState } from 'react';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '../services/auth';

interface SignInBarProps {
  onSignIn: (user: any) => void;
}

export const SignInBar: React.FC<SignInBarProps> = ({ onSignIn }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    try {
      const user = await signInWithGoogle();
      onSignIn(user);
    } catch (error) {
      setError('Failed to sign in with Google');
      console.error(error);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const user = isSignUp 
        ? await signUpWithEmail(email, password)
        : await signInWithEmail(email, password);
      onSignIn(user);
    } catch (error: any) {
      setError(error.message || 'Failed to sign in');
    }
  };

  return (
    <div className="sign-in-bar">
      <h2>{isSignUp ? 'Create Account' : 'Sign In'}</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleEmailSignIn}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">
          {isSignUp ? 'Sign Up' : 'Sign In'}
        </button>
      </form>

      <button onClick={handleGoogleSignIn} className="google-sign-in">
        Sign in with Google
      </button>

      <button 
        onClick={() => setIsSignUp(!isSignUp)}
        className="toggle-sign-in"
      >
        {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
      </button>
    </div>
  );
}; 
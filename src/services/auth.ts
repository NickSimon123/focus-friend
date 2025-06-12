import { 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  browserPopupRedirectResolver
} from 'firebase/auth';
import { auth, googleProvider, microsoftProvider } from '../config/firebase';

export const signInWithGoogle = async () => {
  try {
    console.log('Attempting Google sign in...');
    const result = await signInWithPopup(auth, googleProvider, browserPopupRedirectResolver);
    console.log('Google sign in successful:', result.user.email);
    return result.user;
  } catch (error: any) {
    console.error('Error signing in with Google:', error);
    
    // Handle specific error cases
    switch (error.code) {
      case 'auth/popup-closed-by-user':
        throw new Error('Sign-in popup was closed. Please try again.');
      case 'auth/cancelled-popup-request':
        throw new Error('Sign-in was cancelled. Please try again.');
      case 'auth/popup-blocked':
        throw new Error('Pop-up was blocked by the browser. Please allow pop-ups for this site.');
      case 'auth/network-request-failed':
        throw new Error('Network error. Please check your internet connection.');
      case 'auth/unauthorized-domain':
        throw new Error('This domain is not authorized for Google sign-in. Please contact support.');
      case 'auth/operation-not-allowed':
        throw new Error('Google sign-in is not enabled. Please contact support.');
      case 'auth/account-exists-with-different-credential':
        throw new Error('An account already exists with the same email address but different sign-in credentials.');
      default:
        console.error('Unexpected error during Google sign-in:', error);
        throw new Error('Failed to sign in with Google. Please try again.');
    }
  }
};

export const signInWithMicrosoft = async () => {
  try {
    console.log('Attempting Microsoft sign in...');
    const result = await signInWithPopup(auth, microsoftProvider, browserPopupRedirectResolver);
    console.log('Microsoft sign in successful:', result.user.email);
    return result.user;
  } catch (error: any) {
    console.error('Error signing in with Microsoft:', error);
    switch (error.code) {
      case 'auth/popup-closed-by-user':
        throw new Error('Sign-in popup was closed. Please try again.');
      case 'auth/cancelled-popup-request':
        throw new Error('Sign-in was cancelled. Please try again.');
      case 'auth/popup-blocked':
        throw new Error('Pop-up was blocked by the browser. Please allow pop-ups for this site.');
      case 'auth/network-request-failed':
        throw new Error('Network error. Please check your internet connection.');
      case 'auth/unauthorized-domain':
        throw new Error('This domain is not authorized for Microsoft sign-in. Please contact support.');
      case 'auth/operation-not-allowed':
        throw new Error('Microsoft sign-in is not enabled. Please contact support.');
      case 'auth/account-exists-with-different-credential':
        throw new Error('An account already exists with the same email address but different sign-in credentials.');
      default:
        console.error('Unexpected error during Microsoft sign-in:', error);
        throw new Error('Failed to sign in with Microsoft. Please try again.');
    }
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  try {
    console.log('Attempting email sign in...');
    const result = await signInWithEmailAndPassword(auth, email, password);
    console.log('Email sign in successful:', result.user.email);
    return result.user;
  } catch (error: any) {
    console.error('Error signing in with email:', error);
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        throw new Error('Invalid email or password.');
      case 'auth/too-many-requests':
        throw new Error('Too many failed attempts. Please try again later.');
      case 'auth/network-request-failed':
        throw new Error('Network error. Please check your internet connection.');
      case 'auth/user-disabled':
        throw new Error('This account has been disabled. Please contact support.');
      default:
        console.error('Unexpected error during email sign-in:', error);
        throw new Error('Failed to sign in. Please try again.');
    }
  }
};

export const signUpWithEmail = async (email: string, password: string) => {
  try {
    console.log('Attempting email sign up...');
    const result = await createUserWithEmailAndPassword(auth, email, password);
    console.log('Email sign up successful:', result.user.email);
    return result.user;
  } catch (error: any) {
    console.error('Error signing up with email:', error);
    switch (error.code) {
      case 'auth/email-already-in-use':
        throw new Error('This email is already registered. Please sign in instead.');
      case 'auth/weak-password':
        throw new Error('Password is too weak. Please use a stronger password.');
      case 'auth/invalid-email':
        throw new Error('Invalid email address.');
      case 'auth/network-request-failed':
        throw new Error('Network error. Please check your internet connection.');
      case 'auth/operation-not-allowed':
        throw new Error('Email/password accounts are not enabled. Please contact support.');
      default:
        console.error('Unexpected error during email sign-up:', error);
        throw new Error('Failed to create account. Please try again.');
    }
  }
};

export const signOut = async () => {
  try {
    console.log('Attempting sign out...');
    await firebaseSignOut(auth);
    console.log('Sign out successful');
  } catch (error) {
    console.error('Error signing out:', error);
    throw new Error('Failed to sign out. Please try again.');
  }
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, (user) => {
    console.log('Auth state changed:', user ? 'User signed in' : 'User signed out');
    callback(user);
  });
}; 
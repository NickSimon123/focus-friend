import { 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth, googleProvider, microsoftProvider } from '../config/firebase';

export const signInWithGoogle = async () => {
  try {
    console.log('Attempting Google sign in...');
    const result = await signInWithPopup(auth, googleProvider);
    console.log('Google sign in successful:', result.user.email);
    return result.user;
  } catch (error: any) {
    console.error('Error signing in with Google:', error);
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in popup was closed. Please try again.');
    }
    if (error.code === 'auth/cancelled-popup-request') {
      throw new Error('Sign-in was cancelled. Please try again.');
    }
    if (error.code === 'auth/popup-blocked') {
      throw new Error('Pop-up was blocked by the browser. Please allow pop-ups for this site.');
    }
    if (error.code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your internet connection.');
    }
    throw new Error('Failed to sign in with Google. Please try again.');
  }
};

export const signInWithMicrosoft = async () => {
  try {
    console.log('Attempting Microsoft sign in...');
    const result = await signInWithPopup(auth, microsoftProvider);
    console.log('Microsoft sign in successful:', result.user.email);
    return result.user;
  } catch (error: any) {
    console.error('Error signing in with Microsoft:', error);
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in popup was closed. Please try again.');
    }
    if (error.code === 'auth/cancelled-popup-request') {
      throw new Error('Sign-in was cancelled. Please try again.');
    }
    if (error.code === 'auth/popup-blocked') {
      throw new Error('Pop-up was blocked by the browser. Please allow pop-ups for this site.');
    }
    if (error.code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your internet connection.');
    }
    throw new Error('Failed to sign in with Microsoft. Please try again.');
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
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      throw new Error('Invalid email or password.');
    }
    if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many failed attempts. Please try again later.');
    }
    if (error.code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your internet connection.');
    }
    throw new Error('Failed to sign in. Please try again.');
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
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('This email is already registered. Please sign in instead.');
    }
    if (error.code === 'auth/weak-password') {
      throw new Error('Password is too weak. Please use a stronger password.');
    }
    if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address.');
    }
    if (error.code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your internet connection.');
    }
    throw new Error('Failed to create account. Please try again.');
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
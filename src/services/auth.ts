import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let auth: ReturnType<typeof getAuth>;

export const initializeFirebase = () => {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  return auth;
};

export const getFirebaseAuth = () => {
  if (!auth) {
    auth = getAuth();
  }
  return auth;
};

// Initialize providers
const googleProvider = new GoogleAuthProvider();
const microsoftProvider = new OAuthProvider('microsoft.com');
const appleProvider = new OAuthProvider('apple.com');

// Configure Microsoft provider
microsoftProvider.setCustomParameters({
  tenant: import.meta.env.VITE_AZURE_TENANT_ID,
  prompt: 'select_account'
});

// Configure Apple provider
appleProvider.addScope('email');
appleProvider.addScope('name');

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(getFirebaseAuth(), googleProvider);
    return result.user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

export const signInWithMicrosoft = async () => {
  try {
    const result = await signInWithPopup(getFirebaseAuth(), microsoftProvider);
    return result.user;
  } catch (error) {
    console.error('Microsoft sign in error:', error);
    throw error;
  }
};

export const signInWithApple = async () => {
  try {
    const result = await signInWithPopup(getFirebaseAuth(), appleProvider);
    return result.user;
  } catch (error) {
    console.error('Apple sign in error:', error);
    throw error;
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
    return result.user;
  } catch (error) {
    console.error('Error signing in with email:', error);
    throw error;
  }
};

export const signUpWithEmail = async (email: string, password: string) => {
  try {
    const result = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
    return result.user;
  } catch (error) {
    console.error('Error signing up with email:', error);
    throw error;
  }
};

export const signInWithPhone = async (phoneNumber: string) => {
  try {
    const recaptchaVerifier = new RecaptchaVerifier(getFirebaseAuth(), 'recaptcha-container', {
      size: 'normal',
      callback: () => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
      }
    });

    const confirmationResult = await signInWithPhoneNumber(getFirebaseAuth(), phoneNumber, recaptchaVerifier);
    return confirmationResult;
  } catch (error) {
    console.error('Phone sign in error:', error);
    throw error;
  }
};

export const confirmPhoneCode = async (confirmationResult: any, code: string) => {
  try {
    const result = await confirmationResult.confirm(code);
    return result.user;
  } catch (error) {
    console.error('Phone code confirmation error:', error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(getFirebaseAuth());
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(getFirebaseAuth(), callback);
}; 
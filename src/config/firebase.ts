import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, OAuthProvider, GoogleAuthProvider } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyCS1oLuwwzwUVInJ9l_yIt40_gryDpK2ss",
  authDomain: "focus-friend-536ad.firebaseapp.com",
  projectId: "focus-friend-536ad",
  storageBucket: "focus-friend-536ad.firebasestorage.app",
  messagingSenderId: "975734753164",
  appId: "1:975734753164:web:a60d3122a16b9c29dab8a9",
  measurementId: "G-JWXXYT2M3K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics only in production
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Initialize Auth
const auth = getAuth(app);

// Configure auth persistence
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Error setting auth persistence:", error);
});

// Initialize Google provider with specific scopes
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
  // Add any additional scopes you need
  scope: 'email profile'
});

// Initialize Microsoft provider
const microsoftProvider = new OAuthProvider('microsoft.com');
microsoftProvider.setCustomParameters({
  prompt: 'select_account',
  tenant: 'common'
});

// Log the current auth state
auth.onAuthStateChanged((user) => {
  if (user) {
    console.log('User is signed in:', user.email);
  } else {
    console.log('No user is signed in');
  }
});

export { auth, googleProvider, microsoftProvider };

export default app; 
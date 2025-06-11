import React, { useState, useEffect } from 'react';
import { PublicClientApplication, EventType, EventMessage, AuthenticationResult } from '@azure/msal-browser';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import StudentDashboard from './components/StudentDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import SignInBar from './components/SignInBar';
import { auth } from './services/auth';
import { onAuthStateChanged } from 'firebase/auth';

// MSAL configuration
const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID || '',
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID}`,
    redirectUri: import.meta.env.VITE_REDIRECT_URI || 'http://localhost:5173',
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
};

const msalInstance = new PublicClientApplication(msalConfig);

// Default to using the first account if no active account is set
if (!msalInstance.getActiveAccount() && msalInstance.getAllAccounts().length > 0) {
  msalInstance.setActiveAccount(msalInstance.getAllAccounts()[0]);
}

// Optional - This will update account state if a user signs in from another tab/window
msalInstance.addEventCallback((event: EventMessage) => {
  if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
    const payload = event.payload as AuthenticationResult;
    const account = payload.account;
    msalInstance.setActiveAccount(account);
  }
});

interface User {
  id: string;
  email: string;
  role: 'teacher' | 'student';
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Check if user role is stored in localStorage
        const storedRole = localStorage.getItem('userRole');
        if (storedRole) {
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            role: storedRole as 'teacher' | 'student'
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = (userData: any, role: 'teacher' | 'student') => {
    // Store user role in localStorage
    localStorage.setItem('userRole', role);
    
    setUser({
      id: userData.uid || userData.localAccountId,
      email: userData.email || userData.username,
      role
    });
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      await msalInstance.logoutPopup();
      localStorage.removeItem('userRole');
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {user && (
          <nav className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <span className="text-lg font-semibold text-gray-900">Focus Friend</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-4">
                    {user.email} ({user.role})
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </nav>
        )}

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {!user ? (
            <SignInBar msalInstance={msalInstance} onSignIn={handleSignIn} />
          ) : (
            <Routes>
              <Route
                path="/"
                element={
                  user.role === 'teacher' ? (
                    <TeacherDashboard msalInstance={msalInstance} />
                  ) : (
                    <StudentDashboard msalInstance={msalInstance} />
                  )
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          )}
        </main>
      </div>
    </Router>
  );
}

export default App;
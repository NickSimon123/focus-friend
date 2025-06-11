import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { PublicClientApplication, EventType, EventMessage, AuthenticationResult } from '@azure/msal-browser';
import { MsalProvider, useMsal } from '@azure/msal-react';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';
import SignInBar from './components/SignInBar';
import { initializeFirebase } from './services/auth';

// Initialize Firebase
initializeFirebase();

// MSAL configuration
const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID || '',
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID || ''}`,
    redirectUri: import.meta.env.VITE_AZURE_REDIRECT_URI || window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  }
};

// Create MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

// Initialize MSAL
const initializeMsal = async () => {
  try {
    await msalInstance.initialize();
    // Default to using the first account if no active account is set
    if (!msalInstance.getActiveAccount() && msalInstance.getAllAccounts().length > 0) {
      msalInstance.setActiveAccount(msalInstance.getAllAccounts()[0]);
    }
    return true;
  } catch (error) {
    console.error('Error initializing MSAL:', error);
    return false;
  }
};

// Optional - This will update account state if a user signs in from another tab/window
msalInstance.addEventCallback((event: EventMessage) => {
  if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
    const payload = event.payload as AuthenticationResult;
    const account = payload.account;
    msalInstance.setActiveAccount(account);
  }
});

// App content component that uses MSAL hooks
const AppContent: React.FC = () => {
  const { accounts, instance } = useMsal();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'teacher' | 'student' | null>(null);
  const [isMsalInitialized, setIsMsalInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      const initialized = await initializeMsal();
      setIsMsalInitialized(initialized);
      
      if (accounts.length > 0) {
        setIsAuthenticated(true);
        // For demo purposes, we'll set the role based on the username
        // In a real app, you would get this from your backend
        setUserRole(accounts[0].username.includes('teacher') ? 'teacher' : 'student');
      }
    };

    init();
  }, [accounts]);

  if (!isMsalInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <SignInBar 
          isAuthenticated={isAuthenticated}
          onSignIn={() => setIsAuthenticated(true)}
          onSignOut={() => {
            setIsAuthenticated(false);
            setUserRole(null);
          }}
          msalInstance={instance}
        />
        
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route 
              path="/" 
              element={
                isAuthenticated ? (
                  userRole === 'teacher' ? (
                    <TeacherDashboard msalInstance={instance} />
                  ) : (
                    <StudentDashboard msalInstance={instance} />
                  )
                ) : (
                  <Navigate to="/login" replace />
                )
              } 
            />
            <Route 
              path="/login" 
              element={
                isAuthenticated ? (
                  <Navigate to="/" replace />
                ) : (
                  <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
                    <h1 className="text-2xl font-bold text-center mb-6">Welcome to Focus Friend</h1>
                    <p className="text-center text-gray-600 mb-8">
                      Please sign in to continue
                    </p>
                  </div>
                )
              } 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

// Main App component that provides MSAL context
function App() {
  return (
    <MsalProvider instance={msalInstance}>
      <AppContent />
    </MsalProvider>
  );
}

export default App;
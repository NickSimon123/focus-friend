import React, { useState, useEffect } from 'react';
import { SignInBar } from './components/SignInBar';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';
import { onAuthStateChange } from './services/auth';
import type { User } from 'firebase/auth';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <SignInBar onSignIn={setUser} />;
  }

  // For now, we'll just show the student dashboard
  // In a real app, you'd determine the user's role and show the appropriate dashboard
  return <StudentDashboard user={user} />;
}

export default App;
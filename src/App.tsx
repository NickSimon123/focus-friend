import React, { useState, useEffect } from 'react';
import { SignInBar } from './components/SignInBar';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';
import { onAuthStateChange } from './services/auth';
import type { User } from 'firebase/auth';

type UserRole = 'student' | 'teacher';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole>('student');

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = (user: User) => {
    setUser(user);
    // In a real app, you would fetch the user's role from your database
    // For now, we'll use the role selected in the SignInBar
    setRole(role);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <SignInBar onSignIn={handleSignIn} />;
  }

  return role === 'teacher' ? (
    <TeacherDashboard user={user} />
  ) : (
    <StudentDashboard user={user} />
  );
}

export default App;
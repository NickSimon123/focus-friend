import React, { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';

interface Student {
  id: string;
  name: string;
  focusScore: number;
  lastActive: string;
  status: 'online' | 'offline' | 'in-session';
}

interface TeacherDashboardProps {
  user: User;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ user }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching students data
    const mockStudents: Student[] = [
      {
        id: '1',
        name: 'John Doe',
        focusScore: 85,
        lastActive: '2024-02-20T10:30:00',
        status: 'online',
      },
      {
        id: '2',
        name: 'Jane Smith',
        focusScore: 92,
        lastActive: '2024-02-20T10:25:00',
        status: 'in-session',
      },
      // Add more mock students as needed
    ];

    setStudents(mockStudents);
    setLoading(false);
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Welcome back, {user.displayName || 'Teacher'}
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900">
                Student Overview
              </h2>
            </div>
            <div className="border-t border-gray-200">
              <ul className="divide-y divide-gray-200">
                {students.map((student) => (
                  <li key={student.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div
                            className={`h-3 w-3 rounded-full ${
                              student.status === 'online'
                                ? 'bg-green-400'
                                : student.status === 'in-session'
                                ? 'bg-yellow-400'
                                : 'bg-gray-400'
                            }`}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {student.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            Last active: {new Date(student.lastActive).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="text-sm text-gray-900">
                          Focus Score: {student.focusScore}%
                        </div>
                        <button
                          className="ml-4 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeacherDashboard; 
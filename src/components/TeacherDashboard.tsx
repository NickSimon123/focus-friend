import React, { useState } from 'react';
import { PublicClientApplication } from '@azure/msal-browser';

interface Student {
  id: string;
  name: string;
  focusScore: number;
  moodScore: number;
  attendance: number;
}

interface TeacherDashboardProps {
  msalInstance: PublicClientApplication;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ msalInstance }) => {
  const [students, setStudents] = useState<Student[]>([
    { id: '1', name: 'John Doe', focusScore: 85, moodScore: 90, attendance: 95 },
    { id: '2', name: 'Jane Smith', focusScore: 92, moodScore: 88, attendance: 98 },
    { id: '3', name: 'Mike Johnson', focusScore: 78, moodScore: 82, attendance: 90 },
  ]);

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Teacher Dashboard</h1>
          
          {/* Overview Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Total Students</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">{students.length}</dd>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Average Focus Score</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {Math.round(students.reduce((acc, student) => acc + student.focusScore, 0) / students.length)}%
                </dd>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Average Mood Score</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {Math.round(students.reduce((acc, student) => acc + student.moodScore, 0) / students.length)}%
                </dd>
              </div>
            </div>
          </div>

          {/* Student List */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {students.map((student) => (
                <li key={student.id}>
                  <div 
                    className="px-4 py-4 sm:px-6 cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelectedStudent(student)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-indigo-600 font-medium">
                              {student.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-500">ID: {student.id}</div>
                        </div>
                      </div>
                      <div className="flex space-x-4">
                        <div className="text-sm text-gray-500">
                          Focus: {student.focusScore}%
                        </div>
                        <div className="text-sm text-gray-500">
                          Mood: {student.moodScore}%
                        </div>
                        <div className="text-sm text-gray-500">
                          Attendance: {student.attendance}%
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Student Details Modal */}
          {selectedStudent && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg max-w-2xl w-full p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Student Details</h3>
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Name</h4>
                    <p className="mt-1 text-sm text-gray-900">{selectedStudent.name}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Focus Score</h4>
                    <div className="mt-1 w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-indigo-600 h-2.5 rounded-full" 
                        style={{ width: `${selectedStudent.focusScore}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Mood Score</h4>
                    <div className="mt-1 w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-green-600 h-2.5 rounded-full" 
                        style={{ width: `${selectedStudent.moodScore}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Attendance</h4>
                    <div className="mt-1 w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${selectedStudent.attendance}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard; 
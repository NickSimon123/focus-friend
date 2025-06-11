import React, { useState, useEffect } from 'react';
import { PublicClientApplication } from '@azure/msal-browser';
import Schedule from './Schedule';

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
    { id: '3', name: 'Mike Johnson', focusScore: 78, moodScore: 85, attendance: 92 },
  ]);

  const [schedule, setSchedule] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        // Ensure MSAL is initialized
        if (!msalInstance.getActiveAccount()) {
          await msalInstance.initialize();
        }

        // Here you would typically fetch data from your backend
        // For now, we're using mock data
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing dashboard:', error);
        setIsLoading(false);
      }
    };

    initializeDashboard();
  }, [msalInstance]);

  const handleAddScheduleItem = (item: any) => {
    const newItem = {
      ...item,
      id: Date.now().toString()
    };
    setSchedule([...schedule, newItem]);
  };

  const handleDeleteScheduleItem = (id: string) => {
    setSchedule(schedule.filter(item => item.id !== id));
  };

  const handleScheduleItemClick = (item: any) => {
    console.log('Schedule item clicked:', item);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Student Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.map((student) => (
            <div key={student.id} className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{student.name}</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Focus Score:</span>
                  <span className="font-medium">{student.focusScore}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mood Score:</span>
                  <span className="font-medium">{student.moodScore}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Attendance:</span>
                  <span className="font-medium">{student.attendance}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Schedule
        schedule={schedule}
        onAddItem={handleAddScheduleItem}
        onDeleteItem={handleDeleteScheduleItem}
        onItemClick={handleScheduleItemClick}
        msalInstance={msalInstance}
      />

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Class Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Average Focus Score</h3>
            <p className="text-3xl font-bold text-blue-600">
              {Math.round(students.reduce((acc, student) => acc + student.focusScore, 0) / students.length)}%
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-800 mb-2">Average Mood Score</h3>
            <p className="text-3xl font-bold text-green-600">
              {Math.round(students.reduce((acc, student) => acc + student.moodScore, 0) / students.length)}%
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-purple-800 mb-2">Average Attendance</h3>
            <p className="text-3xl font-bold text-purple-600">
              {Math.round(students.reduce((acc, student) => acc + student.attendance, 0) / students.length)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard; 
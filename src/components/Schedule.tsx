import React, { useState } from 'react';
import { ScheduleItem } from '../types';

interface ScheduleProps {
  schedule: ScheduleItem[];
  onAddItem: (item: Omit<ScheduleItem, 'id'>) => void;
  onDeleteItem: (id: string) => void;
  onItemClick: (item: ScheduleItem) => void;
}

const Schedule: React.FC<ScheduleProps> = ({
  schedule,
  onAddItem,
  onDeleteItem,
  onItemClick
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isDoubleLesson, setIsDoubleLesson] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get the start of the week (Monday)
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  // Get all days of the week
  const getWeekDays = (startDate: Date) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const weekStart = getWeekStart(selectedDate);
  const weekDays = getWeekDays(weekStart);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newTime) return;

    const [hours, minutes] = newTime.split(':').map(Number);
    const startTime = new Date(selectedDate);
    startTime.setHours(hours, minutes, 0, 0);

    const endTime = new Date(startTime);
    if (isDoubleLesson) {
      endTime.setHours(endTime.getHours() + 2);
    } else {
      endTime.setHours(endTime.getHours() + 1);
    }

    onAddItem({
      title: newTitle,
      time: newTime,
      description: newDescription,
      isDoubleLesson,
      startTime,
      endTime
    });

    setNewTitle('');
    setNewTime('');
    setNewDescription('');
    setIsDoubleLesson(false);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getTimeBlockHeight = (startTime: Date, endTime: Date) => {
    const duration = endTime.getTime() - startTime.getTime();
    const hours = duration / (1000 * 60 * 60);
    return `${hours * 100}px`;
  };

  const getTimeBlockTop = (startTime: Date) => {
    const hours = startTime.getHours() + startTime.getMinutes() / 60;
    return `${(hours - 8) * 100}px`; // Assuming 8 AM is the start of the day
  };

  const getEventsForDay = (date: Date) => {
    return schedule.filter(item => {
      const itemDate = new Date(item.startTime);
      return itemDate.getDate() === date.getDate() &&
             itemDate.getMonth() === date.getMonth() &&
             itemDate.getFullYear() === date.getFullYear();
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Schedule</h2>
        <div className="flex space-x-4">
          <button
            onClick={() => {
              const newDate = new Date(selectedDate);
              newDate.setDate(newDate.getDate() - 7);
              setSelectedDate(newDate);
            }}
            className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
          >
            Previous Week
          </button>
          <button
            onClick={() => setSelectedDate(new Date())}
            className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
          >
            This Week
          </button>
          <button
            onClick={() => {
              const newDate = new Date(selectedDate);
              newDate.setDate(newDate.getDate() + 7);
              setSelectedDate(newDate);
            }}
            className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
          >
            Next Week
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time
            </label>
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            rows={3}
          />
        </div>
        <div className="mt-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isDoubleLesson}
              onChange={(e) => setIsDoubleLesson(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">Double Lesson (2 hours)</span>
          </label>
        </div>
        <button
          type="submit"
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add to Schedule
        </button>
      </form>

      <div className="grid grid-cols-7 gap-4">
        {weekDays.map((date) => (
          <div key={date.toISOString()} className="border rounded-lg p-2">
            <div className="text-center font-medium mb-2">
              {formatDate(date)}
            </div>
            <div className="relative min-h-[800px]">
              {getEventsForDay(date).map((item) => (
                <div
                  key={item.id}
                  onClick={() => onItemClick(item)}
                  className="absolute w-full bg-blue-100 border border-blue-300 rounded p-2 cursor-pointer hover:bg-blue-200"
                  style={{
                    top: getTimeBlockTop(new Date(item.startTime)),
                    height: getTimeBlockHeight(new Date(item.startTime), new Date(item.endTime))
                  }}
                >
                  <div className="font-medium">{item.title}</div>
                  <div className="text-sm text-gray-600">
                    {formatTime(new Date(item.startTime))} - {formatTime(new Date(item.endTime))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Schedule; 
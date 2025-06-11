import React, { useState, useEffect } from 'react';
import { ScheduleItem } from '../types';
import { Client } from '@microsoft/microsoft-graph-client';
import { AuthCodeMSALBrowserAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/authCodeMsalBrowser';
import { PublicClientApplication, InteractionType } from '@azure/msal-browser';

interface ScheduleProps {
  schedule: ScheduleItem[];
  onAddItem: (item: Omit<ScheduleItem, 'id'>) => void;
  onDeleteItem: (id: string) => void;
  onItemClick: (item: ScheduleItem) => void;
  msalInstance: PublicClientApplication;
}

const Schedule: React.FC<ScheduleProps> = ({
  schedule,
  onAddItem,
  onDeleteItem,
  onItemClick,
  msalInstance
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

  const syncWithOutlook = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const authProvider = new AuthCodeMSALBrowserAuthenticationProvider(msalInstance, {
        account: msalInstance.getAllAccounts()[0],
        scopes: ['Calendars.Read'],
        interactionType: InteractionType.Popup
      });

      const client = Client.initWithMiddleware({
        authProvider
      });

      // Get events for the current week
      const startDate = new Date(weekStart);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(weekStart);
      endDate.setDate(endDate.getDate() + 7);
      endDate.setHours(23, 59, 59, 999);

      const response = await client
        .api('/me/calendar/events')
        .filter(`start/dateTime ge '${startDate.toISOString()}' and end/dateTime le '${endDate.toISOString()}'`)
        .get();

      // Map Outlook events to our schedule format
      const outlookEvents = response.value.map((event: any) => {
        const startTime = new Date(event.start.dateTime);
        const endTime = new Date(event.end.dateTime);
        
        // Find the closest matching time from our existing schedule
        const matchingTime = schedule.find(item => {
          const itemStart = new Date(item.startTime);
          return itemStart.getHours() === startTime.getHours() && 
                 itemStart.getMinutes() === startTime.getMinutes();
        });

        return {
          id: event.id,
          title: event.subject,
          time: matchingTime?.time || startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          description: event.bodyPreview || '',
          isDoubleLesson: (endTime.getTime() - startTime.getTime()) > 60 * 60 * 1000,
          startTime,
          endTime,
          isRecurring: event.type === 'seriesMaster',
          seriesMasterId: event.seriesMasterId
        };
      });

      // Add new events to schedule
      outlookEvents.forEach(event => {
        if (!schedule.some(item => item.id === event.id)) {
          onAddItem(event);
        }
      });

    } catch (err) {
      console.error('Error syncing with Outlook:', err);
      setError('Failed to sync with Outlook. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
          <button
            onClick={syncWithOutlook}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Syncing...' : 'Sync with Outlook'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-600 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter lesson title"
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

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            rows={2}
            placeholder="Enter lesson description"
          />
        </div>

        <div className="mb-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isDoubleLesson}
              onChange={(e) => setIsDoubleLesson(e.target.checked)}
              className="rounded text-blue-600"
            />
            <span className="text-sm text-gray-700">Double Lesson (2 hours)</span>
          </label>
        </div>

        <button
          type="submit"
          className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add Lesson
        </button>
      </form>

      <div className="relative h-[800px] border-t border-gray-200">
        {/* Time markers */}
        <div className="absolute left-0 top-0 w-16 h-full border-r border-gray-200">
          {Array.from({ length: 13 }, (_, i) => i + 8).map((hour) => (
            <div
              key={hour}
              className="absolute text-sm text-gray-500"
              style={{ top: `${(hour - 8) * 100}px` }}
            >
              {hour}:00
            </div>
          ))}
        </div>

        {/* Week view */}
        <div className="absolute left-16 right-0 h-full">
          {weekDays.map((date, dayIndex) => (
            <div
              key={date.toISOString()}
              className="absolute h-full border-r border-gray-200"
              style={{
                left: `${(dayIndex * 100) / 7}%`,
                width: `${100 / 7}%`
              }}
            >
              <div className="text-center py-2 border-b border-gray-200">
                {formatDate(date)}
              </div>
              {getEventsForDay(date).map((item) => (
                <div
                  key={item.id}
                  onClick={() => onItemClick(item)}
                  className="absolute left-0 right-0 mx-2 bg-blue-100 rounded-lg p-2 cursor-pointer hover:bg-blue-200 transition-colors"
                  style={{
                    top: getTimeBlockTop(item.startTime),
                    height: getTimeBlockHeight(item.startTime, item.endTime)
                  }}
                >
                  <div className="font-medium">{item.title}</div>
                  <div className="text-sm text-gray-600">
                    {formatTime(item.startTime)} - {formatTime(item.endTime)}
                  </div>
                  {item.description && (
                    <div className="text-sm text-gray-600 mt-1">{item.description}</div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteItem(item.id);
                    }}
                    className="absolute top-1 right-1 text-gray-500 hover:text-red-500"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Schedule; 
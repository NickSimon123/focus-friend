import React, { useState, useEffect } from 'react';
import { PublicClientApplication } from '@azure/msal-browser';
import type { AuthenticationResult, AccountInfo } from '@azure/msal-browser';

// Add type declaration for Vite env
interface ImportMetaEnv {
  VITE_AZURE_CLIENT_ID: string;
  VITE_AZURE_TENANT_ID: string;
  VITE_REDIRECT_URI: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface ScheduleItem {
  id: string;
  title: string;
  time: string;
  description: string;
  isDoubleLesson?: boolean;
  startTime: Date;
  endTime: Date;
  isRecurring?: boolean;
  seriesMasterId?: string;
}

interface MoodEntry {
  id: string;
  date: string;
  mood: string;
  state: 'focused' | 'bored' | 'stressed' | 'neutral';
  lessonId?: string;
  lessonTitle?: string;
  note: string;
}

interface RewardStats {
  totalPoints: number;
  pointsThisWeek: number;
  completedLessons: string[];
  lastUpdated: string;
  gamePoints: number;
  focusPoints: number;
  moodPoints: number;
}

interface FocusSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  interruptions: number;
  activities: Activity[];
}

interface Activity {
  id: string;
  timestamp: Date;
  type: 'leave' | 'return' | 'tab_switch' | 'window_focus';
  details: string;
}

// Microsoft Graph API configuration
const clientId = 'd6aa1d05-2e2e-4c52-9c21-fe0f7d5ec062';
const tenantId = 'organizations';

const MSAL_CONFIG = {
  auth: {
    clientId: clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri: import.meta.env.VITE_REDIRECT_URI || window.location.origin,
    postLogoutRedirectUri: import.meta.env.VITE_REDIRECT_URI || window.location.origin,
    navigateToLoginRequestUrl: true
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    allowNativeBroker: false,
    loggerOptions: {
      loggerCallback: (level: any, message: any, containsPii: any) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case 0:
            console.error(message);
            return;
          case 1:
            console.warn(message);
            return;
          case 2:
            console.info(message);
            return;
          case 3:
            console.debug(message);
            return;
          default:
            return;
        }
      },
      piiLoggingEnabled: false,
      logLevel: 3
    }
  }
};

// Add background options at the top level
const backgroundOptions = {
  default: 'from-gray-50 to-gray-100',
  ocean: 'from-blue-50 to-cyan-100',
  sunset: 'from-orange-50 to-pink-100',
  forest: 'from-green-50 to-emerald-100',
  space: 'from-indigo-50 to-purple-100',
  game: 'from-purple-50 to-indigo-50'
} as const;

function App() {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [focusMode, setFocusMode] = useState(false);
  const [newScheduleItem, setNewScheduleItem] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isOutlookConnected, setIsOutlookConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [msalInstance, setMsalInstance] = useState<PublicClientApplication | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Focus Timer states
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<'focus' | 'break'>('focus');
  const [customFocusTime, setCustomFocusTime] = useState(25);
  const [customBreakTime, setCustomBreakTime] = useState(5);

  // Mood Tracker states
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [currentMood, setCurrentMood] = useState('');
  const [moodNote, setMoodNote] = useState('');

  // Focus tracking states
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [currentSession, setCurrentSession] = useState<FocusSession | null>(null);
  const [lastActivity, setLastActivity] = useState<Date>(new Date());
  const [isTracking, setIsTracking] = useState(false);

  // Add new state for session analysis
  const [showSessionAnalysis, setShowSessionAnalysis] = useState(false);
  const [completedSession, setCompletedSession] = useState<FocusSession | null>(null);

  // Add new state for mood tracking
  const [currentState, setCurrentState] = useState<'focused' | 'bored' | 'stressed' | 'neutral'>('neutral');
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);

  // Add new state for lesson details modal
  const [selectedLessonDetails, setSelectedLessonDetails] = useState<ScheduleItem | null>(null);
  const [showLessonDetails, setShowLessonDetails] = useState(false);
  const [showWeeklyReport, setShowWeeklyReport] = useState(false);

  // Update reward system state
  const [rewardStats, setRewardStats] = useState<RewardStats>(() => {
    const saved = localStorage.getItem('rewardStats');
    return saved ? JSON.parse(saved) : {
      totalPoints: 0,
      pointsThisWeek: 0,
      completedLessons: [],
      lastUpdated: new Date().toISOString(),
      gamePoints: 0,
      focusPoints: 0,
      moodPoints: 0
    };
  });

  // Sort schedule items by time
  const sortedSchedule = [...schedule].sort((a, b) => {
    const timeA = new Date(`2000-01-01 ${a.time}`).getTime();
    const timeB = new Date(`2000-01-01 ${b.time}`).getTime();
    return timeA - timeB;
  });

  // Focus Timer effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isTimerRunning) {
      interval = setInterval(() => {
        if (timerSeconds > 0) {
          setTimerSeconds(timerSeconds - 1);
        } else if (timerMinutes > 0) {
          setTimerMinutes(timerMinutes - 1);
          setTimerSeconds(59);
        } else {
          // Timer completed
          setIsTimerRunning(false);
          if (timerMode === 'focus') {
            setTimerMode('break');
            setTimerMinutes(customBreakTime);
          } else {
            setTimerMode('focus');
            setTimerMinutes(customFocusTime);
          }
          // Play notification sound
          new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3').play();
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerMinutes, timerSeconds, timerMode, customFocusTime, customBreakTime]);

  // Initialize MSAL
  useEffect(() => {
    const initializeMsal = async () => {
      try {
        console.log('Initializing MSAL with config:', MSAL_CONFIG);
        const msalApp = new PublicClientApplication(MSAL_CONFIG);
        await msalApp.initialize();
        setMsalInstance(msalApp);

        // Check if user is already signed in
        const accounts = msalApp.getAllAccounts();
        console.log('Found accounts:', accounts);
        if (accounts.length > 0) {
          setIsOutlookConnected(true);
          await fetchCalendarEvents(msalApp, accounts[0]);
        }
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize MSAL:', error);
        setError(`Failed to initialize authentication: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setIsInitialized(true); // Still set initialized to true to show the UI
      }
    };

    initializeMsal();
  }, []);

  const connectToOutlook = async () => {
    if (!msalInstance) {
      setError('Authentication not initialized. Please refresh the page.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      console.log('Starting login process with config:', MSAL_CONFIG);
      const loginResponse = await msalInstance.loginPopup({
        scopes: ['user.read', 'calendars.read', 'offline_access'],
        prompt: 'select_account'
      });

      console.log('Login successful:', loginResponse);

      if (loginResponse) {
        console.log('Fetching calendar events...');
        await fetchCalendarEvents(msalInstance, loginResponse.account!);
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      if (error.errorCode === 'user_cancelled') {
        setError('Login was cancelled. Please try again.');
      } else if (error.errorCode === 'consent_required') {
        setError('Please grant the required permissions to access your calendar.');
      } else {
        setError(`Failed to connect to Outlook: ${error.message || 'Unknown error'}`);
      }
      setIsOutlookConnected(false);
    } finally {
      setIsConnecting(false);
    }
  };

  // Define school periods for Munich International School
  const schoolPeriods = [
    { start: '09:20', end: '10:15' }, // Period 1
    { start: '10:15', end: '11:10' }, // Period 2
    { start: '11:10', end: '11:30' }, // Break
    { start: '11:30', end: '12:25' }, // Period 3
    { start: '12:25', end: '13:20' }, // Period 4
    { start: '13:20', end: '14:00' }, // Lunch Break
    { start: '14:00', end: '14:55' }, // Period 5
    { start: '14:55', end: '15:50' }, // Period 6
    { start: '15:50', end: '16:05' }  // Period 7
  ];

  const fetchCalendarEvents = async (msalApp: PublicClientApplication, account: AccountInfo) => {
    try {
      console.log('Acquiring token...');
      const tokenResponse = await msalApp.acquireTokenSilent({
        scopes: ['user.read', 'calendars.read', 'offline_access'],
        account: account
      });

      console.log('Token acquired, fetching calendar...');
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14); // Fetch for the next 14 days to ensure we have next week's data

      // Fetch calendar events with timezone set to Europe/Berlin
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/calendar/events?$filter=start/dateTime ge '${startDate.toISOString()}' and end/dateTime le '${endDate.toISOString()}'&$orderby=start/dateTime&$select=subject,start,end,bodyPreview,location,importance,showAs,recurrence,seriesMasterId`,
        {
          headers: {
            'Authorization': `Bearer ${tokenResponse.accessToken}`,
            'Content-Type': 'application/json',
            'Prefer': 'outlook.timezone="Europe/Berlin"'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Calendar API error:', errorData);
        throw new Error(`Failed to fetch calendar events: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('Calendar data received:', data);
      
      const outlookSchedule: ScheduleItem[] = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Process events for the next 14 days
      for (let i = 0; i < 14; i++) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() + i);
        const dateStr = currentDate.toISOString().split('T')[0];

        // Filter events for this day
        const dayEvents = data.value.filter((event: any) => {
          const eventDate = new Date(event.start.dateTime);
          return eventDate.toISOString().split('T')[0] === dateStr;
        });

        // Sort events by start time
        dayEvents.sort((a: any, b: any) => 
          new Date(a.start.dateTime).getTime() - new Date(b.start.dateTime).getTime()
        );

        // Add each event to the schedule
        dayEvents.forEach((event: any) => {
          const startTime = new Date(event.start.dateTime);
          const endTime = new Date(event.end.dateTime);
          
          // Format time to match school periods format (HH:mm)
          const formatTime = (date: Date) => {
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            return `${hours}:${minutes}`;
          };

          outlookSchedule.push({
            id: event.id,
            title: event.subject,
            time: `${formatTime(startTime)} - ${formatTime(endTime)}`,
            description: [
              event.bodyPreview,
              event.location ? `Location: ${event.location}` : null,
              event.importance === 'high' ? 'High Priority' : null,
              event.showAs === 'busy' ? 'Busy' : event.showAs === 'tentative' ? 'Tentative' : null,
              event.recurrence ? 'Recurring Event' : null
            ].filter(Boolean).join('\n') || 'No description',
            isDoubleLesson: false,
            startTime: startTime,
            endTime: endTime,
            isRecurring: !!event.recurrence,
            seriesMasterId: event.seriesMasterId
          });
        });
      }

      // Sort all events by date and time
      const sortedSchedule = outlookSchedule.sort((a, b) => 
        a.startTime.getTime() - b.startTime.getTime()
      );

      setSchedule(sortedSchedule);
      setIsOutlookConnected(true);
      setError(null);

      // Log the processed schedule for debugging
      console.log('Processed schedule:', sortedSchedule);
    } catch (error: any) {
      console.error('Error fetching calendar events:', error);
      if (error.name === 'InteractionRequiredAuthError') {
        setError('Please sign in again to access your calendar.');
      } else {
        setError(`Failed to fetch calendar events: ${error.message || 'Unknown error'}`);
      }
      setIsOutlookConnected(false);
    }
  };

  const addToSchedule = () => {
    if (newScheduleItem.trim() && newTime.trim()) {
      const newItem: ScheduleItem = {
        id: Date.now().toString(),
        title: newScheduleItem,
        time: newTime,
        description: newDescription,
        startTime: new Date(newTime),
        endTime: new Date(newTime)
      };
      setSchedule([...schedule, newItem]);
      setNewScheduleItem('');
      setNewTime('');
      setNewDescription('');
    }
  };

  const changeScheduleTime = (id: string, newTime: string) => {
    setSchedule(schedule.map(item => 
      item.id === id ? { ...item, time: newTime } : item
    ));
  };

  const toggleFocusMode = () => {
    setFocusMode(!focusMode);
  };

  // Focus Timer functions
  const startTimer = () => {
    setIsTimerRunning(true);
  };

  const pauseTimer = () => {
    setIsTimerRunning(false);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimerMinutes(timerMode === 'focus' ? customFocusTime : customBreakTime);
    setTimerSeconds(0);
  };

  const adjustTime = (minutes: number) => {
    if (!isTimerRunning) {
      setTimerMinutes(Math.max(5, Math.min(120, minutes)));
      setTimerSeconds(0);
    }
  };

  // Mood Tracker functions
  const addMoodEntry = () => {
    if (currentMood && selectedLesson) {
      const today = new Date().toLocaleDateString();
      const existingEntry = moodEntries.find(
        entry => entry.lessonId === selectedLesson && entry.date === today
      );

      if (existingEntry) {
        setError('You have already recorded your mood for this lesson today. One point per lesson!');
        return;
      }

      const lesson = schedule.find(item => item.id === selectedLesson);
      if (!lesson) {
        setError('Selected lesson not found.');
        return;
      }

      const newEntry: MoodEntry = {
        id: Date.now().toString(),
        date: today,
        mood: currentMood,
        state: currentState,
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        note: moodNote
      };

      setMoodEntries([...moodEntries, newEntry]);
      setCurrentMood('');
      setCurrentState('neutral');
      setSelectedLesson(null);
      setMoodNote('');
      setError(null);

      // Add point for mood entry
      setRewardStats(prev => {
        const newStats = {
          ...prev,
          moodPoints: prev.moodPoints + 1,
          totalPoints: prev.totalPoints + 1,
          pointsThisWeek: prev.pointsThisWeek + 1,
          completedLessons: [...prev.completedLessons, lesson.id],
          lastUpdated: new Date().toISOString()
        };
        localStorage.setItem('rewardStats', JSON.stringify(newStats));
        return newStats;
      });

      const successMessage = `Point earned! You've completed ${rewardStats.totalPoints + 1} lessons today.`;
      setError(successMessage);
      setTimeout(() => setError(null), 3000);
    } else {
      setError('Please select a lesson and mood to earn a point.');
    }
  };

  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekOffset, setWeekOffset] = useState(0); // 0 for current week, 1 for next week, etc.

  // Group schedule items by date
  const groupedSchedule = schedule.reduce((groups: { [key: string]: ScheduleItem[] }, item) => {
    const date = item.startTime.toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {});

  // Get current day's schedule
  const currentDaySchedule = groupedSchedule[selectedDate.toLocaleDateString()] || [];

  // Format time for display
  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Get current event with proper time comparison
  const getCurrentEvent = () => {
    const now = new Date();
    return schedule.find(event => {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      return eventStart <= now && now <= eventEnd;
    });
  };

  // Get upcoming events for today with proper time sorting
  const getUpcomingEvents = () => {
    const now = new Date();
    return schedule
      .filter(event => {
        const eventStart = new Date(event.startTime);
        return eventStart > now;
      })
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  };

  // Update getWeekSchedule to handle next week's events
  const getWeekSchedule = () => {
    const weekSchedule: { [key: string]: ScheduleItem[] } = {};
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + (weekOffset * 7));
    startOfWeek.setHours(0, 0, 0, 0);

    // Generate all days of the week
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      weekSchedule[dateStr] = [];
    }

    // Group events by day
    schedule.forEach(event => {
      const eventDate = new Date(event.startTime);
      const dateStr = eventDate.toISOString().split('T')[0];
      if (weekSchedule[dateStr]) {
        weekSchedule[dateStr].push(event);
      }
    });

    // Sort events within each day by start time
    Object.keys(weekSchedule).forEach(date => {
      weekSchedule[date].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    });

    return weekSchedule;
  };

  // Update the weekly view rendering
  const renderWeeklyView = () => {
    const weekSchedule = getWeekSchedule();
    const weekRange = getWeekRange();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <button 
            onClick={goToPreviousWeek}
            className="p-2 rounded-full hover:bg-indigo-50 text-indigo-600 transition-colors duration-200"
            disabled={weekOffset === 0}
          >
            ←
          </button>
          <div className="flex items-center gap-4">
            <button 
              onClick={goToCurrentWeek}
              className="px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors duration-200"
            >
              Current Week
            </button>
            <h3 className="text-lg font-medium text-indigo-900">
              {formatDate(weekRange.start)} - {formatDate(weekRange.end)}
            </h3>
            <button 
              onClick={() => setShowWeeklyReport(true)}
              className="px-4 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors duration-200"
            >
              View Weekly Report
            </button>
          </div>
          <button 
            onClick={goToNextWeek}
            className="p-2 rounded-full hover:bg-indigo-50 text-indigo-600 transition-colors duration-200"
          >
            →
          </button>
        </div>

        <div className="grid grid-cols-7 gap-4">
          {Object.entries(weekSchedule).map(([date, events], index) => {
            const currentDate = new Date(date);
            const isToday = currentDate.toDateString() === new Date().toDateString();
            const isPast = currentDate < new Date() && !isToday;
            const currentEvent = isToday ? getCurrentEvent() : null;
            const currentPeriod = isToday ? getCurrentPeriod() : null;
            
            return (
              <div 
                key={date} 
                className={`border rounded-xl p-3 ${
                  isToday 
                    ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
                    : isPast 
                      ? 'bg-gray-50' 
                      : 'hover:bg-indigo-50/50 hover:border-indigo-100'
                }`}
              >
                <div className="font-medium text-center mb-3">
                  <div className="text-sm text-gray-600">
                    {days[currentDate.getDay()]}
                  </div>
                  <div className={`text-lg ${
                    isToday ? 'text-indigo-700 font-bold' : 'text-gray-900'
                  }`}>
                    {currentDate.getDate()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {currentDate.toLocaleDateString(undefined, { month: 'short' })}
                  </div>
                </div>
                <div className="space-y-2">
                  {events.length === 0 ? (
                    <div className="text-sm text-gray-500 text-center py-2">
                      No events
                    </div>
                  ) : (
                    events.map((event) => {
                      const isCurrent = currentEvent?.id === event.id;
                      const isCurrentPeriodEvent = currentPeriod && event.time.startsWith(currentPeriod.start);
                      
                      return (
                        <div 
                          key={event.id} 
                          className={`text-sm p-2 rounded-lg ${
                            isCurrent 
                              ? 'bg-green-100 border border-green-300 shadow-md ring-2 ring-green-200' 
                              : isCurrentPeriodEvent 
                                ? 'bg-indigo-50 border border-indigo-200'
                                : 'bg-white hover:bg-indigo-50/50'
                          }`}
                        >
                          <div className={`font-medium ${
                            isCurrent 
                              ? 'text-green-700' 
                              : isCurrentPeriodEvent 
                                ? 'text-indigo-700' 
                                : 'text-gray-600'
                          }`}>
                            {event.time}
                          </div>
                          <div className={`truncate ${
                            isCurrent 
                              ? 'text-green-900' 
                              : isCurrentPeriodEvent 
                                ? 'text-indigo-900' 
                                : 'text-gray-900'
                          }`}>
                            {event.title}
                          </div>
                          {isCurrent && (
                            <div className="text-xs text-green-700 font-medium mt-1">In Progress</div>
                          )}
                          {isCurrentPeriodEvent && !isCurrent && (
                            <div className="text-xs text-indigo-600 mt-1">Current Period</div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Update getCurrentPeriod to handle time comparison correctly
  const getCurrentPeriod = () => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    return schoolPeriods.find(period => {
      return currentTime >= period.start && currentTime <= period.end;
    });
  };

  // Update getCurrentSessionTime to handle time comparison correctly
  const getCurrentSessionTime = () => {
    const now = new Date();
    const currentPeriod = getCurrentPeriod();
    if (!currentPeriod) return null;

    const [startHour, startMinute] = currentPeriod.start.split(':').map(Number);
    const [endHour, endMinute] = currentPeriod.end.split(':').map(Number);
    
    const startTime = new Date(now);
    startTime.setHours(startHour, startMinute, 0, 0);
    
    const endTime = new Date(now);
    endTime.setHours(endHour, endMinute, 0, 0);
    
    return {
      start: startTime,
      end: endTime
    };
  };

  // Add debug logging for schedule
  useEffect(() => {
    console.log('Current schedule:', schedule);
    console.log('Current day schedule:', currentDaySchedule);
    console.log('Current event:', getCurrentEvent());
    console.log('Upcoming events:', getUpcomingEvents());
  }, [schedule, selectedDate]);

  // Get week range for display
  const getWeekRange = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + (weekOffset * 7));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    return {
      start: startOfWeek,
      end: endOfWeek
    };
  };

  // Navigation functions
  const goToNextDay = () => {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setSelectedDate(nextDay);
  };

  const goToPreviousDay = () => {
    const prevDay = new Date(selectedDate);
    prevDay.setDate(prevDay.getDate() - 1);
    setSelectedDate(prevDay);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // Navigation functions for weeks
  const goToNextWeek = () => {
    setWeekOffset(prev => prev + 1);
  };

  const goToPreviousWeek = () => {
    setWeekOffset(prev => Math.max(0, prev - 1));
  };

  const goToCurrentWeek = () => {
    setWeekOffset(0);
  };

  // Start tracking focus session
  const startTracking = () => {
    const newSession: FocusSession = {
      id: Date.now().toString(),
      startTime: new Date(),
      duration: 0,
      interruptions: 0,
      activities: []
    };
    setCurrentSession(newSession);
    setIsTracking(true);
    setFocusMode(true);
  };

  // Stop tracking focus session
  const stopTracking = () => {
    if (currentSession) {
      const endTime = new Date();
      const duration = (endTime.getTime() - currentSession.startTime.getTime()) / 1000;
      const completedSession = {
        ...currentSession,
        endTime,
        duration
      };

      // Calculate focus points (1 point per minute of focused time, bonus for no interruptions)
      const focusMinutes = Math.floor(duration / 60);
      const focusPoints = focusMinutes + (currentSession.interruptions === 0 ? focusMinutes : 0);

      setFocusSessions([...focusSessions, completedSession]);
      setCompletedSession(completedSession);
      setCurrentSession(null);
      setIsTracking(false);
      setFocusMode(false);
      setShowSessionAnalysis(true);

      // Update reward stats
      setRewardStats(prev => {
        const newStats = {
          ...prev,
          focusPoints: prev.focusPoints + focusPoints,
          totalPoints: prev.totalPoints + focusPoints,
          pointsThisWeek: prev.pointsThisWeek + focusPoints,
          lastUpdated: new Date().toISOString()
        };
        localStorage.setItem('rewardStats', JSON.stringify(newStats));
        return newStats;
      });
    }
  };

  // Track user activity
  useEffect(() => {
    if (!isTracking) return;

    const trackActivity = (type: Activity['type'], details: string) => {
      const now = new Date();
      setLastActivity(now);

      if (currentSession) {
        const newActivity: Activity = {
          id: Date.now().toString(),
          timestamp: now,
          type,
          details
        };

        setCurrentSession({
          ...currentSession,
          activities: [...currentSession.activities, newActivity],
          interruptions: type === 'leave' || type === 'tab_switch' 
            ? currentSession.interruptions + 1 
            : currentSession.interruptions
        });
      }
    };

    // Track visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        trackActivity('leave', 'User left the page');
      } else {
        trackActivity('return', 'User returned to the page');
      }
    };

    // Track tab/window focus
    const handleFocus = () => {
      trackActivity('window_focus', 'Window focused');
    };

    const handleBlur = () => {
      trackActivity('tab_switch', 'Switched to another tab');
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isTracking, currentSession]);

  // Update session duration
  useEffect(() => {
    if (!isTracking || !currentSession) return;

    const interval = setInterval(() => {
      const now = new Date();
      const duration = (now.getTime() - currentSession.startTime.getTime()) / 1000;
      setCurrentSession({
        ...currentSession,
        duration
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTracking, currentSession]);

  // Add function to get distraction analysis
  const getDistractionAnalysis = (session: FocusSession) => {
    const distractions = session.activities.filter(a => a.type === 'leave' || a.type === 'tab_switch');
    const totalDistractions = distractions.length;
    const avgTimeBetweenDistractions = totalDistractions > 0 
      ? session.duration / totalDistractions 
      : session.duration;

    return {
      totalDistractions,
      avgTimeBetweenDistractions,
      distractions
    };
  };

  // Add function to get mood statistics for a lesson
  const getLessonMoodStats = (lessonId: string) => {
    const lessonMoods = moodEntries.filter(entry => entry.lessonId === lessonId);
    const stats = {
      focused: lessonMoods.filter(entry => entry.state === 'focused').length,
      bored: lessonMoods.filter(entry => entry.state === 'bored').length,
      stressed: lessonMoods.filter(entry => entry.state === 'stressed').length,
      neutral: lessonMoods.filter(entry => entry.state === 'neutral').length,
      total: lessonMoods.length
    };
    return stats;
  };

  // Add function to get detailed mood statistics for a lesson
  const getDetailedLessonStats = (lessonId: string) => {
    const lessonMoods = moodEntries.filter(entry => entry.lessonId === lessonId);
    const stats = {
      focused: lessonMoods.filter(entry => entry.state === 'focused').length,
      bored: lessonMoods.filter(entry => entry.state === 'bored').length,
      stressed: lessonMoods.filter(entry => entry.state === 'stressed').length,
      neutral: lessonMoods.filter(entry => entry.state === 'neutral').length,
      total: lessonMoods.length,
      entries: lessonMoods.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    };
    return stats;
  };

  // Add function to get weekly statistics
  const getWeeklyStats = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + (weekOffset * 7));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const weekMoods = moodEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= startOfWeek && entryDate <= endOfWeek;
    });

    const stats = {
      focused: weekMoods.filter(entry => entry.state === 'focused').length,
      bored: weekMoods.filter(entry => entry.state === 'bored').length,
      stressed: weekMoods.filter(entry => entry.state === 'stressed').length,
      neutral: weekMoods.filter(entry => entry.state === 'neutral').length,
      total: weekMoods.length,
      byLesson: schedule.reduce((acc: { [key: string]: any }, lesson) => {
        const lessonMoods = weekMoods.filter(entry => entry.lessonId === lesson.id);
        if (lessonMoods.length > 0) {
          acc[lesson.title] = {
            focused: lessonMoods.filter(entry => entry.state === 'focused').length,
            bored: lessonMoods.filter(entry => entry.state === 'bored').length,
            stressed: lessonMoods.filter(entry => entry.state === 'stressed').length,
            neutral: lessonMoods.filter(entry => entry.state === 'neutral').length,
            total: lessonMoods.length
          };
        }
        return acc;
      }, {})
    };

    return stats;
  };

  // Add function to render the lesson details modal
  const renderLessonDetailsModal = () => {
    if (!selectedLessonDetails) return null;
    const stats = getDetailedLessonStats(selectedLessonDetails.id);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-xl">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{selectedLessonDetails.title}</h2>
              <p className="text-gray-600">{selectedLessonDetails.time}</p>
            </div>
            <button 
              onClick={() => setShowLessonDetails(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-6">
            {/* Overall Statistics */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-green-50 rounded-xl p-4">
                <div className="text-sm text-green-600 font-medium">Focused</div>
                <div className="text-2xl font-bold text-green-700">
                  {stats.focused}
                </div>
                <div className="text-xs text-green-600">
                  {stats.total > 0 ? `${Math.round((stats.focused / stats.total) * 100)}%` : '0%'}
                </div>
              </div>
              <div className="bg-yellow-50 rounded-xl p-4">
                <div className="text-sm text-yellow-600 font-medium">Bored</div>
                <div className="text-2xl font-bold text-yellow-700">
                  {stats.bored}
                </div>
                <div className="text-xs text-yellow-600">
                  {stats.total > 0 ? `${Math.round((stats.bored / stats.total) * 100)}%` : '0%'}
                </div>
              </div>
              <div className="bg-red-50 rounded-xl p-4">
                <div className="text-sm text-red-600 font-medium">Stressed</div>
                <div className="text-2xl font-bold text-red-700">
                  {stats.stressed}
                </div>
                <div className="text-xs text-red-600">
                  {stats.total > 0 ? `${Math.round((stats.stressed / stats.total) * 100)}%` : '0%'}
                </div>
              </div>
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="text-sm text-blue-600 font-medium">Neutral</div>
                <div className="text-2xl font-bold text-blue-700">
                  {stats.neutral}
                </div>
                <div className="text-xs text-blue-600">
                  {stats.total > 0 ? `${Math.round((stats.neutral / stats.total) * 100)}%` : '0%'}
                </div>
              </div>
            </div>

            {/* Recent Entries */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Recent Entries</h3>
              <div className="space-y-3">
                {stats.entries.map((entry) => (
                  <div key={entry.id} className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg">
                    <div className="text-2xl">{entry.mood}</div>
                    <div className="flex-grow">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm px-2 py-1 rounded-full ${
                          entry.state === 'focused' ? 'bg-green-100 text-green-800' :
                          entry.state === 'bored' ? 'bg-yellow-100 text-yellow-800' :
                          entry.state === 'stressed' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {entry.state}
                        </span>
                        <span className="text-sm text-gray-600">{entry.date}</span>
                      </div>
                      {entry.note && (
                        <p className="text-sm text-gray-600 mt-1">{entry.note}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Add function to render the weekly report modal
  const renderWeeklyReportModal = () => {
    const stats = getWeeklyStats();
    const weekRange = getWeekRange();

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl p-8 max-w-4xl w-full shadow-xl">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Weekly Report</h2>
              <p className="text-gray-600">
                {formatDate(weekRange.start)} - {formatDate(weekRange.end)}
              </p>
            </div>
            <button 
              onClick={() => setShowWeeklyReport(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-8">
            {/* Overall Statistics */}
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Overall Statistics</h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-green-50 rounded-xl p-4">
                  <div className="text-sm text-green-600 font-medium">Focused</div>
                  <div className="text-2xl font-bold text-green-700">
                    {stats.focused}
                  </div>
                  <div className="text-xs text-green-600">
                    {stats.total > 0 ? `${Math.round((stats.focused / stats.total) * 100)}%` : '0%'}
                  </div>
                </div>
                <div className="bg-yellow-50 rounded-xl p-4">
                  <div className="text-sm text-yellow-600 font-medium">Bored</div>
                  <div className="text-2xl font-bold text-yellow-700">
                    {stats.bored}
                  </div>
                  <div className="text-xs text-yellow-600">
                    {stats.total > 0 ? `${Math.round((stats.bored / stats.total) * 100)}%` : '0%'}
                  </div>
                </div>
                <div className="bg-red-50 rounded-xl p-4">
                  <div className="text-sm text-red-600 font-medium">Stressed</div>
                  <div className="text-2xl font-bold text-red-700">
                    {stats.stressed}
                  </div>
                  <div className="text-xs text-red-600">
                    {stats.total > 0 ? `${Math.round((stats.stressed / stats.total) * 100)}%` : '0%'}
                  </div>
                </div>
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="text-sm text-blue-600 font-medium">Neutral</div>
                  <div className="text-2xl font-bold text-blue-700">
                    {stats.neutral}
                  </div>
                  <div className="text-xs text-blue-600">
                    {stats.total > 0 ? `${Math.round((stats.neutral / stats.total) * 100)}%` : '0%'}
                  </div>
                </div>
              </div>
            </div>

            {/* Lesson Statistics */}
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Lesson Statistics</h3>
              <div className="space-y-4">
                {Object.entries(stats.byLesson).map(([lesson, lessonStats]: [string, any]) => (
                  <div key={lesson} className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-medium text-gray-900 mb-3">{lesson}</h4>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-green-50 rounded-lg p-2">
                        <div className="text-sm text-green-600">Focused</div>
                        <div className="text-lg font-bold text-green-700">
                          {lessonStats.focused}
                        </div>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-2">
                        <div className="text-sm text-yellow-600">Bored</div>
                        <div className="text-lg font-bold text-yellow-700">
                          {lessonStats.bored}
                        </div>
                      </div>
                      <div className="bg-red-50 rounded-lg p-2">
                        <div className="text-sm text-red-600">Stressed</div>
                        <div className="text-lg font-bold text-red-700">
                          {lessonStats.stressed}
                        </div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-2">
                        <div className="text-sm text-blue-600">Neutral</div>
                        <div className="text-lg font-bold text-blue-700">
                          {lessonStats.neutral}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Add function to render reward stats
  const renderRewardStats = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Reward Points</h2>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-indigo-50 rounded-xl p-4">
            <div className="text-sm text-indigo-600 font-medium">Today's Points</div>
            <div className="text-2xl font-bold text-indigo-700">
              {rewardStats.totalPoints}
            </div>
            <div className="text-xs text-indigo-600">
              {rewardStats.completedLessons.length} lessons completed
            </div>
          </div>
          <div className="bg-green-50 rounded-xl p-4">
            <div className="text-sm text-green-600 font-medium">This Week's Points</div>
            <div className="text-2xl font-bold text-green-700">
              {rewardStats.pointsThisWeek}
            </div>
            <div className="text-xs text-green-600">
              Keep going!
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Daily Progress</span>
            <span>{rewardStats.totalPoints} / {currentDaySchedule.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(rewardStats.totalPoints / Math.max(currentDaySchedule.length, 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Completed Lessons */}
        {rewardStats.completedLessons.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Completed Today</h3>
            <div className="space-y-2">
              {rewardStats.completedLessons.map(lessonId => {
                const lesson = schedule.find(item => item.id === lessonId);
                return lesson ? (
                  <div key={lessonId} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-green-500">✓</span>
                    <span>{lesson.title}</span>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const [currentPage, setCurrentPage] = useState<'main' | 'game'>('main');

  // Add game state
  const [gameScore, setGameScore] = useState(0);
  const [gameHighScore, setGameHighScore] = useState(() => {
    const saved = localStorage.getItem('gameHighScore');
    return saved ? parseInt(saved) : 0;
  });

  // Update handleGameEnd to use the state from App component
  const handleGameEnd = (finalScore: number) => {
    const earnedPoints = Math.floor(finalScore / 100);
    setGameScore(finalScore);
    
    if (finalScore > gameHighScore) {
      setGameHighScore(finalScore);
      localStorage.setItem('gameHighScore', finalScore.toString());
    }
    
    setRewardStats(prev => {
      const newStats = {
        ...prev,
        gamePoints: prev.gamePoints + earnedPoints,
        totalPoints: prev.totalPoints + earnedPoints,
        pointsThisWeek: prev.pointsThisWeek + earnedPoints,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem('rewardStats', JSON.stringify(newStats));
      return newStats;
    });
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-indigo-600 mb-4">Loading FocusFriend...</h1>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${backgroundOptions.default}`}>
      {/* Top Bar */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left Section - Logo */}
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">FocusFriend</h1>
            </div>

            {/* Right Section - Game and Focus Controls */}
            <div className="flex items-center space-x-4">
              {/* Game Section */}
              <button
                onClick={() => setCurrentPage(currentPage === 'main' ? 'game' : 'main')}
                className="px-6 py-2 rounded-full bg-purple-600 text-white hover:bg-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center space-x-2"
              >
                <span className="text-xl">🎮</span>
                <span className="font-medium">{currentPage === 'main' ? 'Play Game' : 'Back to Schedule'}</span>
              </button>

              {/* Focus Session Controls */}
              <div className="border-l border-gray-200 pl-4">
                {!isTracking ? (
                  <button 
                    onClick={startTracking} 
                    className="px-6 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-md"
                  >
                    Start Focus Session
                  </button>
                ) : (
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-4 bg-indigo-50 px-4 py-2 rounded-full">
                      <div className="text-sm text-indigo-700">
                        <span className="font-medium">Session:</span> {Math.floor(currentSession?.duration || 0)}s
                      </div>
                      <div className="text-sm text-indigo-700">
                        <span className="font-medium">Interruptions:</span> {currentSession?.interruptions || 0}
                      </div>
                    </div>
                    <button 
                      onClick={stopTracking} 
                      className="px-6 py-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition-all duration-200 transform hover:scale-105 shadow-md"
                    >
                      End Session
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Session Analysis Modal */}
      {showSessionAnalysis && completedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-xl">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Session Complete! 🎉</h2>
              <button 
                onClick={() => setShowSessionAnalysis(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-indigo-50 rounded-xl p-4">
                  <div className="text-sm text-indigo-600 font-medium">Duration</div>
                  <div className="text-2xl font-bold text-indigo-700">
                    {Math.floor(completedSession.duration / 60)}m {Math.floor(completedSession.duration % 60)}s
                  </div>
                </div>
                <div className="bg-red-50 rounded-xl p-4">
                  <div className="text-sm text-red-600 font-medium">Interruptions</div>
                  <div className="text-2xl font-bold text-red-700">
                    {completedSession.interruptions}
                  </div>
                </div>
              </div>

              {completedSession.interruptions > 0 && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Distraction Analysis</h3>
                  <div className="space-y-3">
                    {getDistractionAnalysis(completedSession).distractions.map((distraction, index) => (
                      <div key={distraction.id} className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                          <span className="text-red-600 text-sm">!</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {distraction.details}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(distraction.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button 
                  onClick={() => setShowSessionAnalysis(false)}
                  className="px-6 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-all duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {currentPage === 'main' ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Schedule */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Schedule</h2>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setViewMode('daily')}
                      className={`px-3 py-1 rounded-md text-sm ${
                        viewMode === 'daily' 
                          ? 'bg-indigo-100 text-indigo-700' 
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Daily
                    </button>
                    <button 
                      onClick={() => setViewMode('weekly')}
                      className={`px-3 py-1 rounded-md text-sm ${
                        viewMode === 'weekly' 
                          ? 'bg-indigo-100 text-indigo-700' 
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Weekly
                    </button>
                  </div>
                </div>

                {/* Schedule content */}
                {viewMode === 'daily' ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <button 
                        onClick={goToPreviousDay}
                        className="p-2 rounded-full hover:bg-indigo-50 text-indigo-600 transition-colors duration-200"
                      >
                        ←
                      </button>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={goToToday}
                          className="px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors duration-200"
                        >
                          Today
                        </button>
                        <h3 className="text-lg font-medium text-indigo-900">
                          {formatDate(selectedDate)}
                        </h3>
                      </div>
                      <button 
                        onClick={goToNextDay}
                        className="p-2 rounded-full hover:bg-indigo-50 text-indigo-600 transition-colors duration-200"
                      >
                        →
                      </button>
                    </div>

                    <div className="space-y-3">
                      {currentDaySchedule.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No events scheduled</p>
                      ) : (
                        currentDaySchedule.map((item) => {
                          const isCurrentEvent = getCurrentEvent()?.id === item.id;
                          const currentPeriod = getCurrentPeriod();
                          const isCurrentPeriod = currentPeriod && item.time.startsWith(currentPeriod.start);
                          const currentSession = getCurrentSessionTime();
                          const isInCurrentSession = currentSession && 
                            new Date(item.startTime) >= currentSession.start && 
                            new Date(item.endTime) <= currentSession.end;
                          
                          const moodStats = getLessonMoodStats(item.id);
                          
                          return (
                            <div 
                              key={item.id} 
                              onClick={() => {
                                setSelectedLessonDetails(item);
                                setShowLessonDetails(true);
                              }}
                              className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                                isCurrentEvent 
                                  ? 'bg-green-100 border-green-300 shadow-md ring-2 ring-green-200' 
                                  : isCurrentPeriod
                                    ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                                    : isInCurrentSession 
                                      ? 'bg-blue-50 border-blue-200 shadow-sm'
                                      : 'border-gray-200 hover:bg-indigo-50/50 hover:border-indigo-100'
                              }`}
                            >
                              <div className="flex items-start gap-4">
                                <div className="w-24 flex-shrink-0">
                                  <div className={`font-medium ${
                                    isCurrentEvent 
                                      ? 'text-green-700' 
                                      : isCurrentPeriod 
                                        ? 'text-indigo-700' 
                                        : 'text-gray-600'
                                  }`}>
                                    {item.time}
                                  </div>
                                </div>
                                <div className="flex-grow">
                                  <div className="flex items-center gap-2">
                                    <h4 className={`font-medium ${
                                      isCurrentEvent 
                                        ? 'text-green-900' 
                                        : isCurrentPeriod 
                                          ? 'text-indigo-900' 
                                          : 'text-gray-900'
                                    }`}>
                                      {item.title}
                                    </h4>
                                    {isCurrentEvent && (
                                      <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full font-medium">
                                        In Progress
                                      </span>
                                    )}
                                    {isCurrentPeriod && !isCurrentEvent && (
                                      <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                                        Current Period
                                      </span>
                                    )}
                                    {isInCurrentSession && !isCurrentEvent && !isCurrentPeriod && (
                                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                        Current Session
                                      </span>
                                    )}
                                  </div>
                                  {item.description && (
                                    <p className={`text-sm mt-1 ${
                                      isCurrentEvent 
                                        ? 'text-green-700' 
                                        : isCurrentPeriod 
                                          ? 'text-indigo-600' 
                                          : 'text-gray-600'
                                    }`}>
                                      {item.description}
                                    </p>
                                  )}
                                  {moodStats.total > 0 && (
                                    <div className="mt-2 flex gap-2">
                                      {moodStats.focused > 0 && (
                                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                          Focused: {moodStats.focused}
                                        </span>
                                      )}
                                      {moodStats.bored > 0 && (
                                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                                          Bored: {moodStats.bored}
                                        </span>
                                      )}
                                      {moodStats.stressed > 0 && (
                                        <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                                          Stressed: {moodStats.stressed}
                                        </span>
                                      )}
                                      {moodStats.neutral > 0 && (
                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                          Neutral: {moodStats.neutral}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ) : (
                  renderWeeklyView()
                )}
              </div>
            </div>

            {/* Right Column - Tools */}
            <div className="space-y-8">
              {/* Reward Stats */}
              {renderRewardStats()}

              {/* Focus Timer */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Focus Timer</h2>
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {String(timerMinutes).padStart(2, '0')}:{String(timerSeconds).padStart(2, '0')}
                  </div>
                  <div className="text-sm text-gray-600 mb-4">
                    {timerMode === 'focus' ? 'Focus Time' : 'Break Time'}
                  </div>

                  {!isTimerRunning && (
                    <div className="mb-4">
                      <div className="text-sm font-medium text-gray-700 mb-2">Quick Set</div>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {[5, 15, 25, 45, 60].map((minutes) => (
                          <button
                            key={minutes}
                            onClick={() => adjustTime(minutes)}
                            className={`px-3 py-1 rounded-md text-sm ${
                              timerMinutes === minutes
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            {minutes}m
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 justify-center">
                    {!isTimerRunning ? (
                      <button 
                        onClick={startTimer}
                        className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors duration-200"
                      >
                        Start
                      </button>
                    ) : (
                      <button 
                        onClick={pauseTimer}
                        className="px-4 py-2 rounded-md bg-yellow-600 text-white hover:bg-yellow-700 transition-colors duration-200"
                      >
                        Pause
                      </button>
                    )}
                    <button 
                      onClick={resetTimer}
                      className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors duration-200"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>

              {/* Mood Tracker */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Mood & Focus Tracker</h2>
                <div className="space-y-4">
                  {/* Mood Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">How are you feeling?</label>
                    <div className="flex gap-2 justify-center">
                      {['😊', '😐', '😢', '😡', '😴'].map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => setCurrentMood(emoji)}
                          className={`text-2xl p-2 rounded-md ${
                            currentMood === emoji 
                              ? 'bg-indigo-100 border-2 border-indigo-500' 
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* State Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">What's your current state?</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setCurrentState('focused')}
                        className={`p-2 rounded-md text-sm ${
                          currentState === 'focused'
                            ? 'bg-green-100 border-2 border-green-500 text-green-700'
                            : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        Focused
                      </button>
                      <button
                        onClick={() => setCurrentState('bored')}
                        className={`p-2 rounded-md text-sm ${
                          currentState === 'bored'
                            ? 'bg-yellow-100 border-2 border-yellow-500 text-yellow-700'
                            : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        Bored
                      </button>
                      <button
                        onClick={() => setCurrentState('stressed')}
                        className={`p-2 rounded-md text-sm ${
                          currentState === 'stressed'
                            ? 'bg-red-100 border-2 border-red-500 text-red-700'
                            : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        Stressed
                      </button>
                      <button
                        onClick={() => setCurrentState('neutral')}
                        className={`p-2 rounded-md text-sm ${
                          currentState === 'neutral'
                            ? 'bg-blue-100 border-2 border-blue-500 text-blue-700'
                            : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        Neutral
                      </button>
                    </div>
                  </div>

                  {/* Lesson Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Which lesson is this for?</label>
                    <select
                      value={selectedLesson || ''}
                      onChange={(e) => setSelectedLesson(e.target.value)}
                      className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">Select a lesson</option>
                      {currentDaySchedule.map((lesson) => (
                        <option key={lesson.id} value={lesson.id}>
                          {lesson.time} - {lesson.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Note Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
                    <input
                      type="text"
                      value={moodNote}
                      onChange={(e) => setMoodNote(e.target.value)}
                      placeholder="How are you feeling?"
                      className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  {/* Submit Button */}
                  <button 
                    onClick={addMoodEntry}
                    className="w-full px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors duration-200"
                  >
                    Add Entry
                  </button>

                  {/* Recent Entries */}
                  <div className="mt-4">
                    <h3 className="font-medium text-gray-900 mb-2">Recent Entries</h3>
                    <div className="space-y-2">
                      {moodEntries.slice().reverse().map((entry) => (
                        <div key={entry.id} className="p-3 rounded-md border border-gray-200">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{entry.mood}</span>
                              <span className={`text-sm px-2 py-1 rounded-full ${
                                entry.state === 'focused' ? 'bg-green-100 text-green-800' :
                                entry.state === 'bored' ? 'bg-yellow-100 text-yellow-800' :
                                entry.state === 'stressed' ? 'bg-red-100 text-red-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {entry.state}
                              </span>
                            </div>
                            <span className="text-sm text-gray-600">{entry.date}</span>
                          </div>
                          {entry.lessonTitle && (
                            <div className="text-sm text-gray-600 mt-1">
                              Lesson: {entry.lessonTitle}
                            </div>
                          )}
                          {entry.note && (
                            <p className="text-sm text-gray-600 mt-1">{entry.note}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Outlook Connection */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Outlook Calendar</h2>
                <div className="space-y-4">
                  <button 
                    onClick={connectToOutlook} 
                    disabled={isConnecting || isOutlookConnected}
                    className={`w-full px-4 py-2 rounded-md ${
                      isOutlookConnected 
                        ? 'bg-green-600 text-white' 
                        : isConnecting 
                          ? 'bg-gray-400 text-white cursor-not-allowed'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    } transition-colors duration-200`}
                  >
                    {isConnecting 
                      ? 'Connecting...' 
                      : isOutlookConnected 
                        ? 'Connected to Outlook' 
                        : 'Connect to Outlook'}
                  </button>
                  {isOutlookConnected && (
                    <button 
                      onClick={async () => {
                        try {
                          if (msalInstance) {
                            const accounts = msalInstance.getAllAccounts();
                            if (accounts.length > 0) {
                              await msalInstance.logoutPopup({
                                account: accounts[0],
                                postLogoutRedirectUri: window.location.origin
                              });
                            }
                          }
                          setSchedule([]);
                          setIsOutlookConnected(false);
                          setError(null);
                          setMsalInstance(null);
                        } catch (error) {
                          console.error('Error disconnecting from Outlook:', error);
                          setError('Failed to disconnect from Outlook. Please try again.');
                        }
                      }}
                      className="w-full px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors duration-200"
                    >
                      Disconnect from Outlook
                    </button>
                  )}
                  {error && (
                    <p className="text-sm text-red-600 text-center">
                      {error}
                    </p>
                  )}
                  {isOutlookConnected && !error && (
                    <p className="text-sm text-green-600 text-center">
                      Successfully connected to Outlook! Your calendar events have been imported.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <GamePage 
          points={rewardStats.totalPoints} 
          onGameEnd={handleGameEnd}
          highScore={gameHighScore}
          setRewardStats={setRewardStats}
        />
      )}

      {/* Add modals */}
      {showLessonDetails && renderLessonDetailsModal()}
      {showWeeklyReport && renderWeeklyReportModal()}
    </div>
  );
}

// Add GamePage component at the end of the file
const GamePage: React.FC<{ 
  points: number;
  onGameEnd: (score: number) => void;
  highScore: number;
  setRewardStats: React.Dispatch<React.SetStateAction<RewardStats>>;
}> = ({ points, onGameEnd, highScore, setRewardStats }) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const [targetPosition, setTargetPosition] = useState({ x: 0, y: 0 });
  const [multiplier, setMultiplier] = useState(1);
  const [combo, setCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  const [comboPosition, setComboPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      setIsPlaying(false);
      onGameEnd(score);
    }
  }, [isPlaying, timeLeft, score, onGameEnd]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setIsPlaying(true);
    setMultiplier(1);
    setCombo(0);
    moveTarget();
  };

  const moveTarget = () => {
    // Get the game container's dimensions
    const gameContainer = document.querySelector('.game-container');
    if (!gameContainer) return;

    const rect = gameContainer.getBoundingClientRect();
    const padding = 40; // Half of the target's width/height to prevent edge cutting

    // Calculate safe boundaries
    const maxX = rect.width - padding;
    const maxY = rect.height - padding;
    const minX = padding;
    const minY = padding;

    // Generate random position within safe boundaries
    const x = Math.random() * (maxX - minX) + minX;
    const y = Math.random() * (maxY - minY) + minY;

    setTargetPosition({ x, y });
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!isPlaying) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const distance = Math.sqrt(
      Math.pow(x - targetPosition.x, 2) + Math.pow(y - targetPosition.y, 2)
    );

    if (distance < 50) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      setShowCombo(true);
      setComboPosition({ x: e.clientX, y: e.clientY });
      setTimeout(() => setShowCombo(false), 500);

      const newMultiplier = Math.min(5, 1 + (newCombo * 0.1));
      setMultiplier(newMultiplier);
      setScore(prev => prev + Math.floor(10 * newMultiplier));
      moveTarget();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-purple-900 mb-4">Focus Clicker</h1>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-sm text-gray-600">Score</div>
            <div className="text-2xl font-bold text-purple-700">{score}</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-sm text-gray-600">Time Left</div>
            <div className="text-2xl font-bold text-purple-700">{timeLeft}s</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-sm text-gray-600">High Score</div>
            <div className="text-2xl font-bold text-purple-700">{highScore}</div>
          </div>
        </div>
        {!isPlaying && (
          <button
            onClick={startGame}
            className="px-8 py-3 rounded-full bg-purple-600 text-white text-lg font-medium hover:bg-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Start Game
          </button>
        )}
      </div>

      {isPlaying && (
        <div
          className="relative w-full h-[60vh] bg-white rounded-2xl shadow-lg overflow-hidden cursor-crosshair game-container"
          onClick={handleClick}
        >
          <div
            className="absolute w-20 h-20 bg-purple-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 hover:scale-110"
            style={{
              left: targetPosition.x,
              top: targetPosition.y,
              boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)'
            }}
          />
          {showCombo && (
            <div
              className="absolute text-2xl font-bold text-purple-600 animate-bounce"
              style={{
                left: comboPosition.x,
                top: comboPosition.y - 30,
                transform: 'translate(-50%, -50%)'
              }}
            >
              +{Math.floor(10 * multiplier)} (x{multiplier.toFixed(1)})
            </div>
          )}
        </div>
      )}

      <div className="mt-8 text-center">
        <h2 className="text-xl font-semibold text-purple-900 mb-2">How to Play</h2>
        <p className="text-gray-600 max-w-md">
          Click the purple target as many times as you can in 30 seconds!
          Build up your combo to increase your multiplier and score more points.
          Your high score will be saved between sessions.
        </p>
      </div>
    </div>
  );
};

export default App;
import React, { useState, useEffect } from 'react';
import { PublicClientApplication, AccountInfo } from '@azure/msal-browser';
import GamePage from './GamePage';
import FocusTimer from './FocusTimer';
import MoodTracker from './MoodTracker';
import Schedule from './Schedule';
import RewardSystem from './RewardSystem';
import { ScheduleItem, MoodEntry, RewardStats, FocusSession, Activity } from '../types';

interface StudentDashboardProps {
  msalInstance: PublicClientApplication;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ msalInstance }) => {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [focusMode, setFocusMode] = useState(false);
  const [newScheduleItem, setNewScheduleItem] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isOutlookConnected, setIsOutlookConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Add game state
  const [currentPage, setCurrentPage] = useState<'main' | 'game'>('main');
  const [gameScore, setGameScore] = useState(0);
  const [gameHighScore, setGameHighScore] = useState(() => {
    const saved = localStorage.getItem('gameHighScore');
    return saved ? parseInt(saved) : 0;
  });

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedSchedule = localStorage.getItem('schedule');
    const savedFocusSessions = localStorage.getItem('focusSessions');
    const savedMoodEntries = localStorage.getItem('moodEntries');
    const savedRewardStats = localStorage.getItem('rewardStats');

    if (savedSchedule) setSchedule(JSON.parse(savedSchedule));
    if (savedFocusSessions) setFocusSessions(JSON.parse(savedFocusSessions));
    if (savedMoodEntries) setMoodEntries(JSON.parse(savedMoodEntries));
    if (savedRewardStats) setRewardStats(JSON.parse(savedRewardStats));
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('schedule', JSON.stringify(schedule));
  }, [schedule]);

  useEffect(() => {
    localStorage.setItem('focusSessions', JSON.stringify(focusSessions));
  }, [focusSessions]);

  useEffect(() => {
    localStorage.setItem('moodEntries', JSON.stringify(moodEntries));
  }, [moodEntries]);

  useEffect(() => {
    localStorage.setItem('rewardStats', JSON.stringify(rewardStats));
  }, [rewardStats]);

  const handleAddScheduleItem = (item: Omit<ScheduleItem, 'id'>) => {
    const newItem = {
      ...item,
      id: Date.now().toString()
    };
    setSchedule([...schedule, newItem]);
  };

  const handleDeleteScheduleItem = (id: string) => {
    setSchedule(schedule.filter(item => item.id !== id));
  };

  const handleScheduleItemClick = (item: ScheduleItem) => {
    setSelectedLessonDetails(item);
    setShowLessonDetails(true);
  };

  const handleMoodSubmit = (mood: MoodEntry) => {
    setMoodEntries([mood, ...moodEntries]);
    setRewardStats(prev => ({
      ...prev,
      totalPoints: prev.totalPoints + 5,
      pointsThisWeek: prev.pointsThisWeek + 5,
      moodPoints: prev.moodPoints + 5
    }));
  };

  const handleTimerComplete = () => {
    if (currentSession) {
      const completedSession: FocusSession = {
        ...currentSession,
        endTime: new Date()
      };
      setFocusSessions([...focusSessions, completedSession]);
      setCurrentSession(null);
      setShowSessionAnalysis(true);
      setCompletedSession(completedSession);
      setRewardStats(prev => ({
        ...prev,
        totalPoints: prev.totalPoints + 10,
        pointsThisWeek: prev.pointsThisWeek + 10,
        focusPoints: prev.focusPoints + 10
      }));
    }
  };

  const handleTimerInterruption = () => {
    if (currentSession) {
      const activity: Activity = {
        id: Date.now().toString(),
        timestamp: new Date(),
        type: 'leave',
        details: 'Timer paused'
      };
      setCurrentSession({
        ...currentSession,
        interruptions: currentSession.interruptions + 1,
        activities: [...currentSession.activities, activity]
      });
    }
  };

  const handleGameEnd = (score: number) => {
    setGameScore(score);
    if (score > gameHighScore) {
      setGameHighScore(score);
      localStorage.setItem('gameHighScore', score.toString());
    }
    setCurrentPage('main');
    setRewardStats(prev => ({
      ...prev,
      totalPoints: prev.totalPoints + score,
      pointsThisWeek: prev.pointsThisWeek + score,
      gamePoints: prev.gamePoints + score
    }));
  };

  if (currentPage === 'game') {
    return (
      <GamePage
        onGameEnd={handleGameEnd}
        onBack={() => setCurrentPage('main')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Schedule
              schedule={schedule}
              onAddItem={handleAddScheduleItem}
              onDeleteItem={handleDeleteScheduleItem}
              onItemClick={handleScheduleItemClick}
              msalInstance={msalInstance}
            />
            <FocusTimer
              onTimerComplete={handleTimerComplete}
              onInterruption={handleTimerInterruption}
            />
          </div>
          <div className="space-y-6">
            <MoodTracker
              onMoodSubmit={handleMoodSubmit}
              moodEntries={moodEntries}
              selectedLesson={selectedLesson}
            />
            <RewardSystem
              stats={rewardStats}
              onGameStart={() => setCurrentPage('game')}
            />
          </div>
        </div>
      </div>

      {/* Lesson Details Modal */}
      {showLessonDetails && selectedLessonDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-xl font-bold mb-4">{selectedLessonDetails.title}</h3>
            <p className="text-gray-600 mb-4">{selectedLessonDetails.description}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowLessonDetails(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Analysis Modal */}
      {showSessionAnalysis && completedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-xl font-bold mb-4">Focus Session Analysis</h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600">Duration</div>
                <div className="text-lg">
                  {Math.round(
                    (completedSession.endTime!.getTime() -
                      completedSession.startTime.getTime()) /
                      (1000 * 60)
                  )}{' '}
                  minutes
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Interruptions</div>
                <div className="text-lg">{completedSession.interruptions}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Focus Score</div>
                <div className="text-lg">
                  {Math.max(
                    0,
                    100 -
                      completedSession.interruptions * 10 -
                      completedSession.activities.length * 5
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowSessionAnalysis(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard; 
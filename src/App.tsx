import React, { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { signInWithGoogle, signInWithEmail, signUpWithEmail, signOut, onAuthStateChange } from './services/auth';

// Color themes for gradients
const gradientThemes = {
  default: 'from-gray-50 to-gray-100'
};

// Microsoft Outlook integration types
interface OutlookEvent {
  id: string;
  title: string;
  time: string;
  description: string;
  isDoubleLesson: boolean;
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
  lessonId: string;
  lessonTitle: string;
  note: string;
}

interface FocusSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  interruptions: number;
  activities: Array<{
    id: string;
    timestamp: Date;
    type: 'leave' | 'return' | 'window_focus' | 'tab_switch';
    details: string;
  }>;
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

// Authentication Component
const AuthComponent: React.FC<{ onAuthSuccess: (user: User) => void }> = ({ onAuthSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const user = isSignUp 
        ? await signUpWithEmail(email, password)
        : await signInWithEmail(email, password);
      
      onAuthSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      const user = await signInWithGoogle();
      onAuthSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">FocusFriend</h1>
          <p className="text-gray-600">Your productivity companion</p>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter your password"
              required
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-gray-500 text-sm">or</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Game Component
const FocusGame: React.FC<{ points: number; onGameEnd: (score: number) => void; highScore: number; setRewardStats: (updater: (prev: RewardStats) => RewardStats) => void }> = ({
  points,
  onGameEnd,
  highScore,
  setRewardStats
}) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameActive, setGameActive] = useState(false);
  const [targetPosition, setTargetPosition] = useState({ x: 0, y: 0 });
  const [multiplier, setMultiplier] = useState(1);
  const [hitCount, setHitCount] = useState(0);
  const [showPoints, setShowPoints] = useState(false);
  const [clickPosition, setClickPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (gameActive && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      setGameActive(false);
      onGameEnd(score);
    }
  }, [gameActive, timeLeft, score, onGameEnd]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setGameActive(true);
    setMultiplier(1);
    setHitCount(0);
    generateTarget();
  };

  const generateTarget = () => {
    const gameContainer = document.querySelector('.game-container');
    if (!gameContainer) return;

    const rect = gameContainer.getBoundingClientRect();
    const targetSize = 40;
    const maxX = rect.width - targetSize;
    const maxY = rect.height - targetSize;
    const minX = targetSize;
    const minY = targetSize;

    const x = Math.random() * (maxX - minX) + minX;
    const y = Math.random() * (maxY - minY) + minY;

    setTargetPosition({ x, y });
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    if (!gameActive) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const distance = Math.sqrt(
      Math.pow(clickX - targetPosition.x, 2) + Math.pow(clickY - targetPosition.y, 2)
    );

    if (distance < 50) {
      const newHitCount = hitCount + 1;
      setHitCount(newHitCount);
      setShowPoints(true);
      setClickPosition({ x: e.clientX, y: e.clientY });
      
      setTimeout(() => setShowPoints(false), 500);

      const newMultiplier = Math.min(5, 1 + (newHitCount * 0.1));
      setMultiplier(newMultiplier);
      setScore(prev => prev + Math.floor(10 * newMultiplier));
      generateTarget();
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
        {!gameActive && (
          <button
            onClick={startGame}
            className="px-8 py-3 rounded-full bg-purple-600 text-white text-lg font-medium hover:bg-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Start Game
          </button>
        )}
      </div>

      {gameActive && (
        <div
          className="relative w-full h-[60vh] bg-white rounded-2xl shadow-lg overflow-hidden cursor-crosshair game-container"
          onClick={handleContainerClick}
        >
          <div
            className="absolute w-20 h-20 bg-purple-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 hover:scale-110"
            style={{
              left: targetPosition.x,
              top: targetPosition.y,
              boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)'
            }}
          />
          {showPoints && (
            <div
              className="absolute text-2xl font-bold text-purple-600 animate-bounce"
              style={{
                left: clickPosition.x,
                top: clickPosition.y - 30,
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

// Main Focus Friend App
function FocusFriendApp() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'main' | 'game'>('main');

  // Schedule and calendar state
  const [schedule, setSchedule] = useState<OutlookEvent[]>([]);
  const [isOutlookConnected, setIsOutlookConnected] = useState(false);
  const [outlookError, setOutlookError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Timer state
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timerMode, setTimerMode] = useState<'focus' | 'break'>('focus');
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);

  // Mood tracking state
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [selectedMood, setSelectedMood] = useState('');
  const [selectedState, setSelectedState] = useState<'focused' | 'bored' | 'stressed' | 'neutral'>('neutral');
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [moodNote, setMoodNote] = useState('');

  // Focus session tracking
  const [currentSession, setCurrentSession] = useState<FocusSession | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionHistory, setSessionHistory] = useState<FocusSession[]>([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [showSessionComplete, setShowSessionComplete] = useState(false);
  const [completedSession, setCompletedSession] = useState<FocusSession | null>(null);

  // Schedule view state
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekOffset, setWeekOffset] = useState(0);

  // Game state
  const [gameScore, setGameScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('gameHighScore');
    return saved ? parseInt(saved) : 0;
  });

  // Reward system
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

  // Initialize authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Handle authentication success
  const handleAuthSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Game end handler
  const handleGameEnd = (score: number) => {
    const pointsEarned = Math.floor(score / 100);
    setGameScore(score);
    
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('gameHighScore', score.toString());
    }

    setRewardStats(prev => {
      const updated = {
        ...prev,
        gamePoints: prev.gamePoints + pointsEarned,
        totalPoints: prev.totalPoints + pointsEarned,
        pointsThisWeek: prev.pointsThisWeek + pointsEarned,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem('rewardStats', JSON.stringify(updated));
      return updated;
    });
  };

  // Get current day's schedule
  const todaySchedule = schedule.filter(event => {
    const eventDate = event.startTime.toLocaleDateString();
    const today = new Date().toLocaleDateString();
    return eventDate === today;
  }).sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-indigo-600 mb-4">Loading FocusFriend...</h1>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthComponent onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className={`min-h-screen ${gradientThemes.default}`}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">FocusFriend</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentView(currentView === 'main' ? 'game' : 'main')}
                className="px-6 py-2 rounded-full bg-purple-600 text-white hover:bg-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center space-x-2"
              >
                <span className="text-xl">🎮</span>
                <span className="font-medium">
                  {currentView === 'main' ? 'Play Game' : 'Back to Schedule'}
                </span>
              </button>
              <div className="border-l border-gray-200 pl-4 flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  Welcome, {user.email}
                </div>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 rounded-full bg-gray-600 text-white hover:bg-gray-700 transition-all duration-200"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {currentView === 'main' ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content area */}
            <div className="lg:col-span-2 space-y-8">
              {/* Schedule */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Schedule</h2>
                <div className="space-y-3">
                  {todaySchedule.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No events scheduled for today. Connect your calendar to see your schedule!
                    </p>
                  ) : (
                    todaySchedule.map((event) => (
                      <div key={event.id} className="p-4 rounded-xl border border-gray-200 hover:bg-indigo-50/50 hover:border-indigo-100 transition-all duration-200">
                        <div className="flex items-start gap-4">
                          <div className="w-24 flex-shrink-0">
                            <div className="font-medium text-gray-600">{event.time}</div>
                          </div>
                          <div className="flex-grow">
                            <h4 className="font-medium text-gray-900">{event.title}</h4>
                            {event.description && (
                              <p className="text-sm mt-1 text-gray-600">{event.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Reward Points */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Reward Points</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-indigo-50 rounded-xl p-4">
                      <div className="text-sm text-indigo-600 font-medium">Total Points</div>
                      <div className="text-2xl font-bold text-indigo-700">{rewardStats.totalPoints}</div>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4">
                      <div className="text-sm text-green-600 font-medium">This Week</div>
                      <div className="text-2xl font-bold text-green-700">{rewardStats.pointsThisWeek}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-purple-50 rounded-lg p-2">
                      <div className="text-xs text-purple-600">Game</div>
                      <div className="text-lg font-bold text-purple-700">{rewardStats.gamePoints}</div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-2">
                      <div className="text-xs text-blue-600">Focus</div>
                      <div className="text-lg font-bold text-blue-700">{rewardStats.focusPoints}</div>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-2">
                      <div className="text-xs text-yellow-600">Mood</div>
                      <div className="text-lg font-bold text-yellow-700">{rewardStats.moodPoints}</div>
                    </div>
                  </div>
                </div>
              </div>

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
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => setIsTimerActive(!isTimerActive)}
                      className={`px-4 py-2 rounded-md text-white transition-colors duration-200 ${
                        isTimerActive ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      {isTimerActive ? 'Pause' : 'Start'}
                    </button>
                    <button
                      onClick={() => {
                        setIsTimerActive(false);
                        setTimerMinutes(timerMode === 'focus' ? focusMinutes : breakMinutes);
                        setTimerSeconds(0);
                      }}
                      className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors duration-200"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <button className="w-full px-4 py-3 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors duration-200 text-left">
                    📊 View Analytics
                  </button>
                  <button className="w-full px-4 py-3 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 transition-colors duration-200 text-left">
                    📝 Add Mood Entry
                  </button>
                  <button className="w-full px-4 py-3 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors duration-200 text-left">
                    🎯 Focus Session
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <FocusGame
          points={rewardStats.totalPoints}
          onGameEnd={handleGameEnd}
          highScore={highScore}
          setRewardStats={setRewardStats}
        />
      )}
    </div>
  );
}

export default FocusFriendApp;
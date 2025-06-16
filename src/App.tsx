import React, { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { signInWithGoogle, signInWithEmail, signUpWithEmail, signOut, onAuthStateChange } from './services/auth';

// Color themes for gradients
const gradientThemes = {
  default: 'from-slate-50 via-blue-50 to-slate-100'
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 w-full max-w-md border border-slate-200/50">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl text-white">🎯</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">FocusFriend</h1>
          <p className="text-slate-600">Your productivity companion</p>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-6">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/70 backdrop-blur-sm"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/70 backdrop-blur-sm"
              placeholder="Enter your password"
              required
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-2xl border border-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 rounded-2xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 transform hover:scale-[1.02]"
          >
            {loading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-slate-200"></div>
          <span className="px-4 text-slate-500 text-sm">or</span>
          <div className="flex-1 border-t border-slate-200"></div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-white border border-slate-200 text-slate-700 py-4 rounded-2xl font-medium hover:bg-slate-50 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-3 transform hover:scale-[1.02]"
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
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
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
    const targetSize = 60;
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

    if (distance < 60) {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex flex-col items-center justify-center p-6">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold text-slate-800 mb-6">Focus Clicker</h1>
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-slate-200/50">
            <div className="text-sm text-slate-600 font-medium">Score</div>
            <div className="text-3xl font-bold text-blue-600">{score}</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-slate-200/50">
            <div className="text-sm text-slate-600 font-medium">Time Left</div>
            <div className="text-3xl font-bold text-blue-600">{timeLeft}s</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-slate-200/50">
            <div className="text-sm text-slate-600 font-medium">High Score</div>
            <div className="text-3xl font-bold text-blue-600">{highScore}</div>
          </div>
        </div>
        {!gameActive && (
          <button
            onClick={startGame}
            className="px-10 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white text-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Start Game
          </button>
        )}
      </div>

      {gameActive && (
        <div
          className="relative w-full max-w-4xl h-[70vh] bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden cursor-crosshair game-container border border-slate-200/50"
          onClick={handleContainerClick}
        >
          <div
            className="absolute w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 hover:scale-110 shadow-lg"
            style={{
              left: targetPosition.x,
              top: targetPosition.y,
              boxShadow: '0 0 30px rgba(59, 130, 246, 0.6)'
            }}
          />
          {showPoints && (
            <div
              className="absolute text-2xl font-bold text-blue-600 animate-bounce"
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

      <div className="mt-8 text-center max-w-md">
        <h2 className="text-xl font-semibold text-slate-700 mb-3">How to Play</h2>
        <p className="text-slate-600 leading-relaxed">
          Click the blue target as many times as you can in 30 seconds! 
          Build up your combo to increase your multiplier and score more points.
        </p>
      </div>
    </div>
  );
};

// Overview Card Component
const OverviewCard: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = "" }) => (
  <div className={`bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-slate-200/50 ${className}`}>
    <h3 className="text-lg font-semibold text-slate-700 mb-4">{title}</h3>
    {children}
  </div>
);

// Stat Card Component
const StatCard: React.FC<{ icon: string; label: string; value: string | number; color: string }> = ({ icon, label, value, color }) => (
  <div className={`bg-gradient-to-br ${color} rounded-2xl p-4 text-white shadow-sm`}>
    <div className="flex items-center gap-3 mb-2">
      <span className="text-2xl">{icon}</span>
      <span className="text-sm font-medium opacity-90">{label}</span>
    </div>
    <div className="text-2xl font-bold">{value}</div>
  </div>
);

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

  // Timer effect
  useEffect(() => {
    if (isTimerActive && (timerMinutes > 0 || timerSeconds > 0)) {
      const timer = setInterval(() => {
        if (timerSeconds > 0) {
          setTimerSeconds(timerSeconds - 1);
        } else if (timerMinutes > 0) {
          setTimerMinutes(timerMinutes - 1);
          setTimerSeconds(59);
        } else {
          setIsTimerActive(false);
          // Timer completed - could add notification here
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isTimerActive, timerMinutes, timerSeconds]);

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

  // Connect to Outlook
  const connectToOutlook = async () => {
    setIsConnecting(true);
    setOutlookError(null);

    try {
      // Simulate Outlook connection - replace with actual Microsoft Graph API integration
      setTimeout(() => {
        setIsOutlookConnected(true);
        setIsConnecting(false);
        // Add some mock events
        const mockEvents: OutlookEvent[] = [
          {
            id: '1',
            title: 'Mathematics',
            time: '09:00 - 10:00',
            description: 'Algebra and Calculus',
            isDoubleLesson: false,
            startTime: new Date(),
            endTime: new Date(Date.now() + 60 * 60 * 1000)
          },
          {
            id: '2',
            title: 'Physics',
            time: '11:00 - 12:00',
            description: 'Quantum Mechanics',
            isDoubleLesson: false,
            startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
            endTime: new Date(Date.now() + 3 * 60 * 60 * 1000)
          }
        ];
        setSchedule(mockEvents);
      }, 2000);
    } catch (error) {
      setOutlookError('Failed to connect to Outlook');
      setIsConnecting(false);
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

  // Get next event
  const nextEvent = todaySchedule.find(event => event.startTime > new Date());

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center animate-pulse">
            <span className="text-2xl text-white">🎯</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Loading FocusFriend...</h1>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthComponent onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${gradientThemes.default}`}>
      {/* Minimalist Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-lg text-white">🎯</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-800">FocusFriend</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentView(currentView === 'main' ? 'game' : 'main')}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center gap-2 font-medium"
              >
                <span className="text-lg">{currentView === 'main' ? '🎮' : '📊'}</span>
                <span>{currentView === 'main' ? 'Play Game' : 'Dashboard'}</span>
              </button>
              
              <div className="flex items-center gap-3 text-slate-600">
                <span className="text-sm font-medium">{user.email?.split('@')[0]}</span>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors duration-200 text-sm font-medium"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {currentView === 'main' ? (
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          {/* Overview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Main Stats */}
            <div className="lg:col-span-8">
              <OverviewCard title="Today's Overview" className="mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard icon="🎯" label="Focus Points" value={rewardStats.focusPoints} color="from-blue-500 to-blue-600" />
                  <StatCard icon="🎮" label="Game Points" value={rewardStats.gamePoints} color="from-slate-500 to-slate-600" />
                  <StatCard icon="😊" label="Mood Points" value={rewardStats.moodPoints} color="from-emerald-500 to-emerald-600" />
                  <StatCard icon="⚡" label="Total Points" value={rewardStats.totalPoints} color="from-indigo-500 to-indigo-600" />
                </div>
              </OverviewCard>

              {/* Schedule Overview */}
              <OverviewCard title="Today's Schedule">
                {!isOutlookConnected ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                      <span className="text-2xl">📅</span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">Connect Your Calendar</h3>
                    <p className="text-slate-600 mb-4">Sync with Outlook to see your schedule and track focus sessions</p>
                    <button
                      onClick={connectToOutlook}
                      disabled={isConnecting}
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 font-medium"
                    >
                      {isConnecting ? 'Connecting...' : 'Connect to Outlook'}
                    </button>
                    {outlookError && (
                      <p className="text-red-600 text-sm mt-2">{outlookError}</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {nextEvent && (
                      <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium text-blue-700">Next Up</span>
                        </div>
                        <h4 className="font-semibold text-slate-800">{nextEvent.title}</h4>
                        <p className="text-slate-600 text-sm">{nextEvent.time}</p>
                      </div>
                    )}
                    
                    {todaySchedule.length === 0 ? (
                      <div className="text-center py-6 text-slate-500">
                        <span className="text-4xl mb-2 block">🌅</span>
                        <p>No more events today. Great job!</p>
                      </div>
                    ) : (
                      todaySchedule.slice(0, 3).map((event) => (
                        <div key={event.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors duration-200">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <div className="flex-1">
                            <h4 className="font-medium text-slate-800">{event.title}</h4>
                            <p className="text-slate-600 text-sm">{event.time}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </OverviewCard>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Focus Timer */}
              <OverviewCard title="Focus Timer">
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-3">
                    {String(timerMinutes).padStart(2, '0')}:{String(timerSeconds).padStart(2, '0')}
                  </div>
                  <div className="text-sm text-slate-600 mb-4">
                    {timerMode === 'focus' ? '🎯 Focus Time' : '☕ Break Time'}
                  </div>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => setIsTimerActive(!isTimerActive)}
                      className={`px-4 py-2 rounded-xl text-white transition-all duration-200 font-medium ${
                        isTimerActive 
                          ? 'bg-slate-500 hover:bg-slate-600' 
                          : 'bg-emerald-500 hover:bg-emerald-600'
                      }`}
                    >
                      {isTimerActive ? 'Pause' : 'Start'}
                    </button>
                    <button
                      onClick={() => {
                        setIsTimerActive(false);
                        setTimerMinutes(25);
                        setTimerSeconds(0);
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors duration-200 font-medium"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </OverviewCard>

              {/* Quick Actions */}
              <OverviewCard title="Quick Actions">
                <div className="space-y-3">
                  <button className="w-full p-4 rounded-2xl bg-blue-50 text-left hover:bg-blue-100 transition-all duration-200 border border-blue-100 group">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📊</span>
                      <div>
                        <div className="font-medium text-slate-700 group-hover:text-blue-700">View Analytics</div>
                        <div className="text-sm text-slate-500">Track your progress</div>
                      </div>
                    </div>
                  </button>
                  
                  <button className="w-full p-4 rounded-2xl bg-emerald-50 text-left hover:bg-emerald-100 transition-all duration-200 border border-emerald-100 group">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">😊</span>
                      <div>
                        <div className="font-medium text-slate-700 group-hover:text-emerald-700">Log Mood</div>
                        <div className="text-sm text-slate-500">How are you feeling?</div>
                      </div>
                    </div>
                  </button>
                  
                  <button className="w-full p-4 rounded-2xl bg-slate-50 text-left hover:bg-slate-100 transition-all duration-200 border border-slate-100 group">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🎯</span>
                      <div>
                        <div className="font-medium text-slate-700 group-hover:text-slate-800">Focus Session</div>
                        <div className="text-sm text-slate-500">Start deep work</div>
                      </div>
                    </div>
                  </button>
                </div>
              </OverviewCard>

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
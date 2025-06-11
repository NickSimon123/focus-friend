import React, { useState, useEffect } from 'react';

interface FocusTimerProps {
  onTimerComplete: () => void;
  onInterruption: () => void;
}

const FocusTimer: React.FC<FocusTimerProps> = ({ onTimerComplete, onInterruption }) => {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [customFocusTime, setCustomFocusTime] = useState(25);
  const [customBreakTime, setCustomBreakTime] = useState(5);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning) {
      interval = setInterval(() => {
        if (seconds > 0) {
          setSeconds(seconds - 1);
        } else if (minutes > 0) {
          setMinutes(minutes - 1);
          setSeconds(59);
        } else {
          clearInterval(interval);
          setIsRunning(false);
          onTimerComplete();
          if (mode === 'focus') {
            setMode('break');
            setMinutes(customBreakTime);
          } else {
            setMode('focus');
            setMinutes(customFocusTime);
          }
        }
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, minutes, seconds, mode, customFocusTime, customBreakTime, onTimerComplete]);

  const startTimer = () => {
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
    onInterruption();
  };

  const resetTimer = () => {
    setIsRunning(false);
    setMinutes(mode === 'focus' ? customFocusTime : customBreakTime);
    setSeconds(0);
  };

  const toggleMode = () => {
    setMode(mode === 'focus' ? 'break' : 'focus');
    setMinutes(mode === 'focus' ? customBreakTime : customFocusTime);
    setSeconds(0);
    setIsRunning(false);
  };

  const handleFocusTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setCustomFocusTime(value);
      if (mode === 'focus') {
        setMinutes(value);
        setSeconds(0);
      }
    }
  };

  const handleBreakTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setCustomBreakTime(value);
      if (mode === 'break') {
        setMinutes(value);
        setSeconds(0);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">
          {mode === 'focus' ? 'Focus Timer' : 'Break Timer'}
        </h2>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="text-gray-600 hover:text-gray-800"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </div>

      {showSettings && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Focus Time (minutes)
              </label>
              <input
                type="number"
                value={customFocusTime}
                onChange={handleFocusTimeChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Break Time (minutes)
              </label>
              <input
                type="number"
                value={customBreakTime}
                onChange={handleBreakTimeChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                min="1"
              />
            </div>
          </div>
        </div>
      )}

      <div className="text-center mb-6">
        <div className="text-6xl font-bold text-gray-800 mb-2">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
        <div className="text-sm text-gray-600">
          {mode === 'focus' ? 'Time to focus!' : 'Take a break!'}
        </div>
      </div>

      <div className="flex justify-center space-x-4">
        {!isRunning ? (
          <button
            onClick={startTimer}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start
          </button>
        ) : (
          <button
            onClick={pauseTimer}
            className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Pause
          </button>
        )}
        <button
          onClick={resetTimer}
          className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Reset
        </button>
        <button
          onClick={toggleMode}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Switch to {mode === 'focus' ? 'Break' : 'Focus'}
        </button>
      </div>
    </div>
  );
};

export default FocusTimer; 
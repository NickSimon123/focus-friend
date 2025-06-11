import React, { useState } from 'react';
import { MoodEntry } from '../types';

interface MoodTrackerProps {
  onMoodSubmit: (mood: MoodEntry) => void;
  moodEntries: MoodEntry[];
  selectedLesson?: string;
}

const MoodTracker: React.FC<MoodTrackerProps> = ({
  onMoodSubmit,
  moodEntries,
  selectedLesson
}) => {
  const [currentMood, setCurrentMood] = useState('');
  const [moodNote, setMoodNote] = useState('');
  const [currentState, setCurrentState] = useState<'focused' | 'bored' | 'stressed' | 'neutral'>('neutral');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMood) return;

    const newMood: MoodEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      mood: currentMood,
      state: currentState,
      lessonId: selectedLesson,
      note: moodNote
    };

    onMoodSubmit(newMood);
    setCurrentMood('');
    setMoodNote('');
    setCurrentState('neutral');
  };

  const getMoodEmoji = (mood: string) => {
    const emojiMap: { [key: string]: string } = {
      happy: '😊',
      sad: '😢',
      angry: '😠',
      excited: '🤩',
      tired: '😴',
      anxious: '😰',
      calm: '😌',
      confused: '😕'
    };
    return emojiMap[mood] || '😐';
  };

  const getStateEmoji = (state: string) => {
    const emojiMap: { [key: string]: string } = {
      focused: '🎯',
      bored: '😑',
      stressed: '😫',
      neutral: '😐'
    };
    return emojiMap[state] || '😐';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Mood Tracker</h2>

      <form onSubmit={handleSubmit} className="mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How are you feeling?
          </label>
          <div className="grid grid-cols-4 gap-2">
            {['happy', 'sad', 'angry', 'excited', 'tired', 'anxious', 'calm', 'confused'].map(
              (mood) => (
                <button
                  key={mood}
                  type="button"
                  onClick={() => setCurrentMood(mood)}
                  className={`p-2 rounded-lg text-center transition-colors ${
                    currentMood === mood
                      ? 'bg-blue-100 border-2 border-blue-500'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <div className="text-2xl mb-1">{getMoodEmoji(mood)}</div>
                  <div className="text-sm capitalize">{mood}</div>
                </button>
              )
            )}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current State
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(['focused', 'bored', 'stressed', 'neutral'] as const).map((state) => (
              <button
                key={state}
                type="button"
                onClick={() => setCurrentState(state)}
                className={`p-2 rounded-lg text-center transition-colors ${
                  currentState === state
                    ? 'bg-blue-100 border-2 border-blue-500'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <div className="text-2xl mb-1">{getStateEmoji(state)}</div>
                <div className="text-sm capitalize">{state}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add a note (optional)
          </label>
          <textarea
            value={moodNote}
            onChange={(e) => setMoodNote(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            rows={3}
            placeholder="How are you feeling about your current task?"
          />
        </div>

        <button
          type="submit"
          disabled={!currentMood}
          className={`w-full py-2 rounded-lg text-white font-medium ${
            currentMood
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          Save Mood
        </button>
      </form>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Recent Moods</h3>
        <div className="space-y-3">
          {moodEntries.slice(0, 5).map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getMoodEmoji(entry.mood)}</span>
                <span className="text-2xl">{getStateEmoji(entry.state)}</span>
                <div>
                  <div className="font-medium capitalize">{entry.mood}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(entry.date).toLocaleTimeString()}
                  </div>
                </div>
              </div>
              {entry.note && (
                <div className="text-sm text-gray-600 max-w-xs">{entry.note}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MoodTracker; 
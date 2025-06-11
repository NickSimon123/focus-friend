import React from 'react';
import { RewardStats } from '../types';

interface RewardSystemProps {
  stats: RewardStats;
  onGameStart: () => void;
}

const RewardSystem: React.FC<RewardSystemProps> = ({ stats, onGameStart }) => {
  const getProgressColor = (points: number) => {
    if (points >= 100) return 'bg-green-500';
    if (points >= 50) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const getLevel = (points: number) => {
    return Math.floor(points / 50) + 1;
  };

  const getNextLevelPoints = (points: number) => {
    const currentLevel = getLevel(points);
    return currentLevel * 50;
  };

  const getProgressPercentage = (points: number) => {
    const nextLevel = getNextLevelPoints(points);
    const currentLevel = (getLevel(points) - 1) * 50;
    return ((points - currentLevel) / (nextLevel - currentLevel)) * 100;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Rewards & Progress</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Points</h3>
          <div className="text-3xl font-bold text-blue-600">{stats.totalPoints}</div>
          <div className="mt-2">
            <div className="text-sm text-gray-600">Level {getLevel(stats.totalPoints)}</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
              <div
                className={`h-2 rounded-full ${getProgressColor(stats.totalPoints)}`}
                style={{ width: `${getProgressPercentage(stats.totalPoints)}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.totalPoints} / {getNextLevelPoints(stats.totalPoints)} points to next level
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">This Week</h3>
          <div className="text-3xl font-bold text-green-600">{stats.pointsThisWeek}</div>
          <div className="mt-2">
            <div className="text-sm text-gray-600">Weekly Progress</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
              <div
                className="h-2 rounded-full bg-green-500"
                style={{ width: `${(stats.pointsThisWeek / 200) * 100}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.pointsThisWeek} / 200 weekly goal
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-sm text-gray-600 mb-1">Focus Points</div>
          <div className="text-2xl font-bold text-blue-600">{stats.focusPoints}</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <div className="text-sm text-gray-600 mb-1">Game Points</div>
          <div className="text-2xl font-bold text-purple-600">{stats.gamePoints}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-sm text-gray-600 mb-1">Mood Points</div>
          <div className="text-2xl font-bold text-green-600">{stats.moodPoints}</div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Completed Lessons</h3>
        <div className="space-y-2">
          {stats.completedLessons.length > 0 ? (
            stats.completedLessons.map((lesson, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-white rounded-lg p-2"
              >
                <span className="text-gray-800">{lesson}</span>
                <span className="text-green-500">✓</span>
              </div>
            ))
          ) : (
            <div className="text-gray-500 text-center py-2">No completed lessons yet</div>
          )}
        </div>
      </div>

      <button
        onClick={onGameStart}
        className="w-full mt-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
      >
        Play Focus Game
      </button>
    </div>
  );
};

export default RewardSystem; 
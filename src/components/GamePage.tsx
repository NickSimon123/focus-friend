import React, { useState, useEffect, useRef } from 'react';

interface GamePageProps {
  onGameEnd: (score: number) => void;
  onBack: () => void;
}

const GamePage: React.FC<GamePageProps> = ({ onGameEnd, onBack }) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isPlaying, setIsPlaying] = useState(false);
  const [targets, setTargets] = useState<{ id: number; x: number; y: number }[]>([]);
  const [level, setLevel] = useState(1);
  const gameAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      endGame();
    }
  }, [isPlaying, timeLeft]);

  const startGame = () => {
    setIsPlaying(true);
    setTimeLeft(60);
    setScore(0);
    setLevel(1);
    generateTargets();
  };

  const generateTargets = () => {
    const newTargets = [];
    const numTargets = Math.min(3 + level, 10);
    
    for (let i = 0; i < numTargets; i++) {
      newTargets.push({
        id: i,
        x: Math.random() * 80 + 10,
        y: Math.random() * 80 + 10
      });
    }
    
    setTargets(newTargets);
  };

  const handleTargetClick = (id: number) => {
    setScore(prev => prev + 1);
    setTargets(prev => prev.filter(target => target.id !== id));
    
    if (targets.length === 1) {
      setLevel(prev => prev + 1);
      generateTargets();
    }
  };

  const endGame = () => {
    setIsPlaying(false);
    onGameEnd(score);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
          >
            Back to Dashboard
          </button>
          <div className="text-2xl font-bold">Focus Game</div>
          <div className="text-xl">Score: {score}</div>
        </div>

        {!isPlaying ? (
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Focus Game</h2>
            <p className="mb-8">Click the targets as they appear. Stay focused and quick!</p>
            <button
              onClick={startGame}
              className="px-8 py-4 bg-blue-600 rounded-lg text-xl font-bold hover:bg-blue-500 transition-colors"
            >
              Start Game
            </button>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute top-0 right-0 text-2xl font-bold">
              Time: {timeLeft}s
            </div>
            <div
              ref={gameAreaRef}
              className="w-full h-[600px] bg-gray-800 rounded-lg relative overflow-hidden"
            >
              {targets.map(target => (
                <button
                  key={target.id}
                  onClick={() => handleTargetClick(target.id)}
                  className="absolute w-12 h-12 bg-red-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 hover:bg-red-400 transition-colors"
                  style={{
                    left: `${target.x}%`,
                    top: `${target.y}%`
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GamePage; 
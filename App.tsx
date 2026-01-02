import React, { useState } from 'react';
import { StartScreen } from './components/StartScreen';
import { Game } from './components/Game';
import { EndScreen } from './components/EndScreen';

type ScreenState = 'start' | 'game' | 'end';

const App: React.FC = () => {
  const [screen, setScreen] = useState<ScreenState>('start');
  const [gameKey, setGameKey] = useState(0); // Key to force new image on restart
  const [completedImageUrl, setCompletedImageUrl] = useState<string>('');

  const handleNewGame = () => {
    setGameKey(prev => prev + 1); // Increment key to force new image
    setScreen('game');
  };

  const handleGameComplete = (imageUrl: string) => {
    setCompletedImageUrl(imageUrl);
    setScreen('end');
  };

  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden font-sans select-none text-white">

      {/* Screen Routing */}
      {screen === 'start' && (
        <StartScreen onStart={() => setScreen('game')} />
      )}

      {screen === 'game' && (
        <Game key={gameKey} onComplete={handleGameComplete} onRestart={handleNewGame} onHome={() => setScreen('start')} />
      )}

      {screen === 'end' && (
        <EndScreen imageUrl={completedImageUrl} onRestart={handleNewGame} />
      )}

    </div>
  );
};

export default App;
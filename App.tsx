import React, { useState } from 'react';
import { StartScreen } from './components/StartScreen';
import { Game } from './components/Game';
import { SudokuGame } from './components/SudokuGame';
import { EndScreen } from './components/EndScreen';

type GameType = 'block-puzzle' | 'sudoku';
type ScreenState = 'start' | 'game' | 'end';

const App: React.FC = () => {
  const [screen, setScreen] = useState<ScreenState>('start');
  const [currentGame, setCurrentGame] = useState<GameType>('block-puzzle');
  const [gameKey, setGameKey] = useState(0); // Key to force new game on restart
  const [completedImageUrl, setCompletedImageUrl] = useState<string>('');

  const handleSelectGame = (game: GameType) => {
    setCurrentGame(game);
    setGameKey(prev => prev + 1);
    setScreen('game');
  };

  const handleNewGame = () => {
    setGameKey(prev => prev + 1);
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
        <StartScreen onSelectGame={handleSelectGame} />
      )}

      {screen === 'game' && currentGame === 'block-puzzle' && (
        <Game key={gameKey} onComplete={handleGameComplete} onRestart={handleNewGame} onHome={() => setScreen('start')} />
      )}

      {screen === 'game' && currentGame === 'sudoku' && (
        <SudokuGame key={gameKey} onComplete={handleGameComplete} onRestart={handleNewGame} onHome={() => setScreen('start')} />
      )}

      {screen === 'end' && (
        <EndScreen imageUrl={completedImageUrl} onRestart={handleNewGame} />
      )}

    </div>
  );
};

export default App;
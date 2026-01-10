import React, { useState } from 'react';
import { getImageUrl } from '../constants';
import { ComingSoonModal } from './ComingSoonModal';

type GameType = 'block-puzzle' | 'sudoku';

interface StartScreenProps {
  onSelectGame: (game: GameType) => void;
}

interface GameDef {
  id: string;
  name: string;
  icon: string;
  gameType?: GameType;
  active: boolean;
  color: string;
}

interface CollectionDef {
  id: string;
  name: string;
  imageId: number;
  badge: string;
  badgeColor: string;
}

const GAMES: GameDef[] = [
  { id: 'block-puzzle', name: 'Blocks', icon: '🧩', gameType: 'block-puzzle', active: true, color: 'from-emerald-500 to-teal-600' },
  { id: 'sudoku', name: 'Sudoku', icon: '🔢', gameType: 'sudoku', active: true, color: 'from-blue-500 to-indigo-600' },
  { id: 'jigsaw', name: 'Jigsaw', icon: '🖼️', active: false, color: 'from-purple-500 to-violet-600' },
  { id: 'shapes', name: 'Shapes', icon: '◇', active: false, color: 'from-amber-500 to-orange-600' },
  { id: 'word-search', name: 'Words', icon: '🔤', active: false, color: 'from-rose-500 to-pink-600' },
  { id: 'crossover', name: 'Cross', icon: '➕', active: false, color: 'from-cyan-500 to-blue-600' },
  { id: 'keysmash', name: 'Keys', icon: '⌨️', active: false, color: 'from-lime-500 to-green-600' },
  { id: 'waywords', name: 'Way', icon: '↓', active: false, color: 'from-fuchsia-500 to-purple-600' },
];

const COLLECTIONS: CollectionDef[] = [
  { id: 'nature', name: 'Nature', imageId: 10, badge: 'Blocks', badgeColor: 'bg-emerald-500' },
  { id: 'space', name: 'Space', imageId: 110, badge: 'Jigsaw', badgeColor: 'bg-purple-500' },
  { id: 'ocean', name: 'Ocean', imageId: 1015, badge: 'Blocks', badgeColor: 'bg-emerald-500' },
  { id: 'cities', name: 'Cities', imageId: 1040, badge: 'Shapes', badgeColor: 'bg-amber-500' },
  { id: 'art', name: 'Art', imageId: 1050, badge: 'Jigsaw', badgeColor: 'bg-purple-500' },
  { id: 'animals', name: 'Animals', imageId: 1074, badge: 'Blocks', badgeColor: 'bg-emerald-500' },
];

export const StartScreen: React.FC<StartScreenProps> = ({ onSelectGame }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<{ name: string; icon: string } | null>(null);

  const handleGameClick = (game: GameDef) => {
    if (game.active && game.gameType) {
      onSelectGame(game.gameType);
    } else {
      setSelectedGame({ name: game.name, icon: game.icon });
      setModalOpen(true);
    }
  };

  const handleCollectionClick = (collection: CollectionDef) => {
    setSelectedGame({ name: collection.name + ' Collection', icon: '📚' });
    setModalOpen(true);
  };

  const heroImageUrl = `https://picsum.photos/id/1018/800/400`;

  return (
    <div className="absolute inset-0 flex flex-col bg-gray-950 z-50 overflow-y-auto">
      {/* Header */}
      <div className="text-center pt-8 pb-4 flex-shrink-0">
        <div className="flex items-center justify-center gap-1 mb-1">
          <span className="text-red-500 text-2xl font-light tracking-wide">Zen</span>
        </div>
        <h1 className="text-3xl font-black tracking-[0.3em] text-white uppercase">
          Puzzles
        </h1>
      </div>

      {/* Hero Banner */}
      <div className="mx-4 rounded-2xl overflow-hidden relative flex-shrink-0">
        <img
          src={heroImageUrl}
          alt="Featured Puzzle"
          className="w-full aspect-video object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-red-900/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
          <p className="text-white/60 text-xs uppercase tracking-widest mb-1">Featured Puzzle</p>
          <h2 className="text-white text-xl font-bold mb-3">Random Challenge</h2>
          <button
            onClick={() => onSelectGame('block-puzzle')}
            className="px-8 py-2 bg-white text-black font-semibold rounded-full hover:bg-gray-200 transition-colors text-sm"
          >
            Play
          </button>
        </div>
      </div>

      {/* Daily Puzzles Section */}
      <section className="px-4 mt-6 flex-shrink-0">
        <h2 className="text-white/80 text-lg font-semibold mb-3">Daily Puzzles</h2>
        <div className="grid grid-cols-4 gap-3">
          {GAMES.map((game) => (
            <button
              key={game.id}
              onClick={() => handleGameClick(game)}
              className={`
                flex flex-col items-center justify-center p-3 rounded-xl
                bg-gray-800/80 border border-white/5
                transition-all duration-200
                ${game.active
                  ? 'hover:bg-gray-700 hover:scale-105 hover:border-white/20'
                  : 'opacity-40 grayscale'
                }
              `}
            >
              <div
                className={`
                  w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-2
                  ${game.active ? `bg-gradient-to-br ${game.color}` : 'bg-gray-700'}
                `}
              >
                {game.icon}
              </div>
              <span className="text-white/80 text-xs font-medium">{game.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Collections Section */}
      <section className="mt-6 pb-8 flex-shrink-0">
        <h2 className="text-white/80 text-lg font-semibold mb-3 px-4">Collections</h2>
        <div className="flex overflow-x-auto gap-3 px-4 pb-2 scrollbar-hide">
          {COLLECTIONS.map((collection) => (
            <button
              key={collection.id}
              onClick={() => handleCollectionClick(collection)}
              className="flex-shrink-0 w-32 rounded-xl overflow-hidden relative group"
            >
              <img
                src={`https://picsum.photos/id/${collection.imageId}/200/300`}
                alt={collection.name}
                className="w-full aspect-[2/3] object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className={`absolute top-2 left-2 ${collection.badgeColor} px-2 py-0.5 rounded text-[10px] text-white font-medium`}>
                {collection.badge}
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-2">
                <p className="text-white text-sm font-semibold">{collection.name}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Footer */}
      <div className="mt-auto py-4 text-center flex-shrink-0">
        <p className="text-white/20 text-xs tracking-[0.2em] uppercase">
          Prototype v1.0
        </p>
      </div>

      {/* Coming Soon Modal */}
      <ComingSoonModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        gameName={selectedGame?.name || ''}
        icon={selectedGame?.icon}
      />
    </div>
  );
};

import React, { useState, useCallback, useMemo } from 'react';
import GameBoard from './GameBoard';
import GameControls from './GameControls';
import GameTester from './components/GameTester'; // Import the new tester component

function App() {
  const [gridSize, setGridSize] = useState(4);
  const [playerCount, setPlayerCount] = useState(2);
  const [gameKey, setGameKey] = useState(0);

  const handleNewGame = useCallback(() => {
    // Basic validation
    if (playerCount < 1 || playerCount > 4) {
      alert("Player count must be between 1 and 4.");
      return;
    }
    setGameKey(prevKey => prevKey + 1);
  }, [playerCount]);

  // Automatically calculate card size based on grid size.
  const cardSize = useMemo(() => {
    // Formula: 4 -> 90, 5 -> 80, 6 -> 70, etc.
    return 130 - (gridSize * 10);
  }, [gridSize]);

  return (
    <main className="min-h-screen flex flex-col items-center p-4 bg-background text-foreground">
      <header className="text-center mb-4">
        <h1 className="text-4xl font-bold tracking-tight text-cyan-400">Royal Grid Domination</h1>
        <p className="text-slate-400">
          {playerCount > 1
            ? 'Outmaneuver your opponents. The last player to make a move wins.'
            : 'A solo challenge. Survive as long as you can by making valid moves.'}
        </p>
      </header>
      <div className="flex flex-col md:flex-row gap-8 w-full max-w-7xl">
        <aside className="w-full md:w-64 flex-shrink-0 space-y-4">
          <GameControls
            gridSize={gridSize}
            setGridSize={setGridSize}
            playerCount={playerCount}
            setPlayerCount={setPlayerCount}
            onNewGame={handleNewGame}
          />
          <GameTester />
        </aside>
        <section className="flex-grow flex items-center justify-center">
          <GameBoard
            key={gameKey}
            gridSize={gridSize}
            playerCount={playerCount}
            cardSize={cardSize}
          />
        </section>
      </div>
    </main>
  );
}

export default App;

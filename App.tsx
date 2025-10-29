import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameBoard from './GameBoard';
import GameControls from './GameControls';
import { Player } from './lib/types';
import { Card, CardContent } from './components/ui/Card';
import { Button } from './components/ui/Button';

function App() {
  const [gridSize, setGridSize] = useState(4);
  const [playerCount, setPlayerCount] = useState(2);
  const [gameKey, setGameKey] = useState(0);
  const [gameOverData, setGameOverData] = useState<{ winner: Player | null; turn: number } | null>(null);


  const handleNewGame = useCallback(() => {
    // Basic validation
    if (playerCount < 1 || playerCount > 4) {
      // In a real app, you'd show a toast or message here.
      alert("Player count must be between 1 and 4.");
      return;
    }
    setGameOverData(null);
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
        <p className="text-slate-400">Outmaneuver your opponents. The last player to make a move wins.</p>
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
          {gameOverData && (
              <AnimatePresence>
                  <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                  >
                    <Card className="text-center p-4 bg-slate-800/80 rounded-lg">
                      <CardContent className="p-0 space-y-2">
                        <h2 className="text-3xl font-bold text-white">Game Over</h2>
                        {playerCount === 1 ? (
                          <p className="text-xl text-gray-400">Total Turns: {gameOverData.turn - 1}</p>
                        ) : gameOverData.winner ? (
                          <p className="text-xl text-cyan-400">
                            Player {gameOverData.winner.id + 1} ({gameOverData.winner.type}) Wins!
                          </p>
                        ) : (
                          <p className="text-xl text-gray-400">It's a draw!</p>
                        )}
                        <Button onClick={handleNewGame}>Play Again</Button>
                      </CardContent>
                    </Card>
                  </motion.div>
              </AnimatePresence>
          )}
        </aside>
        <section className="flex-grow flex items-center justify-center">
          <GameBoard
            key={gameKey}
            gridSize={gridSize}
            playerCount={playerCount}
            cardSize={cardSize}
            onGameOver={setGameOverData}
          />
        </section>
      </div>
    </main>
  );
}

export default App;
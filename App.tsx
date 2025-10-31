import React, { useState, useCallback, useMemo } from 'react';
import GameBoard from './GameBoard';
import GameControls from './GameControls';
import GameTester from './components/GameTester';
import { LoginScreen } from './components/LoginScreen';
import { useAuth } from './lib/auth-context';
import { Lobby } from './components/Lobby';
import { useGameSessionContext as useGameSession } from './lib/game-session-context';
import { MultiplayerGameBoard } from './components/MultiplayerGameBoard';
import { Button } from './components/ui/Button';

function App() {
  console.log('[App] Component rendering...');
  
  const { user, loading } = useAuth();
  const { game, leaveCurrentGame, reset } = useGameSession();
  
  console.log('[App] Auth state:', { user: user?.id, loading });
  console.log('[App] Game state:', { game: game?.id, status: game?.status });
  
  const [gridSize, setGridSize] = useState(4);
  const [playerCount, setPlayerCount] = useState(2);
  const [gameKey, setGameKey] = useState(0);

  const handleBackToLobby = useCallback(async () => {
    console.log('[App] handleBackToLobby called');
    await reset();
  }, [reset]);

  const handleNewGame = useCallback(() => {
    // Basic validation
    if (playerCount < 1 || playerCount > 4) {
      alert("Player count must be between 1 and 4.");
      return;
    }
    setGameKey(prevKey => prevKey + 1);
  }, [playerCount]);

  // Use DB game config when available
  const effectiveGridSize = game?.grid_size ?? gridSize;
  const effectivePlayerCount = game?.num_players ?? playerCount;

  // Automatically calculate card size based on grid size.
  const cardSize = useMemo(() => {
    // Formula: 4 -> 90, 5 -> 80, 6 -> 70, etc.
    return 130 - (effectiveGridSize * 10);
  }, [effectiveGridSize]);

  // Show loading state
  if (loading) {
    console.log('[App] Showing loading screen');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!user) {
    console.log('[App] No user, showing LoginScreen');
    return <LoginScreen />;
  }

  // If authenticated but not in a game yet, show Lobby
  if (!game) {
    console.log('[App] User authenticated, no game, showing Lobby');
    return (
      <main className="min-h-screen flex flex-col items-center p-4 bg-background text-foreground">
        <header className="text-center mb-6">
          <h1 className="text-4xl font-bold tracking-tight text-cyan-400">Royal Grid Domination</h1>
          <p className="text-slate-400">Create or join a game to begin.</p>
        </header>
        <Lobby />
      </main>
    );
  }

  // Debug: Check if game object is valid
  if (!game.id) {
    console.error('[App] ERROR: Invalid game object:', game);
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-foreground">
        <div className="text-center space-y-4">
          <h2 className="text-2xl text-red-400">Error: Invalid Game State</h2>
          <p className="text-slate-400">The game session is corrupted.</p>
          <Button onClick={handleBackToLobby}>Back to Lobby</Button>
        </div>
      </main>
    );
  }

  console.log('[App] Valid game exists, showing MultiplayerGameBoard');
  console.log('[App] Game details:', {
    id: game.id,
    status: game.status,
    players: game.players,
    created_by: game.created_by,
  });

  // Show multiplayer game board
  return (
    <main className="min-h-screen flex flex-col items-center p-4 bg-background text-foreground">
      <header className="text-center mb-4">
        <h1 className="text-4xl font-bold tracking-tight text-cyan-400">Royal Grid Domination</h1>
        <p className="text-slate-400">Multiplayer Game</p>
      </header>
      <MultiplayerGameBoard
        game={game}
        userId={user.id}
        gridSize={effectiveGridSize}
        playerCount={effectivePlayerCount}
        cardSize={cardSize}
        onLeaveGame={leaveCurrentGame}
      />
    </main>
  );
}

export default App;

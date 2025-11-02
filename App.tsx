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

type Page = 'landing' | 'settings' | 'lobby';
type GameMode = 'single' | 'online' | null;

function App() {
  console.log('[App] Component rendering...');
  
  const { user, loading } = useAuth();
  const { game, leaveCurrentGame, reset, createNewGame, joinByShareCode } = useGameSession();
  
  console.log('[App] Auth state:', { user: user?.id, loading });
  console.log('[App] Game state:', { game: game?.id, status: game?.status });
  
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [gameMode, setGameMode] = useState<GameMode>(null);
  const [gridSize, setGridSize] = useState(5);
  const [playerCount, setPlayerCount] = useState(2);
  const [gameKey, setGameKey] = useState(0);

  const handleBackToLobby = useCallback(async () => {
    console.log('[App] handleBackToLobby called');
    await reset();
    setCurrentPage('landing');
    setGameMode(null);
  }, [reset]);

  const handleLeaveGame = useCallback(async () => {
    console.log('[App] handleLeaveGame called');
    await leaveCurrentGame();
    setCurrentPage('landing');
    setGameMode(null);
  }, [leaveCurrentGame]);

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

  // If authenticated but not in a game yet, show the three-page flow
  if (!game) {
    console.log('[App] User authenticated, no game, showing page:', currentPage);
    
    // Landing Page
    if (currentPage === 'landing') {
      return (
        <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-foreground">
          <header className="text-center mb-12">
            <h1 className="text-5xl font-bold tracking-tight text-cyan-400 mb-3">Royal Grid Domination</h1>
            <p className="text-slate-400 text-lg">Choose your battle mode</p>
          </header>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full px-4">
            {/* Single Player Button */}
            <button
              onClick={() => {
                setGameMode('single');
                setCurrentPage('settings');
              }}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 to-purple-800 p-8 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50"
            >
              <div className="relative z-10 flex flex-col items-center space-y-4">
                <div className="text-6xl">🎮</div>
                <h2 className="text-3xl font-bold text-white">Single Player</h2>
                <p className="text-purple-200 text-center">Challenge AI opponents</p>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-purple-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            </button>

            {/* Play Online Button */}
            <button
              onClick={() => {
                setGameMode('online');
                setCurrentPage('settings');
              }}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-800 p-8 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/50"
            >
              <div className="relative z-10 flex flex-col items-center space-y-4">
                <div className="text-6xl">🌐</div>
                <h2 className="text-3xl font-bold text-white">Play Online</h2>
                <p className="text-cyan-200 text-center">Compete with real players</p>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-blue-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            </button>

            {/* Join Match Button */}
            <button
              onClick={async () => {
                try {
                  const code = window.prompt('Enter match code');
                  if (!code) return;
                  await joinByShareCode(code.trim());
                } catch (e) {
                  console.error('[App] joinByShareCode failed', e);
                }
              }}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-green-800 p-8 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/50"
            >
              <div className="relative z-10 flex flex-col items-center space-y-4">
                <div className="text-6xl">🔗</div>
                <h2 className="text-3xl font-bold text-white">Join Match</h2>
                <p className="text-emerald-200 text-center">Enter a share code to join</p>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-green-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            </button>
          </div>
        </main>
      );
    }
    
    // Settings Page
    if (currentPage === 'settings') {
      const mazeSizes = [4, 5, 7, 8, 10];
      const opponentCounts = [1, 2, 3, 4];
      
      return (
        <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-foreground">
          <div className="w-full max-w-2xl mx-auto space-y-8">
            <header className="text-center">
              <h1 className="text-4xl font-bold tracking-tight text-cyan-400 mb-2">Game Settings</h1>
              <p className="text-slate-400">
                {gameMode === 'single' ? 'Configure your single player game' : 'Configure your online match'}
              </p>
            </header>

            <div className="rounded-xl border border-white/10 bg-white/5 p-8 space-y-8">
              {/* Maze Size */}
              <div>
                <label className="block text-xl font-semibold mb-4 text-slate-200">Maze Size</label>
                <div className="flex flex-wrap gap-3">
                  {mazeSizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setGridSize(size)}
                      className={`px-6 py-3 rounded-lg font-semibold text-lg transition-all duration-200 ${
                        gridSize === size
                          ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/50 scale-105'
                          : 'bg-white/10 text-slate-300 hover:bg-white/20'
                      }`}
                    >
                      {size}x{size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Player Count */}
              <div>
                <label className="block text-xl font-semibold mb-4 text-slate-200">Player Count</label>
                <div className="flex flex-wrap gap-3">
                  {opponentCounts.map(count => {
                    const isDisabled = gameMode === 'online' && count === 1;
                    return (
                      <button
                        key={count}
                        onClick={() => !isDisabled && setPlayerCount(count)}
                        disabled={isDisabled}
                        className={`px-6 py-3 rounded-lg font-semibold text-lg transition-all duration-200 ${
                          isDisabled
                            ? 'bg-white/5 text-slate-600 cursor-not-allowed opacity-50'
                            : playerCount === count
                            ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/50 scale-105'
                            : 'bg-white/10 text-slate-300 hover:bg-white/20'
                        }`}
                      >
                        {count} {count === 1 ? 'Opponent' : 'Opponents'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <Button
                  onClick={() => setCurrentPage('landing')}
                  variant="outline"
                  className="flex-1 h-12 text-lg"
                >
                  Back
                </Button>
                <Button
                  onClick={async () => {
                    const adjustedPlayers = gameMode === 'online' && playerCount === 1 ? 2 : playerCount;
                    console.log('[App] Creating game with settings:', { gridSize, playerCount: adjustedPlayers, gameMode });
                    await createNewGame({ numPlayers: adjustedPlayers, gridSize });
                  }}
                  className="flex-1 h-12 text-lg bg-cyan-500 hover:bg-cyan-600"
                >
                  Continue
                </Button>
              </div>
            </div>
          </div>
        </main>
      );
    }
    
    // Lobby Page
    if (currentPage === 'lobby') {
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
        <div className="flex items-center justify-center gap-3 mt-1">
          <p className="text-slate-400">Multiplayer Game</p>
          {Array.isArray(game.players) && (game.players as any[]).length === 1 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              Solo Mode
            </span>
          )}
        </div>
      </header>
      <MultiplayerGameBoard
        game={game}
        userId={user.id}
        gridSize={effectiveGridSize}
        playerCount={effectivePlayerCount}
        cardSize={cardSize}
        onLeaveGame={handleLeaveGame}
      />
    </main>
  );
}

export default App;

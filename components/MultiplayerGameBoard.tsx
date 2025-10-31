import React, { useEffect, useMemo, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import PlayingCard from './PlayingCard';
import GameInfo from '../GameInfo';
import MoveHistory from '../MoveHistory';
import CardCounter from '../CardCounter';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { useMultiplayerGameState } from '../hooks/useMultiplayerGameState';
import { useGameEffects } from '../hooks/useGameEffects';
import type { Game } from '../lib/database.types';

interface MultiplayerGameBoardProps {
  game: Game;
  userId: string;
  gridSize: number;
  playerCount: number;
  cardSize: number;
  onLeaveGame: () => void;
}

export const MultiplayerGameBoard: React.FC<MultiplayerGameBoardProps> = ({
  game,
  userId,
  gridSize,
  playerCount,
  cardSize,
  onLeaveGame,
}) => {
  console.log('[MultiplayerGameBoard] Component rendering', { 
    gameId: game.id, 
    userId, 
    gridSize, 
    playerCount 
  });
  
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  
  const gameState = useMultiplayerGameState({ game, userId });
  const {
    grid,
    players,
    currentPlayer,
    gameStatus,
    winner,
    turn,
    moveHistory,
    initializeGame,
    performMove,
    initialCardCounts,
    isInitialized,
    canMove,
  } = gameState;

  const { possibleMoves, isAiThinking } = useGameEffects(gameState, playerCount);

  // Compute share URL at top-level to avoid conditional hooks
  const shareUrl = useMemo(() => {
    if (!game?.share_code) return '';
    return `${window.location.origin}/?share=${game.share_code}`;
  }, [game?.share_code]);

  // Determine host and autostart for single-player games
  const isHost = game.created_by === userId;
  const autoStartRef = useRef(false);
  useEffect(() => {
    if (!isInitialized && (game.num_players || 2) === 1 && isHost && !autoStartRef.current) {
      autoStartRef.current = true;
      initializeGame();
    }
  }, [isInitialized, game.num_players, isHost, initializeGame]);

  console.log('[MultiplayerGameBoard] Game state:', {
    isInitialized,
    hasGrid: !!grid,
    gameStatus: game.status,
    playersInDB: game.players,
  });

  // Show waiting screen if game not initialized
  if (!isInitialized || !grid) {
    const gamePlayers = game.players as any[];
    const playersCount = Array.isArray(gamePlayers) ? gamePlayers.length : 0;
    const totalSlots = game.num_players || 2;
    const botsCount = Math.max(0, totalSlots - playersCount);
    const isSinglePlayer = totalSlots === 1;
    const minPlayers = isSinglePlayer ? 1 : 2;
    const canStart = isHost; // host can start anytime

    console.log('[MultiplayerGameBoard] Showing waiting room', {
      playersCount,
      totalSlots,
      botsCount,
      canStart,
      isHost,
    });

    const handleCopy = async () => {
      if (!shareUrl) return;
      await navigator.clipboard.writeText(shareUrl);
      console.log('[MultiplayerGameBoard] Share link copied');
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
    };

    const handleStartGame = async () => {
      console.log('[MultiplayerGameBoard] handleStartGame called');
      await initializeGame();
    };

    return (
      <div className="flex flex-col items-center justify-center h-full w-full gap-6 p-8">
        <div className="bg-slate-800/50 p-8 rounded-xl max-w-md w-full text-center space-y-4">
          <h2 className="text-2xl font-bold text-white">Waiting Room</h2>
          <div className="text-4xl font-bold text-cyan-400">
            {playersCount} / {totalSlots}
          </div>
          {/* Share code and link */}
          <div className="mt-2 space-y-2">
            <div className="text-sm opacity-80">Share Code</div>
            <div className="font-mono text-lg">{game.share_code || '—'}</div>
            <div className="mt-2 flex gap-2 items-center">
              <Input readOnly value={shareUrl} className="text-sm" />
              <Button onClick={handleCopy} className="whitespace-nowrap">
                {showCopySuccess ? '✓ Copied!' : 'Copy Link'}
              </Button>
            </div>
          </div>
          
          {/* Player List */}
          <div className="space-y-2 py-4">
            {gamePlayers.map((player: any, idx: number) => (
              <div key={idx} className="flex items-center gap-3 bg-slate-700/50 p-3 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center font-bold">
                  {idx + 1}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold">{player.name || `Player ${idx + 1}`}</div>
                  {player.uid === userId && (
                    <div className="text-xs text-cyan-400">You</div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Empty slots */}
            {Array.from({ length: Math.max(0, totalSlots - playersCount) }).map((_, idx) => (
              <div key={`empty-${idx}`} className="flex items-center gap-3 bg-slate-700/30 p-3 rounded-lg border-2 border-dashed border-slate-600">
                <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center">
                  {playersCount + idx + 1}
                </div>
                <div className="flex-1 text-left text-slate-500">
                  Waiting for player...
                </div>
              </div>
            ))}
          </div>

          {isHost ? (
            <p className="text-slate-300 text-sm">
              {botsCount > 0
                ? `Start game with ${botsCount} bot${botsCount > 1 ? 's' : ''}`
                : 'Ready to start!'}
            </p>
          ) : (
            <p className="text-slate-300 text-sm">Waiting for host to start</p>
          )}

          <div className="pt-4 space-y-3">
            {isHost ? (
              <Button 
                onClick={handleStartGame}
                className="w-full"
              >
                {botsCount > 0 ? `Start game with ${botsCount} bot${botsCount > 1 ? 's' : ''}` : 'Start Game'}
              </Button>
            ) : (
              <div className="text-sm text-slate-400">
                Waiting for host to start the game...
              </div>
            )}
            
            <Button variant="secondary" onClick={() => setShowLeaveConfirm(true)} className="w-full">
              Leave Game
            </Button>
          </div>
        </div>
        
        <ConfirmDialog
          open={showLeaveConfirm}
          onOpenChange={setShowLeaveConfirm}
          title="Leave Game?"
          description="Are you sure you want to leave? The game will continue without you."
          confirmText="Leave"
          cancelText="Stay"
          onConfirm={onLeaveGame}
          variant="destructive"
        />
      </div>
    );
  }

  // Get current player info from game.players
  const gamePlayers = game.players as any[];
  const currentGamePlayer = Array.isArray(gamePlayers) && currentPlayer
    ? gamePlayers[currentPlayer.id]
    : null;
  const isYourTurn = currentGamePlayer?.uid === userId;

  return (
    <div className="flex flex-col xl:flex-row gap-8 w-full h-full items-start justify-center p-4">
      {/* Turn Indicator */}
      <div className="w-full xl:hidden mb-4">
        <div
          className={`p-4 rounded-lg text-center font-semibold ${
            isYourTurn
              ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-300'
              : 'bg-slate-700/50 border-2 border-slate-600 text-slate-400'
          }`}
        >
          {isYourTurn ? '🎯 Your Turn!' : `⏳ ${currentGamePlayer?.name || 'Opponent'}'s Turn`}
        </div>
      </div>

      {/* Game Grid */}
      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, ${cardSize}px)`,
          gridTemplateRows: `repeat(${gridSize}, ${cardSize * 1.4}px)`,
        }}
      >
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const kingHere = players.find(p => p.position.row === r && p.position.col === c);
            const isPossible = possibleMoves.some(move => move.row === r && move.col === c);

            return (
              <PlayingCard
                key={`${r}-${c}`}
                cell={cell}
                isKingHere={kingHere}
                isPossibleMove={isPossible && canMove}
                onClick={() => {
                  if (isPossible && canMove && !isAiThinking) {
                    performMove({ row: r, col: c });
                  }
                }}
                cardSize={cardSize}
              />
            );
          })
        )}
      </div>

      {/* Sidebar */}
      <div className="flex flex-col gap-4 w-full xl:w-80">
        {/* Turn Indicator (Desktop) */}
        <div className="hidden xl:block">
          <div
            className={`p-4 rounded-lg text-center font-semibold ${
              isYourTurn
                ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-300'
                : 'bg-slate-700/50 border-2 border-slate-600 text-slate-400'
            }`}
          >
            {isYourTurn ? '🎯 Your Turn!' : `⏳ ${currentGamePlayer?.name || 'Opponent'}'s Turn`}
          </div>
        </div>

        <GameInfo
          players={players}
          currentPlayerId={currentPlayer?.id ?? 0}
          gameStatus={gameStatus}
          turn={turn}
          winner={winner}
          isAiThinking={isAiThinking}
          playerCount={playerCount}
        />

        {initialCardCounts && <CardCounter grid={grid} initialCounts={initialCardCounts} />}

        <MoveHistory history={moveHistory} />

        {gameStatus === 'gameOver' && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-xl text-center"
          >
            <h2 className="text-2xl font-bold text-white mb-2">Game Over!</h2>
            {winner ? (
              <p className="text-white">Player {winner.id + 1} wins!</p>
            ) : (
              <p className="text-white">It's a draw!</p>
            )}
            <Button className="mt-4" onClick={onLeaveGame}>
              Back to Lobby
            </Button>
          </motion.div>
        )}

        <Button variant="secondary" onClick={() => setShowLeaveConfirm(true)} className="mt-4">
          Leave Game
        </Button>
      </div>
      
      <ConfirmDialog
        open={showLeaveConfirm}
        onOpenChange={setShowLeaveConfirm}
        title="Leave Game?"
        description={gameStatus === 'playing' 
          ? "Are you sure you want to leave? You'll forfeit the game and it will continue without you."
          : "Are you sure you want to leave this game?"}
        confirmText="Leave"
        cancelText="Stay"
        onConfirm={onLeaveGame}
        variant="destructive"
      />
    </div>
  );
};

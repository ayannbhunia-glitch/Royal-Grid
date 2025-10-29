import { useState, useCallback, useMemo } from 'react';
import { Grid, Player, GameStatus, MoveRecord, Position } from '../lib/types';
import { generateInitialGameState } from '../lib/game';
import { useToast } from './use-toast';

export const useGameState = (gridSize: number, playerCount: number) => {
  const [grid, setGrid] = useState<Grid | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerId, setCurrentPlayerId] = useState(0);
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [winner, setWinner] = useState<Player | null>(null);
  const [turn, setTurn] = useState(1);
  const [moveHistory, setMoveHistory] = useState<MoveRecord[]>([]);
  const { toast } = useToast();

  const currentPlayer = useMemo(() => players.find(p => p.id === currentPlayerId), [players, currentPlayerId]);
  const activePlayers = useMemo(() => players.filter(p => !p.isFinished), [players]);

  const initializeGame = useCallback(() => {
    try {
      const { grid: newGrid, players: newPlayers } = generateInitialGameState(gridSize, playerCount);
      setGrid(newGrid);
      setPlayers(newPlayers);
      setCurrentPlayerId(0);
      setGameStatus('playing');
      setWinner(null);
      setTurn(1);
      setMoveHistory([]);
    } catch (error) {
      if (error instanceof Error) {
        toast({ title: "Game Setup Error", description: error.message, variant: 'destructive' });
      }
      setGrid(null);
    }
  }, [gridSize, playerCount, toast]);

  const performMove = useCallback((to: Position) => {
    if (gameStatus !== 'playing' || !grid || !currentPlayer) return;

    const from = currentPlayer.position;
    const card = grid[from.row][from.col].card;
    
    const newGrid = grid.map(r => r.map(c => ({ ...c, justMovedTo: false })));
    newGrid[from.row][from.col].occupiedBy = undefined;
    newGrid[from.row][from.col].isInvalid = true;
    newGrid[to.row][to.col].occupiedBy = currentPlayer.id;
    newGrid[to.row][to.col].justMovedTo = true;
    
    const newPlayers = players.map(p => p.id === currentPlayer.id ? { ...p, position: to } : p);

    setGrid(newGrid);
    setPlayers(newPlayers);
    setMoveHistory(prev => [...prev, { turn, player: currentPlayer, card, from, to }]);
    setTurn(t => t + 1);
  }, [gameStatus, grid, currentPlayer, players, turn]);

  const advancePlayer = useCallback(() => {
    // Use a functional update for `setPlayers` to get the most recent `players` state.
    // This prevents race conditions where this function might otherwise close over stale state.
    setPlayers(currentPlayers => {
        setCurrentPlayerId(prevId => {
            if (currentPlayers.length === 0) return prevId;

            // Start looking for the next active player from the next ID.
            let nextId = (prevId + 1) % currentPlayers.length;
            
            // Add a guard to prevent an infinite loop if all players are finished.
            let guard = 0;
            while (currentPlayers[nextId]?.isFinished && guard < currentPlayers.length * 2) {
                nextId = (nextId + 1) % currentPlayers.length;
                guard++;
            }

            return nextId;
        });
        // We are only reading the state, so return it unchanged.
        return currentPlayers;
    });
  }, []);

  const markPlayerFinished = useCallback((playerId: number) => {
    toast({ title: `Player ${playerId + 1} has no more moves!` });
    setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, isFinished: true } : p));
  }, [toast]);
  
  const endGame = useCallback((winnerPlayer: Player | null) => {
    setGameStatus('gameOver');
    setWinner(winnerPlayer);
  }, []);

  return {
    grid,
    players,
    currentPlayer,
    gameStatus,
    winner,
    turn,
    moveHistory,
    activePlayers,
    initializeGame,
    performMove,
    advancePlayer,
    markPlayerFinished,
    endGame,
  };
};
import { useState, useCallback, useMemo } from 'react';
import { Grid, Player, GameStatus, MoveRecord, Position, Rank } from '../lib/types';
import { generateInitialGameState, RANKS } from '../lib/game';
import { useToast } from './use-toast';

export const useGameState = (gridSize: number, playerCount: number) => {
  const [grid, setGrid] = useState<Grid | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerId, setCurrentPlayerId] = useState(0);
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [winner, setWinner] = useState<Player | null>(null);
  const [turn, setTurn] = useState(1);
  const [moveHistory, setMoveHistory] = useState<MoveRecord[]>([]);
  const [initialCardCounts, setInitialCardCounts] = useState<Record<Rank, number> | null>(null);
  const { toast } = useToast();

  const currentPlayer = useMemo(() => players.find(p => p.id === currentPlayerId), [players, currentPlayerId]);
  const activePlayers = useMemo(() => players.filter(p => !p.isFinished), [players]);

  const initializeGame = useCallback(() => {
    try {
      const { grid: newGrid, players: newPlayers } = generateInitialGameState(gridSize, playerCount);

      const counts = {} as Record<Rank, number>;
      RANKS.forEach(r => counts[r] = 0);
      newGrid.forEach(row => {
        row.forEach(cell => {
          counts[cell.card.rank]++;
        });
      });
      setInitialCardCounts(counts);

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
  
  const advancePlayer = useCallback(() => {
    setPlayers(currentPlayers => {
        setCurrentPlayerId(prevId => {
            if (currentPlayers.length === 0) return prevId;
            const activePlayerIds = currentPlayers.filter(p => !p.isFinished).map(p => p.id);
            if (activePlayerIds.length === 0) return prevId;

            const currentIndexInActive = activePlayerIds.indexOf(prevId);
            const nextIndexInActive = (currentIndexInActive + 1) % activePlayerIds.length;
            
            return activePlayerIds[nextIndexInActive];
        });
        return currentPlayers;
    });
  }, []);

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
    
    // Immediately advance to the next player, making the move and turn change an atomic operation.
    advancePlayer();

  }, [gameStatus, grid, currentPlayer, players, turn, advancePlayer]);

  const markPlayerFinished = useCallback((playerId: number) => {
    toast({ title: `Player ${playerId + 1} has no more moves!` });
    setPlayers(prev => {
      const newPlayers = prev.map(p => p.id === playerId ? { ...p, isFinished: true } : p);
      // If the currently active player just got finished, immediately advance.
      if (currentPlayer?.id === playerId) {
        advancePlayer();
      }
      return newPlayers;
    });
  }, [toast, currentPlayer, advancePlayer]);
  
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
    initialCardCounts,
    initializeGame,
    performMove,
    advancePlayer,
    markPlayerFinished,
    endGame,
  };
};
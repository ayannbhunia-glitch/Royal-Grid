import { useState, useCallback, useMemo, useEffect } from 'react';
import { Grid, Player, GameStatus, MoveRecord, Position, Rank } from '../lib/types';
import { generateInitialGameState, RANKS } from '../lib/game';
import { useToast } from './use-toast';
import { submitMove, initializeGameState } from '../lib/move-service';
import type { Game } from '../lib/database.types';

interface MultiplayerGameStateProps {
  game: Game | null;
  userId: string | null;
}

export const useMultiplayerGameState = ({ game, userId }: MultiplayerGameStateProps) => {
  const [grid, setGrid] = useState<Grid | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerId, setCurrentPlayerId] = useState(0);
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [winner, setWinner] = useState<Player | null>(null);
  const [turn, setTurn] = useState(1);
  const [moveHistory, setMoveHistory] = useState<MoveRecord[]>([]);
  const [initialCardCounts, setInitialCardCounts] = useState<Record<Rank, number> | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  const currentPlayer = useMemo(() => players.find(p => p.id === currentPlayerId), [players, currentPlayerId]);
  const activePlayers = useMemo(() => players.filter(p => !p.isFinished), [players]);

  // Sync state from DB game object
  useEffect(() => {
    if (!game) {
      setIsInitialized(false);
      return;
    }

    const dbState = game.state as any;
    
    // If game is active and has state, load it
    if (game.status === 'active' && dbState?.board && Array.isArray(dbState.board) && dbState.board.length > 0) {
      setGrid(dbState.board);
      setPlayers(dbState.players || []);
      setCurrentPlayerId(dbState.currentPlayer ?? 0);
      setTurn(dbState.turn ?? 1);
      setMoveHistory(dbState.history || []);
      setGameStatus('playing');
      setIsInitialized(true);
    } else if (game.status === 'ended') {
      setGameStatus('gameOver');
      setIsInitialized(true);
    } else {
      // Game is waiting or has no state yet
      setIsInitialized(false);
    }
  }, [game]);

  const initializeGame = useCallback(async () => {
    if (!game) return;
    
    try {
      const gridSize = game.grid_size || 8;
      const totalPlayers = game.num_players || 2;
      const gamePlayers = game.players as any[];
      const humanPlayersCount = Array.isArray(gamePlayers) ? gamePlayers.length : 0;
      
      // Generate game state with total players (including bots)
      const { grid: newGrid, players: newPlayers } = generateInitialGameState(gridSize, totalPlayers);

      // Mark bot players (players beyond human count)
      const playersWithTypes = newPlayers.map((player, idx) => ({
        ...player,
        type: (idx < humanPlayersCount ? 'human' : 'cpu') as 'human' | 'cpu',
      }));

      const counts = {} as Record<Rank, number>;
      RANKS.forEach(r => counts[r] = 0);
      newGrid.forEach(row => {
        row.forEach(cell => {
          counts[cell.card.rank]++;
        });
      });
      setInitialCardCounts(counts);

      const initialState = {
        board: newGrid,
        players: playersWithTypes,
        turn: 1,
        currentPlayer: 0,
        history: [],
        lastMoveAt: new Date().toISOString(),
      };

      // Save to DB
      await initializeGameState(game.id, initialState);

      setGrid(newGrid);
      setPlayers(playersWithTypes);
      setCurrentPlayerId(0);
      setGameStatus('playing');
      setWinner(null);
      setTurn(1);
      setMoveHistory([]);
      setIsInitialized(true);

      const botCount = totalPlayers - humanPlayersCount;
      toast({ 
        title: "Game Started!", 
        description: botCount > 0 
          ? `Playing with ${humanPlayersCount} human${humanPlayersCount > 1 ? 's' : ''} and ${botCount} bot${botCount > 1 ? 's' : ''}`
          : "Good luck!" 
      });
    } catch (error) {
      if (error instanceof Error) {
        toast({ title: "Game Setup Error", description: error.message, variant: 'destructive' });
      }
      setGrid(null);
    }
  }, [game, toast]);

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

  const performMove = useCallback(async (to: Position) => {
    if (gameStatus !== 'playing' || !grid || !currentPlayer || !game) return;

    const from = currentPlayer.position;
    const card = grid[from.row][from.col].card;

    const newGrid = grid.map(r => r.map(c => ({ ...c, justMovedTo: false })));
    newGrid[from.row][from.col].occupiedBy = undefined;
    newGrid[from.row][from.col].isInvalid = true;
    newGrid[to.row][to.col].occupiedBy = currentPlayer.id;
    newGrid[to.row][to.col].justMovedTo = true;

    const newPlayers = players.map(p => p.id === currentPlayer.id ? { ...p, position: to } : p);

    // Calculate next player
    const activePlayerIds = newPlayers.filter(p => !p.isFinished).map(p => p.id);
    const currentIndexInActive = activePlayerIds.indexOf(currentPlayer.id);
    const nextIndexInActive = (currentIndexInActive + 1) % activePlayerIds.length;
    const nextPlayerId = activePlayerIds[nextIndexInActive];

    const newMoveHistory = [...moveHistory, { turn, player: currentPlayer, card, from, to }];
    const newTurn = turn + 1;

    const newState = {
      board: newGrid,
      players: newPlayers,
      turn: newTurn,
      currentPlayer: nextPlayerId,
      history: newMoveHistory,
      lastMoveAt: new Date().toISOString(),
    };

    // Optimistic update
    setGrid(newGrid);
    setPlayers(newPlayers);
    setMoveHistory(newMoveHistory);
    setTurn(newTurn);
    setCurrentPlayerId(nextPlayerId);

    // Submit to server
    try {
      await submitMove(
        { gameId: game.id, position: to, playerId: currentPlayer.id },
        newState
      );
    } catch (error) {
      console.error('Failed to submit move:', error);
      toast({ title: "Move Failed", description: "Could not sync move to server", variant: 'destructive' });
    }
  }, [gameStatus, grid, currentPlayer, players, turn, moveHistory, game, toast]);

  const markPlayerFinished = useCallback((playerId: number) => {
    toast({ title: `Player ${playerId + 1} has no more moves!` });
    setPlayers(prev => {
      const newPlayers = prev.map(p => p.id === playerId ? { ...p, isFinished: true } : p);
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

  // Determine if current user can move
  const canMove = useMemo(() => {
    if (!game || !userId || !currentPlayer) return false;
    
    // Map player order to user
    const gamePlayers = game.players as any[];
    if (!Array.isArray(gamePlayers)) return false;
    
    const currentGamePlayer = gamePlayers[currentPlayer.id];
    return currentGamePlayer?.uid === userId;
  }, [game, userId, currentPlayer]);

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
    isInitialized,
    canMove,
    initializeGame,
    performMove,
    advancePlayer,
    markPlayerFinished,
    endGame,
  };
};

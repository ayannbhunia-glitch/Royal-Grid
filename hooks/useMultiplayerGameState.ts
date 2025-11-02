import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Grid, Player, GameStatus, MoveRecord, Position, Rank } from '../lib/types';
import { generateInitialGameState, RANKS, getPossibleMoves, getExactPath } from '../lib/game';
import { useToast } from './use-toast';
import { submitMove, initializeGameState, endGameInDB } from '../lib/move-service';
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
  const [hoveredMove, setHoveredMove] = useState<Position | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const { toast } = useToast();
  const prevHumanUidsRef = (globalThis as any)._rg_prevHumanUidsRef ??= { current: null as string[] | null };
  const prevPlayersMapRef = (globalThis as any)._rg_prevPlayersMapRef ??= { current: new Map<string, string>() };
  const hasAutoEndedRef = (globalThis as any)._rg_hasAutoEndedRef ??= { current: false };
  const initialHumanCountRef = (globalThis as any)._rg_initialHumanCountRef ??= { current: null as number | null };

  const currentPlayer = useMemo(() => players.find(p => p.id === currentPlayerId), [players, currentPlayerId]);
  const activePlayers = useMemo(() => players.filter(p => !p.isFinished), [players]);
  const animatingRef = useRef(false);

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

  // Reset tracking refs when switching games
  useEffect(() => {
    prevHumanUidsRef.current = null;
    prevPlayersMapRef.current = new Map();
    hasAutoEndedRef.current = false;
    initialHumanCountRef.current = null;
  }, [game?.id]);

  // Detect player leave and auto-end if only one human remains
  useEffect(() => {
    if (!game) return;
    const dbPlayers = (game.players as any[]) || [];
    const humanUids = dbPlayers.map(p => p.uid).filter(Boolean) as string[];

    // Build current players map (uid -> name)
    const currentMap = new Map<string, string>();
    dbPlayers.forEach(p => {
      if (p?.uid) currentMap.set(p.uid, p.name || 'A player');
    });

    // Initialize refs if first run
    if (!prevHumanUidsRef.current) {
      prevHumanUidsRef.current = humanUids;
      if (initialHumanCountRef.current == null) {
        initialHumanCountRef.current = humanUids.length;
      }
      return;
    }

    // Detect departures
    const prev = prevHumanUidsRef.current;
    const left = prev.filter(uid => !humanUids.includes(uid));
    if (left.length > 0) {
      // Find readable name for the first leaver using previous map
      const leftUid = left[0];
      const leaverName = prevPlayersMapRef.current.get(leftUid) || 'A player';
      toast({ title: 'Player Left', description: `${leaverName} left the game.` });
    }

    prevHumanUidsRef.current = humanUids;
    prevPlayersMapRef.current = currentMap;

    // If only one human remains and game is active, end game and declare the remaining as winner
    // BUT only if the game originally started with more than one human player.
    const isActive = game.status === 'active';
    const startedWithMultipleHumans = (initialHumanCountRef.current ?? humanUids.length) > 1;
    if (isActive && startedWithMultipleHumans && humanUids.length === 1 && !hasAutoEndedRef.current) {
      const remainingUid = humanUids[0];
      if (remainingUid && userId === remainingUid) {
        hasAutoEndedRef.current = true;
        (async () => {
          try {
            await endGameInDB(game.id, remainingUid);
            toast({ title: 'You Win!', description: 'All other players left the game.' });
          } catch (e) {
            console.error('[useMultiplayerGameState] Auto-end failed', e);
          }
        })();
      }
    }
  }, [game, userId, toast]);

  const initializeGame = useCallback(async () => {
    if (!game) return;
    
    try {
      const gridSize = game.grid_size || 8;
      const totalPlayers = game.num_players || 2;
      const gamePlayers = game.players as any[];
      const humanPlayersCount = Array.isArray(gamePlayers) ? gamePlayers.length : 0;
      
      // Regenerate until the first player has at least one possible move (avoid instant-dead starts)
      let newGrid: Grid | null = null;
      let playersWithTypes: Player[] = [] as any;
      for (let attempt = 0; attempt < 10; attempt++) {
        const { grid: g, players: p } = generateInitialGameState(gridSize, totalPlayers);
        const typed = p.map((player, idx) => ({
          ...player,
          type: (idx < humanPlayersCount ? 'human' : 'cpu') as 'human' | 'cpu',
        }));
        const first = typed[0];
        const moves = getPossibleMoves(first, g as any);
        if (moves.length > 0) {
          newGrid = g as any;
          playersWithTypes = typed as any;
          break;
        }
      }
      if (!newGrid) {
        // Fallback to a single generation if all attempts failed
        const { grid: g, players: p } = generateInitialGameState(gridSize, totalPlayers);
        newGrid = g as any;
        playersWithTypes = p.map((player, idx) => ({
          ...player,
          type: (idx < humanPlayersCount ? 'human' : 'cpu') as 'human' | 'cpu',
        })) as any;
      }

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
    if (animatingRef.current) return;
    animatingRef.current = true;
    setIsAnimating(true);

    const from = currentPlayer.position;
    const card = grid[from.row][from.col].card;

    // Compute exact path to animate (excluding start)
    const path = getExactPath(grid, from, to, card.value);

    // Clear hover highlights
    setHoveredMove(null);

    // Working copies
    let workingGrid = grid.map(r => r.map(c => ({ ...c, justMovedTo: false, pathHighlight: false })));
    let workingPlayers = [...players];

    // Mark starting cell invalid and clear occupancy
    workingGrid[from.row][from.col].isInvalid = true;
    workingGrid[from.row][from.col].occupiedBy = undefined;

    // Animate through each step
    for (let i = 0; i < path.length; i++) {
      const step = path[i];
      const prevStep = i === 0 ? from : path[i - 1];
      
      // Clear previous position
      if (workingGrid[prevStep.row] && workingGrid[prevStep.row][prevStep.col]) {
        workingGrid[prevStep.row][prevStep.col].occupiedBy = undefined;
      }
      
      // Move to new position
      workingGrid[step.row][step.col].occupiedBy = currentPlayer.id;
      
      // Update player position
      workingPlayers = workingPlayers.map(p => 
        p.id === currentPlayer.id ? { ...p, position: step } : p
      );
      
      // Force new grid reference
      const newGrid = workingGrid.map(r => r.map(c => ({ ...c })));
      setGrid(newGrid);
      setPlayers([...workingPlayers]);
      
      // Wait between steps (250ms)
      await new Promise(res => setTimeout(res, 250));
      workingGrid = newGrid;
    }

    // Finalize destination highlight
    workingGrid[to.row][to.col].justMovedTo = true;

    // Determine next player
    const activePlayerIds = workingPlayers.filter(p => !p.isFinished).map(p => p.id);
    const currentIndexInActive = activePlayerIds.indexOf(currentPlayer.id);
    const nextIndexInActive = (currentIndexInActive + 1) % activePlayerIds.length;
    const nextPlayerId = activePlayerIds[nextIndexInActive];

    const newMoveHistory = [...moveHistory, { turn, player: currentPlayer, card, from, to }];
    const newTurn = turn + 1;

    const newState = {
      board: workingGrid,
      players: workingPlayers,
      turn: newTurn,
      currentPlayer: nextPlayerId,
      history: newMoveHistory,
      lastMoveAt: new Date().toISOString(),
    };

    // Optimistic final state
    const finalGrid = workingGrid.map(r => r.map(c => ({ ...c })));
    setGrid(finalGrid);
    setPlayers([...workingPlayers]);
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
    } finally {
      animatingRef.current = false;
      setIsAnimating(false);
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
    hoveredMove,
    setHoveredMove,
    isAnimating,
    initializeGame,
    performMove,
    advancePlayer,
    markPlayerFinished,
    endGame,
  };
};

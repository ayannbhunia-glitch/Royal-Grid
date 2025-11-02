import { useState, useCallback, useMemo, useRef } from 'react';
import { Grid, Player, GameStatus, MoveRecord, Position, Rank } from '../lib/types';
import { generateInitialGameState, RANKS, getExactPath } from '../lib/game';
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
  const [hoveredMove, setHoveredMove] = useState<Position | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
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

  const animatingRef = useRef(false);

  const performMove = useCallback(async (to: Position) => {
    if (gameStatus !== 'playing' || !grid || !currentPlayer) return;
    if (animatingRef.current) return;
    animatingRef.current = true;
    setIsAnimating(true);

    const from = currentPlayer.position;
    const card = grid[from.row][from.col].card;

    const path = getExactPath(grid, from, to, card.value);

    // Clear any hover highlights
    setHoveredMove(null);

    // Create working copy
    let workingGrid = grid.map(r => r.map(c => ({ ...c, justMovedTo: false, pathHighlight: false })));
    let workingPlayers = [...players];

    // Mark starting cell invalid
    workingGrid[from.row][from.col].isInvalid = true;
    workingGrid[from.row][from.col].occupiedBy = undefined;

    // Animate through each step in the path
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
      
      // Force new grid reference for React to detect change
      const newGrid = workingGrid.map(r => r.map(c => ({ ...c })));
      setGrid(newGrid);
      setPlayers([...workingPlayers]);
      
      // Wait between steps (250ms for smoother animation)
      await new Promise(res => setTimeout(res, 250));
      workingGrid = newGrid;
    }

    // Highlight final destination
    workingGrid[to.row][to.col].justMovedTo = true;
    const finalGrid = workingGrid.map(r => r.map(c => ({ ...c })));
    
    setGrid(finalGrid);
    setPlayers([...workingPlayers]);
    setMoveHistory(prev => [...prev, { turn, player: currentPlayer, card, from, to }]);
    setTurn(t => t + 1);
    advancePlayer();

    animatingRef.current = false;
    setIsAnimating(false);
  }, [gameStatus, grid, currentPlayer, players, turn, advancePlayer]);

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
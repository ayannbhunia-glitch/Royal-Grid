import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Grid, Player, Move, GameStatus, MoveRecord } from './lib/types';
import { generateGrid, getPossibleMoves } from './lib/game';
import PlayingCard from './components/PlayingCard';
import { useToast } from './hooks/use-toast';
import GameInfo from './GameInfo';
import MoveHistory from './MoveHistory';
import CardCounter from './CardCounter';

export const playerColors = ['#F59E0B', '#10B981', '#6366F1', '#EC4899']; // amber, emerald, indigo, pink

interface GameBoardProps {
  gridSize: number;
  playerCount: number;
  cardSize: number;
  onGameOver: (data: { winner: Player | null; turn: number }) => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ gridSize, playerCount, cardSize, onGameOver }) => {
  const [grid, setGrid] = useState<Grid | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerId, setCurrentPlayerId] = useState(0);
  const [possibleMoves, setPossibleMoves] = useState<Move[]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [winner, setWinner] = useState<Player | null>(null);
  const [turn, setTurn] = useState(1);
  const [moveHistory, setMoveHistory] = useState<MoveRecord[]>([]);
  const { toast } = useToast();
  const [isAiThinking, setIsAiThinking] = useState(false);

  const currentPlayer = useMemo(() => players.find(p => p.id === currentPlayerId), [players, currentPlayerId]);

  useEffect(() => {
    try {
      const { grid: newGrid, players: newPlayers } = generateGrid(gridSize, playerCount);
      setGrid(newGrid);
      setPlayers(newPlayers);
      setCurrentPlayerId(0);
      setGameStatus('playing');
      setWinner(null);
      setPossibleMoves([]);
      setTurn(1);
      setMoveHistory([]);
    } catch (error) {
      if (error instanceof Error) {
        toast({ title: "Game Setup Error", description: error.message, variant: 'destructive' });
      }
      setGrid(null);
    }
  }, [gridSize, playerCount, toast]);

  const handleMove = useCallback((row: number, col: number) => {
    if (gameStatus !== 'playing' || !grid || !currentPlayer) return;

    const from = currentPlayer.position;
    const to = { row, col };
    const card = grid[from.row][from.col].card;
    
    const newGrid = grid.map(r => r.map(c => ({...c, justMovedTo: false})));
    const newPlayers = players.map(p => p.id === currentPlayer.id ? { ...p, position: to } : p);
    
    newGrid[from.row][from.col].occupiedBy = undefined;
    newGrid[from.row][from.col].isInvalid = true; // Make the departure card inactive
    newGrid[to.row][to.col].occupiedBy = currentPlayer.id;
    newGrid[to.row][to.col].justMovedTo = true;
    
    setGrid(newGrid);
    setPlayers(newPlayers);
    setMoveHistory(prev => [...prev, { turn, player: currentPlayer, card, from, to }]);
    
    setTurn(prev => prev + 1);
    
    // Find the next active player and set them as current.
    let nextId = (currentPlayer.id + 1) % playerCount;
    let nextPlayer = players[nextId];
    while(nextPlayer?.isFinished) {
        nextId = (nextId + 1) % playerCount;
        nextPlayer = players[nextId];
    }
    setCurrentPlayerId(nextId);

  }, [gameStatus, grid, currentPlayer, players, turn, playerCount]);

  // Centralized useEffect for managing game state, progression, and AI moves.
  useEffect(() => {
    if (gameStatus !== 'playing' || !grid || !currentPlayer) {
      setPossibleMoves([]);
      return;
    }

    // A. Check for game over condition.
    const activePlayers = players.filter(p => !p.isFinished);
    if (activePlayers.length <= 1) {
      const finalWinner = activePlayers[0] || null;
      setGameStatus('gameOver');
      setWinner(finalWinner);
      onGameOver({ winner: finalWinner, turn });
      return;
    }

    // B. If the current player is finished, find the next active one.
    if (currentPlayer.isFinished) {
      let nextId = (currentPlayerId + 1) % playerCount;
      while (players[nextId]?.isFinished) {
        nextId = (nextId + 1) % playerCount;
      }
      setCurrentPlayerId(nextId);
      return;
    }

    // C. Calculate moves for the current active player.
    const moves = getPossibleMoves(currentPlayer, grid);
    setPossibleMoves(moves);

    // D. If the active player has no moves, mark them as finished.
    if (moves.length === 0) {
      toast({ title: `Player ${currentPlayer.id + 1} has no more moves!` });
      setPlayers(prev => prev.map(p => p.id === currentPlayer.id ? { ...p, isFinished: true } : p));
    } 
    // E. If the active player is a CPU and has moves, trigger their action.
    else if (currentPlayer.type === 'cpu' && !isAiThinking) {
        setIsAiThinking(true);
        setTimeout(() => {
            const randomMove = moves[Math.floor(Math.random() * moves.length)];
            handleMove(randomMove.row, randomMove.col);
            setIsAiThinking(false);
        }, 1200);
    }
  }, [gameStatus, grid, players, currentPlayer, currentPlayerId, playerCount, toast, isAiThinking, handleMove, onGameOver, turn]);


  if (!grid) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <p className="text-white text-xl bg-slate-800/50 p-4 rounded-lg">Setting up the board...</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col xl:flex-row gap-8 w-full h-full items-start justify-center p-4">
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
                  isPossibleMove={isPossible && currentPlayer?.type === 'human'}
                  onClick={() => currentPlayer?.type === 'human' && isPossible && !isAiThinking && handleMove(r, c)}
                  cardSize={cardSize}
                />
              );
            })
          )}
        </div>
        <div className="w-full xl:w-80 flex-shrink-0 space-y-4">
            <GameInfo players={players} currentPlayerId={currentPlayerId} gameStatus={gameStatus} turn={turn} winner={winner} />
            <MoveHistory history={moveHistory} />
            <CardCounter grid={grid} />
        </div>
    </div>
  );
};

export default GameBoard;
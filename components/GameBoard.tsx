import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Grid, Player, Move, GameStatus, MoveRecord } from '../lib/types';
import { generateGrid, getPossibleMoves } from '../lib/game';
import PlayingCard from './PlayingCard';
import { useToast } from '../hooks/use-toast';
import GameInfo from './GameInfo';
import MoveHistory from './MoveHistory';
import CardCounter from './CardCounter';
import { Button } from './ui/Button';

export const playerColors = ['#F59E0B', '#10B981', '#6366F1', '#EC4899']; // amber, emerald, indigo, pink

interface GameBoardProps {
  gridSize: number;
  playerCount: number;
  cardSize: number;
}

const GameBoard: React.FC<GameBoardProps> = ({ gridSize, playerCount, cardSize }) => {
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

  const resetGame = useCallback(() => {
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
  
  useEffect(() => {
    resetGame();
  }, [resetGame]);

  // Centralized useEffect for managing game state progression and checking win conditions.
  useEffect(() => {
    if (gameStatus !== 'playing' || !grid) {
      setPossibleMoves([]);
      return;
    }

    // A. Check for game over condition. This is the primary state change driver.
    const activePlayers = players.filter(p => !p.isFinished);
    if (activePlayers.length <= 1) {
      setGameStatus('gameOver');
      setWinner(activePlayers[0] || null); // Last active player is the winner.
      return;
    }

    // Ensure we have a valid current player before proceeding.
    if (!currentPlayer) return;

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

    // D. If the active player has no moves, mark them as finished. This will re-trigger the effect.
    if (moves.length === 0) {
      toast({ title: `Player ${currentPlayer.id + 1} has no more moves!` });
      setPlayers(prev => prev.map(p => p.id === currentPlayer.id ? { ...p, isFinished: true } : p));
    }
  }, [gameStatus, grid, players, currentPlayer, currentPlayerId, playerCount, toast]);


  const handleMove = useCallback(async (row: number, col: number) => {
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
    
    if (currentPlayer.id === playerCount - 1 || playerCount === 1) {
      setTurn(prev => prev + 1);
    }
    
    // Find the next player and set them as current.
    let nextId = (currentPlayer.id + 1) % playerCount;
    while(players[nextId]?.isFinished) {
        nextId = (nextId + 1) % playerCount;
    }
    setCurrentPlayerId(nextId);

  }, [gameStatus, grid, currentPlayer, players, turn, playerCount]);
  
  useEffect(() => {
    if (gameStatus === 'playing' && currentPlayer?.type === 'cpu' && !isAiThinking) {
        setIsAiThinking(true);
        setTimeout(() => {
            if (possibleMoves.length > 0) {
              const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
              handleMove(randomMove.row, randomMove.col);
            }
            setIsAiThinking(false);
        }, 1200);
    }
  }, [gameStatus, currentPlayer, isAiThinking, possibleMoves, handleMove]);

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
             {gameStatus === 'gameOver' && (
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="text-center p-4 bg-slate-800/80 rounded-lg"
                    >
                        <h2 className="text-3xl font-bold text-white mb-2">Game Over</h2>
                        {playerCount === 1 ? (
                          <p className="text-xl text-gray-400 mb-4">Total Turns: {turn - 1}</p>
                        ) : winner ? (
                          <p className="text-xl text-cyan-400 mb-4">
                            Player {winner.id + 1} ({winner.type}) Wins!
                          </p>
                        ) : (
                          <p className="text-xl text-gray-400 mb-4">It's a draw!</p>
                        )}
                        <Button onClick={resetGame}>Play Again</Button>
                    </motion.div>
                </AnimatePresence>
            )}
        </div>
    </div>
  );
};

export default GameBoard;
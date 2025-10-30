import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PlayingCard from './components/PlayingCard';
import GameInfo from './GameInfo';
import MoveHistory from './MoveHistory';
import CardCounter from './CardCounter';
import { Button } from './components/ui/Button';
import { useGameState } from './hooks/useGameState';
import { useGameEffects } from './hooks/useGameEffects';
import DebugInfo from './components/DebugInfo';

interface GameBoardProps {
  gridSize: number;
  playerCount: number;
  cardSize: number;
}

const GameBoard: React.FC<GameBoardProps> = ({ gridSize, playerCount, cardSize }) => {
  const gameState = useGameState(gridSize, playerCount);
  const { grid, players, currentPlayer, gameStatus, winner, turn, moveHistory, initializeGame, performMove, initialCardCounts } = gameState;
  const { possibleMoves, isAiThinking } = useGameEffects(gameState, playerCount);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

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
                onClick={() => currentPlayer?.type === 'human' && isPossible && !isAiThinking && performMove({ row: r, col: c })}
                cardSize={cardSize}
              />
            );
          })
        )}
      </div>
      <div className="w-full xl:w-80 flex-shrink-0 space-y-4">
        <GameInfo
          players={players}
          currentPlayerId={currentPlayer?.id ?? 0}
          gameStatus={gameStatus}
          turn={turn}
          winner={winner}
          isAiThinking={isAiThinking}
          playerCount={playerCount}
        />
        <MoveHistory history={moveHistory} />
        <CardCounter grid={grid} initialCounts={initialCardCounts} />
        <DebugInfo gameState={gameState} />
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
              <Button onClick={initializeGame}>Play Again</Button>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default GameBoard;
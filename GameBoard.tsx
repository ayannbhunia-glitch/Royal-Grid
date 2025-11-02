import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PlayingCard from './components/PlayingCard';
import GameInfo from './GameInfo';
import MoveHistory from './MoveHistory';
import CardCounter from './CardCounter';
import { Button } from './components/ui/Button';
import { useGameState } from './hooks/useGameState';
import { useGameEffects } from './hooks/useGameEffects';
import { getExactPath } from './lib/game';
import DebugInfo from './components/DebugInfo';

interface GameBoardProps {
  gridSize: number;
  playerCount: number;
  cardSize: number;
}

const GameBoard: React.FC<GameBoardProps> = ({ gridSize, playerCount, cardSize }) => {
  const gameState = useGameState(gridSize, playerCount);
  const { grid, players, currentPlayer, gameStatus, winner, turn, moveHistory, initializeGame, performMove, initialCardCounts, hoveredMove, setHoveredMove, isAnimating } = gameState;
  const { possibleMoves, isAiThinking } = useGameEffects(gameState, playerCount);

  // Compute path for arrow trail when hovering
  const hoveredPath = React.useMemo(() => {
    if (!hoveredMove || !grid || !currentPlayer || isAnimating) return [];
    const card = grid[currentPlayer.position.row][currentPlayer.position.col].card;
    return getExactPath(grid, currentPlayer.position, hoveredMove, card.value);
  }, [hoveredMove, grid, currentPlayer, isAnimating]);

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
        className="relative grid gap-2"
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
                isPossibleMove={isPossible && currentPlayer?.type === 'human' && !isAnimating}
                onClick={() => currentPlayer?.type === 'human' && isPossible && !isAiThinking && !isAnimating && performMove({ row: r, col: c })}
                onMouseEnter={() => isPossible && currentPlayer?.type === 'human' && !isAnimating && setHoveredMove({ row: r, col: c })}
                onMouseLeave={() => setHoveredMove(null)}
                cardSize={cardSize}
              />
            );
          })
        )}
        {/* Arrow trail overlay */}
        {hoveredPath.map((pos, idx) => {
          const nextPos = hoveredPath[idx + 1];
          if (!nextPos) return null;
          
          const dr = nextPos.row - pos.row;
          const dc = nextPos.col - pos.col;
          
          // Handle wrap-around
          const wrappedDr = Math.abs(dr) > 1 ? -Math.sign(dr) : dr;
          const wrappedDc = Math.abs(dc) > 1 ? -Math.sign(dc) : dc;
          
          let rotation = 0;
          if (wrappedDr === -1) rotation = 0;   // up
          if (wrappedDr === 1) rotation = 180;  // down
          if (wrappedDc === 1) rotation = 90;   // right
          if (wrappedDc === -1) rotation = 270; // left
          
          return (
            <div
              key={`arrow-${idx}`}
              className="pointer-events-none absolute z-20"
              style={{
                left: `${pos.col * (cardSize + 8) + cardSize / 2}px`,
                top: `${pos.row * (cardSize * 1.4 + 8) + (cardSize * 1.4) / 2}px`,
                transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
              }}
            >
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 4v16M5 11l7-7 7 7"/>
              </svg>
            </div>
          );
        })}

        {/* Hook arrows for turns */}
        {hoveredPath.map((pos, idx) => {
          const prev = hoveredPath[idx - 1];
          const curr = hoveredPath[idx];
          const next = hoveredPath[idx + 1];
          if (!prev || !next) return null;
          // Compute wrapped directions
          const d1rRaw = curr.row - prev.row, d1cRaw = curr.col - prev.col;
          const d2rRaw = next.row - curr.row, d2cRaw = next.col - curr.col;
          const d1r = Math.abs(d1rRaw) > 1 ? -Math.sign(d1rRaw) : d1rRaw;
          const d1c = Math.abs(d1cRaw) > 1 ? -Math.sign(d1cRaw) : d1cRaw;
          const d2r = Math.abs(d2rRaw) > 1 ? -Math.sign(d2rRaw) : d2rRaw;
          const d2c = Math.abs(d2cRaw) > 1 ? -Math.sign(d2cRaw) : d2cRaw;
          const dir = (dr:number, dc:number) => dr === -1 ? 'U' : dr === 1 ? 'D' : dc === -1 ? 'L' : 'R';
          const a = dir(d1r, d1c);
          const b = dir(d2r, d2c);
          if (a === b) return null; // straight line

          // Determine rotation for a canonical curve (U->R)
          const rotMap: Record<string, number> = {
            'U-R': 0,
            'R-D': 90,
            'D-L': 180,
            'L-U': 270,
            'R-U': 270,
            'D-R': 0,
            'L-D': 90,
            'U-L': 180,
          };
          const rot = rotMap[`${a}-${b}`] ?? 0;

          return (
            <div
              key={`hook-${idx}`}
              className="pointer-events-none absolute z-20"
              style={{
                left: `${curr.col * (cardSize + 8) + cardSize / 2}px`,
                top: `${curr.row * (cardSize * 1.4 + 8) + (cardSize * 1.4) / 2}px`,
                transform: `translate(-50%, -50%) rotate(${rot}deg)`,
              }}
            >
              {/* Quarter-circle hook with arrowhead */}
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 20 C4 10 10 4 20 4"/>
                <path d="M18 6 L20 4 L22 6"/>
              </svg>
            </div>
          );
        })}
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
          gridSize={gridSize}
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
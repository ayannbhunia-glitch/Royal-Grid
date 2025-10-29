import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import type { useGameState } from '../hooks/useGameState';
import { suitConfig } from './PlayingCard';

type GameStateHook = ReturnType<typeof useGameState>;

interface DebugInfoProps {
  gameState: GameStateHook;
}

const DebugInfo: React.FC<DebugInfoProps> = ({ gameState }) => {
  const { grid, players, currentPlayer, turn, gameStatus, activePlayers } = gameState;

  const renderGridAsText = () => {
    if (!grid) return 'No grid data.';
    
    return grid.map((row, r) => 
      row.map((cell, c) => {
        const player = players.find(p => p.position.row === r && p.position.col === c);
        if (player) {
          return ` P${player.id} `;
        }
        if (cell.isInvalid) {
          return ' XX ';
        }
        const suitSymbol = suitConfig[cell.card.suit].symbol;
        return `${cell.card.rank}${suitSymbol}`.padEnd(3, ' ');
      }).join('|')
    ).join('\n');
  };

  const debugState = {
    turn,
    gameStatus,
    currentPlayerId: currentPlayer?.id,
    activePlayerIds: activePlayers.map(p => p.id),
    players: players.map(p => ({ id: p.id, pos: p.position, isFinished: p.isFinished })),
  };

  return (
    <details className="w-full">
        <summary className="cursor-pointer text-slate-400 hover:text-white">Debug Info</summary>
        <Card className="bg-slate-900/70 border-slate-700 text-white mt-2">
            <CardHeader>
                <CardTitle className="text-lg">State Snapshot</CardTitle>
            </CardHeader>
            <CardContent>
                <h4 className="font-semibold text-sm mb-1 text-slate-300">Board State</h4>
                <pre className="text-xs bg-slate-800 p-2 rounded-md overflow-x-auto font-mono">
                    {renderGridAsText()}
                </pre>
                <h4 className="font-semibold text-sm mt-4 mb-1 text-slate-300">Game State</h4>
                <pre className="text-xs bg-slate-800 p-2 rounded-md overflow-x-auto font-mono">
                    {JSON.stringify(debugState, null, 2)}
                </pre>
            </CardContent>
        </Card>
    </details>
  );
};

export default DebugInfo;

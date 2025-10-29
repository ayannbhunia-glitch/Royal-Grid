import React from 'react';
import { Player, GameStatus } from './lib/types';
import { playerColors } from './lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/Card';

interface GameInfoProps {
  players: Player[];
  currentPlayerId: number;
  gameStatus: GameStatus;
  turn: number;
  winner: Player | null;
  isAiThinking: boolean;
  playerCount: number;
}

const GameInfo: React.FC<GameInfoProps> = ({ players, currentPlayerId, gameStatus, turn, winner, isAiThinking, playerCount }) => {

  const getStatusMessage = () => {
    if (gameStatus === 'gameOver') {
      if (playerCount === 1) {
        return `Game Over!`;
      }
      if (winner) {
          return `Player ${winner.id + 1} Wins!`;
      }
      return 'Game Over - Draw!';
    }
    
    const currentPlayer = players.find(p => p.id === currentPlayerId);

    if (isAiThinking && currentPlayer?.type === 'cpu') {
      return (
        <span className="animate-pulse">
          Player {currentPlayerId + 1} (AI) is thinking...
        </span>
      );
    }

    if (playerCount === 1) {
      return `Turn: ${turn}`;
    }

    const turnNumber = playerCount > 0 ? Math.floor((turn - 1) / playerCount) + 1 : 1;
    return `Turn ${turnNumber}: Player ${currentPlayerId + 1}'s Move ${currentPlayer?.type === 'cpu' ? '(AI)' : ''}`;
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700 text-white">
      <CardHeader>
        <CardTitle>Game Status</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-lg font-semibold mb-2 h-7 flex items-center">{getStatusMessage()}</p>
        <div className="space-y-1">
          {players.map(player => (
            <div key={player.id} className="flex items-center justify-between text-sm">
              <span className="flex items-center">
                <span 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: playerColors[player.id] }}
                ></span>
                Player {player.id + 1} ({player.type})
              </span>
              <span className={player.isFinished ? 'font-bold text-red-400' : 'text-green-400'}>{player.isFinished ? 'Finished' : 'Active'}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default GameInfo;
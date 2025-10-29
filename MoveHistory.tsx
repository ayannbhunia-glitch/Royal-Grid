import React from 'react';
import { MoveRecord } from './lib/types';
import { playerColors } from './lib/constants';
import { suitConfig } from './components/PlayingCard';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/Card';

interface MoveHistoryProps {
  history: MoveRecord[];
}

const MoveHistory: React.FC<MoveHistoryProps> = ({ history }) => {
  return (
    <Card className="bg-slate-800/50 border-slate-700 text-white">
      <CardHeader>
        <CardTitle>Move History</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-xs h-40 overflow-y-auto pr-2">
          {history.length === 0 ? (
            <li className="text-gray-400">No moves yet.</li>
          ) : (
            [...history].reverse().map((move) => {
              const config = suitConfig[move.card.suit];
              return (
              <li key={`${move.turn}-${move.player.id}`} className="flex items-start">
                 <span
                    className="w-2.5 h-2.5 rounded-full mr-2 mt-1 flex-shrink-0"
                    style={{ backgroundColor: playerColors[move.player.id] }}
                ></span>
                <span>
                    <span className="font-bold">T{move.turn}:</span> Player {move.player.id + 1} moved 
                    <span className={`font-bold mx-1 ${config.color}`}>{move.card.rank}{config.symbol}</span>
                    to [{move.to.row},{move.to.col}].
                </span>
              </li>
            )})
          )}
        </ul>
      </CardContent>
    </Card>
  );
};

export default MoveHistory;
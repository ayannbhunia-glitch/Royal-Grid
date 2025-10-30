import React from 'react';
import { Grid, Rank } from './lib/types';
import { RANKS } from './lib/game';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/Card';

interface CardCounterProps {
  grid: Grid;
  initialCounts: Record<Rank, number> | null;
}

// Helper to get card value, same as in game logic
const getCardValue = (rank: Rank): number => {
  if (rank === 'A') return 1;
  return parseInt(rank, 10);
};

const CardCounter: React.FC<CardCounterProps> = ({ grid, initialCounts }) => {
  const counts = React.useMemo(() => {
    if (!grid || grid.length === 0) {
      // Return a structure that won't break the render logic
      const emptyCounts: Record<Rank, number> = {} as Record<Rank, number>;
      RANKS.forEach(r => emptyCounts[r] = 0);
      return { current: emptyCounts, validRanks: [] as Rank[] };
    }

    const gridSize = grid.length;
    const validRanks = RANKS.filter(r => getCardValue(r) <= gridSize);
    const currentRankCounts: Record<Rank, number> = {} as Record<Rank, number>;

    validRanks.forEach(rank => {
      currentRankCounts[rank] = 0;
    });

    grid.forEach(row => {
      row.forEach(cell => {
        // A card is only counted if it's not invalid AND not currently occupied by a player.
        if (cell && !cell.isInvalid && typeof cell.occupiedBy === 'undefined' && validRanks.includes(cell.card.rank)) {
          currentRankCounts[cell.card.rank]++;
        }
      });
    });

    return { current: currentRankCounts, validRanks };
  }, [grid]);

  return (
    <Card className="bg-slate-800/50 border-slate-700 text-white">
      <CardHeader>
        <CardTitle>Cards On Board</CardTitle>
      </CardHeader>
      <CardContent>
        {counts.validRanks.length > 0 && initialCounts ? (
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-base">
            {counts.validRanks.map((rank) => (
              <div key={rank} className="flex justify-between items-baseline">
                <span className="font-bold text-slate-300 w-4 text-center">{rank}</span>
                <span className="text-slate-400 font-mono">
                  {counts.current[rank] || 0} / {initialCounts[rank] || 0}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400 text-sm">No cards on board.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default CardCounter;
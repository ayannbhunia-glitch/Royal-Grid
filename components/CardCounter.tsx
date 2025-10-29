import React from 'react';
import { Grid, Suit } from '../lib/types';
import { suitConfig } from './PlayingCard';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';

interface CardCounterProps {
  grid: Grid;
}

const CardCounter: React.FC<CardCounterProps> = ({ grid }) => {
  const counts = React.useMemo(() => {
    const suitCounts: Record<Suit, number> = { Hearts: 0, Diamonds: 0, Clubs: 0, Spades: 0 };
    if (!grid) return suitCounts;
    
    grid.forEach(row => {
      row.forEach(cell => {
        if (cell && !cell.isInvalid) {
          suitCounts[cell.card.suit]++;
        }
      });
    });
    return suitCounts;
  }, [grid]);

  return (
    <Card className="bg-slate-800/50 border-slate-700 text-white">
      <CardHeader>
        <CardTitle>Cards on Board</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-around">
        {Object.entries(counts).map(([suit, count]) => {
            const config = suitConfig[suit as Suit];
            return (
                <div key={suit} className="flex items-center space-x-1">
                    <span className={config.color} style={{fontSize: '1.5rem'}}>{config.symbol}</span>
                    <span className="font-bold text-lg">{count}</span>
                </div>
            )
        })}
      </CardContent>
    </Card>
  );
};

export default CardCounter;

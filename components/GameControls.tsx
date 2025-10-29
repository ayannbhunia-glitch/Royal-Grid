import React from 'react';
import { Button } from './ui/Button';
import { Label } from './ui/Label';
import { Slider } from './ui/Slider';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';

interface GameControlsProps {
  gridSize: number;
  setGridSize: (value: number) => void;
  playerCount: number;
  setPlayerCount: (value: number) => void;
  cardSize: number;
  setCardSize: (value: number) => void;
  onNewGame: () => void;
}

const GameControls: React.FC<GameControlsProps> = ({
  gridSize,
  setGridSize,
  playerCount,
  setPlayerCount,
  cardSize,
  setCardSize,
  onNewGame,
}) => {
  return (
    <div className="flex flex-col h-full space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Game Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="grid-size">Grid Size: {gridSize}</Label>
            <Slider
              id="grid-size"
              min={4}
              max={8}
              step={1}
              // fix: The `value` prop for the native range input expects a single value, not an array.
              value={gridSize}
              onValueChange={(value) => setGridSize(value[0])}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="player-count">Players: {playerCount}</Label>
            <Slider
              id="player-count"
              min={1}
              max={4}
              step={1}
              // fix: The `value` prop for the native range input expects a single value, not an array.
              value={playerCount}
              onValueChange={(value) => setPlayerCount(value[0])}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="card-size">Card Size: {cardSize}px</Label>
            <Slider
              id="card-size"
              min={40}
              max={120}
              step={5}
              // fix: The `value` prop for the native range input expects a single value, not an array.
              value={cardSize}
              onValueChange={(value) => setCardSize(value[0])}
            />
          </div>
          <Button onClick={onNewGame} className="w-full">
            New Game
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default GameControls;

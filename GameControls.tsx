import React from 'react';
import { Button } from './components/ui/Button';
import { Label } from './components/ui/Label';
import { Slider } from './components/ui/Slider';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/Card';

interface GameControlsProps {
  gridSize: number;
  setGridSize: (value: number) => void;
  playerCount: number;
  setPlayerCount: (value: number) => void;
  onNewGame: () => void;
}

const GameControls: React.FC<GameControlsProps> = ({
  gridSize,
  setGridSize,
  playerCount,
  setPlayerCount,
  onNewGame,
}) => {
  return (
    <div className="flex flex-col space-y-4">
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
              value={playerCount}
              onValueChange={(value) => setPlayerCount(value[0])}
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
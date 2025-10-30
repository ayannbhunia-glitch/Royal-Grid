import React, { useState, useCallback } from 'react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { generateInitialGameState, getPossibleMoves } from '../lib/game';
import { Player, Grid } from '../lib/types';
import { suitConfig } from './PlayingCard';

// A custom error class to hold the game state at the time of failure
class SimulationError extends Error {
  constructor(message: string, public details: any) {
    super(message);
    this.name = "SimulationError";
  }
}

// Standalone assertion function for clarity
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

// Helper function to render the grid state as text, similar to DebugInfo
const renderGridForTest = (grid: Grid, players: Player[]): string => {
  if (!grid) return 'No grid data.';
  return grid.map((row, r) => 
    row.map((cell, c) => {
      const player = players.find(p => p.position.row === r && p.position.col === c);
      if (player) {
        return ` P${player.id} `.padEnd(4);
      }
      if (cell.isInvalid) {
        return ' XX  '.padEnd(4);
      }
      const suitSymbol = suitConfig[cell.card.suit].symbol;
      return `${cell.card.rank}${suitSymbol}`.padEnd(4);
    }).join('|')
  ).join('\n');
};


const runSimulation = async (
  playerCount: number,
  gridSize: number,
  log: (message: string) => void
): Promise<boolean> => {
  let { grid, players } = generateInitialGameState(gridSize, playerCount);
  let turn = 1;
  let currentPlayerId = 0;
  
  const maxTurns = gridSize * gridSize * 3;

  try {
    while (turn < maxTurns) {
      let activePlayerIds = players.filter(p => !p.isFinished).map(p => p.id);
      
      if (activePlayerIds.length <= 1) {
        log(`Game over on turn ${turn}. Winner: ${activePlayerIds[0] !== undefined ? `Player ${activePlayerIds[0] + 1}`: 'None'}.`);
        break;
      }

      assert(activePlayerIds.includes(currentPlayerId), `Turn ${turn}: Current player ${currentPlayerId + 1} is not in the active list [${activePlayerIds.join(', ')}].`);
      
      const currentPlayer = players.find(p => p.id === currentPlayerId)!;
      const possibleMoves = getPossibleMoves(currentPlayer, grid);

      if (possibleMoves.length === 0) {
        log(`Turn ${turn}: Player ${currentPlayer.id + 1} has no moves. Marking as finished.`);

        // Capture turn order before player is marked finished.
        const originalActivePlayerIds = players.filter(p => !p.isFinished).map(p => p.id);

        players = players.map(p => p.id === currentPlayer.id ? { ...p, isFinished: true } : p);
        
        // After marking, check for game over.
        const newActivePlayerIds = players.filter(p => !p.isFinished).map(p => p.id);
        if(newActivePlayerIds.length <= 1) {
            continue; // The loop will terminate on the next iteration.
        }

        // Determine the next player based on the original turn order.
        const currentIndexInOriginal = originalActivePlayerIds.indexOf(currentPlayerId);
        const nextPlayerId = originalActivePlayerIds[(currentIndexInOriginal + 1) % originalActivePlayerIds.length];

        // The next player in the sequence MUST still be active, as only one player was removed.
        assert(newActivePlayerIds.includes(nextPlayerId), `Logic Error: Could not find next active player.`);

        currentPlayerId = nextPlayerId;
        continue; // Continue to the next player's turn.
      }


      const move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
      const from = currentPlayer.position;
      
      log(`T${turn}: P${currentPlayer.id + 1} moves from [${from.row},${from.col}] to [${move.row},${move.col}]`);

      grid[from.row][from.col].isInvalid = true;
      grid[from.row][from.col].occupiedBy = undefined;
      grid[move.row][move.col].occupiedBy = currentPlayer.id;
      players = players.map(p => p.id === currentPlayer.id ? { ...p, position: move } : p);

      assert(grid[from.row][from.col].isInvalid, `Turn ${turn}: Previous cell [${from.row},${from.col}] was not invalidated.`);
      assert(players.find(p => p.id === currentPlayerId)!.position.row === move.row, `Turn ${turn}: Player position row did not update.`);
      assert(players.find(p => p.id === currentPlayerId)!.position.col === move.col, `Turn ${turn}: Player position col did not update.`);

      turn++;
      const currentIndexInActive = activePlayerIds.indexOf(currentPlayerId);
      const nextPlayerId = activePlayerIds[(currentIndexInActive + 1) % activePlayerIds.length];
      currentPlayerId = nextPlayerId;
    }
    
    if (turn >= maxTurns) {
       throw new Error(`Simulation exceeded max turns (${maxTurns}). Likely an infinite loop.`);
    }
  } catch (e) {
      if (e instanceof Error) {
          // Re-throw with the full game state for detailed debugging
          throw new SimulationError(e.message, { grid, players, turn, currentPlayerId });
      }
      throw e; // Re-throw other unexpected errors
  }

  log('Simulation finished successfully.');
  return true;
};


const GameTester: React.FC = () => {
  const [testSummary, setTestSummary] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [failureDetails, setFailureDetails] = useState<{
      scenario: string;
      error: string;
      log: string[];
      state: any;
  } | null>(null);

  const handleRunTests = useCallback(async () => {
    setIsRunning(true);
    setFailureDetails(null);
    setTestSummary('Preparing tests...');

    const NUM_TESTS = 1000;

    for (let i = 0; i < NUM_TESTS; i++) {
      const playerCount = Math.floor(Math.random() * 4) + 1;
      const gridSize = Math.floor(Math.random() * 5) + 4;
      
      const currentTestLog: string[] = [];
      const log = (message: string) => {
        currentTestLog.push(message);
      };

      setTestSummary(`Running test ${i + 1}/${NUM_TESTS} (${playerCount}p, ${gridSize}x${gridSize})...`);
      await new Promise(resolve => setTimeout(resolve, 10)); 

      try {
        await runSimulation(playerCount, gridSize, log);
      } catch (e) {
        if (e instanceof SimulationError) {
            setTestSummary(`🛑 Test ${i + 1}/${NUM_TESTS} FAILED!`);
            setFailureDetails({
                scenario: `Scenario: ${playerCount} players, ${gridSize}x${gridSize} grid`,
                error: e.message,
                log: currentTestLog,
                state: e.details,
            });
        } else {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setTestSummary(`🛑 An unexpected error occurred during test ${i + 1}.`);
            setFailureDetails({
                scenario: `Scenario: ${playerCount} players, ${gridSize}x${gridSize} grid`,
                error: errorMessage,
                log: currentTestLog,
                state: null
            });
        }
        setIsRunning(false);
        return;
      }
    }

    setTestSummary(`✅ All ${NUM_TESTS} tests passed successfully!`);
    setIsRunning(false);

  }, []);

  return (
     <details className="w-full">
        <summary className="cursor-pointer text-slate-400 hover:text-white">Run Automated Tests</summary>
        <Card className="bg-slate-900/70 border-slate-700 text-white mt-2">
            <CardHeader>
                <CardTitle className="text-lg">Game Logic Test Suite</CardTitle>
            </CardHeader>
            <CardContent>
                <Button onClick={handleRunTests} disabled={isRunning} className="w-full mb-4">
                    {isRunning ? 'Running Tests...' : 'Start Random Tests'}
                </Button>
                {testSummary && (
                    <p className="text-sm mt-2 text-slate-300 font-semibold">{testSummary}</p>
                )}
                {failureDetails && (
                    <div className="mt-4 space-y-4">
                        <h4 className="font-semibold text-base text-red-400">{failureDetails.scenario}</h4>
                        <div>
                            <h5 className="font-semibold text-sm mb-1 text-slate-300">Error Message</h5>
                            <pre className="text-xs bg-red-900/50 text-red-300 p-2 rounded-md font-mono whitespace-pre-wrap">
                                {failureDetails.error}
                            </pre>
                        </div>
                        <div>
                            <h5 className="font-semibold text-sm mb-1 text-slate-300">Move Log</h5>
                             <pre className="text-xs bg-slate-800 p-2 rounded-md overflow-y-auto font-mono h-40">
                                {failureDetails.log.join('\n')}
                            </pre>
                        </div>
                        {failureDetails.state && (
                            <div>
                                <h5 className="font-semibold text-sm mb-1 text-slate-300">State at Failure</h5>
                                <pre className="text-xs bg-slate-800 p-2 rounded-md overflow-x-auto font-mono mb-2">
                                    {renderGridForTest(failureDetails.state.grid, failureDetails.state.players)}
                                </pre>

                                <pre className="text-xs bg-slate-800 p-2 rounded-md overflow-x-auto font-mono">
                                    {JSON.stringify({
                                        turn: failureDetails.state.turn,
                                        currentPlayerId: failureDetails.state.currentPlayerId,
                                        players: failureDetails.state.players,
                                    }, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    </details>
  );
};

export default GameTester;
import { useState, useEffect } from 'react';
import { getPossibleMoves } from '../lib/game';
import { useGameState } from './useGameState';
import { Move } from '../lib/types';

type GameStateHook = ReturnType<typeof useGameState>;

export const useGameEffects = (gameState: GameStateHook, playerCount: number) => {
    const {
        grid,
        currentPlayer,
        gameStatus,
        activePlayers,
        performMove,
        advancePlayer,
        markPlayerFinished,
        endGame,
    } = gameState;

    const [possibleMoves, setPossibleMoves] = useState<Move[]>([]);
    const [isAiThinking, setIsAiThinking] = useState(false);

    // This effect is the primary driver of the game's state machine.
    useEffect(() => {
        if (gameStatus !== 'playing' || !grid || !currentPlayer) {
            setPossibleMoves([]);
            return;
        }

        // 1. Check for a game-over condition.
        const isGameOver = (playerCount > 1 && activePlayers.length <= 1) || (playerCount === 1 && activePlayers.length === 0);
        if (isGameOver) {
            endGame(activePlayers[0] || null);
            return;
        }
        
        // 2. If the current player is already finished, advance to the next.
        if (currentPlayer.isFinished) {
            advancePlayer();
            return;
        }
        
        // 3. Calculate moves for the active player.
        const moves = getPossibleMoves(currentPlayer, grid);
        setPossibleMoves(moves);

        // 4. If no moves are possible, mark the player as finished.
        // This will cause a state change and re-trigger this effect.
        if (moves.length === 0) {
            markPlayerFinished(currentPlayer.id);
        }
    }, [gameStatus, grid, currentPlayer, activePlayers, playerCount, advancePlayer, markPlayerFinished, endGame]);

    // This effect handles the AI's turn.
    useEffect(() => {
        const isAiTurn = gameStatus === 'playing' && currentPlayer?.type === 'cpu' && possibleMoves.length > 0;

        if (isAiTurn) {
            setIsAiThinking(true);
            const timer = setTimeout(() => {
                const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
                performMove(randomMove);
            }, 100); // Shortened delay for faster testing

            return () => clearTimeout(timer);
        } else {
            setIsAiThinking(false);
        }
    }, [gameStatus, currentPlayer, possibleMoves, performMove]);
    
    return { possibleMoves, isAiThinking };
};

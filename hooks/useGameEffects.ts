import { useState, useEffect } from 'react';
import { getPossibleMoves } from '../lib/game';
import { useGameState } from './useGameState';
import { Move } from '../lib/types';

type GameStateHook = ReturnType<typeof useGameState>;

export const useGameEffects = (gameState: GameStateHook, playerCount: number) => {
    const {
        grid,
        players,
        currentPlayer,
        gameStatus,
        turn,
        activePlayers,
        performMove,
        advancePlayer,
        markPlayerFinished,
        endGame,
    } = gameState;

    const [possibleMoves, setPossibleMoves] = useState<Move[]>([]);
    const [isAiThinking, setIsAiThinking] = useState(false);

    useEffect(() => {
        if (gameStatus !== 'playing' || !grid || !currentPlayer) {
            setPossibleMoves([]);
            return;
        }

        const isGameOver = (playerCount > 1 && activePlayers.length <= 1) || (playerCount === 1 && activePlayers.length === 0);
        if (isGameOver) {
            endGame(activePlayers[0] || null);
            return;
        }
        
        if (currentPlayer.isFinished) {
            advancePlayer();
            return;
        }
        
        const moves = getPossibleMoves(currentPlayer, grid);
        setPossibleMoves(moves);

        if (moves.length === 0) {
            markPlayerFinished(currentPlayer.id);
        }
    }, [gameStatus, grid, players, currentPlayer, activePlayers, playerCount, advancePlayer, markPlayerFinished, endGame]);

    useEffect(() => {
        const isAiTurn = gameStatus === 'playing' && currentPlayer?.type === 'cpu' && possibleMoves.length > 0;

        if (isAiTurn) {
            setIsAiThinking(true);
            const timer = setTimeout(() => {
                const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
                performMove(randomMove);
            }, 1200);

            return () => clearTimeout(timer);
        } else {
            setIsAiThinking(false);
        }
    }, [gameStatus, currentPlayer, possibleMoves, performMove]);
    
    useEffect(() => {
        if (turn > 1) {
          advancePlayer();
        }
    }, [turn, advancePlayer]);

    return { possibleMoves, isAiThinking };
};
import { supabase } from './supabase';
import type { Game, GameState } from './database.types';

export type SubmitMoveParams = {
  gameId: string;
  position: { row: number; col: number };
  playerId: number;
};

/**
 * Submit a move to the server (updates the game state in DB)
 * For now, this is a simple client-side update.
 * In Phase 2, we'll move validation to server-side functions.
 */
export async function submitMove(params: SubmitMoveParams, newState: any) {
  const { gameId } = params;

  // Update the game state in the database
  const { data, error } = await supabase
    .from('games')
    .update({
      state: newState,
      updated_at: new Date().toISOString(),
    })
    .eq('id', gameId)
    .select()
    .single();

  if (error) throw error;
  return data as Game;
}

/**
 * Initialize game state when game starts
 */
export async function initializeGameState(gameId: string, initialState: any) {
  const { data, error } = await supabase
    .from('games')
    .update({
      state: initialState,
      status: 'active',
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', gameId)
    .select()
    .single();

  if (error) throw error;
  return data as Game;
}

/**
 * End the game and record winner
 */
export async function endGameInDB(gameId: string, winnerId: string | null) {
  const { data, error } = await supabase
    .from('games')
    .update({
      status: 'ended',
      ended_at: new Date().toISOString(),
      winner_uid: winnerId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', gameId)
    .select()
    .single();

  if (error) throw error;

  // Update player stats (if winner exists)
  if (winnerId) {
    const { error: rpcError } = await supabase.rpc('increment_wins', { user_id: winnerId });
    if (rpcError) console.error('Failed to update stats:', rpcError);
  }

  return data as Game;
}

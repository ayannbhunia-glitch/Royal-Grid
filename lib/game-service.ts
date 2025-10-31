import { supabase } from './supabase';
import type { Database, Game } from './database.types';

export type CreateGameParams = {
  numPlayers?: number;
  gridSize?: number;
};

export async function createGame(userId: string, params: CreateGameParams = {}) {
  const { numPlayers = 2, gridSize = 8 } = params;
  console.log('[game-service] createGame called', { userId, numPlayers, gridSize });

  // 1) Create the game row
  console.log('[game-service] Inserting game into database...');
  const { data: game, error } = await supabase
    .from('games')
    .insert({
      created_by: userId,
      num_players: numPlayers,
      grid_size: gridSize,
    })
    .select('*')
    .single();

  if (error || !game) {
    console.error('[game-service] createGame: Insert failed', error);
    throw error ?? new Error('Failed to create game');
  }

  console.log('[game-service] Game created in DB:', game);

  // 2) Add creator as a player via RPC (keeps server-side logic consistent)
  console.log('[game-service] Joining creator to game via RPC...');
  const { data: joined, error: joinError } = await supabase
    .rpc('join_game', { p_share_code: game.share_code as string });

  if (joinError) {
    console.error('[game-service] createGame: Join RPC failed', joinError);
    throw joinError;
  }

  console.log('[game-service] Creator joined successfully:', joined);
  return joined as Game;
}

export async function joinGameByShareCode(shareCode: string) {
  console.log('[game-service] joinGameByShareCode called', { shareCode });
  const { data, error } = await supabase
    .rpc('join_game', { p_share_code: shareCode });
  if (error) {
    console.error('[game-service] joinGameByShareCode: RPC failed', error);
    throw error;
  }
  console.log('[game-service] Join successful:', data);
  return data as Game;
}

export async function leaveGame(gameId: string) {
  const { data, error } = await supabase
    .rpc('leave_game', { p_game_id: gameId });
  if (error) throw error;
  return data as Game;
}

export async function getGameById(gameId: string) {
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('id', gameId)
    .single();
  if (error) throw error;
  return data as Game;
}

export function subscribeToGame(gameId: string, onChange: (game: Game) => void) {
  const channel = supabase
    .channel(`game:${gameId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'games',
      filter: `id=eq.${gameId}`,
    }, (payload) => {
      onChange(payload.new as Game);
    })
    .subscribe();

  const unsubscribe = async () => {
    await supabase.removeChannel(channel);
  };

  return { channel, unsubscribe };
}

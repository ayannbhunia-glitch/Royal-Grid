import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Game } from '@/lib/database.types'
import { createGame, joinGameByShareCode, leaveGame, subscribeToGame } from '@/lib/game-service'
import { useAuth } from '@/lib/auth-context'

export function useGameSession() {
  console.log('[useGameSession] Hook called');
  
  const { user } = useAuth()
  const [game, setGame] = useState<Game | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const subRef = useRef<{ unsubscribe: () => Promise<void> } | null>(null)
  
  console.log('[useGameSession] State:', { 
    userId: user?.id, 
    gameId: game?.id, 
    loading, 
    error 
  });

  const reset = useCallback(async () => {
    if (subRef.current) {
      await subRef.current.unsubscribe()
      subRef.current = null
    }
    setGame(null)
  }, [])

  useEffect(() => {
    return () => {
      if (subRef.current) subRef.current.unsubscribe()
    }
  }, [])

  const startSubscription = useCallback((g: Game) => {
    if (subRef.current) subRef.current.unsubscribe()
    const { unsubscribe } = subscribeToGame(g.id, (updated) => {
      setGame(updated)
    })
    subRef.current = { unsubscribe }
  }, [])

  const createNewGame = useCallback(
    async (params?: { numPlayers?: number; gridSize?: number }) => {
      console.log('[useGameSession] createNewGame called', { params, userId: user?.id });
      if (!user) {
        console.log('[useGameSession] createNewGame: No user, aborting');
        return;
      }
      setLoading(true)
      setError(null)
      try {
        console.log('[useGameSession] Creating game...');
        const g = await createGame(user.id, params || {})
        console.log('[useGameSession] Game created:', g);
        setGame(g)
        startSubscription(g)
        return g
      } catch (e: any) {
        console.error('[useGameSession] createNewGame error:', e);
        setError(e?.message || 'Failed to create game')
        throw e
      } finally {
        setLoading(false)
      }
    },
    [user, startSubscription]
  )

  const joinByShareCode = useCallback(async (shareCode: string) => {
    console.log('[useGameSession] joinByShareCode called', { shareCode, userId: user?.id });
    if (!user) {
      console.log('[useGameSession] joinByShareCode: No user, aborting');
      return;
    }
    setLoading(true)
    setError(null)
    try {
      console.log('[useGameSession] Joining game...');
      const g = await joinGameByShareCode(shareCode)
      console.log('[useGameSession] Game joined:', g);
      setGame(g)
      startSubscription(g)
      return g
    } catch (e: any) {
      console.error('[useGameSession] joinByShareCode error:', e);
      setError(e?.message || 'Failed to join game')
      throw e
    } finally {
      setLoading(false)
    }
  }, [user, startSubscription])

  const leaveCurrentGame = useCallback(async () => {
    if (!user || !game) return
    setLoading(true)
    setError(null)
    try {
      await leaveGame(game.id)
      await reset()
    } catch (e: any) {
      setError(e?.message || 'Failed to leave game')
      throw e
    } finally {
      setLoading(false)
    }
  }, [user, game, reset])

  const playersCount = useMemo(() => {
    if (!game) return 0
    const p = game.players as unknown as any[]
    return Array.isArray(p) ? p.length : 0
  }, [game])

  return {
    game,
    loading,
    error,
    createNewGame,
    joinByShareCode,
    leaveCurrentGame,
    playersCount,
    reset,
  }
}

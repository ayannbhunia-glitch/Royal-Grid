import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { Game } from '@/lib/database.types'
import { createGame, joinGameByShareCode, leaveGame, subscribeToGame } from '@/lib/game-service'
import { useAuth } from '@/lib/auth-context'

interface GameSessionContextValue {
  game: Game | null
  loading: boolean
  error: string | null
  playersCount: number
  createNewGame: (params?: { numPlayers?: number; gridSize?: number }) => Promise<Game | void>
  joinByShareCode: (shareCode: string) => Promise<Game | void>
  leaveCurrentGame: () => Promise<void>
  reset: () => Promise<void>
}

const GameSessionContext = createContext<GameSessionContextValue | undefined>(undefined)

export function GameSessionProvider({ children }: { children: React.ReactNode }) {
  console.log('[GameSessionProvider] Mounting provider')
  const { user } = useAuth()
  const [game, setGame] = useState<Game | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const subRef = useRef<{ unsubscribe: () => Promise<void> } | null>(null)

  const reset = useCallback(async () => {
    console.log('[GameSessionProvider] reset called')
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
    console.log('[GameSessionProvider] startSubscription', g.id)
    if (subRef.current) subRef.current.unsubscribe()
    const { unsubscribe } = subscribeToGame(g.id, (updated) => {
      console.log('[GameSessionProvider] Realtime update for game', updated?.id)
      setGame(updated)
    })
    subRef.current = { unsubscribe }
  }, [])

  const createNewGame = useCallback(
    async (params?: { numPlayers?: number; gridSize?: number }) => {
      console.log('[GameSessionProvider] createNewGame called', { params, userId: user?.id })
      if (!user) {
        console.log('[GameSessionProvider] createNewGame: No user, aborting')
        return
      }
      setLoading(true)
      setError(null)
      try {
        const g = await createGame(user.id, params || {})
        console.log('[GameSessionProvider] Game created', g)
        setGame(g)
        startSubscription(g)
        return g
      } catch (e: any) {
        console.error('[GameSessionProvider] createNewGame error', e)
        setError(e?.message || 'Failed to create game')
      } finally {
        setLoading(false)
      }
    },
    [user, startSubscription]
  )

  const joinByShareCode = useCallback(async (shareCode: string) => {
    console.log('[GameSessionProvider] joinByShareCode called', { shareCode, userId: user?.id })
    if (!user) {
      console.log('[GameSessionProvider] joinByShareCode: No user, aborting')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const g = await joinGameByShareCode(shareCode)
      console.log('[GameSessionProvider] Game joined', g)
      setGame(g)
      startSubscription(g)
      return g
    } catch (e: any) {
      console.error('[GameSessionProvider] joinByShareCode error', e)
      setError(e?.message || 'Failed to join game')
    } finally {
      setLoading(false)
    }
  }, [user, startSubscription])

  const leaveCurrentGame = useCallback(async () => {
    console.log('[GameSessionProvider] leaveCurrentGame called for', game?.id)
    if (!user || !game) return
    setLoading(true)
    setError(null)
    try {
      await leaveGame(game.id)
      await reset()
    } catch (e: any) {
      console.error('[GameSessionProvider] leaveCurrentGame error', e)
      setError(e?.message || 'Failed to leave game')
    } finally {
      setLoading(false)
    }
  }, [user, game, reset])

  const playersCount = useMemo(() => {
    const p = game?.players as unknown as any[]
    return Array.isArray(p) ? p.length : 0
  }, [game?.players])

  const value: GameSessionContextValue = {
    game,
    loading,
    error,
    playersCount,
    createNewGame,
    joinByShareCode,
    leaveCurrentGame,
    reset,
  }

  return (
    <GameSessionContext.Provider value={value}>
      {children}
    </GameSessionContext.Provider>
  )
}

export function useGameSessionContext() {
  const ctx = useContext(GameSessionContext)
  if (!ctx) throw new Error('useGameSession must be used within GameSessionProvider')
  return ctx
}

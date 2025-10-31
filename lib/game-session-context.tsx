import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { Game } from '@/lib/database.types'
import { createGame, joinGameByShareCode, leaveGame, subscribeToGame } from '@/lib/game-service'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/hooks/use-toast'

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
  const { toast } = useToast()
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
        toast({
          title: 'Authentication Required',
          description: 'Please sign in to create a game.',
          variant: 'destructive',
        })
        return
      }
      setLoading(true)
      setError(null)
      try {
        const g = await createGame(user.id, params || {})
        console.log('[GameSessionProvider] Game created', g)
        setGame(g)
        startSubscription(g)
        toast({
          title: 'Game Created!',
          description: `${params?.numPlayers || 2}-player game on ${params?.gridSize || 8}x${params?.gridSize || 8} grid. Share the code with friends!`,
        })
        // If this is a single-player game, initialize it immediately
        if (params?.numPlayers === 1) {
          console.log('[GameSessionProvider] Single-player game detected, initializing...')
          // We'll handle the initialization in the MultiplayerGameBoard component
          // by checking for single-player mode and auto-starting
        }
        return g
      } catch (e: any) {
        console.error('[GameSessionProvider] createNewGame error', e)
        const errorMsg = e?.message || 'Failed to create game'
        setError(errorMsg)
        toast({
          title: 'Failed to Create Game',
          description: errorMsg.includes('permission') 
            ? 'You don\'t have permission to create games. Please check your account.'
            : 'Something went wrong. Please try again.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    },
    [user, startSubscription, toast]
  )

  const joinByShareCode = useCallback(async (shareCode: string) => {
    console.log('[GameSessionProvider] joinByShareCode called', { shareCode, userId: user?.id })
    if (!user) {
      console.log('[GameSessionProvider] joinByShareCode: No user, aborting')
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to join a game.',
        variant: 'destructive',
      })
      return
    }
    setLoading(true)
    setError(null)
    try {
      const g = await joinGameByShareCode(shareCode)
      console.log('[GameSessionProvider] Game joined', g)
      setGame(g)
      startSubscription(g)
      toast({
        title: 'Joined Game!',
        description: 'You\'ve successfully joined the game. Waiting for host to start...',
      })
      return g
    } catch (e: any) {
      console.error('[GameSessionProvider] joinByShareCode error', e)
      const errorMsg = e?.message || 'Failed to join game'
      setError(errorMsg)
      toast({
        title: 'Failed to Join Game',
        description: errorMsg.includes('not found') || errorMsg.includes('exist')
          ? 'Game not found. Please check the share code and try again.'
          : errorMsg.includes('full')
          ? 'This game is already full. Try creating a new game instead.'
          : 'Something went wrong. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [user, startSubscription, toast])

  const leaveCurrentGame = useCallback(async () => {
    console.log('[GameSessionProvider] leaveCurrentGame called for', game?.id)
    if (!user || !game) return
    setLoading(true)
    setError(null)
    try {
      await leaveGame(game.id)
      await reset()
      toast({
        title: 'Left Game',
        description: 'You\'ve left the game successfully.',
      })
    } catch (e: any) {
      console.error('[GameSessionProvider] leaveCurrentGame error', e)
      const errorMsg = e?.message || 'Failed to leave game'
      setError(errorMsg)
      toast({
        title: 'Failed to Leave Game',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [user, game, reset, toast])

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

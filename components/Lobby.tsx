import React, { useEffect, useMemo, useState } from 'react'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { useGameSessionContext as useGameSession } from '@/lib/game-session-context'

export function Lobby() {
  console.log('[Lobby] Component rendering');
  
  const {
    game,
    loading,
    error,
    createNewGame,
    joinByShareCode,
    leaveCurrentGame,
    playersCount,
  } = useGameSession()

  console.log('[Lobby] State:', { 
    gameId: game?.id, 
    loading, 
    error, 
    playersCount 
  });

  const [numPlayers, setNumPlayers] = useState(2)
  const [gridSize, setGridSize] = useState(8)
  const [shareCode, setShareCode] = useState('')

  // Auto-join if URL contains ?share=CODE
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const incoming = params.get('share')
    if (incoming && !game && !loading) {
      setShareCode(incoming)
      joinByShareCode(incoming).catch(() => {})
    }
  }, [game, loading, joinByShareCode])

  const shareUrl = useMemo(() => {
    if (!game?.share_code) return ''
    return `${window.location.origin}/?share=${game.share_code}`
  }, [game?.share_code])

  const handleCreate = async () => {
    console.log('[Lobby] handleCreate called', { numPlayers, gridSize });
    await createNewGame({ numPlayers, gridSize })
  }

  const handleJoin = async () => {
    console.log('[Lobby] handleJoin called', { shareCode });
    if (!shareCode.trim()) {
      console.log('[Lobby] handleJoin: Empty share code, aborting');
      return;
    }
    await joinByShareCode(shareCode.trim())
  }

  const handleCopy = async () => {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-xl font-semibold mb-3">Create Game</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-sm mb-1 text-slate-300">Players (1-4)</label>
            <Input
              type="number"
              min={1}
              max={4}
              value={numPlayers}
              onChange={(e) => setNumPlayers(Math.max(1, Math.min(4, Number(e.target.value) || 1)))}
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-slate-300">Grid Size (4-10)</label>
            <Input
              type="number"
              min={4}
              max={10}
              value={gridSize}
              onChange={(e) => setGridSize(Math.max(4, Math.min(10, Number(e.target.value) || 8)))}
              disabled={loading}
            />
          </div>
          <div>
            <Button className="w-full" disabled={loading} onClick={handleCreate}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </span>
              ) : 'Create Game'}
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-xl font-semibold mb-3">Join Game</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div className="md:col-span-2">
            <label className="block text-sm mb-1 text-slate-300">Share Code</label>
            <Input
              placeholder="Enter 8-character code"
              value={shareCode}
              onChange={(e) => setShareCode(e.target.value)}
              disabled={loading}
              maxLength={8}
            />
          </div>
          <div>
            <Button className="w-full" disabled={loading || !shareCode.trim()} onClick={handleJoin}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Joining...
                </span>
              ) : 'Join Game'}
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
          {error}
        </div>
      )}
    </div>
  )
}

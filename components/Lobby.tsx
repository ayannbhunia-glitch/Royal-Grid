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
            <label className="block text-sm mb-1">Players (2-4)</label>
            <Input
              type="number"
              min={2}
              max={4}
              value={numPlayers}
              onChange={(e) => setNumPlayers(Math.max(2, Math.min(4, Number(e.target.value) || 2)))}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Grid Size</label>
            <Input
              type="number"
              min={4}
              max={10}
              value={gridSize}
              onChange={(e) => setGridSize(Math.max(4, Math.min(10, Number(e.target.value) || 8)))}
            />
          </div>
          <div>
            <Button className="w-full" disabled={loading} onClick={handleCreate}>
              {loading ? 'Creating...' : 'Create Game'}
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-xl font-semibold mb-3">Join Game</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Share Code</label>
            <Input
              placeholder="Enter share code"
              value={shareCode}
              onChange={(e) => setShareCode(e.target.value)}
            />
          </div>
          <div>
            <Button className="w-full" disabled={loading || !shareCode.trim()} onClick={handleJoin}>
              {loading ? 'Joining...' : 'Join'}
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

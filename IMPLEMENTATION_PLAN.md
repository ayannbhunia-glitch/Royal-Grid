# 🎮 Royal Grid Domination - Implementation Plan

## 📦 What's Been Set Up (Phase 1 - Part 1)

### ✅ Completed
- [x] Supabase client SDK installed
- [x] Environment configuration (`.env.example`)
- [x] Database schema designed and SQL migration created
- [x] Type-safe database types (`lib/database.types.ts`)
- [x] Supabase client wrapper (`lib/supabase.ts`)
- [x] Authentication context and hooks (`lib/auth-context.tsx`)
- [x] Login screen component (`components/LoginScreen.tsx`)
- [x] App integration with auth (shows login when not authenticated)
- [x] Setup documentation (`SUPABASE_SETUP.md`)

### 📂 File Structure Created

```
Royal-Grid/
├── lib/
│   ├── supabase.ts              # Supabase client instance
│   ├── database.types.ts        # Type-safe DB schema
│   └── auth-context.tsx         # Auth provider & hooks
├── components/
│   └── LoginScreen.tsx          # Google Sign-In UI
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # Database setup
├── .env.example                 # Environment template
├── vite-env.d.ts               # Vite env types
├── SUPABASE_SETUP.md           # Setup instructions
└── IMPLEMENTATION_PLAN.md      # This file
```

## 🎯 Current Status: Phase 1 - Part 1 Complete

**You need to:**
1. Create `.env.local` file (copy from `.env.example`)
2. Run the SQL migration in Supabase Dashboard
3. Enable Google Auth in Supabase
4. Test login flow

## 📋 Remaining Work

### Phase 1: Multiplayer Foundation (Backend) - Part 2

#### 🔄 Real-time Game Sessions
- [ ] Create game service (`lib/game-service.ts`)
  - `createGame()` - Creates new game document
  - `joinGame(shareCode)` - Adds player to existing game
  - `subscribeToGame(gameId)` - Real-time listener
  - `leaveGame(gameId)` - Remove player

- [ ] Game state management hook (`hooks/useGameSession.ts`)
  - Subscribe to game updates
  - Handle player joins/leaves
  - Sync local state with Firestore

#### 📤 Move Submission Path
- [ ] Create move service (`lib/move-service.ts`)
  - `submitMove(gameId, position)` - Send move to backend
  - Basic validation before submission
  
- [ ] Update game state on move
  - Write to `games` table
  - Optionally write to `moves` table for history

### Phase 2: Server-Side Logic

#### 🧠 Extract Game Logic
- [ ] Convert `useGameState` to pure functions
- [ ] Convert `useGameEffects` to pure functions
- [ ] Create `lib/game-logic.ts` with:
  - `initializeGame(config)`
  - `validateMove(state, position, player)`
  - `applyMove(state, move)`
  - `checkWinCondition(state)`
  - `getNextPlayer(state)`

#### 🔐 Server-Side Move Validation
- [ ] Create Supabase Edge Function or RPC
  - `make_move(game_id, position)`
  - Validate move server-side
  - Update game state atomically
  - Broadcast to all players

#### 🎨 UI Screens
- [ ] Lobby/Dashboard (`components/Lobby.tsx`)
  - List of user's games
  - "Create New Game" button
  - "Join Game" input (share code)
  
- [ ] Waiting Room (`components/WaitingRoom.tsx`)
  - Show joined players
  - Copy share link button
  - Start game button (for host)

### Phase 3: Game Lobby System

- [ ] Create game routing
  - `/` - Lobby/Dashboard
  - `/game/:id` - Game room
  - `/game/:id/waiting` - Waiting room

- [ ] Share link functionality
  - Generate shareable URL
  - Copy to clipboard
  - Auto-join on visit

- [ ] Game lifecycle
  - waiting → active (when enough players)
  - active → ended (when winner determined)
  - Ending screen with results

### Phase 4: Polish

- [ ] Mobile responsive layout
- [ ] Sound effects
- [ ] Animations
- [ ] Error handling
- [ ] Loading states

### Phase 5: Social Features

- [ ] Leaderboard
- [ ] Friends system
- [ ] Online presence
- [ ] Challenge/invite system

## 🔧 Technical Architecture

### Current (Local)
```
React App
  ↓
Local State (useState)
  ↓
Game Logic (hooks)
  ↓
UI Updates
```

### Target (Multiplayer)
```
React App (Player 1)          React App (Player 2)
       ↓                              ↓
   Supabase Client              Supabase Client
       ↓                              ↓
       └──────────→ Supabase ←────────┘
                   (Single Source of Truth)
                        ↓
                   Game State
                   (Realtime sync)
```

### Data Flow (Multiplayer)
```
1. Player clicks cell
2. Client sends intent to Supabase
3. Server validates move
4. Server updates game state
5. Supabase broadcasts to all clients
6. All clients re-render with new state
```

## 🎓 Key Concepts

### Row Level Security (RLS)
- Ensures players can only modify their own games
- Prevents cheating via direct DB access
- Configured in migration SQL

### Realtime Subscriptions
```typescript
// Subscribe to game updates
const channel = supabase
  .channel(`game:${gameId}`)
  .on('postgres_changes', 
    { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${gameId}` },
    (payload) => {
      // Update local state
      setGameState(payload.new.state);
    }
  )
  .subscribe();
```

### Optimistic Updates
- Update UI immediately (optimistic)
- Send request to server
- Rollback if server rejects
- Improves perceived performance

## 🚀 Next Immediate Steps

1. **Complete Supabase Setup** (follow `SUPABASE_SETUP.md`)
2. **Test Authentication** (verify login works)
3. **Create Game Service** (basic create/join/subscribe)
4. **Build Lobby UI** (dashboard screen)
5. **Implement Real-time Sync** (subscribe to game updates)

## 📊 Progress Tracking

- **Phase 1 Part 1:** ✅ 100% (Auth + DB setup)
- **Phase 1 Part 2:** ⏳ 0% (Real-time sessions)
- **Phase 2:** ⏳ 0% (Server-side logic)
- **Phase 3:** ⏳ 0% (Lobby system)
- **Phase 4:** ⏳ 0% (Polish)
- **Phase 5:** ⏳ 0% (Social features)

---

**Current Focus:** Complete Supabase setup, then implement game creation and real-time sync.

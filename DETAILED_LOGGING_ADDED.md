# 🔍 Detailed Logging Added - Complete Debug Trail

## ✅ Logging Added to All Components

### 1. App.tsx
- Component render start
- Auth state (user ID, loading)
- Game state (game ID, status)
- Each render path (loading, login, lobby, game board, error)
- Game details when showing MultiplayerGameBoard

### 2. hooks/useGameSession.ts
- Hook initialization
- Current state (user ID, game ID, loading, error)
- `createNewGame()` - params, user check, creation process, result
- `joinByShareCode()` - share code, user check, join process, result
- All errors logged with context

### 3. components/Lobby.tsx
- Component render
- Current state (game ID, loading, error, player count)
- `handleCreate()` - params logged
- `handleJoin()` - share code logged, empty check

### 4. lib/game-service.ts
- `createGame()` - user ID, params, DB insert, RPC join, results
- `joinGameByShareCode()` - share code, RPC call, result
- All errors logged with context

### 5. components/MultiplayerGameBoard.tsx
- Component render with props
- Game state (initialized, has grid, status, players)
- Waiting room logic (player count, can start, is creator)
- `handleStartGame()` call logged

## 🎯 What You'll See in Console

### Normal Flow - Create Game

```
[App] Component rendering...
[App] Auth state: { user: "abc123", loading: false }
[App] Game state: { game: undefined, status: undefined }
[useGameSession] Hook called
[useGameSession] State: { userId: "abc123", gameId: undefined, loading: false, error: null }
[App] User authenticated, no game, showing Lobby
[Lobby] Component rendering
[Lobby] State: { gameId: undefined, loading: false, error: null, playersCount: 0 }

// User clicks "Create Game"
[Lobby] handleCreate called { numPlayers: 2, gridSize: 8 }
[useGameSession] createNewGame called { params: {...}, userId: "abc123" }
[useGameSession] Creating game...
[game-service] createGame called { userId: "abc123", numPlayers: 2, gridSize: 8 }
[game-service] Inserting game into database...
[game-service] Game created in DB: { id: "xyz", share_code: "abc123", ... }
[game-service] Joining creator to game via RPC...
[game-service] Creator joined successfully: { ... }
[useGameSession] Game created: { id: "xyz", ... }

// App re-renders with game
[App] Component rendering...
[App] Game state: { game: "xyz", status: "waiting" }
[App] Valid game exists, showing MultiplayerGameBoard
[App] Game details: { id: "xyz", status: "waiting", players: [...], created_by: "abc123" }
[MultiplayerGameBoard] Component rendering { gameId: "xyz", userId: "abc123", ... }
[MultiplayerGameBoard] Game state: { isInitialized: false, hasGrid: false, gameStatus: "waiting", ... }
[MultiplayerGameBoard] Showing waiting room { playersCount: 1, needed: 2, canStart: false, isCreator: true }
```

### Normal Flow - Join Game

```
[Lobby] handleJoin called { shareCode: "abc123" }
[useGameSession] joinByShareCode called { shareCode: "abc123", userId: "def456" }
[useGameSession] Joining game...
[game-service] joinGameByShareCode called { shareCode: "abc123" }
[game-service] Join successful: { ... }
[useGameSession] Game joined: { id: "xyz", ... }
```

### Error Flow

```
[game-service] createGame: Insert failed { message: "...", code: "..." }
[useGameSession] createNewGame error: { ... }
```

## 🐛 How to Debug

### Step 1: Open Console
Press F12 → Console tab

### Step 2: Clear Console
Click the 🚫 icon to clear old logs

### Step 3: Perform Action
- Click "Create Game"
- Click "Join"
- etc.

### Step 4: Read Logs
Look for the sequence:
1. `[Lobby] handleCreate called` ✅
2. `[useGameSession] createNewGame called` ✅
3. `[game-service] createGame called` ✅
4. `[game-service] Inserting game into database...` ✅
5. `[game-service] Game created in DB` ✅
6. `[useGameSession] Game created` ✅
7. `[App] Valid game exists` ✅
8. `[MultiplayerGameBoard] Component rendering` ✅

### Step 5: Find Where It Stops
If you see:
```
[Lobby] handleCreate called
[useGameSession] createNewGame called
[game-service] createGame called
[game-service] Inserting game into database...
[game-service] createGame: Insert failed { ... }
```

**Problem:** Database insert failed - check Supabase migrations

If you see:
```
[App] Valid game exists
[MultiplayerGameBoard] Component rendering
[MultiplayerGameBoard] Game state: { isInitialized: false, hasGrid: false, ... }
// Nothing after this
```

**Problem:** Waiting room should show - check if component is rendering

## 📊 Common Issues & What to Look For

### Issue: Blank screen after create
**Look for:**
- Does `[App] Valid game exists` appear?
- Does `[MultiplayerGameBoard] Component rendering` appear?
- Does `[MultiplayerGameBoard] Showing waiting room` appear?

### Issue: Create button does nothing
**Look for:**
- Does `[Lobby] handleCreate called` appear?
- If yes, does `[useGameSession] createNewGame called` appear?
- If yes, does `[game-service] createGame called` appear?
- Check for error logs

### Issue: Database errors
**Look for:**
```
[game-service] createGame: Insert failed
[game-service] createGame: Join RPC failed
```

**Solution:** Check if migrations are run in Supabase

## 🎯 Next Steps

1. **Open browser console (F12)**
2. **Clear console**
3. **Try to create a game**
4. **Copy ALL console output**
5. **Share the logs**

This will show exactly where the flow breaks!

---

**All logging is now in place. Check console and share what you see!** 🔍

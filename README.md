# <div align="center">👑 Royal Grid Domination — README</div>

<div align="center">
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6">
  <img alt="Royal Grid Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" width="100%" />
</picture>
</div>

<p align="center"><strong>A fast, elegant grid-card strategy game — move your King using card values, remove tiles as you go, outlast your opponents, and claim the throne.</strong></p>

<p align="center">
<img src="https://img.shields.io/badge/React-19-blue?logo=react" alt="React" />
<img src="https://img.shields.io/badge/Vite-blueviolet?logo=vite" alt="Vite" />
<img src="https://img.shields.io/badge/TypeScript-blue?logo=typescript" alt="TypeScript" />
<img src="https://img.shields.io/badge/Tailwind_CSS-cyan?logo=tailwindcss" alt="Tailwind CSS" />
</p>

---

## 🔭 Table of Contents

* [Play — Quick rules (TL;DR)](#-play---quick-rules-tldr)
* [Gameplay illustrated (visual)](#-gameplay-illustrated-visual)
* [Features](#-features)
* [Quick start (run locally)](#-quick-start-run-locally)
* [Project structure (short)](#-project-structure-short)
* [Game internals — key logic snippets](#-game-internals--key-logic-snippets)
* [Testing & debug tools](#-testing--debug-tools)
* [Contribute / Roadmap](#-contribute--roadmap)
* [License](#-license)

---

## 🎲 Play — Quick rules (TL;DR)

* Each player controls a **King** standing on a playing card (value A=1, 2–10, J=11, Q=12, K=13).

* On your turn, you **must** move your King to an **unoccupied** card at an integer distance `d` such that:

  ```
  (cardValue - d) % 2 === 0
  ```

  → That means the parity difference between the card value and the distance must be even.

* When you leave a card, the **source card is removed** from play (cannot be landed on again).

* If you have **no valid moves**, you are finished. Last player able to move wins.

* Play 1–4 players (AI players available).

---

## 🧭 Gameplay illustrated (visual & example)

### Small 5×5 example (ASCII snapshot)

```
  0 1 2 3 4   ← x
0 A . . . .
1 . . . . .
2 . . K . .
3 . . . . .
4 . . . . .
```

King at `(2,2)` stands on card `5` (for example).

**Valid distances from `5`**: `1, 3, 5, ...` (any `d` where `(5 - d) % 2 === 0`).

* `d = 1` → can move to any adjacent tile at Manhattan distance 1
* `d = 2` → **not allowed** because `(5-2)%2 = 1`
* `d = 3` → allowed (jump 3 tiles in any direction or combination that yields distance 3)

> Note: Distance is grid distance (Manhattan / exact path-considered by the game's pathfinding rules — see engine for BFS details).

### Visual move example (move distance 1)

```
Before:
  (2,2) = K on '5'

Possible d=1 moves: (1,2),(3,2),(2,1),(2,3)
After move to (2,3):
  old card (2,2) becomes removed → cannot be used again
```

---

## ✨ Highlighted Features

* ✅ **Beautiful animated grid UI** using React + Framer Motion
* ⚙️ **Adjustable board size**: 4×4 → 8×8
* 🤖 **AI opponents**: simple, reliable AI (placeholder for smarter AI)
* 🧪 **GameTester**: run thousands of simulations to detect logic errors or infinite loops
* 🐞 **Debug Panel**: raw JSON state + text board for dev debugging
* ♻️ **Pure game engine (lib/game.ts)**: deterministic, testable functions (`getPossibleMoves`, `generateInitialGameState`)
* 🔁 **Move history** & live game stats sidebar

---

## 🚀 Quick start (run locally)

**Prerequisites**: Node.js (v18+ recommended)

```bash
# clone
git clone https://github.com/ayannbhunia-glitch/Royal-Grid.git
cd Royal-Grid

# install deps
npm install

# dev server
npm run dev
```

Open the URL printed in your terminal (commonly `http://localhost:5173` for Vite).

**Optional env**

```
# For future AI integration
GEMINI_API_KEY=your_api_key_here
```

*(The current built-in AI does not require an API key.)*

---

## 📂 Project structure (short & sweet)

```
/
├── index.html
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── GameBoard.tsx
│   │   ├── PlayingCard.tsx
│   │   ├── GameControls.tsx
│   │   └── GameTester.tsx
│   ├── hooks/
│   │   ├── useGameState.ts
│   │   └── useGameEffects.ts
│   ├── lib/
│   │   ├── game.ts        # core engine
│   │   ├── types.ts
│   │   └── utils.ts
│   └── ai/
│       └── opponent.ts
└── package.json
```

---

## 🧠 Game internals — key logic snippets

### `getPossibleMoves(playerPosition, board)` — idea

```ts
// signature (simplified)
function getPossibleMoves(pos: Point, value: number, board: Board): Point[] {
  // 1. compute all tiles at integer distance d from pos
  // 2. filter tiles that are unoccupied and not removed
  // 3. keep only those where (value - d) % 2 === 0
  // 4. return reachable tiles (BFS pathfinding used to handle obstacles)
}
```

### Move-validity rule (human-readable)

* Move allowed ⇢ the tile is reachable and `(cardValue - distance) % 2 === 0`.

### Engine responsibilities (useGameEffects / lib/game.ts)

* Calculate possible moves for current player.
* Remove source card when a player leaves it.
* Mark players without moves as `finished`.
* Trigger AI moves automatically on AI turn.
* Maintain move history and detect end-game condition.

---

## 🧪 Testing & debug tools

* `GameTester` component can simulate thousands of games — useful to:

  * Find infinite loop cases
  * Validate fairness across grid sizes
  * Tune AI behavior

**Dev tips**

* Use the **Debug Info** panel in-app to view raw `gameState`.
* Add unit tests around `lib/game.ts` functions (pure functions = easy tests).

---

## 🤝 Contributing & roadmap

Contributions welcome! A few ideas:

* 🔮 Smarter AI (minimax / Monte Carlo)
* ♟️ New card rules / power-ups
* 🖼️ Improve visuals & accessibility
* ♻️ Add replay export / FEN-like board snapshots

Please open PRs / issues on GitHub. Keep changes small, add tests for engine logic.

---

## 📜 License

MIT — feel free to use, modify, and build upon this. Please keep the original authorship if redistributing.

---

## 🏁 Parting pro tip (if you only read one line)

Design engine-first: keep `lib/game.ts` pure and unit-testable — UI should be a thin layer on top.

---

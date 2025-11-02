import { Grid, Card, Player, Suit, Rank, Move, Position } from './types';

export const SUITS: Suit[] = ['Spades', 'Hearts', 'Clubs', 'Diamonds'];
export const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8'];

const getCardValue = (rank: Rank): number => {
  if (rank === 'A') return 1;
  return parseInt(rank, 10);
};

// Find one exact path from 'from' to 'to' with exactly 'k' steps, respecting rules:
// - Wrap-around edges
// - Cannot pass through invalid cells
// - Can pass through occupied cells
// - Cannot land on occupied cell
export const getExactPath = (grid: Grid, from: { row: number; col: number }, to: { row: number; col: number }, k: number): Position[] => {
  const size = grid.length;
  const visited: Set<string> = new Set();
  const path: Position[] = [];
  const pathVisited: Set<string> = new Set(); // prevent revisiting cells within the same path

  const key = (r: number, c: number, rem: number) => `${r},${c},${rem}`;
  const pkey = (r: number, c: number) => `${r},${c}`;
  const norm = (v: number) => ((v % size) + size) % size;

  const dfs = (r: number, c: number, rem: number): boolean => {
    // Wrap
    r = norm(r);
    c = norm(c);

    // Cannot stay in the same cell (except at start with full steps)
    if (r === from.row && c === from.col && rem < k) return false;

    // Do not revisit any cell already in current path (prevents bounce/loop)
    const pk = pkey(r, c);
    if (pathVisited.has(pk)) return false;

    // Block invalid cells
    if (grid[r][c].isInvalid) return false;

    // Treat occupied cells as blocked, except the starting cell
    const isStart = r === from.row && c === from.col;
    if (!isStart && typeof grid[r][c].occupiedBy === 'number') return false;

    const kstr = key(r, c, rem);
    if (visited.has(kstr)) return false;
    visited.add(kstr);

    pathVisited.add(pk);
    path.push({ row: r, col: c });

    if (rem === 0) {
      // Must be at destination and not occupied
      const ok = r === to.row && c === to.col && typeof grid[r][c].occupiedBy !== 'number';
      if (!ok) {
        path.pop();
        pathVisited.delete(pk);
      }
      return ok;
    }

    // Explore 4 directions
    if (dfs(r - 1, c, rem - 1)) return true;
    if (dfs(r + 1, c, rem - 1)) return true;
    if (dfs(r, c - 1, rem - 1)) return true;
    if (dfs(r, c + 1, rem - 1)) return true;

    path.pop();
    pathVisited.delete(pk);
    return false;
  };

  const found = dfs(from.row, from.col, k);
  if (!found) return [];
  // path includes starting position; return only the intermediate steps excluding the start
  return path.slice(1);
};

const shuffle = <T>(array: T[]): T[] => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
};

const createDeck = (size: number): Card[] => {
  const deck: Card[] = [];
  const validRanks = RANKS.filter(r => getCardValue(r) <= size);
  SUITS.forEach(suit => {
    validRanks.forEach(rank => {
      deck.push({ suit, rank, value: getCardValue(rank) });
    });
  });
  return deck;
};

export const generateInitialGameState = (size: number, playerCount: number): { grid: Grid; players: Player[] } => {
    if (playerCount > 4) {
        throw new Error("Game rules do not support more than 4 players.");
    }

    const grid: Grid = Array(size).fill(null).map(() => Array(size).fill(null));
    
    // 1. Determine the exact, most balanced set of cards for the entire board.
    const totalCards = size * size;
    const baseDeck = createDeck(size);
    
    const numFullDecks = Math.floor(totalCards / baseDeck.length);
    const remainderCards = totalCards % baseDeck.length;

    let idealPool: Card[] = [];
    for (let i = 0; i < numFullDecks; i++) {
        idealPool.push(...baseDeck);
    }
    if (remainderCards > 0) {
        idealPool.push(...shuffle(baseDeck).slice(0, remainderCards));
    }

    // 2. Define which specific aces players will receive.
    const playerAces: Card[] = SUITS.slice(0, playerCount).map(suit => ({
        suit,
        rank: 'A',
        value: 1,
    }));

    // 3. Ensure the player aces are present in the ideal pool.
    // This is a safety check; for most balanced distributions, they will be.
    // If not, swap them in with a random card from the pool.
    playerAces.forEach(playerAce => {
        const aceInPool = idealPool.find(c => c.rank === playerAce.rank && c.suit === playerAce.suit);
        if (!aceInPool) {
            // Find a card in the pool that is NOT a required player ace and swap it.
            const swappableIndex = idealPool.findIndex(poolCard => 
                !playerAces.some(pa => pa.rank === poolCard.rank && pa.suit === poolCard.suit)
            );
            if (swappableIndex !== -1) {
                idealPool[swappableIndex] = playerAce;
            }
        }
    });

    // 4. Procedurally remove the player aces to create the final pool for the grid cells.
    const cardsForGrid: Card[] = [];
    const poolCopy = [...idealPool];
    
    playerAces.forEach(playerAce => {
        const indexToRemove = poolCopy.findIndex(c => c.rank === playerAce.rank && c.suit === playerAce.suit);
        if (indexToRemove > -1) {
            poolCopy.splice(indexToRemove, 1);
        }
    });
    // What remains in poolCopy is for the grid.
    const shuffledCardsForGrid = shuffle(poolCopy);


    // 5. Get all grid positions and shuffle them for random placement.
    const allPositions: { row: number; col: number }[] = [];
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            allPositions.push({ row: r, col: c });
        }
    }
    const shuffledPositions = shuffle(allPositions);

    // 6. Place players with their aces.
    const players: Player[] = [];
    for (let i = 0; i < playerCount; i++) {
        const pos = shuffledPositions.pop()!;
        players.push({
            id: i,
            type: i === 0 ? 'human' : 'cpu',
            position: pos,
            isFinished: false,
        });
        grid[pos.row][pos.col] = {
            card: playerAces[i],
            isInvalid: false,
            occupiedBy: i,
        };
    }

    // 7. Fill the rest of the grid.
    shuffledPositions.forEach((pos, i) => {
        grid[pos.row][pos.col] = {
            card: shuffledCardsForGrid[i],
            isInvalid: false,
        };
    });

    return { grid, players };
};


export const getPossibleMoves = (player: Player, grid: Grid): Move[] => {
    if (!player || player.isFinished) return [];

    const size = grid.length;
    const { row: startRow, col: startCol } = player.position;
    const cardValue = grid[startRow][startCol].card.value;

    // 2D array where each cell contains a Set of remaining distances already explored from that cell
    const validMovesBoard: Set<number>[][] = Array(size).fill(null).map(() => 
        Array(size).fill(null).map(() => new Set<number>())
    );
    
    const validMoves: Move[] = [];

    // DFS function: explores from (i, j) with k steps remaining
    const dfs = (i: number, j: number, k: number, seen: Set<string>) => {
        // Base case: no more steps
        if (k < 0) return;

        // Wrap around edges (toroidal grid)
        let row = i;
        let col = j;
        if (row < 0 || row >= size) row = ((row % size) + size) % size;
        if (col < 0 || col >= size) col = ((col % size) + size) % size;

        // Check if this cell is active (not invalid/touched) and not occupied (cannot pass through players)
        const cell = grid[row][col];
        const isStartCell = row === startRow && col === startCol;
        // Do not allow revisiting the start cell during this move
        if (isStartCell && k < cardValue) return;
        // Prevent revisiting any cell in the same path
        const pk = `${row},${col}`;
        if (seen.has(pk)) return;
        if (cell.isInvalid) return;
        if (!isStartCell && typeof cell.occupiedBy === 'number') return;

        // Check if we've already explored this cell with this remaining distance
        if (validMovesBoard[row][col].has(k)) return;

        // Mark this (position, remaining_distance) as explored
        validMovesBoard[row][col].add(k);

        // Mark this cell as part of current path
        seen.add(pk);

        // If we've used all steps (k == 0), this is a valid destination
        if (k === 0) {
            // Only add if not occupied by another player
            if (typeof cell.occupiedBy !== 'number') {
                validMoves.push({ row, col });
            }
            seen.delete(pk);
            return;
        }

        // Explore all 4 directions with one less step remaining
        dfs(row - 1, col, k - 1, seen); // up
        dfs(row + 1, col, k - 1, seen); // down
        dfs(row, col - 1, k - 1, seen); // left
        dfs(row, col + 1, k - 1, seen); // right

        // Backtrack for other paths
        seen.delete(pk);
    };

    // Start DFS from current position with cardValue steps
    dfs(startRow, startCol, cardValue, new Set<string>());

    return validMoves;
};
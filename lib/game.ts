import { Grid, Card, Player, Suit, Rank, Move, Cell } from './types';

export const SUITS: Suit[] = ['Spades', 'Hearts', 'Clubs', 'Diamonds'];
export const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8'];

const getCardValue = (rank: Rank): number => {
  if (rank === 'A') return 1;
  return parseInt(rank, 10);
};

// Fisher-Yates shuffle
const shuffle = <T>(array: T[]): T[] => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
};

const createDeck = (gridSize: number): Card[] => {
    const deck: Card[] = [];
    const validRanks = RANKS.filter(r => getCardValue(r) <= gridSize);
    SUITS.forEach(suit => {
        validRanks.forEach(rank => {
            deck.push({ suit, rank, value: getCardValue(rank) });
        });
    });
    return shuffle(deck);
}

export const generateGrid = (size: number, playerCount: number): { grid: Grid; players: Player[] } => {
  const grid: Grid = Array(size).fill(null).map(() => Array(size).fill(null));
  let deck = createDeck(size);

  // 1. Fill the entire grid with cards
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (deck.length === 0) {
        deck = createDeck(size);
      }
      grid[r][c] = {
        card: deck.pop()!,
        isInvalid: false,
      };
    }
  }

  // 2. Find all 'A' cards to place players
  const acePositions: { row: number, col: number }[] = [];
  grid.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (cell.card.rank === 'A') {
        acePositions.push({ row: r, col: c });
      }
    });
  });

  // 3. Place players on unique 'A' cards
  const players: Player[] = [];
  const shuffledAcePositions = shuffle(acePositions);

  for (let i = 0; i < playerCount; i++) {
    const pos = shuffledAcePositions[i];
    if (!pos) {
      // This case should not happen if size >= 4, but it's a good safeguard.
      // We could try to regenerate the grid or throw an error.
      // For now, let's throw an error.
      throw new Error(`Not enough 'A' cards to place ${playerCount} players.`);
    }
    players.push({
      id: i,
      type: i === 0 ? 'human' : 'cpu',
      position: pos,
      isFinished: false,
    });
    grid[pos.row][pos.col].occupiedBy = i;
  }
  
  return { grid, players };
};


export const getPossibleMoves = (player: Player, grid: Grid): Move[] => {
    if (!player || player.isFinished) return [];

    const size = grid.length;
    const { row: startRow, col: startCol } = player.position;
    const cardValue = grid[startRow][startCol].card.value;

    const possibleMoves: Move[] = [];
    const distances = new Map<string, number>(); // Stores shortest distance to each cell
    const queue: [number, number, number][] = [[startRow, startCol, 0]]; // [row, col, distance]

    distances.set(`${startRow},${startCol}`, 0);

    let head = 0;
    while (head < queue.length) {
        const [r, c, dist] = queue[head++];

        const directions = [
            { dr: -1, dc: 0 }, // Up
            { dr: 1, dc: 0 },  // Down
            { dr: 0, dc: -1 }, // Left
            { dr: 0, dc: 1 },  // Right
        ];

        for (const { dr, dc } of directions) {
            const newRow = (r + dr + size) % size;
            const newCol = (c + dc + size) % size;
            const posKey = `${newRow},${newCol}`;

            // If we haven't found a shorter path to this cell yet
            if (!distances.has(posKey)) {
                const targetCell = grid[newRow][newCol];
                // And the cell is valid to move into
                if (!targetCell.isInvalid && typeof targetCell.occupiedBy !== 'number') {
                    distances.set(posKey, dist + 1);
                    queue.push([newRow, newCol, dist + 1]);
                }
            }
        }
    }

    // A cell is reachable in exactly K steps if the shortest path 'dist' to it
    // is less than or equal to K, and the difference (K - dist) is an even number.
    // This accounts for "back and forth" moves.
    for (const [posKey, dist] of distances.entries()) {
        if (dist > 0 && dist <= cardValue && (cardValue - dist) % 2 === 0) {
            const [row, col] = posKey.split(',').map(Number);
            possibleMoves.push({ row, col });
        }
    }

    return possibleMoves;
};
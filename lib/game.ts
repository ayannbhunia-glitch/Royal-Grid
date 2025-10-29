import { Grid, Card, Player, Suit, Rank, Move } from './types';

export const SUITS: Suit[] = ['Spades', 'Hearts', 'Clubs', 'Diamonds'];
export const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8'];

const getCardValue = (rank: Rank): number => {
  if (rank === 'A') return 1;
  return parseInt(rank, 10);
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

const dealGrid = (size: number): Grid => {
    const grid: Grid = Array(size).fill(null).map(() => Array(size).fill(null));
    let deck = createDeck(size);

    while (deck.length < size * size) {
        deck.push(...createDeck(size));
    }
    deck = shuffle(deck);

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            grid[r][c] = {
                card: deck.pop()!,
                isInvalid: false,
            };
        }
    }
    return grid;
};

const placePlayers = (grid: Grid, playerCount: number): { players: Player[]; updatedGrid: Grid } => {
    const players: Player[] = [];
    const updatedGrid = grid.map(row => row.map(cell => ({ ...cell })));

    const acePositions: { row: number; col: number }[] = [];
    updatedGrid.forEach((row, r) => {
        row.forEach((cell, c) => {
            if (cell.card.rank === 'A') {
                acePositions.push({ row: r, col: c });
            }
        });
    });

    if (acePositions.length < playerCount) {
        throw new Error(`Not enough 'A' cards to place ${playerCount} players. Try a larger grid.`);
    }

    const shuffledAcePositions = shuffle(acePositions);
    for (let i = 0; i < playerCount; i++) {
        const pos = shuffledAcePositions[i];
        players.push({
            id: i,
            type: i === 0 ? 'human' : 'cpu',
            position: pos,
            isFinished: false,
        });
        updatedGrid[pos.row][pos.col].occupiedBy = i;
    }

    return { players, updatedGrid };
};

export const generateInitialGameState = (size: number, playerCount: number): { grid: Grid; players: Player[] } => {
    const grid = dealGrid(size);
    const { players, updatedGrid } = placePlayers(grid, playerCount);
    return { grid: updatedGrid, players };
};

export const getPossibleMoves = (player: Player, grid: Grid): Move[] => {
    if (!player || player.isFinished) return [];

    const size = grid.length;
    const { row: startRow, col: startCol } = player.position;
    const cardValue = grid[startRow][startCol].card.value;

    const distances = new Map<string, number>();
    const queue: [number, number, number][] = [[startRow, startCol, 0]];
    distances.set(`${startRow},${startCol}`, 0);

    let head = 0;
    while (head < queue.length) {
        const [r, c, dist] = queue[head++];

        const directions = [ { dr: -1, dc: 0 }, { dr: 1, dc: 0 }, { dr: 0, dc: -1 }, { dr: 0, dc: 1 } ];

        for (const { dr, dc } of directions) {
            const newRow = (r + dr + size) % size;
            const newCol = (c + dc + size) % size;
            const posKey = `${newRow},${newCol}`;

            if (!distances.has(posKey)) {
                const targetCell = grid[newRow][newCol];
                if (!targetCell.isInvalid && typeof targetCell.occupiedBy !== 'number') {
                    distances.set(posKey, dist + 1);
                    queue.push([newRow, newCol, dist + 1]);
                }
            }
        }
    }

    const possibleMoves: Move[] = [];
    for (const [posKey, dist] of distances.entries()) {
        if (dist > 0 && dist <= cardValue && (cardValue - dist) % 2 === 0) {
            const [row, col] = posKey.split(',').map(Number);
            possibleMoves.push({ row, col });
        }
    }

    return possibleMoves;
};
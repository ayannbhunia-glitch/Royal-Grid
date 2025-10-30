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

export const generateInitialGameState = (size: number, playerCount: number): { grid: Grid; players: Player[] } => {
    if (playerCount > 4) {
        throw new Error("Game rules do not support more than 4 players.");
    }

    const requiredCards = size * size;
    const grid: Grid = Array(size).fill(null).map(() => Array(size).fill(null));
    const players: Player[] = [];
    
    // 1. Reserve aces for players. We take one of each suit to ensure they are unique cards.
    const playerAces: Card[] = SUITS.slice(0, playerCount).map(suit => ({
        suit,
        rank: 'A',
        value: 1,
    }));

    // 2. Create a pool of remaining cards.
    const baseDeck = createDeck(size);
    
    // Remove the aces we already reserved from the base deck definition
    const baseDeckWithoutReservedAces = baseDeck.filter(card => {
        return !playerAces.some(pa => pa.suit === card.suit && pa.rank === card.rank);
    });

    let remainingCardsPool: Card[] = [];
    if (baseDeckWithoutReservedAces.length > 0) {
        while (remainingCardsPool.length < requiredCards - playerCount) {
            remainingCardsPool.push(...baseDeckWithoutReservedAces);
        }
    }
    
    // Shuffle and take the exact number of cards needed to fill the rest of the grid.
    const cardsForGrid = shuffle(remainingCardsPool).slice(0, requiredCards - playerCount);
    
    // 3. Get all grid positions and shuffle them for random placement.
    const allPositions: { row: number; col: number }[] = [];
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            allPositions.push({ row: r, col: c });
        }
    }
    const shuffledPositions = shuffle(allPositions);

    // 4. Place players with their aces.
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

    // 5. Fill the rest of the grid.
    shuffledPositions.forEach((pos, i) => {
        grid[pos.row][pos.col] = {
            card: cardsForGrid[i],
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
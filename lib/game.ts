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

    const distances = new Map<string, number>();
    const queue: [number, number, number][] = [[startRow, startCol, 0]];
    distances.set(`${startRow},${startCol}`, 0);

    let head = 0;
    while (head < queue.length) {
        const [r, c, dist] = queue[head++];

        const directions = [ { dr: -1, dc: 0 }, { dr: 1, dc: 0 }, { dr: 0, dc: -1 }, { dr: 0, dc: 1 } ];

        for (const { dr, dc } of directions) {
            const newRow = r + dr;
            const newCol = c + dc;
            
            // Ensure moves are within bounds, not wrapping around
            if (newRow >= 0 && newRow < size && newCol >= 0 && newCol < size) {
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
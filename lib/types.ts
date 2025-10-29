export type Suit = 'Spades' | 'Hearts' | 'Clubs' | 'Diamonds';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8';

export interface Card {
  suit: Suit;
  rank: Rank;
  value: number;
}

export interface Cell {
  card: Card;
  isInvalid: boolean;
  occupiedBy?: number; // Player ID
  justMovedTo?: boolean;
}

export type Grid = Cell[][];

export interface Player {
  id: number;
  type: 'human' | 'cpu';
  position: { row: number; col: number };
  isFinished: boolean;
}

export type GameStatus = 'playing' | 'gameOver';

export interface Position {
  row: number;
  col: number;
}

export interface Move extends Position {}

export interface MoveRecord {
  turn: number;
  player: Player;
  card: Card;
  from: Position;
  to: Position;
}

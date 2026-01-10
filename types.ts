// 8-Puzzle Types

// Board state: array of 9 tile values (0-7 are image tiles, 8 is empty)
// Index represents position: [0,1,2] = top row, [3,4,5] = middle, [6,7,8] = bottom
export type BoardState = number[];

// Game progress
export interface GameProgress {
  moves: number;
  isSolved: boolean;
}

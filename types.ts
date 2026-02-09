
export type ColorType = 'blue' | 'red' | 'green' | 'yellow' | 'purple' | 'cyan' | 'orange' | 'pink';

export type SpecialBlockType = 'bomb' | 'frozen' | 'star';

export interface Cell {
  color: ColorType;
  specialType?: SpecialBlockType;
  life?: number; // For frozen blocks
}

export interface ShapeData {
  id: string;
  matrix: number[][];
  color: ColorType;
  specialBlocks?: { r: number, c: number, type: SpecialBlockType }[];
}

export type GridState = (Cell | null)[][];

export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAMEOVER = 'GAMEOVER',
  PAUSED = 'PAUSED',
  LEVEL_UP = 'LEVEL_UP'
}

export enum GameMode {
  CLASSIC = 'CLASSIC',
  TIME_RUSH = 'TIME_RUSH',
  HARD = 'HARD'
}

export interface DailyTask {
  id: string;
  description: string;
  target: number;
  current: number;
  xpReward: number;
  completed: boolean;
}

export interface ScoreState {
  current: number;
  best: number;
  combo: number;
  xp: number;
  level: number;
  timeLeft?: number; // For Time Rush
}

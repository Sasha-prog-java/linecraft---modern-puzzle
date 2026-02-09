
import { ColorType, ShapeData } from './types';

export const GRID_SIZE = 8;

export const COLOR_MAP: Record<ColorType, string> = {
  blue: '#3b82f6',
  red: '#ef4444',
  green: '#22c55e',
  yellow: '#eab308',
  purple: '#a855f7',
  cyan: '#06b6d4',
  orange: '#f97316',
  pink: '#ec4899'
};

export const SHAPE_TEMPLATES: Omit<ShapeData, 'id'>[] = [
  // Dots/Small
  { matrix: [[1]], color: 'blue' },
  // Lines
  { matrix: [[1, 1]], color: 'cyan' },
  { matrix: [[1, 1, 1]], color: 'cyan' },
  { matrix: [[1, 1, 1, 1]], color: 'cyan' },
  { matrix: [[1, 1, 1, 1, 1]], color: 'cyan' },
  { matrix: [[1], [1]], color: 'cyan' },
  { matrix: [[1], [1], [1]], color: 'cyan' },
  { matrix: [[1], [1], [1], [1]], color: 'cyan' },
  // Squares
  { matrix: [[1, 1], [1, 1]], color: 'yellow' },
  { matrix: [[1, 1, 1], [1, 1, 1], [1, 1, 1]], color: 'yellow' },
  // L-Shapes
  { matrix: [[1, 0], [1, 0], [1, 1]], color: 'orange' },
  { matrix: [[0, 1], [0, 1], [1, 1]], color: 'orange' },
  { matrix: [[1, 1], [1, 0], [1, 0]], color: 'orange' },
  { matrix: [[1, 1], [0, 1], [0, 1]], color: 'orange' },
  // T-Shapes
  { matrix: [[1, 1, 1], [0, 1, 0]], color: 'purple' },
  { matrix: [[0, 1, 0], [1, 1, 1]], color: 'purple' },
  { matrix: [[1, 0], [1, 1], [1, 0]], color: 'purple' },
  { matrix: [[0, 1], [1, 1], [0, 1]], color: 'purple' },
  // Z-Shapes
  { matrix: [[1, 1, 0], [0, 1, 1]], color: 'red' },
  { matrix: [[0, 1, 1], [1, 1, 0]], color: 'red' },
  { matrix: [[1, 0], [1, 1], [0, 1]], color: 'red' },
  { matrix: [[0, 1], [1, 1], [1, 0]], color: 'red' }
];

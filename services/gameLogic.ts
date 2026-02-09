
import { SHAPE_TEMPLATES, GRID_SIZE } from '../constants';
import { ShapeData, GridState, ColorType, Cell, SpecialBlockType } from '../types';

export const generateShape = (isSmart: boolean = true, grid?: GridState, difficulty: number = 1): ShapeData => {
  const template = SHAPE_TEMPLATES[Math.floor(Math.random() * SHAPE_TEMPLATES.length)];
  const shape: ShapeData = {
    ...template,
    id: Math.random().toString(36).substr(2, 9),
    specialBlocks: []
  };

  // 1 in 10 chance for special block
  if (Math.random() < 0.1) {
    const ones: {r: number, c: number}[] = [];
    shape.matrix.forEach((row, r) => row.forEach((val, c) => {
      if (val === 1) ones.push({r, c});
    }));
    if (ones.length > 0) {
      const target = ones[Math.floor(Math.random() * ones.length)];
      const types: SpecialBlockType[] = ['bomb', 'frozen', 'star'];
      const type = types[Math.floor(Math.random() * types.length)];
      shape.specialBlocks?.push({ ...target, type });
    }
  }

  return shape;
};

// Smart RNG: Try to ensure at least one shape in the set can be placed
export const generateShapeSet = (grid: GridState): (ShapeData)[] => {
  let shapes: ShapeData[] = [generateShape(), generateShape(), generateShape()];
  
  let attempt = 0;
  while (!isAnyPlacementPossible(grid, shapes) && attempt < 10) {
    shapes = [generateShape(), generateShape(), generateShape()];
    attempt++;
  }
  
  return shapes;
};

export const createEmptyGrid = (size: number = GRID_SIZE): GridState => {
  return Array(size).fill(null).map(() => Array(size).fill(null));
};

export const canPlaceShape = (grid: GridState, shape: ShapeData, row: number, col: number): boolean => {
  const { matrix } = shape;
  const size = grid.length;
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (matrix[r][c] === 1) {
        const targetR = row + r;
        const targetC = col + c;
        if (
          targetR < 0 || targetR >= size ||
          targetC < 0 || targetC >= size ||
          grid[targetR][targetC] !== null
        ) {
          return false;
        }
      }
    }
  }
  return true;
};

export const isAnyPlacementPossible = (grid: GridState, shapes: (ShapeData | null)[]): boolean => {
  const activeShapes = shapes.filter(s => s !== null) as ShapeData[];
  if (activeShapes.length === 0) return true;

  const size = grid.length;
  for (const shape of activeShapes) {
    for (let r = 0; r <= size - shape.matrix.length; r++) {
      for (let c = 0; c <= size - shape.matrix[0].length; c++) {
        if (canPlaceShape(grid, shape, r, c)) {
          return true;
        }
      }
    }
  }
  return false;
};

export const placeShape = (grid: GridState, shape: ShapeData, row: number, col: number): { newGrid: GridState, bombTriggered: boolean } => {
  const newGrid = grid.map(r => [...r]);
  const { matrix, color, specialBlocks } = shape;
  let bombTriggered = false;
  let bombCenter: {r: number, c: number} | null = null;

  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (matrix[r][c] === 1) {
        const special = specialBlocks?.find(sb => sb.r === r && sb.c === c);
        const cell: Cell = { color };
        if (special) {
          cell.specialType = special.type;
          if (special.type === 'frozen') cell.life = 2;
          if (special.type === 'bomb') {
            bombTriggered = true;
            bombCenter = { r: row + r, c: col + c };
          }
        }
        newGrid[row + r][col + c] = cell;
      }
    }
  }

  // Handle Bomb Logic (3x3 area)
  if (bombTriggered && bombCenter) {
    const size = grid.length;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = bombCenter.r + dr;
        const nc = bombCenter.c + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          newGrid[nr][nc] = null;
        }
      }
    }
  }

  return { newGrid, bombTriggered };
};

export const checkLines = (grid: GridState): { newGrid: GridState, linesCleared: number } => {
  const size = grid.length;
  const newGrid = grid.map(r => [...r]);
  const rowsToClear: number[] = [];
  const colsToClear: number[] = [];
  const starTriggers: {r: number, c: number}[] = [];

  // Check rows
  for (let r = 0; r < size; r++) {
    if (newGrid[r].every(cell => cell !== null && (cell.specialType !== 'frozen' || cell.life === 0))) {
      rowsToClear.push(r);
    }
  }

  // Check columns
  for (let c = 0; c < size; c++) {
    let full = true;
    for (let r = 0; r < size; r++) {
      const cell = newGrid[r][c];
      if (cell === null || (cell.specialType === 'frozen' && cell.life! > 0)) {
        full = false;
        break;
      }
    }
    if (full) colsToClear.push(c);
  }

  // Process Frozen Blocks and Stars before clearing
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const cell = newGrid[r][c];
      if (!cell) continue;

      const isInRow = rowsToClear.includes(r);
      const isInCol = colsToClear.includes(c);

      if (isInRow || isInCol) {
        if (cell.specialType === 'frozen' && cell.life! > 0) {
          cell.life! -= 1;
        } else if (cell.specialType === 'star') {
          starTriggers.push({ r, c });
        }
      }
    }
  }

  // Handle Stars (Triggers whole row + col)
  starTriggers.forEach(s => {
    if (!rowsToClear.includes(s.r)) rowsToClear.push(s.r);
    if (!colsToClear.includes(s.c)) colsToClear.push(s.c);
  });

  // Clear rows
  for (const r of rowsToClear) {
    for (let c = 0; c < size; c++) {
      const cell = newGrid[r][c];
      if (!cell || (cell.specialType === 'frozen' && cell.life! > 0)) continue;
      newGrid[r][c] = null;
    }
  }

  // Clear cols
  for (const c of colsToClear) {
    for (let r = 0; r < size; r++) {
      const cell = newGrid[r][c];
      if (!cell || (cell.specialType === 'frozen' && cell.life! > 0)) continue;
      newGrid[r][c] = null;
    }
  }

  return {
    newGrid,
    linesCleared: rowsToClear.length + colsToClear.length
  };
};

export const calculatePoints = (shape: ShapeData, linesCleared: number, combo: number): number => {
  let points = shape.matrix.flat().filter(v => v === 1).length;
  
  if (linesCleared === 1) points += 10;
  else if (linesCleared === 2) points += 25;
  else if (linesCleared === 3) points += 45;
  else if (linesCleared > 3) points += 70;

  if (combo > 1) points *= combo;
  return points;
};

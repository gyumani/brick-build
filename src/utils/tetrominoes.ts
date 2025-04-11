export type TetrominoType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

export interface Tetromino {
  shape: boolean[][];
  color: string;
}

export const TETROMINOES: Record<TetrominoType, Tetromino> = {
  I: {
    shape: [
      [false, false, false, false],
      [true, true, true, true],
      [false, false, false, false],
      [false, false, false, false]
    ],
    color: '#00ffff'
  },
  J: {
    shape: [
      [true, false, false],
      [true, true, true],
      [false, false, false]
    ],
    color: '#0000ff'
  },
  L: {
    shape: [
      [false, false, true],
      [true, true, true],
      [false, false, false]
    ],
    color: '#ff7f00'
  },
  O: {
    shape: [
      [true, true],
      [true, true]
    ],
    color: '#ffff00'
  },
  S: {
    shape: [
      [false, true, true],
      [true, true, false],
      [false, false, false]
    ],
    color: '#00ff00'
  },
  T: {
    shape: [
      [false, true, false],
      [true, true, true],
      [false, false, false]
    ],
    color: '#800080'
  },
  Z: {
    shape: [
      [true, true, false],
      [false, true, true],
      [false, false, false]
    ],
    color: '#ff0000'
  }
};

export const rotateTetromino = (tetromino: Tetromino): Tetromino => {
  const newShape = tetromino.shape[0].map((_, i) =>
    tetromino.shape.map(row => row[i]).reverse()
  );
  return { ...tetromino, shape: newShape };
}; 
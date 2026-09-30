// @owner: ai

/** 방 만들기 화면에서 고를 수 있는 보드 크기 */
export const BOARD_SIZES = [3, 4, 5, 6, 7] as const;
export type BoardSize = (typeof BOARD_SIZES)[number];
export const DEFAULT_BOARD_SIZE: BoardSize = 5;

export const MIN_NUMBER = 1;

/** 보드 크기별 승리에 필요한 완성 줄 수 (게임흐름.md 참고) */
const WIN_LINE_THRESHOLD: Record<BoardSize, number> = { 3: 1, 4: 2, 5: 3, 6: 4, 7: 5 };

export function isBoardSize(value: number): value is BoardSize {
  return (BOARD_SIZES as readonly number[]).includes(value);
}

export function maxNumberForSize(size: BoardSize): number {
  return size * size;
}

export function winLineThresholdForSize(size: BoardSize): number {
  return WIN_LINE_THRESHOLD[size];
}

export type BoardCell = number | null;
export type BoardGrid = BoardCell[][];

export function createEmptyBoard(size: BoardSize): BoardGrid {
  return Array.from({ length: size }, () => Array<BoardCell>(size).fill(null));
}

/** 1~(size*size)를 무작위 순서로 섞어 모든 칸을 한 번에 채운 보드를 만든다. */
export function createRandomBoard(size: BoardSize): BoardGrid {
  const maxNumber = maxNumberForSize(size);
  const numbers = Array.from({ length: maxNumber }, (_, i) => i + MIN_NUMBER);
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }

  const board = createEmptyBoard(size);
  let index = 0;
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      board[row][col] = numbers[index];
      index++;
    }
  }
  return board;
}

export function getPlacedNumbers(board: BoardGrid): Set<number> {
  const placed = new Set<number>();
  for (const row of board) {
    for (const cell of row) {
      if (cell !== null) placed.add(cell);
    }
  }
  return placed;
}

/**
 * 1~(size*size)를 중복 없이 모든 칸에 채웠는지 검증한다.
 * (게임흐름.md "숫자를 중복 배치하거나 칸을 다 못 채운 상태" 참고)
 */
export function isBoardValid(board: BoardGrid, size: BoardSize): boolean {
  const placed = getPlacedNumbers(board);
  const maxNumber = maxNumberForSize(size);
  if (placed.size !== size * size) return false;
  for (let n = MIN_NUMBER; n <= maxNumber; n++) {
    if (!placed.has(n)) return false;
  }
  return true;
}

function setCell(board: BoardGrid, row: number, col: number, value: BoardCell): BoardGrid {
  return board.map((r, ri) => (ri === row ? r.map((cell, ci) => (ci === col ? value : cell)) : r));
}

export function placeNumberOnBoard(board: BoardGrid, value: number, row: number, col: number): BoardGrid {
  return setCell(board, row, col, value);
}

export function clearCellOnBoard(board: BoardGrid, row: number, col: number): BoardGrid {
  return setCell(board, row, col, null);
}

function buildLines(size: number): [number, number][][] {
  const rows = Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => [r, c] as [number, number]),
  );
  const cols = Array.from({ length: size }, (_, c) =>
    Array.from({ length: size }, (_, r) => [r, c] as [number, number]),
  );
  const diagonalDown = Array.from({ length: size }, (_, i) => [i, i] as [number, number]);
  const diagonalUp = Array.from({ length: size }, (_, i) => [i, size - 1 - i] as [number, number]);
  return [...rows, ...cols, diagonalDown, diagonalUp];
}

/**
 * 가로 N줄 + 세로 N줄 + 대각선 2줄 중 완성된 줄 수를 센다. 보드 크기(N)에
 * 따라 필요한 줄 수도 다르다 — `winLineThresholdForSize` 참고.
 * (게임흐름.md "가로/세로/대각선" 참고)
 */
export function countCompletedLines(board: BoardGrid, markedNumbers: ReadonlySet<number>): number {
  const size = board.length;
  return buildLines(size).filter((line) =>
    line.every(([row, col]) => {
      const value = board[row][col];
      return value !== null && markedNumbers.has(value);
    }),
  ).length;
}

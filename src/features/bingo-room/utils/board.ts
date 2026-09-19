// @owner: ai

export const BOARD_SIZE = 5;
export const MIN_NUMBER = 1;
export const MAX_NUMBER = 25;

export type BoardCell = number | null;
export type BoardGrid = BoardCell[][];

export function createEmptyBoard(): BoardGrid {
  return Array.from({ length: BOARD_SIZE }, () => Array<BoardCell>(BOARD_SIZE).fill(null));
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
 * 1~25를 중복 없이 25칸 모두 채웠는지 검증한다.
 * (게임흐름.md "숫자를 중복 배치하거나 25칸을 다 못 채운 상태" 참고)
 */
export function isBoardValid(board: BoardGrid): boolean {
  const placed = getPlacedNumbers(board);
  if (placed.size !== BOARD_SIZE * BOARD_SIZE) return false;
  for (let n = MIN_NUMBER; n <= MAX_NUMBER; n++) {
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

function buildLines(): [number, number][][] {
  const rows = Array.from({ length: BOARD_SIZE }, (_, r) =>
    Array.from({ length: BOARD_SIZE }, (_, c) => [r, c] as [number, number]),
  );
  const cols = Array.from({ length: BOARD_SIZE }, (_, c) =>
    Array.from({ length: BOARD_SIZE }, (_, r) => [r, c] as [number, number]),
  );
  const diagonalDown = Array.from({ length: BOARD_SIZE }, (_, i) => [i, i] as [number, number]);
  const diagonalUp = Array.from({ length: BOARD_SIZE }, (_, i) => [i, BOARD_SIZE - 1 - i] as [number, number]);
  return [...rows, ...cols, diagonalDown, diagonalUp];
}

const LINES = buildLines();

/**
 * 가로 5줄 + 세로 5줄 + 대각선 2줄 = 12줄 중 완성된 줄 수를 센다.
 * (게임흐름.md "가로 5줄, 세로 5줄, 대각선 2줄 = 총 12개 라인" 참고)
 */
export function countCompletedLines(board: BoardGrid, markedNumbers: ReadonlySet<number>): number {
  return LINES.filter((line) =>
    line.every(([row, col]) => {
      const value = board[row][col];
      return value !== null && markedNumbers.has(value);
    }),
  ).length;
}

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

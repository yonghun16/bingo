// @owner: ai
import { useState } from "react";
import {
  MAX_NUMBER,
  MIN_NUMBER,
  clearCellOnBoard,
  createEmptyBoard,
  getPlacedNumbers,
  isBoardValid,
  placeNumberOnBoard,
  type BoardGrid,
} from "../utils/board";

interface UseBingoBoardResult {
  board: BoardGrid;
  /** 아직 보드에 배치하지 않은 숫자 목록 (오름차순) */
  availableNumbers: number[];
  selectedNumber: number | null;
  isValid: boolean;
  /** 숫자 팔레트에서 숫자를 고른다. 이미 선택된 숫자를 다시 누르면 선택 해제된다 */
  selectNumber: (value: number) => void;
  /** 빈 칸이면 선택된 숫자를 배치하고, 채워진 칸이면 비운다 */
  placeAt: (row: number, col: number) => void;
  reset: () => void;
}

/**
 * 5x5 빙고판에 1~25 숫자를 클릭으로 배치하는 로컬 상태.
 * (002-board-setup 스펙 참고)
 */
export function useBingoBoard(): UseBingoBoardResult {
  const [board, setBoard] = useState<BoardGrid>(() => createEmptyBoard());
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);

  const placedNumbers = getPlacedNumbers(board);
  const availableNumbers = Array.from(
    { length: MAX_NUMBER - MIN_NUMBER + 1 },
    (_, index) => index + MIN_NUMBER,
  ).filter((n) => !placedNumbers.has(n));

  const selectNumber = (value: number) => {
    setSelectedNumber((current) => (current === value ? null : value));
  };

  const placeAt = (row: number, col: number) => {
    if (board[row][col] !== null) {
      setBoard((current) => clearCellOnBoard(current, row, col));
      return;
    }
    if (selectedNumber === null) return;
    setBoard((current) => placeNumberOnBoard(current, selectedNumber, row, col));
    setSelectedNumber(null);
  };

  const reset = () => {
    setBoard(createEmptyBoard());
    setSelectedNumber(null);
  };

  return { board, availableNumbers, selectedNumber, isValid: isBoardValid(board), selectNumber, placeAt, reset };
}

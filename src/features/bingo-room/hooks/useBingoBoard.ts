// @owner: ai
import { useCallback, useEffect, useState } from "react";
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
import { loadSavedBoard, saveBoard } from "../utils/roomStorage";

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
 * localStorage에도 같이 저장해서, 같은 브라우저로 새로고침해도 배치가
 * 남아있게 한다 — 이 보드는 아무에게도 공유되지 않으므로(게임 종료 전까지),
 * 새로고침 시 복구할 수 있는 곳이 로컬 저장소뿐이다 (006-reconnect-sync 참고).
 *
 * @param roomId - 저장 키로 쓸 방 ID
 */
export function useBingoBoard(roomId: string): UseBingoBoardResult {
  const [board, setBoard] = useState<BoardGrid>(() => loadSavedBoard(roomId) ?? createEmptyBoard());
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);

  useEffect(() => {
    saveBoard(roomId, board);
  }, [roomId, board]);

  const placedNumbers = getPlacedNumbers(board);
  const availableNumbers = Array.from(
    { length: MAX_NUMBER - MIN_NUMBER + 1 },
    (_, index) => index + MIN_NUMBER,
  ).filter((n) => !placedNumbers.has(n));

  const selectNumber = useCallback((value: number) => {
    setSelectedNumber((current) => (current === value ? null : value));
  }, []);

  const placeAt = useCallback(
    (row: number, col: number) => {
      if (board[row][col] !== null) {
        setBoard((current) => clearCellOnBoard(current, row, col));
        return;
      }
      if (selectedNumber === null) return;
      setBoard((current) => placeNumberOnBoard(current, selectedNumber, row, col));
      setSelectedNumber(null);
    },
    [board, selectedNumber],
  );

  const reset = useCallback(() => {
    setBoard(createEmptyBoard());
    setSelectedNumber(null);
  }, []);

  return { board, availableNumbers, selectedNumber, isValid: isBoardValid(board), selectNumber, placeAt, reset };
}

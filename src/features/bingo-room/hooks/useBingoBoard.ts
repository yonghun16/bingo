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

interface SelectedCell {
  row: number;
  col: number;
}

interface UseBingoBoardResult {
  board: BoardGrid;
  /** 아직 보드에 배치하지 않은 숫자 목록 (오름차순) */
  availableNumbers: number[];
  selectedNumber: number | null;
  /** 숫자보다 빈 칸을 먼저 선택해둔 경우, 그 대상 칸 */
  selectedCell: SelectedCell | null;
  isValid: boolean;
  /**
   * 숫자 팔레트에서 숫자를 고른다. 빈 칸을 먼저 선택해둔 상태라면 그
   * 칸에 바로 배치하고 선택을 정리한다. 그렇지 않으면 이 숫자를
   * "선택된 상태"로 표시해두고, 다음에 클릭하는 빈 칸에 배치한다.
   * 이미 선택된 숫자를 다시 누르면 선택 해제된다.
   */
  selectNumber: (value: number) => void;
  /**
   * 빈 칸을 클릭하면: 숫자가 이미 선택돼 있으면 그 자리에 바로 배치하고,
   * 아니면 이 칸을 "다음에 넣을 자리"로 선택해둔다(같은 칸을 다시 누르면
   * 선택 해제). 채워진 칸을 클릭하면 비운다.
   */
  placeAt: (row: number, col: number) => void;
  reset: () => void;
}

/**
 * 5x5 빙고판에 1~25 숫자를 배치하는 로컬 상태. "숫자 먼저 → 칸"과
 * "칸 먼저 → 숫자" 두 가지 입력 순서를 모두 지원한다.
 * localStorage에도 같이 저장해서, 같은 브라우저로 새로고침해도 배치가
 * 남아있게 한다 — 이 보드는 아무에게도 공유되지 않으므로(게임 종료 전까지),
 * 새로고침 시 복구할 수 있는 곳이 로컬 저장소뿐이다 (006-reconnect-sync 참고).
 *
 * @param roomId - 저장 키로 쓸 방 ID
 */
export function useBingoBoard(roomId: string): UseBingoBoardResult {
  const [board, setBoard] = useState<BoardGrid>(() => loadSavedBoard(roomId) ?? createEmptyBoard());
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);

  useEffect(() => {
    saveBoard(roomId, board);
  }, [roomId, board]);

  const placedNumbers = getPlacedNumbers(board);
  const availableNumbers = Array.from(
    { length: MAX_NUMBER - MIN_NUMBER + 1 },
    (_, index) => index + MIN_NUMBER,
  ).filter((n) => !placedNumbers.has(n));

  const selectNumber = useCallback(
    (value: number) => {
      if (selectedCell) {
        setBoard((current) => placeNumberOnBoard(current, value, selectedCell.row, selectedCell.col));
        setSelectedCell(null);
        return;
      }
      setSelectedNumber((current) => (current === value ? null : value));
    },
    [selectedCell],
  );

  const placeAt = useCallback(
    (row: number, col: number) => {
      if (board[row][col] !== null) {
        setBoard((current) => clearCellOnBoard(current, row, col));
        setSelectedCell((cell) => (cell && cell.row === row && cell.col === col ? null : cell));
        return;
      }
      if (selectedNumber !== null) {
        setBoard((current) => placeNumberOnBoard(current, selectedNumber, row, col));
        setSelectedNumber(null);
        return;
      }
      setSelectedCell((cell) => (cell && cell.row === row && cell.col === col ? null : { row, col }));
    },
    [board, selectedNumber],
  );

  const reset = useCallback(() => {
    setBoard(createEmptyBoard());
    setSelectedNumber(null);
    setSelectedCell(null);
  }, []);

  return {
    board,
    availableNumbers,
    selectedNumber,
    selectedCell,
    isValid: isBoardValid(board),
    selectNumber,
    placeAt,
    reset,
  };
}

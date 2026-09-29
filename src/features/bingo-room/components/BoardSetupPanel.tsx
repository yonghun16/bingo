// @owner: ai
import { maxNumberForSize, winLineThresholdForSize, type BoardGrid, type BoardSize } from "../utils/board";
import { BingoBoard } from "./BingoBoard";
import { NumberPalette } from "./NumberPalette";

interface BoardSetupPanelProps {
  board: BoardGrid;
  availableNumbers: number[];
  selectedNumber: number | null;
  selectedCell: { row: number; col: number } | null;
  isValid: boolean;
  isReady: boolean;
  onSelectNumber: (value: number) => void;
  onCellClick: (row: number, col: number) => void;
  onReset: () => void;
  onRandomize: () => void;
  onReadyClick: () => void;
}

/**
 * 1~N 숫자를 보드 크기(3x3/4x4/5x5)에 맞게 배치하고 준비 완료를 누르는 화면.
 * 준비 완료 후에도 보드/팔레트는 계속 눌러서 바꿀 수 있고(막아버리면
 * 다시 배치를 바꿀 방법이 없어진다), 바꾸면 상위(RoomPage)가 준비 상태를
 * 자동으로 되돌린다 (002-board-setup 스펙 참고).
 */
export function BoardSetupPanel({
  board,
  availableNumbers,
  selectedNumber,
  selectedCell,
  isValid,
  isReady,
  onSelectNumber,
  onCellClick,
  onReset,
  onRandomize,
  onReadyClick,
}: BoardSetupPanelProps) {
  const size = board.length as BoardSize;
  const maxNumber = maxNumberForSize(size);
  const winLineThreshold = winLineThresholdForSize(size);

  return (
    <section className="flex w-full max-w-xs flex-col items-center gap-4">
      <p className="text-sm text-slate-400">승리 조건: {winLineThreshold}줄 완성</p>
      <BingoBoard board={board} onCellClick={onCellClick} selectedCell={selectedCell} />
      <NumberPalette
        availableNumbers={availableNumbers}
        selectedNumber={selectedNumber}
        onSelect={onSelectNumber}
        size={size}
      />
      <p className="text-xs text-slate-500">숫자를 먼저 고르거나, 칸을 먼저 선택한 뒤 숫자를 눌러도 배치됩니다.</p>
      <button
        type="button"
        onClick={onRandomize}
        className="w-full rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/20"
      >
        무작위로 채우기
      </button>
      <div className="flex w-full gap-2">
        <button
          type="button"
          onClick={onReset}
          className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-700"
        >
          초기화
        </button>
        <button
          type="button"
          onClick={onReadyClick}
          disabled={!isValid || isReady}
          className="flex-1 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isReady ? "준비 완료" : "준비 완료하기"}
        </button>
      </div>
      {!isValid && !isReady ? (
        <p className="text-sm text-slate-400">1~{maxNumber} 숫자를 빈칸 없이 모두 배치해주세요.</p>
      ) : null}
      {isReady ? <p className="text-sm text-emerald-400">준비 완료! 다른 참가자를 기다리는 중입니다.</p> : null}
    </section>
  );
}

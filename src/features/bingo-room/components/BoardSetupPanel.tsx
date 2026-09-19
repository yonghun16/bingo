// @owner: ai
import type { BoardGrid } from "../utils/board";
import { BingoBoard } from "./BingoBoard";
import { NumberPalette } from "./NumberPalette";

interface BoardSetupPanelProps {
  board: BoardGrid;
  availableNumbers: number[];
  selectedNumber: number | null;
  isValid: boolean;
  isReady: boolean;
  onSelectNumber: (value: number) => void;
  onCellClick: (row: number, col: number) => void;
  onReset: () => void;
  onReadyClick: () => void;
}

/**
 * 1~25 숫자를 5x5 보드에 배치하고 준비 완료를 누르는 화면.
 * 준비 완료 후에도 보드/팔레트는 계속 눌러서 바꿀 수 있고(막아버리면
 * 다시 배치를 바꿀 방법이 없어진다), 바꾸면 상위(RoomPage)가 준비 상태를
 * 자동으로 되돌린다 (002-board-setup 스펙 참고).
 */
export function BoardSetupPanel({
  board,
  availableNumbers,
  selectedNumber,
  isValid,
  isReady,
  onSelectNumber,
  onCellClick,
  onReset,
  onReadyClick,
}: BoardSetupPanelProps) {
  return (
    <section className="flex w-full max-w-xs flex-col items-center gap-4">
      <BingoBoard board={board} onCellClick={onCellClick} />
      <NumberPalette availableNumbers={availableNumbers} selectedNumber={selectedNumber} onSelect={onSelectNumber} />
      <div className="flex w-full gap-2">
        <button
          type="button"
          onClick={onReset}
          className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          초기화
        </button>
        <button
          type="button"
          onClick={onReadyClick}
          disabled={!isValid || isReady}
          className="flex-1 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isReady ? "준비 완료" : "준비 완료하기"}
        </button>
      </div>
      {!isValid && !isReady ? (
        <p className="text-sm text-slate-500">1~25 숫자를 빈칸 없이 모두 배치해주세요.</p>
      ) : null}
      {isReady ? <p className="text-sm text-emerald-600">준비 완료! 다른 참가자를 기다리는 중입니다.</p> : null}
    </section>
  );
}

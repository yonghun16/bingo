// @owner: ai
import { useBingoBoard } from "../hooks/useBingoBoard";
import { BingoBoard } from "./BingoBoard";
import { NumberPalette } from "./NumberPalette";

interface BoardSetupPanelProps {
  /** Presence에 반영된 이 참가자의 준비 상태 */
  isReady: boolean;
  onReady: () => void;
  /** 준비 완료 상태에서 보드를 다시 바꿨을 때 호출된다 (isReady를 되돌리는 용도) */
  onUnready: () => void;
}

/**
 * 1~25 숫자를 5x5 보드에 배치하고 준비 완료를 누르는 화면.
 * (002-board-setup 스펙 참고)
 */
export function BoardSetupPanel({ isReady, onReady, onUnready }: BoardSetupPanelProps) {
  const { board, availableNumbers, selectedNumber, isValid, selectNumber, placeAt, reset } = useBingoBoard();

  const handleCellClick = (row: number, col: number) => {
    placeAt(row, col);
    if (isReady) onUnready();
  };

  return (
    <section className="flex w-full max-w-xs flex-col items-center gap-4">
      <BingoBoard board={board} onCellClick={handleCellClick} disabled={isReady} />
      <NumberPalette
        availableNumbers={availableNumbers}
        selectedNumber={selectedNumber}
        onSelect={selectNumber}
        disabled={isReady}
      />
      <div className="flex w-full gap-2">
        <button
          type="button"
          onClick={reset}
          disabled={isReady}
          className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          초기화
        </button>
        <button
          type="button"
          onClick={onReady}
          disabled={!isValid || isReady}
          className="flex-1 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isReady ? "준비 완료" : "준비 완료하기"}
        </button>
      </div>
      {!isValid && !isReady ? (
        <p className="text-sm text-slate-500">1~25 숫자를 빈칸 없이 모두 배치해주세요.</p>
      ) : null}
    </section>
  );
}

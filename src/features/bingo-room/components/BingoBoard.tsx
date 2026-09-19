// @owner: ai
import type { BoardGrid } from "../utils/board";

interface BingoBoardProps {
  board: BoardGrid;
  onCellClick: (row: number, col: number) => void;
  disabled?: boolean;
  /** 호출된 숫자와 겹치는 칸을 시각적으로 마킹 표시한다 (게임 진행 중) */
  markedNumbers?: ReadonlySet<number>;
}

export function BingoBoard({ board, onCellClick, disabled = false, markedNumbers }: BingoBoardProps) {
  return (
    <div className="grid w-full max-w-xs grid-cols-5 gap-1">
      {board.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          const isMarked = cell !== null && markedNumbers?.has(cell) === true;
          return (
            <button
              key={`${rowIndex}-${colIndex}`}
              type="button"
              disabled={disabled}
              onClick={() => onCellClick(rowIndex, colIndex)}
              className={`flex aspect-square items-center justify-center rounded-md border text-lg font-semibold transition disabled:cursor-not-allowed ${
                isMarked
                  ? "border-emerald-400 bg-emerald-100 text-emerald-700"
                  : "border-slate-300 bg-white text-slate-800 hover:bg-slate-100 disabled:opacity-60"
              }`}
            >
              {cell ?? ""}
            </button>
          );
        }),
      )}
    </div>
  );
}

// @owner: ai
import type { BoardGrid } from "../utils/board";
import { gridColsClass } from "../utils/gridLayout";

interface BingoBoardProps {
  board: BoardGrid;
  onCellClick: (row: number, col: number) => void;
  disabled?: boolean;
  /** 호출된 숫자와 겹치는 칸을 시각적으로 마킹 표시한다 (게임 진행 중) */
  markedNumbers?: ReadonlySet<number>;
  /** 세팅 단계에서 숫자보다 먼저 선택해둔 빈 칸(다음 숫자를 여기에 넣는다) */
  selectedCell?: { row: number; col: number } | null;
  /** 마킹된 칸의 색 테마. 우승자 보드를 금색으로 강조할 때 "gold"를 쓴다 */
  markedVariant?: "emerald" | "gold";
}

const MARKED_VARIANT_CLASS: Record<"emerald" | "gold", string> = {
  emerald: "border-emerald-400 bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.45)]",
  gold: "border-amber-300 bg-amber-400 text-slate-900 shadow-[0_0_14px_rgba(251,191,36,0.65)]",
};

export function BingoBoard({
  board,
  onCellClick,
  disabled = false,
  markedNumbers,
  selectedCell,
  markedVariant = "emerald",
}: BingoBoardProps) {
  return (
    <div className={`grid w-full max-w-xs gap-1 ${gridColsClass(board.length)}`}>
      {board.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          const isMarked = cell !== null && markedNumbers?.has(cell) === true;
          const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
          return (
            <button
              key={`${rowIndex}-${colIndex}`}
              type="button"
              disabled={disabled}
              onClick={() => onCellClick(rowIndex, colIndex)}
              className={`flex aspect-square items-center justify-center rounded-md border text-lg font-semibold transition disabled:cursor-not-allowed ${
                isMarked
                  ? MARKED_VARIANT_CLASS[markedVariant]
                  : isSelected
                    ? "border-emerald-400 bg-slate-700 text-white ring-2 ring-emerald-400"
                    : "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-50"
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

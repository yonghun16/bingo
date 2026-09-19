// @owner: ai
import type { BoardGrid } from "../utils/board";

interface BingoBoardProps {
  board: BoardGrid;
  onCellClick: (row: number, col: number) => void;
  disabled?: boolean;
}

export function BingoBoard({ board, onCellClick, disabled = false }: BingoBoardProps) {
  return (
    <div className="grid w-full max-w-xs grid-cols-5 gap-1">
      {board.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <button
            key={`${rowIndex}-${colIndex}`}
            type="button"
            disabled={disabled}
            onClick={() => onCellClick(rowIndex, colIndex)}
            className="flex aspect-square items-center justify-center rounded-md border border-slate-300 bg-white text-lg font-semibold text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cell ?? ""}
          </button>
        )),
      )}
    </div>
  );
}

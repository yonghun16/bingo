// @owner: ai
import { gridColsClass } from "../utils/gridLayout";

interface NumberPaletteProps {
  availableNumbers: number[];
  selectedNumber: number | null;
  onSelect: (value: number) => void;
  disabled?: boolean;
  /** 보드 크기(3/4/5) — 숫자 개수(size*size)와 정확히 맞는 격자로 보여주기 위함 */
  size: number;
}

export function NumberPalette({
  availableNumbers,
  selectedNumber,
  onSelect,
  disabled = false,
  size,
}: NumberPaletteProps) {
  return (
    <div className={`grid w-full max-w-xs gap-1 ${gridColsClass(size)}`}>
      {availableNumbers.map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(n)}
          className={`rounded-md border px-2 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
            selectedNumber === n
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

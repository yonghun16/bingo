// @owner: ai
interface NumberPaletteProps {
  availableNumbers: number[];
  selectedNumber: number | null;
  onSelect: (value: number) => void;
  disabled?: boolean;
}

export function NumberPalette({
  availableNumbers,
  selectedNumber,
  onSelect,
  disabled = false,
}: NumberPaletteProps) {
  return (
    <div className="grid w-full max-w-xs grid-cols-5 gap-1">
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

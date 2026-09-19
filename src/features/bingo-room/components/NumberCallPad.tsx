// @owner: ai
import { MAX_NUMBER, MIN_NUMBER } from "../utils/board";

interface NumberCallPadProps {
  calledNumbers: number[];
  /** 내 턴이 아니면 전체를 비활성화한다 */
  disabled: boolean;
  onCall: (value: number) => void;
}

/**
 * 1~25 전체를 항상 보여주고, 이미 호출된 숫자는 개별적으로 비활성화한다.
 * (세팅 단계의 NumberPalette와 달리 숫자를 숨기지 않는다 — "이미 불린
 * 숫자는 다시 호출할 수 없다"는 걸 직접 보여줘야 하기 때문)
 */
export function NumberCallPad({ calledNumbers, disabled, onCall }: NumberCallPadProps) {
  const calledSet = new Set(calledNumbers);

  return (
    <div className="grid w-full max-w-xs grid-cols-5 gap-1">
      {Array.from({ length: MAX_NUMBER - MIN_NUMBER + 1 }, (_, index) => index + MIN_NUMBER).map((n) => {
        const isCalled = calledSet.has(n);
        return (
          <button
            key={n}
            type="button"
            disabled={disabled || isCalled}
            onClick={() => onCall(n)}
            className={`rounded-md border px-2 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed ${
              isCalled
                ? "border-slate-200 bg-slate-100 text-slate-400"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-60"
            }`}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}

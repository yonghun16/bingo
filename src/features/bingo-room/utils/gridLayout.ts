// @owner: ai
import type { BoardSize } from "./board";

/**
 * Tailwind는 클래스 이름을 소스 코드에서 정적으로 찾기 때문에, `grid-cols-${size}`처럼
 * 동적으로 문자열을 조합하면 인식하지 못한다. 그래서 실제 쓸 수 있는 클래스 이름을
 * 전부 리터럴로 나열해두고 조회만 동적으로 한다.
 */
const GRID_COLS_CLASS: Record<BoardSize, string> = {
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
  7: "grid-cols-7",
};

/** 보드 크기에 맞는 Tailwind `grid-cols-N` 클래스를 반환한다. */
export function gridColsClass(size: number): string {
  return GRID_COLS_CLASS[size as BoardSize] ?? GRID_COLS_CLASS[5];
}

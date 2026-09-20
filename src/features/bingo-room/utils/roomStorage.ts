// @owner: ai
import type { BoardGrid } from "./board";

const NICKNAME_KEY_PREFIX = "bingo:nickname:";
const BOARD_KEY_PREFIX = "bingo:board:";

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // 프라이빗 모드 등으로 저장이 막혀 있어도 앱은 정상 동작해야 한다.
    // 이 경우 새로고침 복구만 안 될 뿐이다.
  }
}

/**
 * 방 상태(Presence/broadcast)는 새로고침해도 재접속으로 복구되지만, 각자
 * 로컬에만 있는 닉네임/보드는 그렇지 않다. 같은 브라우저의 새로고침이라면
 * localStorage에 남겨둔 값으로 복구한다(006-reconnect-sync 스펙 참고).
 */
export function loadSavedNickname(roomId: string): string | null {
  return safeGet(NICKNAME_KEY_PREFIX + roomId);
}

export function saveNickname(roomId: string, nickname: string): void {
  safeSet(NICKNAME_KEY_PREFIX + roomId, nickname);
}

export function loadSavedBoard(roomId: string): BoardGrid | null {
  const raw = safeGet(BOARD_KEY_PREFIX + roomId);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as BoardGrid) : null;
  } catch {
    return null;
  }
}

export function saveBoard(roomId: string, board: BoardGrid): void {
  safeSet(BOARD_KEY_PREFIX + roomId, JSON.stringify(board));
}

// @owner: ai

/**
 * `bingo-room-{roomId}` 채널의 Broadcast 이벤트 payload 타입.
 * (docs/content/기획/게임흐름.md "Supabase Realtime 이벤트" 참고)
 */

export interface SetBoardPayload {
  board: number[][];
}

export interface GameStartedPayload {
  turnOrder: string[];
  turnSeq: number;
  turnStartedAt: number;
}

export interface NumberCalledPayload {
  number: number;
  auto: boolean;
  turnSeq: number;
  turnStartedAt: number;
}

export interface BingoCompletedPayload {
  nickname: string;
  completedLines: number;
  turnSeq: number;
}

/**
 * 우승자 id(Presence key = 닉네임) 목록만 담는다. 호스트는 각 참가자의
 * 보드 내용을 갖고 있지 않으므로(private) game-over에 전체 보드를 함께
 * 담아 보낼 수 없다 — 보드 공개는 각자 `board-revealed`로 따로 한다.
 */
export interface GameOverPayload {
  winnerIds: string[];
}

/** 게임 종료 후 각자 자신의 보드를 공개할 때 보내는 이벤트 */
export interface BoardRevealedPayload {
  playerId: string;
  board: (number | null)[][];
}

export type RestartGamePayload = Record<string, never>;

export interface ChatMessagePayload {
  nickname: string;
  message: string;
  sentAt: number;
}

export type RequestStatePayload = Record<string, never>;

/**
 * `players`는 담지 않는다 — 참가자 목록은 Presence로 이미 각자 동기화되고
 * 있으므로, 여기서는 Presence로는 알 수 없는 "진행 중인 게임" 정보만
 * 담는다 (재접속한 클라이언트가 request-state로 요청, 006-reconnect-sync 참고).
 */
export interface StateSyncPayload {
  roomStatus: "waiting" | "playing" | "ended";
  turnOrder: string[] | null;
  turnSeq: number | null;
  turnStartedAt: number | null;
  calledNumbers: number[];
  winnerIds: string[] | null;
  revealedBoards: Record<string, (number | null)[][]>;
}

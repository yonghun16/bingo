// @owner: ai
import type { Player, Room } from "./domain";

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

export interface CallNumberPayload {
  number: number;
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

export interface GameOverPayload {
  winners: Player[];
  players: Player[];
}

export type RestartGamePayload = Record<string, never>;

export interface ChatMessagePayload {
  nickname: string;
  message: string;
  sentAt: number;
}

export type RequestStatePayload = Record<string, never>;

export interface StateSyncPayload {
  room: Room;
}

// @owner: ai
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import {
  broadcast,
  leaveRoomChannel,
  subscribeToRoomChannel,
  trackPresence,
  untrackPresence,
} from "../api/roomChannel";
import type { BingoCompletedPayload, GameStartedPayload, NumberCalledPayload } from "../types/events";
import type { Player, RoomPresencePayload } from "../types/domain";
import { MAX_NUMBER, MIN_NUMBER, countCompletedLines, type BoardGrid } from "../utils/board";

const ROOM_CAPACITY = 5;
const MIN_PLAYERS_TO_START = 2;
const TURN_DURATION_MS = 10_000;
const BINGO_LINE_THRESHOLD = 3;
const ALL_NUMBERS = Array.from({ length: MAX_NUMBER - MIN_NUMBER + 1 }, (_, i) => i + MIN_NUMBER);

export type JoinRoomResult =
  | { ok: true }
  | { ok: false; reason: "full" | "duplicate-nickname" | "already-started" | "config-error" };

interface UseRoomPresenceResult {
  /** 현재 방에 있는 참가자 목록 (Presence 기준) */
  players: Player[];
  playerCount: number;
  isRoomFull: boolean;
  /** 입장 시각이 가장 이른 참가자. 턴 타이머/승자 확정을 담당하는 호스트(001-room-lifecycle 참고) */
  host: Player | null;
  /** 이 클라이언트 자신의 Player. 아직 입장하지 않았으면 null */
  currentPlayer: Player | null;
  roomStatus: "waiting" | "playing";
  /** game-started 시점의 턴 순서(참가자 id 목록). 아직 시작 전이면 null */
  turnOrder: string[] | null;
  turnSeq: number | null;
  turnStartedAt: number | null;
  /** 지금까지 호출된 숫자 (호출 순서) */
  calledNumbers: number[];
  /** 내 보드에서 호출된 숫자와 겹치는 칸 */
  markedNumbers: Set<number>;
  /** 내 보드 기준 완성된 라인 수 */
  completedLines: number;
  /** 지금 턴인 참가자 id. 게임 시작 전이면 null */
  currentTurnPlayerId: string | null;
  /** 닉네임 중복·정원(5명)·이미 시작된 방 여부를 검증한 뒤 입장을 시도한다 */
  join: (nickname: string) => Promise<JoinRoomResult>;
  /** 방을 나간다 (Presence에서 내리고 채널 구독도 해제) */
  leave: () => void;
  /** 본인 준비 상태를 갱신한다 (보드를 다시 바꾸면 false로 되돌리는 용도) */
  setReady: (isReady: boolean) => void;
  /** 내 턴에 숫자를 호출한다. 내 턴이 아니거나 이미 호출된 숫자면 무시된다 */
  callNumber: (value: number) => void;
}

type PresenceState = Record<string, (RoomPresencePayload & { presence_ref: string })[]>;

function toPlayers(state: PresenceState): Player[] {
  return Object.entries(state).map(([id, metas]) => {
    const payload = metas[0];
    return {
      id,
      nickname: payload.nickname,
      board: null,
      markedNumbers: [],
      isReady: payload.isReady,
      completedLines: payload.completedLines,
      joinedAt: payload.joinedAt,
    };
  });
}

/**
 * 방의 Presence 상태로부터 참가자 목록/인원수/호스트를 계산하고, 닉네임
 * 중복·정원(5명)·이미 시작된 방 여부를 검증해 입장(track)을 처리한다.
 * 전원 준비 완료 시 호스트가 game-started를 broadcast해 게임을 시작하고,
 * 이후 턴 진행(숫자 호출·마킹·라인 판정·시간 초과 자동 호출)까지 담당한다.
 * (001-room-lifecycle, 002-board-setup, 003-turn-gameplay 스펙 참고)
 *
 * @param roomId - 방 ID
 * @param board - 이 클라이언트의 빙고판(5x5). 세팅 전이면 null.
 */
export function useRoomPresence(roomId: string, board: BoardGrid | null): UseRoomPresenceResult {
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentNickname, setCurrentNickname] = useState<string | null>(null);
  const [roomStatus, setRoomStatus] = useState<"waiting" | "playing">("waiting");
  const [turnOrder, setTurnOrder] = useState<string[] | null>(null);
  const [turnSeq, setTurnSeq] = useState<number | null>(null);
  const [turnStartedAt, setTurnStartedAt] = useState<number | null>(null);
  const [calledNumbers, setCalledNumbers] = useState<number[]>([]);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const selfPayloadRef = useRef<RoomPresencePayload | null>(null);
  const hasStartedRef = useRef(false);
  const appliedTurnSeqRef = useRef(0);
  const calledNumbersRef = useRef<number[]>([]);
  const hasBingoCompletedRef = useRef(false);

  useEffect(() => {
    calledNumbersRef.current = calledNumbers;
  }, [calledNumbers]);

  const leave = useCallback(() => {
    const channel = channelRef.current;
    if (!channel) return;
    void untrackPresence(channel);
    leaveRoomChannel(channel);
    channelRef.current = null;
    selfPayloadRef.current = null;
    hasStartedRef.current = false;
    appliedTurnSeqRef.current = 0;
    hasBingoCompletedRef.current = false;
    setCurrentNickname(null);
    setPlayers([]);
    setRoomStatus("waiting");
    setTurnOrder(null);
    setTurnSeq(null);
    setTurnStartedAt(null);
    setCalledNumbers([]);
  }, []);

  useEffect(() => {
    return () => leave();
  }, [leave]);

  const applyGameStarted = useCallback((payload: GameStartedPayload) => {
    hasStartedRef.current = true;
    setRoomStatus("playing");
    setTurnOrder(payload.turnOrder);
    setTurnSeq(payload.turnSeq);
    setTurnStartedAt(payload.turnStartedAt);

    const channel = channelRef.current;
    if (channel && selfPayloadRef.current) {
      const next: RoomPresencePayload = { ...selfPayloadRef.current, roomStatus: "playing" };
      selfPayloadRef.current = next;
      void trackPresence(channel, next);
    }
  }, []);

  const applyNumberCalled = useCallback((payload: NumberCalledPayload) => {
    if (payload.turnSeq <= appliedTurnSeqRef.current) return; // 이미 처리한 턴 (경합/중복)
    appliedTurnSeqRef.current = payload.turnSeq;
    setCalledNumbers((prev) => (prev.includes(payload.number) ? prev : [...prev, payload.number]));
    setTurnSeq(payload.turnSeq + 1);
    setTurnStartedAt(payload.turnStartedAt);
  }, []);

  const join = useCallback(
    (nickname: string): Promise<JoinRoomResult> => {
      return new Promise((resolve) => {
        let channel: RealtimeChannel;
        try {
          channel = subscribeToRoomChannel(roomId, nickname);
        } catch (error) {
          console.error("Supabase 방 채널 구독 실패:", error);
          resolve({ ok: false, reason: "config-error" });
          return;
        }

        channel.on("presence", { event: "sync" }, () => {
          setPlayers(toPlayers(channel.presenceState<RoomPresencePayload>()));
        });

        channel.on("broadcast", { event: "game-started" }, ({ payload }) => {
          applyGameStarted(payload as GameStartedPayload);
        });

        channel.on("broadcast", { event: "number-called" }, ({ payload }) => {
          applyNumberCalled(payload as NumberCalledPayload);
        });

        channel.subscribe((status) => {
          if (status !== "SUBSCRIBED") return;

          const state = channel.presenceState<RoomPresencePayload>();
          const isDuplicate = Object.prototype.hasOwnProperty.call(state, nickname);
          if (isDuplicate) {
            leaveRoomChannel(channel);
            resolve({ ok: false, reason: "duplicate-nickname" });
            return;
          }

          const isAlreadyStarted = Object.values(state).some((metas) => metas[0]?.roomStatus === "playing");
          if (isAlreadyStarted) {
            leaveRoomChannel(channel);
            resolve({ ok: false, reason: "already-started" });
            return;
          }

          const currentCount = Object.keys(state).length;
          if (currentCount >= ROOM_CAPACITY) {
            leaveRoomChannel(channel);
            resolve({ ok: false, reason: "full" });
            return;
          }

          const payload: RoomPresencePayload = {
            nickname,
            isReady: false,
            joinedAt: Date.now(),
            roomStatus: "waiting",
            completedLines: 0,
          };
          void trackPresence(channel, payload);
          channelRef.current = channel;
          selfPayloadRef.current = payload;
          setCurrentNickname(nickname);
          resolve({ ok: true });
        });
      });
    },
    [roomId, applyGameStarted, applyNumberCalled],
  );

  const setReady = useCallback((isReady: boolean) => {
    const channel = channelRef.current;
    if (!channel || !selfPayloadRef.current) return;
    const next: RoomPresencePayload = { ...selfPayloadRef.current, isReady };
    selfPayloadRef.current = next;
    void trackPresence(channel, next);
  }, []);

  const playerCount = players.length;
  const host = players.reduce<Player | null>(
    (earliest, player) => (!earliest || player.joinedAt < earliest.joinedAt ? player : earliest),
    null,
  );
  const currentPlayer = currentNickname
    ? (players.find((player) => player.nickname === currentNickname) ?? null)
    : null;
  const currentTurnPlayerId =
    turnOrder && turnSeq !== null ? (turnOrder[(turnSeq - 1) % turnOrder.length] ?? null) : null;

  const callNumber = useCallback(
    (value: number) => {
      const channel = channelRef.current;
      if (!channel || turnSeq === null) return;
      if (!currentPlayer || currentPlayer.id !== currentTurnPlayerId) return;
      if (calledNumbersRef.current.includes(value)) return;

      const payload: NumberCalledPayload = {
        number: value,
        auto: false,
        turnSeq,
        turnStartedAt: Date.now(),
      };
      void broadcast(channel, "number-called", payload);
      applyNumberCalled(payload);
    },
    [turnSeq, currentPlayer, currentTurnPlayerId, applyNumberCalled],
  );

  // 호스트만: 전원 준비 완료를 감지하면 game-started를 broadcast해 게임을 시작한다.
  useEffect(() => {
    if (roomStatus !== "waiting" || hasStartedRef.current) return;
    if (!currentPlayer || !host || currentPlayer.id !== host.id) return;
    if (players.length < MIN_PLAYERS_TO_START) return;
    if (!players.every((player) => player.isReady)) return;

    const channel = channelRef.current;
    if (!channel) return;

    hasStartedRef.current = true;
    const payload: GameStartedPayload = {
      turnOrder: [...players].sort((a, b) => a.joinedAt - b.joinedAt).map((player) => player.id),
      turnSeq: 1,
      turnStartedAt: Date.now(),
    };
    void broadcast(channel, "game-started", payload);
    applyGameStarted(payload);
  }, [players, host, currentPlayer, roomStatus, applyGameStarted]);

  // 호스트만: 현재 턴이 10초 안에 호출되지 않으면 남은 숫자 중 랜덤으로 대신 호출한다.
  useEffect(() => {
    if (roomStatus !== "playing") return;
    if (!currentPlayer || !host || currentPlayer.id !== host.id) return;
    if (turnStartedAt === null || turnSeq === null) return;

    const resolvingTurnSeq = turnSeq;
    const delay = Math.max(0, turnStartedAt + TURN_DURATION_MS - Date.now());
    const timeoutId = setTimeout(() => {
      if (appliedTurnSeqRef.current >= resolvingTurnSeq) return; // 그 사이 수동으로 이미 호출됨
      const remaining = ALL_NUMBERS.filter((n) => !calledNumbersRef.current.includes(n));
      if (remaining.length === 0) return;

      const channel = channelRef.current;
      if (!channel) return;

      const number = remaining[Math.floor(Math.random() * remaining.length)];
      const payload: NumberCalledPayload = {
        number,
        auto: true,
        turnSeq: resolvingTurnSeq,
        turnStartedAt: Date.now(),
      };
      void broadcast(channel, "number-called", payload);
      applyNumberCalled(payload);
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [roomStatus, currentPlayer, host, turnStartedAt, turnSeq, applyNumberCalled]);

  const markedNumbers = useMemo(() => {
    const marked = new Set<number>();
    if (!board) return marked;
    const called = new Set(calledNumbers);
    for (const row of board) {
      for (const cell of row) {
        if (cell !== null && called.has(cell)) marked.add(cell);
      }
    }
    return marked;
  }, [board, calledNumbers]);

  const completedLines = useMemo(
    () => (board ? countCompletedLines(board, markedNumbers) : 0),
    [board, markedNumbers],
  );

  // 완성 라인 수가 바뀔 때마다 전원에게 공유하고, 3줄 이상이면 bingo-completed를 한 번만 보낸다.
  useEffect(() => {
    if (roomStatus !== "playing") return;
    const channel = channelRef.current;
    if (!channel || !selfPayloadRef.current) return;
    if (selfPayloadRef.current.completedLines === completedLines) return;

    const next: RoomPresencePayload = { ...selfPayloadRef.current, completedLines };
    selfPayloadRef.current = next;
    void trackPresence(channel, next);

    if (completedLines >= BINGO_LINE_THRESHOLD && !hasBingoCompletedRef.current) {
      hasBingoCompletedRef.current = true;
      const payload: BingoCompletedPayload = {
        nickname: currentNickname ?? "",
        completedLines,
        turnSeq: appliedTurnSeqRef.current,
      };
      void broadcast(channel, "bingo-completed", payload);
    }
  }, [completedLines, roomStatus, currentNickname]);

  return {
    players,
    playerCount,
    isRoomFull: playerCount >= ROOM_CAPACITY,
    host,
    currentPlayer,
    roomStatus,
    turnOrder,
    turnSeq,
    turnStartedAt,
    calledNumbers,
    markedNumbers,
    completedLines,
    currentTurnPlayerId,
    join,
    leave,
    setReady,
    callNumber,
  };
}

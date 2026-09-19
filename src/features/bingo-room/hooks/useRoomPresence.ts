// @owner: ai
import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import {
  broadcast,
  leaveRoomChannel,
  subscribeToRoomChannel,
  trackPresence,
  untrackPresence,
} from "../api/roomChannel";
import type { GameStartedPayload } from "../types/events";
import type { Player, RoomPresencePayload } from "../types/domain";

const ROOM_CAPACITY = 5;
const MIN_PLAYERS_TO_START = 2;

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
  /** 닉네임 중복·정원(5명)·이미 시작된 방 여부를 검증한 뒤 입장을 시도한다 */
  join: (nickname: string) => Promise<JoinRoomResult>;
  /** 방을 나간다 (Presence에서 내리고 채널 구독도 해제) */
  leave: () => void;
  /** 본인 준비 상태를 갱신한다 (보드를 다시 바꾸면 false로 되돌리는 용도) */
  setReady: (isReady: boolean) => void;
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
      completedLines: 0,
      joinedAt: payload.joinedAt,
    };
  });
}

/**
 * 방의 Presence 상태로부터 참가자 목록/인원수/호스트를 계산하고, 닉네임
 * 중복·정원(5명)·이미 시작된 방 여부를 검증해 입장(track)을 처리한다.
 * 전원 준비 완료 시 호스트가 game-started를 broadcast해 게임을 시작한다.
 * (001-room-lifecycle, 002-board-setup 스펙 참고)
 */
export function useRoomPresence(roomId: string): UseRoomPresenceResult {
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentNickname, setCurrentNickname] = useState<string | null>(null);
  const [roomStatus, setRoomStatus] = useState<"waiting" | "playing">("waiting");
  const [turnOrder, setTurnOrder] = useState<string[] | null>(null);
  const [turnSeq, setTurnSeq] = useState<number | null>(null);
  const [turnStartedAt, setTurnStartedAt] = useState<number | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const selfPayloadRef = useRef<RoomPresencePayload | null>(null);
  const hasStartedRef = useRef(false);

  const leave = useCallback(() => {
    const channel = channelRef.current;
    if (!channel) return;
    void untrackPresence(channel);
    leaveRoomChannel(channel);
    channelRef.current = null;
    selfPayloadRef.current = null;
    hasStartedRef.current = false;
    setCurrentNickname(null);
    setPlayers([]);
    setRoomStatus("waiting");
    setTurnOrder(null);
    setTurnSeq(null);
    setTurnStartedAt(null);
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
          };
          void trackPresence(channel, payload);
          channelRef.current = channel;
          selfPayloadRef.current = payload;
          setCurrentNickname(nickname);
          resolve({ ok: true });
        });
      });
    },
    [roomId, applyGameStarted],
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
    join,
    leave,
    setReady,
  };
}

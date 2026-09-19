// @owner: ai
import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import {
  leaveRoomChannel,
  subscribeToRoomChannel,
  trackPresence,
  untrackPresence,
} from "../api/roomChannel";
import type { Player, RoomPresencePayload } from "../types/domain";

const ROOM_CAPACITY = 5;

export type JoinRoomResult =
  | { ok: true }
  | { ok: false; reason: "full" | "duplicate-nickname" | "config-error" };

interface UseRoomPresenceResult {
  /** 현재 방에 있는 참가자 목록 (Presence 기준) */
  players: Player[];
  playerCount: number;
  isRoomFull: boolean;
  /** 입장 시각이 가장 이른 참가자. 턴 타이머/승자 확정을 담당하는 호스트(001-room-lifecycle 참고) */
  host: Player | null;
  /** 이 클라이언트 자신의 Player. 아직 입장하지 않았으면 null */
  currentPlayer: Player | null;
  /** 닉네임 중복·정원(5명)을 검증한 뒤 입장을 시도한다 */
  join: (nickname: string) => Promise<JoinRoomResult>;
  /** 방을 나간다 (Presence에서 내리고 채널 구독도 해제) */
  leave: () => void;
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
 * 방의 Presence 상태로부터 참가자 목록/인원수/호스트를 계산하고,
 * 닉네임 중복·정원(5명) 초과를 검증해 입장(track)을 처리한다.
 * (001-room-lifecycle 스펙 참고)
 */
export function useRoomPresence(roomId: string): UseRoomPresenceResult {
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentNickname, setCurrentNickname] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const leave = useCallback(() => {
    const channel = channelRef.current;
    if (!channel) return;
    void untrackPresence(channel);
    leaveRoomChannel(channel);
    channelRef.current = null;
    setCurrentNickname(null);
    setPlayers([]);
  }, []);

  useEffect(() => {
    return () => leave();
  }, [leave]);

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

        channel.subscribe((status) => {
          if (status !== "SUBSCRIBED") return;

          const state = channel.presenceState<RoomPresencePayload>();
          const isDuplicate = Object.prototype.hasOwnProperty.call(state, nickname);
          if (isDuplicate) {
            leaveRoomChannel(channel);
            resolve({ ok: false, reason: "duplicate-nickname" });
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
          };
          void trackPresence(channel, payload);
          channelRef.current = channel;
          setCurrentNickname(nickname);
          resolve({ ok: true });
        });
      });
    },
    [roomId],
  );

  const playerCount = players.length;
  const host = players.reduce<Player | null>(
    (earliest, player) => (!earliest || player.joinedAt < earliest.joinedAt ? player : earliest),
    null,
  );
  const currentPlayer = currentNickname
    ? (players.find((player) => player.nickname === currentNickname) ?? null)
    : null;

  return {
    players,
    playerCount,
    isRoomFull: playerCount >= ROOM_CAPACITY,
    host,
    currentPlayer,
    join,
    leave,
  };
}

// @owner: ai
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseClient } from "../../../lib/supabase";
import type { RoomPresencePayload } from "../types/domain";

function roomChannelName(roomId: string): string {
  return `bingo-room-${roomId}`;
}

/**
 * 방 채널을 구독한다. Presence key로 닉네임을 사용하므로(게임흐름.md 참고),
 * 같은 방에는 동일한 닉네임으로 동시에 두 번 구독하지 않아야 한다.
 * 구독만으로는 Presence 목록에 나타나지 않으며, `trackPresence`를 호출해야
 * 실제로 참가자로 반영된다 — 정원/닉네임 중복 검증을 먼저 한 뒤 track하기
 * 위한 구조다.
 *
 * @param roomId - 방 ID
 * @param nickname - 이 클라이언트의 닉네임 (Presence key)
 * @returns 구독된 RealtimeChannel. 화면을 벗어날 때 반드시 `leaveRoomChannel`로 정리한다.
 */
export function subscribeToRoomChannel(roomId: string, nickname: string): RealtimeChannel {
  const channel = getSupabaseClient().channel(roomChannelName(roomId), {
    config: { presence: { key: nickname } },
  });

  channel.subscribe();

  return channel;
}

/**
 * 방 채널 구독을 해제한다. 컴포넌트 언마운트/방 이탈 시 반드시 호출한다.
 */
export function leaveRoomChannel(channel: RealtimeChannel): void {
  void channel.unsubscribe();
}

/**
 * 이 클라이언트를 방의 Presence 목록에 실제로 올린다(입장 확정).
 * 정원/닉네임 중복 검증을 통과한 뒤에만 호출해야 한다.
 */
export function trackPresence(channel: RealtimeChannel, payload: RoomPresencePayload) {
  return channel.track(payload);
}

/**
 * 이 클라이언트를 방의 Presence 목록에서 내린다(퇴장).
 */
export function untrackPresence(channel: RealtimeChannel) {
  return channel.untrack();
}

/**
 * 방 채널에 Broadcast 이벤트를 보낸다. 이벤트 이름은 kebab-case로
 * 통일한다 (AGENTS.md "통신 규칙" 참고).
 */
export function broadcast<T extends object>(channel: RealtimeChannel, event: string, payload: T) {
  return channel.send({ type: "broadcast", event, payload });
}

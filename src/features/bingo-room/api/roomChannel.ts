// @owner: ai
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabase";

function roomChannelName(roomId: string): string {
  return `bingo-room-${roomId}`;
}

/**
 * 방 채널을 구독한다. Presence key로 닉네임을 사용하므로(게임흐름.md 참고),
 * 같은 방에는 동일한 닉네임으로 동시에 두 번 구독하지 않아야 한다.
 *
 * @param roomId - 방 ID
 * @param nickname - 이 클라이언트의 닉네임 (Presence key)
 * @returns 구독된 RealtimeChannel. 화면을 벗어날 때 반드시 `leaveRoomChannel`로 정리한다.
 */
export function subscribeToRoomChannel(roomId: string, nickname: string): RealtimeChannel {
  const channel = supabase.channel(roomChannelName(roomId), {
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

// @owner: ai
import { useState } from "react";
import { useParams } from "react-router-dom";
import { InviteLinkBox } from "../../features/bingo-room/components/InviteLinkBox";
import { NicknameEntryForm } from "../../features/bingo-room/components/NicknameEntryForm";
import { ParticipantList } from "../../features/bingo-room/components/ParticipantList";
import { useRoomPresence } from "../../features/bingo-room/hooks/useRoomPresence";
import type { JoinRoomResult } from "../../features/bingo-room/hooks/useRoomPresence";

const JOIN_ERROR_MESSAGE: Record<Exclude<JoinRoomResult, { ok: true }>["reason"], string> = {
  full: "방이 가득 찼습니다.",
  "duplicate-nickname": "이미 사용 중인 닉네임입니다.",
  "config-error": "Supabase 설정을 확인해주세요 (.env.example 참고).",
};

/**
 * 방 화면. 닉네임 입력 후 입장하면 대기실(참가자 목록)을 보여준다.
 * 빙고판 세팅/게임 진행/종료 화면은 002~004 스펙에서 이어서 채운다.
 */
export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { players, host, currentPlayer, join } = useRoomPresence(roomId ?? "");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  if (!roomId) {
    return null;
  }

  const handleJoin = async (nickname: string) => {
    setIsJoining(true);
    setJoinError(null);
    const result = await join(nickname);
    setIsJoining(false);
    if (!result.ok) {
      setJoinError(JOIN_ERROR_MESSAGE[result.reason]);
    }
  };

  if (!currentPlayer) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-50 px-4">
        <p className="text-slate-600">
          방 <span className="font-mono font-semibold">{roomId}</span>에 입장합니다
        </p>
        <NicknameEntryForm onSubmit={handleJoin} error={joinError} isSubmitting={isJoining} />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center gap-6 bg-slate-50 px-4 py-12">
      <h1 className="text-xl font-semibold text-slate-900">
        방 <span className="font-mono">{roomId}</span> 대기실
      </h1>
      <InviteLinkBox inviteUrl={window.location.href} />
      <div className="w-full max-w-sm">
        <ParticipantList players={players} hostId={host?.id ?? null} currentPlayerId={currentPlayer.id} />
      </div>
      <p className="text-sm text-slate-500">빙고판 세팅 화면은 준비 중입니다.</p>
    </main>
  );
}

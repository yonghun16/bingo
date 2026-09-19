// @owner: ai
import { useState } from "react";
import { useParams } from "react-router-dom";
import { BoardSetupPanel } from "../../features/bingo-room/components/BoardSetupPanel";
import { InviteLinkBox } from "../../features/bingo-room/components/InviteLinkBox";
import { NicknameEntryForm } from "../../features/bingo-room/components/NicknameEntryForm";
import { ParticipantList } from "../../features/bingo-room/components/ParticipantList";
import { useRoomPresence } from "../../features/bingo-room/hooks/useRoomPresence";
import type { JoinRoomResult } from "../../features/bingo-room/hooks/useRoomPresence";

const JOIN_ERROR_MESSAGE: Record<Exclude<JoinRoomResult, { ok: true }>["reason"], string> = {
  full: "방이 가득 찼습니다.",
  "duplicate-nickname": "이미 사용 중인 닉네임입니다.",
  "already-started": "이미 게임이 시작된 방입니다.",
  "config-error": "Supabase 설정을 확인해주세요 (.env.example 참고).",
};

/**
 * 방 화면. 닉네임 입력 후 입장하면 대기실(빙고판 세팅)을 보여주고,
 * 전원 준비 완료 시 게임이 시작된다. 턴 진행/종료 화면은 003~004
 * 스펙에서 이어서 채운다.
 */
export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { players, host, currentPlayer, roomStatus, turnOrder, join, setReady } = useRoomPresence(roomId ?? "");
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
        방 <span className="font-mono">{roomId}</span> {roomStatus === "waiting" ? "대기실" : ""}
      </h1>

      {roomStatus === "waiting" ? (
        <>
          <InviteLinkBox inviteUrl={window.location.href} />
          <BoardSetupPanel
            isReady={currentPlayer.isReady}
            onReady={() => setReady(true)}
            onUnready={() => setReady(false)}
          />
          <div className="w-full max-w-xs">
            <ParticipantList players={players} hostId={host?.id ?? null} currentPlayerId={currentPlayer.id} />
          </div>
        </>
      ) : (
        <section className="flex w-full max-w-xs flex-col items-center gap-3 text-center">
          <p className="font-medium text-slate-800">게임이 시작되었습니다! 🎉</p>
          <p className="text-sm text-slate-500">턴 진행 화면은 준비 중입니다 (003 스펙).</p>
          {turnOrder ? (
            <ol className="w-full list-decimal space-y-1 pl-6 text-left text-sm text-slate-600">
              {turnOrder.map((id) => (
                <li key={id}>{players.find((player) => player.id === id)?.nickname ?? id}</li>
              ))}
            </ol>
          ) : null}
        </section>
      )}
    </main>
  );
}

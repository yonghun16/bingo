// @owner: ai
import { useState } from "react";
import { useParams } from "react-router-dom";
import { BoardSetupPanel } from "../../features/bingo-room/components/BoardSetupPanel";
import { InviteLinkBox } from "../../features/bingo-room/components/InviteLinkBox";
import { NicknameEntryForm } from "../../features/bingo-room/components/NicknameEntryForm";
import { ParticipantList } from "../../features/bingo-room/components/ParticipantList";
import { TurnGameplayPanel } from "../../features/bingo-room/components/TurnGameplayPanel";
import { useBingoBoard } from "../../features/bingo-room/hooks/useBingoBoard";
import { useRoomPresence } from "../../features/bingo-room/hooks/useRoomPresence";
import type { JoinRoomResult } from "../../features/bingo-room/hooks/useRoomPresence";

const JOIN_ERROR_MESSAGE: Record<Exclude<JoinRoomResult, { ok: true }>["reason"], string> = {
  full: "방이 가득 찼습니다.",
  "duplicate-nickname": "이미 사용 중인 닉네임입니다.",
  "already-started": "이미 게임이 시작된 방입니다.",
  "config-error": "Supabase 설정을 확인해주세요 (.env.example 참고).",
};

/**
 * 방 화면. 닉네임 입력 → 빙고판 세팅 → 턴제 게임 진행 순으로 전환된다.
 * 종료/재시작 화면은 004 스펙에서 이어서 채운다.
 */
export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const bingoBoard = useBingoBoard();
  const {
    players,
    host,
    currentPlayer,
    roomStatus,
    calledNumbers,
    markedNumbers,
    currentTurnPlayerId,
    turnStartedAt,
    join,
    setReady,
    callNumber,
  } = useRoomPresence(roomId ?? "", bingoBoard.board);
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

  const handleCellClick = (row: number, col: number) => {
    bingoBoard.placeAt(row, col);
    if (currentPlayer?.isReady) setReady(false);
  };

  const handleReset = () => {
    bingoBoard.reset();
    if (currentPlayer?.isReady) setReady(false);
  };

  const handleReadyClick = () => {
    if (bingoBoard.isValid) setReady(true);
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

  if (roomStatus === "playing") {
    return (
      <main className="flex min-h-screen flex-col items-center gap-6 bg-slate-50 px-4 py-12">
        <h1 className="text-xl font-semibold text-slate-900">
          방 <span className="font-mono">{roomId}</span>
        </h1>
        <TurnGameplayPanel
          board={bingoBoard.board}
          markedNumbers={markedNumbers}
          calledNumbers={calledNumbers}
          players={players}
          hostId={host?.id ?? null}
          currentTurnPlayerId={currentTurnPlayerId}
          currentPlayerId={currentPlayer.id}
          turnStartedAt={turnStartedAt}
          onCallNumber={callNumber}
        />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center gap-6 bg-slate-50 px-4 py-12">
      <h1 className="text-xl font-semibold text-slate-900">
        방 <span className="font-mono">{roomId}</span> 대기실
      </h1>
      <InviteLinkBox inviteUrl={window.location.href} />
      <BoardSetupPanel
        board={bingoBoard.board}
        availableNumbers={bingoBoard.availableNumbers}
        selectedNumber={bingoBoard.selectedNumber}
        isValid={bingoBoard.isValid}
        isReady={currentPlayer.isReady}
        onSelectNumber={bingoBoard.selectNumber}
        onCellClick={handleCellClick}
        onReset={handleReset}
        onReadyClick={handleReadyClick}
      />
      <div className="w-full max-w-xs">
        <ParticipantList players={players} hostId={host?.id ?? null} currentPlayerId={currentPlayer.id} />
      </div>
    </main>
  );
}

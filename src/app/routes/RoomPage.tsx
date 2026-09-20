// @owner: ai
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { BoardSetupPanel } from "../../features/bingo-room/components/BoardSetupPanel";
import { ChatPanel } from "../../features/bingo-room/components/ChatPanel";
import { GameOverPanel } from "../../features/bingo-room/components/GameOverPanel";
import { InviteLinkBox } from "../../features/bingo-room/components/InviteLinkBox";
import { NicknameEntryForm } from "../../features/bingo-room/components/NicknameEntryForm";
import { ParticipantList } from "../../features/bingo-room/components/ParticipantList";
import { RoomLayout } from "../../features/bingo-room/components/RoomLayout";
import { TurnGameplayPanel } from "../../features/bingo-room/components/TurnGameplayPanel";
import { useBingoBoard } from "../../features/bingo-room/hooks/useBingoBoard";
import { useRoomPresence } from "../../features/bingo-room/hooks/useRoomPresence";
import type { JoinRoomResult } from "../../features/bingo-room/hooks/useRoomPresence";
import { loadSavedNickname, saveNickname } from "../../features/bingo-room/utils/roomStorage";

const JOIN_ERROR_MESSAGE: Record<Exclude<JoinRoomResult, { ok: true }>["reason"], string> = {
  full: "방이 가득 찼습니다.",
  "duplicate-nickname": "이미 사용 중인 닉네임입니다.",
  "already-started": "이미 게임이 시작(또는 종료)된 방입니다.",
  "config-error": "Supabase 설정을 확인해주세요 (.env.example 참고).",
};

/**
 * 방 화면. 닉네임 입력 → 빙고판 세팅 → 턴제 게임 진행 → 종료/재시작
 * 순으로 전환된다. 입장 후에는 항상 오른쪽에 채팅이 함께 표시된다.
 *
 * 같은 브라우저로 새로고침하면 localStorage에 저장해둔 닉네임으로 자동
 * 재입장을 시도한다 — 게임이 이미 시작된 방이면 다른 클라이언트로부터
 * 현재 상태를 받아와 이어서 진행한다 (006-reconnect-sync 스펙 참고).
 */
export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const safeRoomId = roomId ?? "";
  const bingoBoard = useBingoBoard(safeRoomId);
  const {
    players,
    host,
    currentPlayer,
    roomStatus,
    calledNumbers,
    markedNumbers,
    currentTurnPlayerId,
    turnStartedAt,
    winnerIds,
    revealedBoards,
    chatMessages,
    sendChatMessage,
    join,
    setReady,
    callNumber,
    restartGame,
    hasReconnectTimedOut,
  } = useRoomPresence(safeRoomId, bingoBoard.board);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const { reset: resetBoard } = bingoBoard;

  // roomStatus가 (playing/ended에서) waiting으로 돌아오면 재시작된 것 —
  // 내 보드도 같이 초기화한다(bingoBoard 상태는 useRoomPresence가 모르므로 여기서 처리).
  const previousStatusRef = useRef(roomStatus);
  useEffect(() => {
    if (previousStatusRef.current !== "waiting" && roomStatus === "waiting") {
      resetBoard();
    }
    previousStatusRef.current = roomStatus;
  }, [roomStatus, resetBoard]);

  const attemptJoin = useCallback(
    async (nickname: string) => {
      setIsJoining(true);
      setJoinError(null);
      const result = await join(nickname);
      setIsJoining(false);
      if (!result.ok) {
        setJoinError(JOIN_ERROR_MESSAGE[result.reason]);
        return;
      }
      saveNickname(safeRoomId, nickname);
    },
    [join, safeRoomId],
  );

  // 이 브라우저로 예전에 입장했던 닉네임이 있으면 자동으로 재입장을 시도한다.
  const autoJoinStartedRef = useRef(false);
  useEffect(() => {
    if (currentPlayer || autoJoinStartedRef.current) return;
    const saved = loadSavedNickname(safeRoomId);
    if (!saved) return;
    autoJoinStartedRef.current = true;
    void attemptJoin(saved);
  }, [currentPlayer, attemptJoin, safeRoomId]);

  if (!roomId) {
    return null;
  }

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
        <NicknameEntryForm
          onSubmit={attemptJoin}
          error={joinError}
          isSubmitting={isJoining}
          defaultValue={loadSavedNickname(safeRoomId) ?? ""}
        />
      </main>
    );
  }

  const chat = <ChatPanel messages={chatMessages} onSend={sendChatMessage} />;
  const reconnectNotice = hasReconnectTimedOut ? (
    <p className="w-full rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
      다른 참가자의 상태를 불러오지 못해 새로 시작합니다.
    </p>
  ) : null;

  if (roomStatus === "ended") {
    return (
      <RoomLayout chat={chat}>
        {reconnectNotice}
        <h1 className="text-xl font-semibold text-slate-900">
          방 <span className="font-mono">{roomId}</span>
        </h1>
        <GameOverPanel
          winnerIds={winnerIds ?? []}
          players={players}
          revealedBoards={revealedBoards}
          calledNumbers={calledNumbers}
          onRestart={restartGame}
        />
      </RoomLayout>
    );
  }

  if (roomStatus === "playing") {
    return (
      <RoomLayout chat={chat}>
        {reconnectNotice}
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
      </RoomLayout>
    );
  }

  return (
    <RoomLayout chat={chat}>
      {reconnectNotice}
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
    </RoomLayout>
  );
}

// @owner: ai
import { useCountdownSeconds } from "../hooks/useCountdownSeconds";
import type { Player } from "../types/domain";
import { winLineThresholdForSize, type BoardGrid, type BoardSize } from "../utils/board";
import { BingoBoard } from "./BingoBoard";
import { ParticipantList } from "./ParticipantList";

const TURN_DURATION_MS = 10_000;

interface TurnGameplayPanelProps {
  board: BoardGrid;
  markedNumbers: ReadonlySet<number>;
  calledNumbers: number[];
  players: Player[];
  hostId: string | null;
  currentTurnPlayerId: string | null;
  currentPlayerId: string;
  turnStartedAt: number | null;
  onCallNumber: (value: number) => void;
}

/**
 * 턴제로 숫자를 호출하고 보드를 마킹하는 게임 진행 화면.
 * (003-turn-gameplay 스펙 참고)
 */
export function TurnGameplayPanel({
  board,
  markedNumbers,
  calledNumbers,
  players,
  hostId,
  currentTurnPlayerId,
  currentPlayerId,
  turnStartedAt,
  onCallNumber,
}: TurnGameplayPanelProps) {
  const remainingSeconds = useCountdownSeconds(turnStartedAt, TURN_DURATION_MS);
  const isMyTurn = currentTurnPlayerId === currentPlayerId;
  const currentTurnNickname = players.find((player) => player.id === currentTurnPlayerId)?.nickname ?? "?";
  const size = board.length as BoardSize;
  const winLineThreshold = winLineThresholdForSize(size);
  const myCompletedLines = players.find((player) => player.id === currentPlayerId)?.completedLines ?? 0;

  const handleCellClick = (row: number, col: number) => {
    if (!isMyTurn) return;
    const value = board[row][col];
    if (value === null || markedNumbers.has(value)) return;
    onCallNumber(value);
  };

  return (
    <section className="flex w-full max-w-xs flex-col items-center gap-4">
      <div className="flex flex-col items-center gap-2">
        <p className="text-center font-medium text-white">
          {isMyTurn ? "내 차례입니다! 숫자를 눌러 호출하세요" : `${currentTurnNickname}님의 차례`}
        </p>
        {isMyTurn ? (
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-full border-4 text-3xl font-bold tabular-nums ${
              remainingSeconds <= 3
                ? "animate-pulse border-red-400 text-red-400"
                : "border-emerald-400 text-emerald-400"
            }`}
          >
            {remainingSeconds}
          </div>
        ) : (
          <p className="text-sm text-slate-400">{remainingSeconds}초 남음</p>
        )}
      </div>
      <p className="text-sm text-slate-400">
        승리 조건: {winLineThreshold}줄 완성 (내 진행: {myCompletedLines}/{winLineThreshold}줄)
      </p>
      <BingoBoard
        board={board}
        onCellClick={handleCellClick}
        disabled={!isMyTurn}
        markedNumbers={markedNumbers}
      />
      <p className="text-sm text-slate-400">
        호출된 숫자: {calledNumbers.length > 0 ? calledNumbers.join(", ") : "없음"}
      </p>
      <div className="w-full">
        <ParticipantList
          players={players}
          hostId={hostId}
          currentPlayerId={currentPlayerId}
          renderStatus={(player) => `${player.completedLines}줄 완성`}
        />
      </div>
    </section>
  );
}

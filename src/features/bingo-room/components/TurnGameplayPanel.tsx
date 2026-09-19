// @owner: ai
import { useCountdownSeconds } from "../hooks/useCountdownSeconds";
import type { Player } from "../types/domain";
import type { BoardGrid } from "../utils/board";
import { BingoBoard } from "./BingoBoard";
import { NumberCallPad } from "./NumberCallPad";
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

  return (
    <section className="flex w-full max-w-xs flex-col items-center gap-4">
      <p className="text-center font-medium text-slate-800">
        {isMyTurn ? "내 차례입니다!" : `${currentTurnNickname}님의 차례`} · {remainingSeconds}초
      </p>
      <BingoBoard board={board} onCellClick={() => {}} disabled markedNumbers={markedNumbers} />
      <NumberCallPad calledNumbers={calledNumbers} disabled={!isMyTurn} onCall={onCallNumber} />
      <p className="text-sm text-slate-500">
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

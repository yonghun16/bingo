// @owner: ai
import type { Player } from "../types/domain";
import type { BoardGrid } from "../utils/board";
import { BingoBoard } from "./BingoBoard";

interface GameOverPanelProps {
  winnerIds: string[];
  players: Player[];
  revealedBoards: Record<string, BoardGrid>;
  calledNumbers: number[];
  onRestart: () => void;
}

/**
 * 우승자 발표 + 전체 참가자 보드 공개 + 다시 하기.
 * (004-game-end-restart 스펙 참고)
 */
export function GameOverPanel({ winnerIds, players, revealedBoards, calledNumbers, onRestart }: GameOverPanelProps) {
  const calledSet = new Set(calledNumbers);
  const winnerNicknames = players
    .filter((player) => winnerIds.includes(player.id))
    .map((player) => player.nickname);
  const isTie = winnerNicknames.length > 1;

  return (
    <section className="flex w-full max-w-2xl flex-col items-center gap-6">
      <p className="text-center text-lg font-semibold text-slate-900">
        🎉 {winnerNicknames.join(", ") || "?"}
        {isTie ? "님이 공동 우승했습니다!" : "님이 우승했습니다!"}
      </p>
      <button
        type="button"
        onClick={onRestart}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
      >
        다시 하기
      </button>
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
        {players.map((player) => {
          const revealedBoard = revealedBoards[player.id];
          return (
            <div
              key={player.id}
              className="flex flex-col items-center gap-2 rounded-lg border border-slate-200 bg-white p-3"
            >
              <p className="text-sm font-medium text-slate-700">
                {player.nickname}
                {winnerIds.includes(player.id) ? " 🏆" : ""}
              </p>
              {revealedBoard ? (
                <BingoBoard board={revealedBoard} onCellClick={() => {}} disabled markedNumbers={calledSet} />
              ) : (
                <p className="text-sm text-slate-400">보드를 불러오는 중...</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

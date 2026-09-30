// @owner: ai
import { Link } from "react-router-dom";
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
      <p className="text-center text-lg font-semibold text-white">
        🎉 {winnerNicknames.join(", ") || "?"}
        {isTie ? "님이 공동 우승했습니다!" : "님이 우승했습니다!"}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onRestart}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-400"
        >
          다시 하기
        </button>
        <Link
          to="/"
          className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-700"
        >
          새 게임 만들기
        </Link>
      </div>
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
        {players.map((player) => {
          const revealedBoard = revealedBoards[player.id];
          const isWinner = winnerIds.includes(player.id);
          return (
            <div
              key={player.id}
              className={`flex flex-col items-center gap-2 rounded-lg border p-3 ${
                isWinner
                  ? "border-amber-400/60 bg-slate-900/60 shadow-[0_0_16px_rgba(251,191,36,0.25)]"
                  : "border-slate-800 bg-slate-900/60"
              }`}
            >
              <p className="text-sm font-medium text-slate-200">
                {player.nickname}
                {isWinner ? " 🏆" : ""}
              </p>
              {revealedBoard ? (
                <BingoBoard
                  board={revealedBoard}
                  onCellClick={() => {}}
                  disabled
                  markedNumbers={calledSet}
                  markedVariant={isWinner ? "gold" : "emerald"}
                />
              ) : (
                <p className="text-sm text-slate-500">보드를 불러오는 중...</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

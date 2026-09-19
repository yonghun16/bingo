// @owner: ai
import type { Player } from "../types/domain";

interface ParticipantListProps {
  players: Player[];
  hostId: string | null;
  currentPlayerId: string | null;
}

export function ParticipantList({ players, hostId, currentPlayerId }: ParticipantListProps) {
  return (
    <ul className="flex w-full flex-col gap-2">
      {players.map((player) => (
        <li
          key={player.id}
          className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
        >
          <span className="text-slate-800">
            {player.nickname}
            {player.id === currentPlayerId ? " (나)" : ""}
            {player.id === hostId ? " 👑" : ""}
          </span>
          <span className="text-sm text-slate-500">{player.isReady ? "준비 완료" : "대기중"}</span>
        </li>
      ))}
    </ul>
  );
}

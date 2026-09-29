// @owner: ai
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BOARD_SIZES, DEFAULT_BOARD_SIZE, winLineThresholdForSize, type BoardSize } from "../../features/bingo-room/utils/board";

function createRoomId(): string {
  return crypto.randomUUID().slice(0, 8);
}

export function LandingPage() {
  const navigate = useNavigate();
  const [size, setSize] = useState<BoardSize>(DEFAULT_BOARD_SIZE);

  const handleCreateRoom = () => {
    const roomId = createRoomId();
    navigate(`/room/${roomId}?size=${size}`);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-50 px-4 text-center">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">빙고</h1>
        <p className="mt-2 text-slate-600">최대 5명이 함께 즐기는 실시간 멀티플레이어 빙고 게임</p>
      </div>

      <div className="flex flex-col items-center gap-2">
        <p className="text-sm font-medium text-slate-700">보드 크기</p>
        <div className="flex gap-2">
          {BOARD_SIZES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setSize(option)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                size === option
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              {option} x {option}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-400">{winLineThresholdForSize(size)}줄을 먼저 완성하면 우승입니다.</p>
      </div>

      <button
        type="button"
        onClick={handleCreateRoom}
        className="rounded-lg bg-slate-900 px-6 py-3 font-medium text-white transition hover:bg-slate-700"
      >
        방 만들기
      </button>
    </main>
  );
}

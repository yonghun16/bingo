// @owner: ai
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BOARD_SIZES,
  DEFAULT_BOARD_SIZE,
  winLineThresholdForSize,
  type BoardSize,
} from "../../features/bingo-room/utils/board";

function createRoomId(): string {
  return crypto.randomUUID().slice(0, 8);
}

/** 타이틀 화면을 장식하는 빙고판 모양 그래픽. 대각선이 완성된 모습을 흉내낸다. */
function DecorativeBingoGrid() {
  const size = 5;
  const cells = Array.from({ length: size * size }, (_, index) => index + 1);

  return (
    <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
      {cells.map((number, index) => {
        const row = Math.floor(index / size);
        const col = index % size;
        const isMarked = row === col;
        return (
          <div
            key={number}
            className={`flex h-9 w-9 items-center justify-center rounded-md text-xs font-semibold sm:h-11 sm:w-11 sm:text-sm ${
              isMarked
                ? "bg-emerald-500 text-white shadow-[0_0_14px_rgba(16,185,129,0.55)]"
                : "bg-slate-800 text-slate-500"
            }`}
          >
            {number}
          </div>
        );
      })}
    </div>
  );
}

export function LandingPage() {
  const navigate = useNavigate();
  const [size, setSize] = useState<BoardSize>(DEFAULT_BOARD_SIZE);

  const handleCreateRoom = () => {
    const roomId = createRoomId();
    navigate(`/room/${roomId}?size=${size}`);
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-slate-950 to-slate-900 px-4 py-16 text-center">
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />

      <div className="relative flex flex-col items-center gap-8">
        <DecorativeBingoGrid />

        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">빙고</h1>
          <p className="mt-3 text-slate-400">최대 5명이 함께 즐기는 실시간 멀티플레이어 빙고 게임</p>
        </div>

        <div className="flex w-full max-w-xs flex-col items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur">
          <p className="text-sm font-medium text-slate-300">보드 크기</p>
          <div className="flex gap-1.5">
            {BOARD_SIZES.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setSize(option)}
                className={`rounded-lg border px-2.5 py-2 text-sm font-medium transition ${
                  size === option
                    ? "border-emerald-400 bg-emerald-500 text-white"
                    : "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {option}x{option}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500">{winLineThresholdForSize(size)}줄을 먼저 완성하면 우승입니다.</p>

          <button
            type="button"
            onClick={handleCreateRoom}
            className="mt-2 w-full rounded-lg bg-emerald-500 px-6 py-3 font-medium text-white shadow-[0_0_20px_rgba(16,185,129,0.35)] transition hover:bg-emerald-400"
          >
            방 만들기
          </button>
        </div>
      </div>
    </main>
  );
}

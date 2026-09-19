// @owner: ai
import { useNavigate } from "react-router-dom";

function createRoomId(): string {
  return crypto.randomUUID().slice(0, 8);
}

export function LandingPage() {
  const navigate = useNavigate();

  const handleCreateRoom = () => {
    const roomId = createRoomId();
    navigate(`/room/${roomId}`);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-50 px-4 text-center">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">빙고</h1>
        <p className="mt-2 text-slate-600">
          최대 5명이 함께 즐기는 실시간 멀티플레이어 빙고 게임
        </p>
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

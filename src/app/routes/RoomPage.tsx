// @owner: ai
import { useParams } from "react-router-dom";

/**
 * 방 화면. 닉네임 입력, 대기실/보드 세팅, 게임 진행, 종료 화면은
 * features/bingo-room 쪽 컴포넌트로 채워나간다 (001~006 스펙 참고).
 */
export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <p className="text-slate-600">
        방 <span className="font-mono font-semibold">{roomId}</span> — 대기실/게임 화면 준비 중
      </p>
    </main>
  );
}

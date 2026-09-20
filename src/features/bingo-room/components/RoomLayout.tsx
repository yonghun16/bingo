// @owner: ai
import type { ReactNode } from "react";

interface RoomLayoutProps {
  /** 왼쪽 메인 영역 (세팅/게임 진행/종료 화면) */
  children: ReactNode;
  /** 오른쪽 채팅 영역 */
  chat: ReactNode;
}

/**
 * 좌: 빙고판(단계별 화면) / 우: 채팅, 2분할 레이아웃.
 * (게임흐름.md "UI 요구사항" 참고)
 */
export function RoomLayout({ children, chat }: RoomLayoutProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 bg-slate-50 px-4 py-12 lg:flex-row lg:items-start">
      <div className="flex flex-1 flex-col items-center gap-6">{children}</div>
      <div className="w-full lg:w-80">{chat}</div>
    </main>
  );
}

// @owner: ai
import { useState, type ReactNode } from "react";

interface RoomLayoutProps {
  /** 왼쪽 메인 영역 (세팅/게임 진행/종료 화면) */
  children: ReactNode;
  /** 채팅 영역 */
  chat: ReactNode;
}

/**
 * 넓은 화면(lg 이상)은 좌: 빙고판 / 우: 채팅 2분할 레이아웃을 그대로 쓴다.
 * 좁은 화면(모바일)은 채팅이 화면 아래로 밀려나 스크롤해야 보이는 문제가
 * 있어서, 대신 우측 하단 플로팅 버튼으로 반투명 바텀시트를 열고 닫는
 * 방식을 쓴다 — 빙고판을 계속 보면서 필요할 때만 채팅을 띄워볼 수 있다.
 * (게임흐름.md "UI 요구사항" 참고)
 */
export function RoomLayout({ children, chat }: RoomLayoutProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 bg-gradient-to-b from-slate-950 to-slate-900 px-4 py-12 lg:flex-row lg:items-start">
      <div className="flex flex-1 flex-col items-center gap-6">{children}</div>
      <div className="hidden lg:block lg:w-80">{chat}</div>

      {!isChatOpen ? (
        <button
          type="button"
          onClick={() => setIsChatOpen(true)}
          aria-label="채팅 열기"
          className="fixed right-5 bottom-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/60 text-2xl text-white shadow-[0_4px_20px_rgba(16,185,129,0.35)] backdrop-blur-sm transition hover:bg-emerald-500/80 lg:hidden"
        >
          💬
        </button>
      ) : null}

      <div
        className={`fixed inset-x-0 bottom-0 z-40 flex h-[70vh] flex-col rounded-t-2xl border-t border-slate-700 bg-slate-900/80 shadow-2xl backdrop-blur-md transition-transform duration-300 lg:hidden ${
          isChatOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <p className="font-medium text-white">채팅</p>
          <button
            type="button"
            onClick={() => setIsChatOpen(false)}
            aria-label="채팅 닫기"
            className="rounded-md px-2 py-1 text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            ✕
          </button>
        </div>
        <div className="min-h-0 flex-1 px-3 pb-3">{chat}</div>
      </div>
    </main>
  );
}

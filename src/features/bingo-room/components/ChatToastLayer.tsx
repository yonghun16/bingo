// @owner: ai
import type { ChatToast } from "../hooks/useChatToasts";

interface ChatToastLayerProps {
  toasts: ChatToast[];
}

/**
 * 새 채팅 메시지를 화면 최상단에 잠깐 띄우는 토스트 오버레이.
 * fixed 포지션이라 스크롤해도 항상 화면 위에 떠 있다가, 일정 시간 뒤
 * (useChatToasts) 자동으로 사라진다.
 */
export function ChatToastLayer({ toasts }: ChatToastLayerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="w-full max-w-sm rounded-lg bg-slate-900/90 px-4 py-2 text-sm text-white shadow-lg backdrop-blur"
        >
          <span className="font-semibold">{toast.nickname}</span>
          <span className="text-slate-400"> · </span>
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}

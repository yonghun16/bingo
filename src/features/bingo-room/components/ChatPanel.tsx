// @owner: ai
import { useState, type FormEvent } from "react";
import type { ChatMessage } from "../types/domain";

interface ChatPanelProps {
  messages: ChatMessage[];
  onSend: (message: string) => void;
}

function formatTime(sentAt: number): string {
  return new Date(sentAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

/**
 * 대기실/게임 중 언제든 사용 가능한 실시간 채팅.
 * (005-chat 스펙 참고)
 */
export function ChatPanel({ messages, onSend }: ChatPanelProps) {
  const [draft, setDraft] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setDraft("");
  };

  return (
    <div className="flex h-full max-h-[32rem] w-full flex-col rounded-lg border border-slate-200 bg-white">
      <ul className="flex-1 space-y-2 overflow-y-auto p-3">
        {messages.length === 0 ? (
          <li className="text-sm text-slate-400">아직 채팅이 없습니다.</li>
        ) : (
          messages.map((message, index) => (
            <li key={`${message.sentAt}-${message.nickname}-${index}`} className="text-sm">
              <span className="font-medium text-slate-700">{message.nickname}</span>{" "}
              <span className="text-xs text-slate-400">{formatTime(message.sentAt)}</span>
              <p className="break-words text-slate-800">{message.message}</p>
            </li>
          ))
        )}
      </ul>
      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-slate-200 p-2">
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="메시지 입력..."
          className="min-w-0 flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-slate-500"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="shrink-0 rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          전송
        </button>
      </form>
    </div>
  );
}

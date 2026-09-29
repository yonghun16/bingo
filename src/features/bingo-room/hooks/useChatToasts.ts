// @owner: ai
import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "../types/domain";

export interface ChatToast {
  id: string;
  nickname: string;
  message: string;
}

const TOAST_DURATION_MS = 4000;
const MAX_VISIBLE_TOASTS = 3;

/**
 * 새로 도착한 채팅 메시지를 화면 상단에 잠깐 띄웠다가 사라지는 토스트
 * 큐로 바꿔준다. 마운트 시점 이후에 온 메시지만 토스트로 띄우고(재접속 시
 * 한꺼번에 불러온 과거 채팅 기록은 띄우지 않는다), 최대 3개까지만 동시에
 * 보여주며 각각 일정 시간 뒤 자동으로 사라진다.
 */
export function useChatToasts(chatMessages: ChatMessage[]): ChatToast[] {
  const [toasts, setToasts] = useState<ChatToast[]>([]);
  const seenCountRef = useRef(chatMessages.length);
  const mountedAtRef = useRef(0);

  useEffect(() => {
    mountedAtRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (chatMessages.length < seenCountRef.current) {
      seenCountRef.current = 0;
    }
    const newMessages = chatMessages
      .slice(seenCountRef.current)
      .filter((message) => message.sentAt >= mountedAtRef.current);
    seenCountRef.current = chatMessages.length;
    if (newMessages.length === 0) return;

    const newToasts = newMessages.map((message) => ({
      id: crypto.randomUUID(),
      nickname: message.nickname,
      message: message.message,
    }));

    setToasts((current) => [...current, ...newToasts].slice(-MAX_VISIBLE_TOASTS));

    newToasts.forEach((toast) => {
      setTimeout(() => {
        setToasts((current) => current.filter((t) => t.id !== toast.id));
      }, TOAST_DURATION_MS);
    });
  }, [chatMessages]);

  return toasts;
}

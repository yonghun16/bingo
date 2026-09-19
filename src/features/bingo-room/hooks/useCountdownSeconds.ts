// @owner: ai
import { useEffect, useState } from "react";

/**
 * `startedAt + durationMs` 시점까지 남은 시간을 초 단위(0 이상)로 반환한다.
 * 로컬 setTimeout으로 스스로 카운트다운하는 게 아니라 항상 `startedAt`
 * 기준으로 다시 계산한다 — 호스트가 바뀌어도 남은 시간이 어긋나지 않기
 * 위함이다 (003-turn-gameplay 스펙 "턴 시작 시각" 참고).
 */
export function useCountdownSeconds(startedAt: number | null, durationMs: number): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (startedAt === null) return;
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, [startedAt]);

  if (startedAt === null) return 0;
  return Math.max(0, Math.ceil((startedAt + durationMs - now) / 1000));
}

// @owner: ai
import type { ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

/**
 * 앱 전역 Provider를 조립하는 자리.
 * 현재는 전역 상태 라이브러리를 쓰지 않아(React 기본 상태로 충분) 감싸는 Provider가 없다.
 * 전역 Provider가 필요해지면 여기에 추가한다.
 */
export function Providers({ children }: ProvidersProps) {
  return children;
}

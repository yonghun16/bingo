// @owner: ai
import { useEffect, useState } from "react";

interface InviteLinkBoxProps {
  inviteUrl: string;
}

const TOAST_DURATION_MS = 3000;

/**
 * 초대 링크를 항상 화면에 텍스트로 띄워두는 대신, 버튼 하나로 복사하고
 * 결과를 토스트로만 짧게 알려준다 — 대기실 화면의 공간을 아끼기 위함.
 */
export function InviteLinkBox({ inviteUrl }: InviteLinkBoxProps) {
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (!showToast) return;
    const timer = setTimeout(() => setShowToast(false), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [showToast]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setShowToast(true);
    } catch (error) {
      console.error("초대 링크 복사 실패:", error);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleCopy}
        className="flex-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-400"
      >
        초대 링크 공유
      </button>
      {showToast ? (
        <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
          <div className="w-full max-w-sm rounded-lg bg-white/95 px-4 py-2 text-center text-sm text-slate-900 shadow-lg">
            🔗 초대 링크 복사 완료! 친구들에게 보내고 같이 빙고해요 🎉
          </div>
        </div>
      ) : null}
    </>
  );
}

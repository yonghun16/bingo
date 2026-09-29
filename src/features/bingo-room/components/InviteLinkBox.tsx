// @owner: ai
import { useState } from "react";

interface InviteLinkBoxProps {
  inviteUrl: string;
}

export function InviteLinkBox({ inviteUrl }: InviteLinkBoxProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error("초대 링크 복사 실패:", error);
    }
  };

  return (
    <div className="flex w-full max-w-sm items-center gap-2">
      <input
        type="text"
        readOnly
        value={inviteUrl}
        className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300"
      />
      <button
        type="button"
        onClick={handleCopy}
        className="shrink-0 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-400"
      >
        {copied ? "복사됨" : "복사"}
      </button>
    </div>
  );
}

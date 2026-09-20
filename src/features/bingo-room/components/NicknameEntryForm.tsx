// @owner: ai
import { useState, type FormEvent } from "react";

interface NicknameEntryFormProps {
  onSubmit: (nickname: string) => void;
  error?: string | null;
  isSubmitting?: boolean;
  /** 이 브라우저로 예전에 썼던 닉네임이 있으면 미리 채워둔다 (재접속 편의) */
  defaultValue?: string;
}

export function NicknameEntryForm({ onSubmit, error, isSubmitting = false, defaultValue = "" }: NicknameEntryFormProps) {
  const [nickname, setNickname] = useState(defaultValue);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = nickname.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-xs flex-col gap-3">
      <label htmlFor="nickname" className="text-sm font-medium text-slate-700">
        닉네임
      </label>
      <input
        id="nickname"
        type="text"
        value={nickname}
        onChange={(event) => setNickname(event.target.value)}
        placeholder="닉네임을 입력하세요"
        disabled={isSubmitting}
        autoFocus
        className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500 disabled:bg-slate-100"
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={isSubmitting || !nickname.trim()}
        className="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "입장 중..." : "입장하기"}
      </button>
    </form>
  );
}

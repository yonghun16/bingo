// @owner: ai
import { Link } from "react-router-dom";

/**
 * 어떤 라우트에도 일치하지 않는 주소로 들어왔을 때 보여주는 안내 화면.
 * (예: 초대 링크가 잘리거나, 잘못 복사된 경우)
 */
export function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-slate-950 to-slate-900 px-4 text-center">
      <div>
        <h1 className="text-3xl font-bold text-white">페이지를 찾을 수 없어요</h1>
        <p className="mt-2 text-slate-400">
          주소가 잘못됐거나 링크가 손상된 것 같아요.
          <br />
          공유받은 주소를 다시 확인해주세요.
        </p>
      </div>
      <Link
        to="/"
        className="rounded-lg bg-emerald-500 px-6 py-3 font-medium text-white transition hover:bg-emerald-400"
      >
        홈으로 가기
      </Link>
    </main>
  );
}

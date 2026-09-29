export const config = {
  matcher: "/room/:path*",
};

/** 카톡/페이스북/트위터 등 링크 미리보기를 만드는 크롤러의 User-Agent 패턴 */
const LINK_PREVIEW_BOT_PATTERN =
  /kakaotalk-scrap|facebookexternalhit|twitterbot|slackbot|discordbot|telegrambot|line\/|whatsapp|linkedinbot/i;

/**
 * src/features/bingo-room/utils/board.ts의 BOARD_SIZES와 값이 같아야 한다.
 * Vercel의 미들웨어 빌드 대상은 별도 번들 경계라서 src/ import를 인라인해
 * 주지 않으므로(배포 시 ERR_MODULE_NOT_FOUND 발생 확인됨), 이 파일만으로
 * 완결되도록 값을 복사해서 둔다.
 */
const BOARD_SIZES = [3, 4, 5] as const;
type BoardSize = (typeof BOARD_SIZES)[number];

function readBoardSize(url: URL): BoardSize | null {
  const raw = Number(url.searchParams.get("size"));
  return (BOARD_SIZES as readonly number[]).includes(raw) ? (raw as BoardSize) : null;
}

function buildPreviewHtml(size: BoardSize | null, pageUrl: string): string {
  const title = size ? `${size}x${size} 빙고 게임방` : "빙고 게임방";
  const description = "친구가 만든 실시간 빙고 게임방입니다. 버튼을 눌러 참여해주세요!";

  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <title>${title}</title>
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${pageUrl}" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
  </head>
  <body>
    <p>${title}</p>
    <p>${description}</p>
  </body>
</html>`;
}

/**
 * `/room/:roomId` 주소를 링크 미리보기 크롤러(카톡 등)가 요청하면, 보드
 * 크기(`?size=`)를 반영한 og 메타태그가 담긴 정적 HTML을 대신 응답한다.
 * 실제 사용자(일반 브라우저)의 요청은 그대로 통과시켜 평소처럼 SPA가
 * 렌더링되게 한다.
 */
export default function middleware(request: Request) {
  const userAgent = request.headers.get("user-agent") ?? "";
  if (!LINK_PREVIEW_BOT_PATTERN.test(userAgent)) {
    return;
  }

  const url = new URL(request.url);
  const size = readBoardSize(url);

  return new Response(buildPreviewHtml(size, url.toString()), {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

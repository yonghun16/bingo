// @owner: ai

function readEnvVar(key: "VITE_SUPABASE_URL" | "VITE_SUPABASE_ANON_KEY"): string {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`환경변수 ${key}가 설정되지 않았습니다. .env.example을 참고해 .env를 만드세요.`);
  }
  return value;
}

/**
 * Supabase 접속 정보를 읽어 반환한다. 실제로 Supabase를 사용하는 시점(예:
 * 방 채널 구독)에 호출해야 한다 — 모듈 최상단에서 미리 계산해 두면 .env가
 * 없을 때 Supabase와 무관한 화면(랜딩 페이지 등)까지 죽어버리기 때문이다.
 */
export function getEnv() {
  return {
    supabaseUrl: readEnvVar("VITE_SUPABASE_URL"),
    supabaseAnonKey: readEnvVar("VITE_SUPABASE_ANON_KEY"),
  };
}

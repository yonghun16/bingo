// @owner: ai

function readEnvVar(key: "VITE_SUPABASE_URL" | "VITE_SUPABASE_ANON_KEY"): string {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`환경변수 ${key}가 설정되지 않았습니다. .env.example을 참고해 .env를 만드세요.`);
  }
  return value;
}

export const env = {
  supabaseUrl: readEnvVar("VITE_SUPABASE_URL"),
  supabaseAnonKey: readEnvVar("VITE_SUPABASE_ANON_KEY"),
};

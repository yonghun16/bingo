// @owner: ai
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getEnv } from "../config/env";

let client: SupabaseClient | null = null;

/**
 * 앱 전역에서 공유하는 단일 Supabase 클라이언트 인스턴스를 반환한다.
 * 최초 호출 시에만 생성하고(지연 초기화) 이후에는 캐시된 인스턴스를 재사용한다.
 * 다른 곳에서는 이 함수를 통해서만 접근하고, 개별적으로 createClient()를
 * 다시 호출하지 않는다 (AGENTS.md "통신 규칙" 참고).
 */
export function getSupabaseClient(): SupabaseClient {
  if (!client) {
    const env = getEnv();
    client = createClient(env.supabaseUrl, env.supabaseAnonKey);
  }
  return client;
}

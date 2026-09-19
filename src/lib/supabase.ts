// @owner: ai
import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env";

/**
 * 앱 전역에서 공유하는 단일 Supabase 클라이언트 인스턴스.
 * 다른 곳에서는 이 인스턴스를 가져다 쓰기만 하고, 개별적으로
 * createClient()를 다시 호출하지 않는다 (AGENTS.md "통신 규칙" 참고).
 */
export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey);

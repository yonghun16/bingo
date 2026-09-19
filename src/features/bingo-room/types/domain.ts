// @owner: ai

/**
 * 방(Room)의 로컬 뷰. 서버에 저장되는 객체가 아니라, 각 클라이언트가
 * Presence 상태 + 그동안 수신한 broadcast 이벤트를 조합해 구성한다.
 * (docs/content/기획/게임흐름.md "데이터 모델" 참고)
 */
export interface Room {
  roomId: string;
  players: Player[];
  status: "waiting" | "playing" | "ended";
  /** 현재 턴인 player의 순번(입장 순서 기준 인덱스) */
  currentTurnIndex: number;
  /** 턴이 진행될 때마다 1씩 증가. number-called 중복/경합 판별에 사용 */
  turnSeq: number;
  /** 현재 턴이 시작된 시각(타임스탬프). 10초 카운트다운 기준 */
  turnStartedAt: number;
  calledNumbers: number[];
  winner: Player | Player[] | null;
  chatMessages: ChatMessage[];
}

export interface Player {
  /** Presence key (닉네임 기반) */
  id: string;
  nickname: string;
  /** 5x5 보드. null이면 아직 세팅 중 */
  board: number[][] | null;
  markedNumbers: number[];
  isReady: boolean;
  completedLines: number;
  /** Presence 입장 시각. 턴 순서와 호스트 판단에 사용 */
  joinedAt: number;
}

export interface ChatMessage {
  nickname: string;
  message: string;
  sentAt: number;
}

/**
 * Supabase Presence에 track()으로 올리는 값. Presence key는 닉네임이다.
 * (Player의 부분집합 — board/markedNumbers/completedLines는 Presence가
 * 아니라 게임 진행 중 로컬 계산으로 채워진다.)
 *
 * `roomStatus`는 각자 자신의 presence에도 반영해둔다 — game-started
 * broadcast는 그 순간 구독 중인 클라이언트에게만 가고 늦게 들어온
 * 클라이언트에게는 재전송되지 않으므로, 방금 입장하려는 클라이언트가
 * "이미 시작된 방인지"를 Presence 스냅샷만 보고도 판단할 수 있어야 한다.
 */
export interface RoomPresencePayload {
  nickname: string;
  isReady: boolean;
  joinedAt: number;
  roomStatus: "waiting" | "playing";
}

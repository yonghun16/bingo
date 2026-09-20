// @owner: ai
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import {
  broadcast,
  leaveRoomChannel,
  subscribeToRoomChannel,
  trackPresence,
  untrackPresence,
} from "../api/roomChannel";
import type {
  BingoCompletedPayload,
  BoardRevealedPayload,
  ChatMessagePayload,
  GameOverPayload,
  GameStartedPayload,
  NumberCalledPayload,
  StateSyncPayload,
} from "../types/events";
import type { ChatMessage, Player, RoomPresencePayload } from "../types/domain";
import { MAX_NUMBER, MIN_NUMBER, countCompletedLines, type BoardGrid } from "../utils/board";

const ROOM_CAPACITY = 5;
const MIN_PLAYERS_TO_START = 2;
const TURN_DURATION_MS = 10_000;
const BINGO_LINE_THRESHOLD = 3;
const BINGO_GRACE_MS = 300;
const REQUEST_STATE_TIMEOUT_MS = 3_000;
const ALL_NUMBERS = Array.from({ length: MAX_NUMBER - MIN_NUMBER + 1 }, (_, i) => i + MIN_NUMBER);

export type JoinRoomResult =
  | { ok: true }
  | { ok: false; reason: "full" | "duplicate-nickname" | "already-started" | "config-error" };

interface UseRoomPresenceResult {
  /** 현재 방에 있는 참가자 목록 (Presence 기준) */
  players: Player[];
  playerCount: number;
  isRoomFull: boolean;
  /** 입장 시각이 가장 이른 참가자. 턴 타이머/승자 확정을 담당하는 호스트(001-room-lifecycle 참고) */
  host: Player | null;
  /** 이 클라이언트 자신의 Player. 아직 입장하지 않았으면 null */
  currentPlayer: Player | null;
  roomStatus: "waiting" | "playing" | "ended";
  /** game-started 시점의 턴 순서(참가자 id 목록). 아직 시작 전이면 null */
  turnOrder: string[] | null;
  turnSeq: number | null;
  turnStartedAt: number | null;
  /** 지금까지 호출된 숫자 (호출 순서) */
  calledNumbers: number[];
  /** 내 보드에서 호출된 숫자와 겹치는 칸 */
  markedNumbers: Set<number>;
  /** 내 보드 기준 완성된 라인 수 */
  completedLines: number;
  /** 지금 턴인 참가자 id. 게임 시작 전이면 null */
  currentTurnPlayerId: string | null;
  /** 우승자 id 목록. 게임이 끝나지 않았으면 null */
  winnerIds: string[] | null;
  /** 게임 종료 후 공개된 보드들 (playerId → board) */
  revealedBoards: Record<string, BoardGrid>;
  /** 대기실/게임 중 언제든 쌓이는 채팅 메시지 (수신 순서) */
  chatMessages: ChatMessage[];
  /** 채팅 메시지를 보낸다 */
  sendChatMessage: (message: string) => void;
  /** 닉네임 중복·정원(5명)·이미 시작/종료된 방 여부를 검증한 뒤 입장을 시도한다 */
  join: (nickname: string) => Promise<JoinRoomResult>;
  /** 방을 나간다 (Presence에서 내리고 채널 구독도 해제) */
  leave: () => void;
  /** 본인 준비 상태를 갱신한다 (보드를 다시 바꾸면 false로 되돌리는 용도) */
  setReady: (isReady: boolean) => void;
  /** 내 턴에 숫자를 호출한다. 내 턴이 아니거나 이미 호출된 숫자면 무시된다 */
  callNumber: (value: number) => void;
  /** 같은 방에서 새 게임을 시작한다 (세팅 단계로 복귀) */
  restartGame: () => void;
  /** 마지막 입장 시도가 재접속 상태 동기화 타임아웃(3초)으로 대체 처리됐는지 */
  hasReconnectTimedOut: boolean;
}

type PresenceState = Record<string, (RoomPresencePayload & { presence_ref: string })[]>;

function toPlayers(state: PresenceState): Player[] {
  return Object.entries(state).map(([id, metas]) => {
    const payload = metas[0];
    return {
      id,
      nickname: payload.nickname,
      board: null,
      markedNumbers: [],
      isReady: payload.isReady,
      completedLines: payload.completedLines,
      joinedAt: payload.joinedAt,
    };
  });
}

/**
 * 방의 Presence 상태로부터 참가자 목록/인원수/호스트를 계산하고, 닉네임
 * 중복·정원(5명)·이미 시작/종료된 방 여부를 검증해 입장(track)을 처리한다.
 * 전원 준비 완료 시 호스트가 game-started를 broadcast해 게임을 시작하고,
 * 턴 진행(숫자 호출·마킹·라인 판정·시간 초과 자동 호출), 동시 우승 판정과
 * 게임 종료·재시작까지 담당한다.
 * (001-room-lifecycle, 002-board-setup, 003-turn-gameplay, 004-game-end-restart 스펙 참고)
 *
 * @param roomId - 방 ID
 * @param board - 이 클라이언트의 빙고판(5x5). 세팅 전이면 null.
 */
export function useRoomPresence(roomId: string, board: BoardGrid | null): UseRoomPresenceResult {
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentNickname, setCurrentNickname] = useState<string | null>(null);
  const [roomStatus, setRoomStatus] = useState<"waiting" | "playing" | "ended">("waiting");
  const [turnOrder, setTurnOrder] = useState<string[] | null>(null);
  const [turnSeq, setTurnSeq] = useState<number | null>(null);
  const [turnStartedAt, setTurnStartedAt] = useState<number | null>(null);
  const [calledNumbers, setCalledNumbers] = useState<number[]>([]);
  const [winnerIds, setWinnerIds] = useState<string[] | null>(null);
  const [revealedBoards, setRevealedBoards] = useState<Record<string, BoardGrid>>({});
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [hasReconnectTimedOut, setHasReconnectTimedOut] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const selfPayloadRef = useRef<RoomPresencePayload | null>(null);
  const boardRef = useRef<BoardGrid | null>(board);
  const isHostRef = useRef(false);
  const hasStartedRef = useRef(false);
  const hasGameEndedRef = useRef(false);
  const hasRevealedBoardRef = useRef(false);
  const appliedTurnSeqRef = useRef(0);
  const calledNumbersRef = useRef<number[]>([]);
  const hasBingoCompletedRef = useRef(false);
  const pendingWinnersRef = useRef<Map<string, BingoCompletedPayload>>(new Map());
  const gameOverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** request-state에 대한 응답을 기다리는 동안만 채워진다 (join 진행 중 1회용) */
  const pendingStateSyncResolverRef = useRef<((payload: StateSyncPayload) => void) | null>(null);
  /** 다른 사람의 request-state에 응답할 때 쓸, 내가 아는 최신 공유 상태 */
  const sharedStateRef = useRef<StateSyncPayload>({
    roomStatus: "waiting",
    turnOrder: null,
    turnSeq: null,
    turnStartedAt: null,
    calledNumbers: [],
    winnerIds: null,
    revealedBoards: {},
  });

  useEffect(() => {
    calledNumbersRef.current = calledNumbers;
  }, [calledNumbers]);

  useEffect(() => {
    boardRef.current = board;
  }, [board]);

  useEffect(() => {
    sharedStateRef.current = { roomStatus, turnOrder, turnSeq, turnStartedAt, calledNumbers, winnerIds, revealedBoards };
  }, [roomStatus, turnOrder, turnSeq, turnStartedAt, calledNumbers, winnerIds, revealedBoards]);

  const leave = useCallback(() => {
    const channel = channelRef.current;
    if (!channel) return;
    void untrackPresence(channel);
    leaveRoomChannel(channel);
    if (gameOverTimerRef.current !== null) {
      clearTimeout(gameOverTimerRef.current);
      gameOverTimerRef.current = null;
    }
    channelRef.current = null;
    selfPayloadRef.current = null;
    hasStartedRef.current = false;
    hasGameEndedRef.current = false;
    hasRevealedBoardRef.current = false;
    hasBingoCompletedRef.current = false;
    appliedTurnSeqRef.current = 0;
    pendingWinnersRef.current = new Map();
    pendingStateSyncResolverRef.current = null;
    setCurrentNickname(null);
    setPlayers([]);
    setRoomStatus("waiting");
    setTurnOrder(null);
    setTurnSeq(null);
    setTurnStartedAt(null);
    setCalledNumbers([]);
    setWinnerIds(null);
    setRevealedBoards({});
    setChatMessages([]);
    setHasReconnectTimedOut(false);
  }, []);

  useEffect(() => {
    return () => leave();
  }, [leave]);

  const applyChatMessage = useCallback((payload: ChatMessagePayload) => {
    setChatMessages((prev) => [...prev, payload]);
  }, []);

  const sendChatMessage = useCallback(
    (message: string) => {
      const channel = channelRef.current;
      const trimmed = message.trim();
      if (!channel || !trimmed || !currentNickname) return;
      const payload: ChatMessagePayload = { nickname: currentNickname, message: trimmed, sentAt: Date.now() };
      void broadcast(channel, "chat-message", payload);
      applyChatMessage(payload);
    },
    [currentNickname, applyChatMessage],
  );

  const applyGameStarted = useCallback((payload: GameStartedPayload) => {
    hasStartedRef.current = true;
    setRoomStatus("playing");
    setTurnOrder(payload.turnOrder);
    setTurnSeq(payload.turnSeq);
    setTurnStartedAt(payload.turnStartedAt);

    const channel = channelRef.current;
    if (channel && selfPayloadRef.current) {
      const next: RoomPresencePayload = { ...selfPayloadRef.current, roomStatus: "playing" };
      selfPayloadRef.current = next;
      void trackPresence(channel, next);
    }
  }, []);

  const applyNumberCalled = useCallback((payload: NumberCalledPayload) => {
    if (payload.turnSeq <= appliedTurnSeqRef.current) return; // 이미 처리한 턴 (경합/중복)
    appliedTurnSeqRef.current = payload.turnSeq;
    setCalledNumbers((prev) => (prev.includes(payload.number) ? prev : [...prev, payload.number]));
    setTurnSeq(payload.turnSeq + 1);
    setTurnStartedAt(payload.turnStartedAt);
  }, []);

  const revealOwnBoard = useCallback(() => {
    const channel = channelRef.current;
    if (!channel || hasRevealedBoardRef.current || !selfPayloadRef.current || !boardRef.current) return;
    hasRevealedBoardRef.current = true;
    const payload: BoardRevealedPayload = {
      playerId: selfPayloadRef.current.nickname,
      board: boardRef.current,
    };
    void broadcast(channel, "board-revealed", payload);
    setRevealedBoards((prev) => ({ ...prev, [payload.playerId]: payload.board }));
  }, []);

  const applyGameOver = useCallback(
    (payload: GameOverPayload) => {
      hasGameEndedRef.current = true;
      if (gameOverTimerRef.current !== null) {
        clearTimeout(gameOverTimerRef.current);
        gameOverTimerRef.current = null;
      }
      setRoomStatus("ended");
      setWinnerIds(payload.winnerIds);
      revealOwnBoard();
    },
    [revealOwnBoard],
  );

  const finalizeGameOver = useCallback(
    (winnerIds: string[]) => {
      if (hasGameEndedRef.current) return;
      const channel = channelRef.current;
      if (!channel) return;
      const payload: GameOverPayload = { winnerIds };
      void broadcast(channel, "game-over", payload);
      applyGameOver(payload);
    },
    [applyGameOver],
  );

  const applyBingoCompleted = useCallback(
    (payload: BingoCompletedPayload) => {
      pendingWinnersRef.current.set(payload.nickname, payload);
      if (!isHostRef.current || hasGameEndedRef.current || gameOverTimerRef.current !== null) return;

      gameOverTimerRef.current = setTimeout(() => {
        gameOverTimerRef.current = null;
        if (hasGameEndedRef.current) return;
        const winners = Array.from(pendingWinnersRef.current.values()).filter(
          (entry) => entry.turnSeq === payload.turnSeq,
        );
        finalizeGameOver(winners.map((winner) => winner.nickname));
      }, BINGO_GRACE_MS);
    },
    [finalizeGameOver],
  );

  const applyRestartGame = useCallback(() => {
    hasStartedRef.current = false;
    hasGameEndedRef.current = false;
    hasRevealedBoardRef.current = false;
    hasBingoCompletedRef.current = false;
    appliedTurnSeqRef.current = 0;
    pendingWinnersRef.current = new Map();
    if (gameOverTimerRef.current !== null) {
      clearTimeout(gameOverTimerRef.current);
      gameOverTimerRef.current = null;
    }
    setRoomStatus("waiting");
    setTurnOrder(null);
    setTurnSeq(null);
    setTurnStartedAt(null);
    setCalledNumbers([]);
    setWinnerIds(null);
    setRevealedBoards({});

    const channel = channelRef.current;
    if (channel && selfPayloadRef.current) {
      const next: RoomPresencePayload = {
        ...selfPayloadRef.current,
        isReady: false,
        completedLines: 0,
        roomStatus: "waiting",
      };
      selfPayloadRef.current = next;
      void trackPresence(channel, next);
    }
  }, []);

  /** request-state 응답(state-sync)으로 받은 공유 상태를 그대로 반영한다 (재접속) */
  const applyStateSync = useCallback((payload: StateSyncPayload) => {
    hasStartedRef.current = payload.roomStatus !== "waiting";
    hasGameEndedRef.current = payload.roomStatus === "ended";
    // turnSeq는 "다음에 불릴 턴"의 번호이므로, 마지막으로 처리된 턴은 그 하나 전이다.
    appliedTurnSeqRef.current = payload.turnSeq !== null ? payload.turnSeq - 1 : 0;
    setRoomStatus(payload.roomStatus);
    setTurnOrder(payload.turnOrder);
    setTurnSeq(payload.turnSeq);
    setTurnStartedAt(payload.turnStartedAt);
    setCalledNumbers(payload.calledNumbers);
    setWinnerIds(payload.winnerIds);
    setRevealedBoards(payload.revealedBoards);
  }, []);

  const join = useCallback(
    (nickname: string): Promise<JoinRoomResult> => {
      return new Promise((resolve) => {
        let channel: RealtimeChannel;
        try {
          channel = subscribeToRoomChannel(roomId, nickname);
        } catch (error) {
          console.error("Supabase 방 채널 구독 실패:", error);
          resolve({ ok: false, reason: "config-error" });
          return;
        }

        channel.on("presence", { event: "sync" }, () => {
          setPlayers(toPlayers(channel.presenceState<RoomPresencePayload>()));
        });

        channel.on("broadcast", { event: "game-started" }, ({ payload }) => {
          applyGameStarted(payload as GameStartedPayload);
        });

        channel.on("broadcast", { event: "number-called" }, ({ payload }) => {
          applyNumberCalled(payload as NumberCalledPayload);
        });

        channel.on("broadcast", { event: "bingo-completed" }, ({ payload }) => {
          applyBingoCompleted(payload as BingoCompletedPayload);
        });

        channel.on("broadcast", { event: "game-over" }, ({ payload }) => {
          applyGameOver(payload as GameOverPayload);
        });

        channel.on("broadcast", { event: "board-revealed" }, ({ payload }) => {
          const revealed = payload as BoardRevealedPayload;
          setRevealedBoards((prev) => (prev[revealed.playerId] ? prev : { ...prev, [revealed.playerId]: revealed.board }));
        });

        channel.on("broadcast", { event: "restart-game" }, () => {
          applyRestartGame();
        });

        channel.on("broadcast", { event: "chat-message" }, ({ payload }) => {
          applyChatMessage(payload as ChatMessagePayload);
        });

        // 다른 사람이 재접속하며 보낸 request-state에 응답한다. 나도 아는 게 없으면(대기 중) 응답하지 않는다.
        channel.on("broadcast", { event: "request-state" }, () => {
          if (sharedStateRef.current.roomStatus === "waiting") return;
          void broadcast(channel, "state-sync", sharedStateRef.current);
        });

        // 내가 보낸 request-state에 대한 응답. join() 진행 중일 때만 의미가 있다.
        channel.on("broadcast", { event: "state-sync" }, ({ payload }) => {
          pendingStateSyncResolverRef.current?.(payload as StateSyncPayload);
        });

        channel.subscribe((status) => {
          if (status !== "SUBSCRIBED") return;

          const state = channel.presenceState<RoomPresencePayload>();
          const isDuplicate = Object.prototype.hasOwnProperty.call(state, nickname);
          if (isDuplicate) {
            leaveRoomChannel(channel);
            resolve({ ok: false, reason: "duplicate-nickname" });
            return;
          }

          const currentCount = Object.keys(state).length;
          if (currentCount >= ROOM_CAPACITY) {
            leaveRoomChannel(channel);
            resolve({ ok: false, reason: "full" });
            return;
          }

          const finalizeJoin = (payload: RoomPresencePayload) => {
            void trackPresence(channel, payload);
            channelRef.current = channel;
            selfPayloadRef.current = payload;
            setCurrentNickname(nickname);
            resolve({ ok: true });
          };

          const isAlreadyStarted = Object.values(state).some(
            (metas) => metas[0]?.roomStatus === "playing" || metas[0]?.roomStatus === "ended",
          );

          if (!isAlreadyStarted) {
            setHasReconnectTimedOut(false);
            finalizeJoin({
              nickname,
              isReady: false,
              joinedAt: Date.now(),
              roomStatus: "waiting",
              completedLines: 0,
            });
            return;
          }

          // 이미 진행 중인 방 — 재접속(닉네임이 원래 참가자였는지)인지, 새로 들어오려는
          // 낯선 사람인지 모르는 상태다. 다른 클라이언트에게 공유 상태를 요청해서 확인한다.
          const timeoutId = setTimeout(() => {
            pendingStateSyncResolverRef.current = null;
            setHasReconnectTimedOut(true);
            // 아무도 응답하지 않으면(전원 동시 새로고침 등) 검증할 방법이 없으므로,
            // 새로 시작하는 것으로 안내하며 대기 상태로 입장시킨다.
            finalizeJoin({
              nickname,
              isReady: false,
              joinedAt: Date.now(),
              roomStatus: "waiting",
              completedLines: 0,
            });
          }, REQUEST_STATE_TIMEOUT_MS);

          pendingStateSyncResolverRef.current = (payload) => {
            clearTimeout(timeoutId);
            pendingStateSyncResolverRef.current = null;

            const isRecognizedReturningPlayer = payload.turnOrder?.includes(nickname) ?? false;
            if (!isRecognizedReturningPlayer) {
              leaveRoomChannel(channel);
              resolve({ ok: false, reason: "already-started" });
              return;
            }

            setHasReconnectTimedOut(false);
            applyStateSync(payload);
            finalizeJoin({
              nickname,
              isReady: true,
              joinedAt: Date.now(),
              roomStatus: payload.roomStatus,
              completedLines: 0,
            });
          };

          void broadcast(channel, "request-state", {});
        });
      });
    },
    [
      roomId,
      applyGameStarted,
      applyNumberCalled,
      applyBingoCompleted,
      applyGameOver,
      applyRestartGame,
      applyChatMessage,
      applyStateSync,
    ],
  );

  const setReady = useCallback((isReady: boolean) => {
    const channel = channelRef.current;
    if (!channel || !selfPayloadRef.current) return;
    const next: RoomPresencePayload = { ...selfPayloadRef.current, isReady };
    selfPayloadRef.current = next;
    void trackPresence(channel, next);
  }, []);

  const restartGame = useCallback(() => {
    const channel = channelRef.current;
    if (!channel) return;
    void broadcast(channel, "restart-game", {});
    applyRestartGame();
  }, [applyRestartGame]);

  const playerCount = players.length;
  const host = players.reduce<Player | null>(
    (earliest, player) => (!earliest || player.joinedAt < earliest.joinedAt ? player : earliest),
    null,
  );
  const currentPlayer = currentNickname
    ? (players.find((player) => player.nickname === currentNickname) ?? null)
    : null;
  const currentTurnPlayerId =
    turnOrder && turnSeq !== null ? (turnOrder[(turnSeq - 1) % turnOrder.length] ?? null) : null;

  useEffect(() => {
    isHostRef.current = !!currentPlayer && !!host && currentPlayer.id === host.id;
  }, [currentPlayer, host]);

  const callNumber = useCallback(
    (value: number) => {
      const channel = channelRef.current;
      if (!channel || turnSeq === null) return;
      if (!currentPlayer || currentPlayer.id !== currentTurnPlayerId) return;
      if (calledNumbersRef.current.includes(value)) return;

      const payload: NumberCalledPayload = {
        number: value,
        auto: false,
        turnSeq,
        turnStartedAt: Date.now(),
      };
      void broadcast(channel, "number-called", payload);
      applyNumberCalled(payload);
    },
    [turnSeq, currentPlayer, currentTurnPlayerId, applyNumberCalled],
  );

  // 호스트만: 전원 준비 완료를 감지하면 game-started를 broadcast해 게임을 시작한다.
  useEffect(() => {
    if (roomStatus !== "waiting" || hasStartedRef.current) return;
    if (!currentPlayer || !host || currentPlayer.id !== host.id) return;
    if (players.length < MIN_PLAYERS_TO_START) return;
    if (!players.every((player) => player.isReady)) return;

    const channel = channelRef.current;
    if (!channel) return;

    hasStartedRef.current = true;
    const payload: GameStartedPayload = {
      turnOrder: [...players].sort((a, b) => a.joinedAt - b.joinedAt).map((player) => player.id),
      turnSeq: 1,
      turnStartedAt: Date.now(),
    };
    void broadcast(channel, "game-started", payload);
    applyGameStarted(payload);
  }, [players, host, currentPlayer, roomStatus, applyGameStarted]);

  // 호스트만: 현재 턴이 10초 안에 호출되지 않으면 남은 숫자 중 랜덤으로 대신 호출한다.
  useEffect(() => {
    if (roomStatus !== "playing") return;
    if (!currentPlayer || !host || currentPlayer.id !== host.id) return;
    if (turnStartedAt === null || turnSeq === null) return;

    const resolvingTurnSeq = turnSeq;
    const delay = Math.max(0, turnStartedAt + TURN_DURATION_MS - Date.now());
    const timeoutId = setTimeout(() => {
      if (appliedTurnSeqRef.current >= resolvingTurnSeq) return; // 그 사이 수동으로 이미 호출됨
      const remaining = ALL_NUMBERS.filter((n) => !calledNumbersRef.current.includes(n));
      if (remaining.length === 0) return;

      const channel = channelRef.current;
      if (!channel) return;

      const number = remaining[Math.floor(Math.random() * remaining.length)];
      const payload: NumberCalledPayload = {
        number,
        auto: true,
        turnSeq: resolvingTurnSeq,
        turnStartedAt: Date.now(),
      };
      void broadcast(channel, "number-called", payload);
      applyNumberCalled(payload);
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [roomStatus, currentPlayer, host, turnStartedAt, turnSeq, applyNumberCalled]);

  // 호스트만: 이탈로 활성 참가자가 1명만 남으면 유예 없이 즉시 게임을 종료한다.
  useEffect(() => {
    if (roomStatus !== "playing" || hasGameEndedRef.current) return;
    if (!currentPlayer || !host || currentPlayer.id !== host.id) return;
    if (players.length !== 1) return;
    finalizeGameOver([players[0].id]);
  }, [players, roomStatus, host, currentPlayer, finalizeGameOver]);

  const markedNumbers = useMemo(() => {
    const marked = new Set<number>();
    if (!board) return marked;
    const called = new Set(calledNumbers);
    for (const row of board) {
      for (const cell of row) {
        if (cell !== null && called.has(cell)) marked.add(cell);
      }
    }
    return marked;
  }, [board, calledNumbers]);

  const completedLines = useMemo(
    () => (board ? countCompletedLines(board, markedNumbers) : 0),
    [board, markedNumbers],
  );

  // 완성 라인 수가 바뀔 때마다 전원에게 공유하고, 3줄 이상이면 bingo-completed를 한 번만 보낸다.
  useEffect(() => {
    if (roomStatus !== "playing") return;
    const channel = channelRef.current;
    if (!channel || !selfPayloadRef.current) return;
    if (selfPayloadRef.current.completedLines === completedLines) return;

    const next: RoomPresencePayload = { ...selfPayloadRef.current, completedLines };
    selfPayloadRef.current = next;
    void trackPresence(channel, next);

    if (completedLines >= BINGO_LINE_THRESHOLD && !hasBingoCompletedRef.current) {
      hasBingoCompletedRef.current = true;
      const payload: BingoCompletedPayload = {
        nickname: currentNickname ?? "",
        completedLines,
        turnSeq: appliedTurnSeqRef.current,
      };
      void broadcast(channel, "bingo-completed", payload);
    }
  }, [completedLines, roomStatus, currentNickname]);

  return {
    players,
    playerCount,
    isRoomFull: playerCount >= ROOM_CAPACITY,
    host,
    currentPlayer,
    roomStatus,
    turnOrder,
    turnSeq,
    turnStartedAt,
    calledNumbers,
    markedNumbers,
    completedLines,
    currentTurnPlayerId,
    winnerIds,
    revealedBoards,
    chatMessages,
    sendChatMessage,
    join,
    leave,
    setReady,
    callNumber,
    restartGame,
    hasReconnectTimedOut,
  };
}

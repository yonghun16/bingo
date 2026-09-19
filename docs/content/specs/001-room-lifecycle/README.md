---
status: draft
created: 2026-09-19
tags:
- realtime
- mvp
created_at: 2026-09-19T14:17:47.863832Z
updated_at: 2026-09-19T14:17:47.863832Z
---

# 방 생성/입장/정원/호스트 판단

## Overview

카카오톡 링크 공유로 방을 만들고 입장하는 흐름. Supabase Realtime 채널(`bingo-room-{roomId}`) 구독과 Presence로 참가자/정원/호스트를 관리한다. 전체 배경은 [[게임흐름]] 참고.

## Design

- 방 생성 시 클라이언트가 roomId를 직접 생성하고 `/room/:roomId`로 라우팅한다.
- 입장 시 채널을 구독하기 전에 현재 Presence 상태를 조회해 정원(5명) 초과 여부를 확인하고, 초과 시 입장을 막는다.
- 이미 게임이 시작된 방(Presence로 공유되는 status가 `playing`/`ended`)에는 입장할 수 없다.
- 호스트 = Presence 입장 시각(`joinedAt`)이 가장 이른 참가자. 별도 broadcast 없이 모든 클라이언트가 동일한 Presence 목록으로 각자 동일하게 계산한다.
- 별도 게임 서버 없이 Presence/Broadcast만 사용하는 배경은 [[0001-supabase-realtime-통신]](ADR) 참고.

## Plan

- [ ] `lib/supabase.ts`: Supabase 클라이언트 단일 인스턴스
- [ ] `features/bingo-room/api/roomChannel.ts`: 채널 구독/구독 해제
- [ ] `useRoomPresence` 훅: 참가자 목록, 인원수, 호스트 여부 계산
- [ ] 정원(5명) 초과 / 이미 시작된 방 입장 차단 로직
- [ ] 방 만들기 → roomId 생성 → 초대 링크 표시 UI
- [ ] 닉네임 입력 → 입장 플로우

## Test

- [ ] 여러 탭으로 방 생성/입장 시 Presence로 참가자 목록이 실시간 동기화됨
- [ ] 5명 입장 후 6번째 입장 시도 시 "방이 가득 찼습니다" 안내가 뜸
- [ ] 이미 게임이 시작된 방에 새로 입장 시도하면 차단됨
- [ ] 모든 탭에서 동일한 사람이 호스트로 계산됨

## Notes

호스트 이탈 시 승계 로직의 실제 활용(턴 타이머 이어받기)은 003(turn-gameplay)에서 다룬다.

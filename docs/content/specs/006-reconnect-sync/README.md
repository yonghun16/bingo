---
status: draft
created: 2026-09-19
tags:
- realtime
depends_on:
- 001-room-lifecycle
- 003-turn-gameplay
created_at: 2026-09-19T14:18:10.175784Z
updated_at: 2026-09-19T14:18:10.175784Z
---

# 재접속/새로고침 상태 동기화

## Overview

새로고침이나 재접속으로 로컬 상태를 잃은 클라이언트가 현재 게임 상태를 다시 받아오는 기능. [[게임흐름]] "예외 처리" 및 [[0001-supabase-realtime-통신]](ADR)의 Consequences 참고.

## Design

- 재접속한 클라이언트는 채널 재구독 직후 `request-state`를 broadcast한다.
- 다른 클라이언트(주로 호스트, 없으면 아무나)가 자신이 알고 있는 최신 상태를 `state-sync`로 응답한다.
- 알려진 한계: 참가자 전원이 동시에 새로고침하면 상태를 복구해 줄 클라이언트가 없다. 이는 서버가 상태 원본을 갖지 않는 구조([[0001-supabase-realtime-통신]])의 트레이드오프로, 이번 스펙 범위에서는 해결하지 않는다.

## Plan

- [ ] 재구독 시 `request-state` broadcast
- [ ] `state-sync` 응답 로직(호스트 우선 응답, 없으면 아무나)
- [ ] 수신한 상태로 로컬 Room/Player 상태 재구성

## Test

- [ ] 게임 진행 중 새로고침한 탭이 몇 초 내에 현재 상태로 복구됨
- [ ] 세팅 단계에서 새로고침해도 참가자 목록/준비 상태가 정상 복구됨

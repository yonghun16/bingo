---
status: draft
created: 2026-09-19
tags:
- realtime
depends_on:
- 001-room-lifecycle
- 003-turn-gameplay
created_at: 2026-09-19T14:18:10.175784Z
updated_at: 2026-09-19T14:45:48.838200Z
---

# 재접속/새로고침 상태 동기화

## Overview

새로고침이나 재접속으로 로컬 상태를 잃은 클라이언트가 현재 게임 상태를 다시 받아오는 기능. [[게임흐름]] "예외 처리" 및 [[0001-supabase-realtime-통신]](ADR)의 Consequences 참고.

## Design

- 재접속한 클라이언트는 채널 재구독 직후 `request-state`를 broadcast한다.
- 다른 클라이언트(주로 호스트, 없으면 아무나)가 자신이 알고 있는 최신 상태를 `state-sync`로 응답한다.
- 알려진 한계: 참가자 전원이 동시에 새로고침하면 상태를 복구해 줄 클라이언트가 없다. 이는 서버가 상태 원본을 갖지 않는 구조([[0001-supabase-realtime-통신]])의 트레이드오프다. 이 스펙에서는 완전한 복구 대신, 일정 시간(약 3초) 무응답 시 안내 메시지와 함께 방을 새로 시작하도록 유도하는 것으로 대응한다.

## Plan

- [ ] 재구독 시 `request-state` broadcast
- [ ] `state-sync` 응답 로직(호스트 우선 응답, 없으면 아무나)
- [ ] 수신한 상태로 로컬 Room/Player 상태 재구성


- [ ] `request-state` 응답 대기 타임아웃(약 3초) 처리 + 무응답 시 안내 UI

## Test

- [ ] 게임 진행 중 새로고침한 탭이 몇 초 내에 현재 상태로 복구됨
- [ ] 세팅 단계에서 새로고침해도 참가자 목록/준비 상태가 정상 복구됨

- [ ] `request-state`에 3초 내 응답이 없으면 안내 메시지가 뜨고 방을 새로 시작할 수 있음

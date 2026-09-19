---
status: draft
created: 2026-09-19
tags:
- realtime
- mvp
- gameplay
depends_on:
- 003-turn-gameplay
created_at: 2026-09-19T14:18:03.900378Z
updated_at: 2026-09-19T14:18:03.900378Z
---

# 게임 종료 및 재시작

## Overview

우승자를 확정하고 게임을 종료·재시작하는 흐름. [[게임흐름]] "5. 게임 종료" 참고.

## Design

- 호스트는 같은 `number-called` 라운드에서 들어오는 `bingo-completed` 이벤트를 짧은 유예 시간(약 300ms) 동안 모아 동시 달성 여부를 판단한다.
- 확정된 우승자(단독 또는 복수)와 전체 참가자 보드 공개 데이터를 `game-over`로 broadcast한다. 이 즉시 게임이 종료된다.
- "다시 하기" 버튼을 누르면 `restart-game`을 broadcast하고, 수신한 전원이 로컬 상태를 초기화한 뒤 세팅 단계(002-board-setup)로 복귀한다.

## Plan

- [ ] 호스트: `bingo-completed` 유예 수집 + 동시 우승 판정 로직
- [ ] `game-over` broadcast(우승자 정보 + 전체 보드 공개 데이터)
- [ ] 우승자 배너/모달 UI
- [ ] 전체 참가자 보드 공개 뷰
- [ ] "다시 하기" 버튼 → `restart-game` broadcast
- [ ] `restart-game` 수신 시 로컬 상태 초기화

## Test

- [ ] 단독 우승 시 정확히 한 명만 우승자로 표시됨
- [ ] 동시 달성(같은 호출로 여러 명이 3줄 완성) 시 공동 우승으로 표시됨
- [ ] 게임 종료 즉시 모든 참가자의 보드가 공개됨(마스킹 해제)
- [ ] 재시작 시 이전 라운드 데이터가 모든 탭에서 남지 않고 완전히 초기화됨

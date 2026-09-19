---
status: draft
created: 2026-09-19
tags:
- realtime
- mvp
- gameplay
depends_on:
- 002-board-setup
created_at: 2026-09-19T14:17:59.043506Z
updated_at: 2026-09-19T14:17:59.043506Z
---

# 턴제 숫자 호출과 라인 판정

## Overview

턴제로 숫자를 호출하고 보드를 마킹하며 라인 완성을 판정하는 핵심 게임 로직. [[게임흐름]] "4. 게임 진행(턴제)" 참고.

## Design

- 현재 턴 유저는 10초 안에 `call-number`를 broadcast해야 한다.
- 10초 안에 호출하지 않으면 호스트 클라이언트가 남은 숫자 중 랜덤으로 골라 `number-called`를 broadcast한다(payload에 `auto: true` 표시).
- 모든 클라이언트는 `number-called` 수신 시 로컬 보드를 마킹하고 완성 라인 수(가로5+세로5+대각선2=12줄)를 재계산한다.
- 3줄을 완성한 클라이언트는 `bingo-completed`를 broadcast한다. 여러 명의 동시 우승 최종 판정은 004(game-end-restart)에서 다룬다.
- 호스트가 연결을 끊으면 Presence `joinedAt` 기준 다음 순번이 자동으로 호스트 역할(턴 타이머 관리)을 이어받는다. 호스트 판단 로직은 001(room-lifecycle) 참고.

## Plan

- [ ] 턴 상태(현재 턴, 남은 시간) 계산 훅
- [ ] 숫자 선택 UI(턴일 때만 활성화, 이미 호출된 숫자는 비활성화) → `call-number` broadcast
- [ ] 호스트: 10초 타이머 관리 + 시간 초과 자동 호출
- [ ] `number-called` 수신 → 보드 마킹 + 라인 완성 수 계산
- [ ] 3줄 완성 시 `bingo-completed` broadcast
- [ ] 호스트 이탈 시 다음 순번이 타이머 역할을 승계하는지 확인

## Test

- [ ] 여러 탭에서 턴이 입장 순서대로 정확히 넘어감
- [ ] 10초 초과 시 호스트가 자동으로 숫자를 호출함
- [ ] 숫자 호출 시 전원의 보드에 동일하게 마킹됨
- [ ] 3줄 완성 시 `bingo-completed`가 정상 발생함
- [ ] 호스트 탭을 강제로 닫아도 다음 순번이 타이머를 이어받아 게임이 계속 진행됨

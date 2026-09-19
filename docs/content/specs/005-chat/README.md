---
status: draft
created: 2026-09-19
priority: low
tags:
- realtime
- mvp
depends_on:
- 001-room-lifecycle
created_at: 2026-09-19T14:18:10.134348Z
updated_at: 2026-09-19T14:18:10.134348Z
---

# 실시간 채팅

## Overview

대기실/게임 중 언제든 사용 가능한 실시간 채팅. [[게임흐름]] "6. 채팅" 참고.

## Design

- `chat-message`를 broadcast(닉네임 + 메시지 + 타임스탬프)하고, 각 클라이언트는 수신 순서대로 로컬에 누적한다.
- 서버에 영구 저장하지 않으므로, 새로고침 시 채팅 이력도 함께 유실된다. 게임 상태 재동기화(006-reconnect-sync)의 범위에는 채팅 이력 복구를 포함하지 않는다.

## Plan

- [ ] 채팅 입력창 + 메시지 리스트 컴포넌트
- [ ] `chat-message` broadcast 송수신
- [ ] 닉네임/타임스탬프 표시

## Test

- [ ] 대기실/게임 중 어느 시점에도 채팅 송수신이 정상 동작함

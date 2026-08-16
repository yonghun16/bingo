# 빙고 (Bingo)

최대 5명이 함께 즐기는 실시간 멀티플레이어 빙고 게임입니다.

## 기술 스택

- 프론트엔드: React + TypeScript + Vite + Tailwind CSS
- 실시간 통신: Socket.io-client ↔ 별도 Node.js + Socket.io 게임 서버

## 게임 흐름

1. 방 만들기 → 초대 링크 공유
2. 닉네임 입력 후 입장 (최대 5명)
3. 1~25 숫자를 5x5 보드에 배치, 전원 준비 완료 시 자동 시작
4. 입장 순서대로 턴제 진행 (10초 안에 숫자 호출)
5. 가로/세로/대각선 12줄 중 3줄 완성 시 우승, 재시작 가능
6. 대기실/게임 중 실시간 채팅 지원

자세한 스펙과 개발 프로세스는 [`docs/content`](docs/content)(Obsidian Vault, Quartz 사이트) 문서를 참고하세요.

# LONG RUN

일에서 발생한 문제를 스스로 판단하고 대응할 수 있도록 돕는 개인 문제 해결 기록 서비스입니다.
답을 대신 제시하지 않고, 사용자가 자신의 답을 판단할 수 있도록 돕습니다.

MVP는 회원가입이나 서버 없이 브라우저 localStorage에 데이터를 저장합니다. 구현 결과와 판단 기록은 [docs/implementation-notes.md](docs/implementation-notes.md)에 있습니다.

## 기술 스택

- React, TypeScript, Vite
- React Router
- Vitest, Playwright

## 시작하기

Node.js 20 이상이 필요합니다. 환경 변수는 사용하지 않습니다.

```bash
npm install
npm run dev
```

## 테스트

```bash
npm test
```

E2E 테스트는 처음 한 번 브라우저 설치가 필요합니다.

```bash
npx playwright install chromium
npm run test:e2e
```

## 프로젝트 구조

```
src/
├── components/  공통 UI
├── domain/      PLAY 타입과 상태·완료 규칙
├── pages/       라우트별 화면
└── storage/     localStorage 저장과 백업
e2e/             Playwright E2E 테스트
```

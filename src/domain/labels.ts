import type {
  ChangeDirection,
  ExecutionState,
  NextActionState,
  PlayStage,
  ResultState,
} from './play';

export const STAGE_NAMES: Record<PlayStage, string> = {
  1: '① 상황',
  2: '② 원인',
  3: '③ 문제',
  4: '④ 대응',
  5: '⑤ 실행',
  6: '⑥ 결과 / 나의 상태',
  7: '⑦ 다음 행동 / 인사이트',
};

export const STAGE_QUESTIONS: Record<PlayStage, string> = {
  1: '무슨 일이 있었는가?',
  2: '왜 이런 일이 생겼다고 생각하는가?',
  3: '무엇을 해결할 것인가?',
  4: '무엇을 해볼 것인가?',
  5: '실제로 실행했는가?',
  6: '어떻게 되었는가?',
  7: '다음에는 어떻게 할 것인가?',
};

export const NEXT_BUTTON_LABELS: Record<Exclude<PlayStage, 7>, string> = {
  1: '원인 찾아보기',
  2: '문제 정의하기',
  3: '대응 정하기',
  4: '실행해보기',
  5: '결과 확인하기',
  6: '다음 행동 정하기',
};

export const REQUIRED_MESSAGES: Record<PlayStage, string> = {
  1: '상황을 입력해 주세요.',
  2: '원인을 입력해 주세요.',
  3: '문제를 입력해 주세요.',
  4: '대응을 입력해 주세요.',
  5: '실행 여부를 선택해 주세요.',
  6: '결과와 스트레스 변화, 통제감 변화를 모두 선택해 주세요.',
  7: '다음 행동을 선택해 주세요. 다음 행동을 정한다를 골랐다면 내용도 입력해 주세요.',
};

export const EXECUTION_LABELS: Record<ExecutionState, string> = {
  EXECUTED: '실행함',
  PARTIALLY_EXECUTED: '일부 실행함',
  NOT_EXECUTED: '실행하지 않음',
};

export const RESULT_LABELS: Record<ResultState, string> = {
  RESOLVED: '해결됨',
  PARTIALLY_RESOLVED: '일부 해결됨',
  UNRESOLVED: '해결되지 않음',
  UNCERTAIN: '판단하기 어려움',
};

export const CHANGE_LABELS: Record<ChangeDirection, string> = {
  DECREASE: '감소',
  NO_CHANGE: '변화 없음',
  INCREASE: '증가',
};

export const NEXT_ACTION_LABELS: Record<NextActionState, string> = {
  DEFINED: '다음 행동을 정한다',
  NO_CHANGE: '현재는 바꿀 행동이 없다',
  UNKNOWN: '아직 모르겠다',
};

/** 사용자의 현지 날짜로 표시한다. */
export function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}.${month}.${day}`;
}

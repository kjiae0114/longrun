export const EXECUTION_STATES = ['EXECUTED', 'PARTIALLY_EXECUTED', 'NOT_EXECUTED'] as const;
export const RESULT_STATES = ['RESOLVED', 'PARTIALLY_RESOLVED', 'UNRESOLVED', 'UNCERTAIN'] as const;
export const CHANGE_DIRECTIONS = ['DECREASE', 'NO_CHANGE', 'INCREASE'] as const;
export const NEXT_ACTION_STATES = ['DEFINED', 'NO_CHANGE', 'UNKNOWN'] as const;

export type ExecutionState = (typeof EXECUTION_STATES)[number];
export type ResultState = (typeof RESULT_STATES)[number];
export type ChangeDirection = (typeof CHANGE_DIRECTIONS)[number];
export type NextActionState = (typeof NEXT_ACTION_STATES)[number];

export interface Play {
  id: string;
  createdAt: string;
  /** 사용자가 고른 날짜(YYYY-MM-DD). 시각 정보가 없다. */
  problemOccurredAt: string | null;
  completedAt: string | null;
  deletedAt: string | null;
  situation: string;
  cause: string;
  problem: string;
  response: string;
  execution: { state: ExecutionState | null; explanation: string };
  result: { state: ResultState | null; explanation: string };
  stressChange: ChangeDirection | null;
  controlChange: ChangeDirection | null;
  nextAction: { state: NextActionState | null; content: string };
  insight: string;
}

/** 사용자가 작성하는 값. 식별자와 시각은 시스템만 기록한다. */
export type PlayContent = Omit<Play, 'id' | 'createdAt' | 'completedAt' | 'deletedAt'>;

export type PlayStatus = 'IN_PROGRESS' | 'COMPLETED' | 'TRASHED';
export type PlayStage = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const PLAY_STAGES: readonly PlayStage[] = [1, 2, 3, 4, 5, 6, 7];

const hasText = (value: string) => value.trim() !== '';

/** 휴지통 상태가 다른 상태보다 우선한다. */
export function getPlayStatus(play: Pick<Play, 'completedAt' | 'deletedAt'>): PlayStatus {
  if (play.deletedAt !== null) return 'TRASHED';
  return play.completedAt !== null ? 'COMPLETED' : 'IN_PROGRESS';
}

export function isStageComplete(play: PlayContent, stage: PlayStage): boolean {
  switch (stage) {
    case 1:
      return hasText(play.situation);
    case 2:
      return hasText(play.cause);
    case 3:
      return hasText(play.problem);
    case 4:
      return hasText(play.response);
    case 5:
      return play.execution.state !== null;
    case 6:
      return (
        play.result.state !== null && play.stressChange !== null && play.controlChange !== null
      );
    case 7:
      return (
        play.nextAction.state !== null &&
        (play.nextAction.state !== 'DEFINED' || hasText(play.nextAction.content))
      );
  }
}

/**
 * 이어서 작성할 단계. 별도로 저장하지 않고 필수값이 비어 있는 첫 단계로 계산한다.
 * 모든 단계가 채워졌으면 PLAY 마치기가 있는 ⑦로 간다.
 */
export function getCurrentStage(play: PlayContent): PlayStage {
  return PLAY_STAGES.find((stage) => !isStageComplete(play, stage)) ?? 7;
}

export function canComplete(play: PlayContent): boolean {
  return PLAY_STAGES.every((stage) => isStageComplete(play, stage));
}

const isOneOf = <T extends string>(values: readonly T[], value: unknown): value is T =>
  values.includes(value as T);

const isNullableOneOf = <T extends string>(values: readonly T[], value: unknown): value is T | null =>
  value === null || isOneOf(values, value);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isTimestamp = (value: unknown): value is string =>
  typeof value === 'string' && !Number.isNaN(Date.parse(value));

const isNullableTimestamp = (value: unknown): value is string | null =>
  value === null || isTimestamp(value);

function isCalendarDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

/** 외부에서 읽은 값을 검증한다. 정의되지 않은 필드는 버리고, 규칙에 어긋나면 null을 반환한다. */
export function parsePlay(value: unknown): Play | null {
  if (!isRecord(value)) return null;
  const { id, createdAt, problemOccurredAt, completedAt, deletedAt } = value;
  const { situation, cause, problem, response, insight } = value;
  const { execution, result, stressChange, controlChange, nextAction } = value;

  if (typeof id !== 'string' || id === '') return null;
  if (!isTimestamp(createdAt) || !isNullableTimestamp(completedAt)) return null;
  if (!isNullableTimestamp(deletedAt)) return null;
  if (problemOccurredAt !== null && !isCalendarDate(problemOccurredAt)) return null;
  if (typeof situation !== 'string' || typeof cause !== 'string') return null;
  if (typeof problem !== 'string' || typeof response !== 'string') return null;
  if (typeof insight !== 'string') return null;
  if (!isRecord(execution) || !isRecord(result) || !isRecord(nextAction)) return null;
  if (typeof execution.explanation !== 'string' || typeof result.explanation !== 'string') {
    return null;
  }
  if (typeof nextAction.content !== 'string') return null;
  if (!isNullableOneOf(EXECUTION_STATES, execution.state)) return null;
  if (!isNullableOneOf(RESULT_STATES, result.state)) return null;
  if (!isNullableOneOf(NEXT_ACTION_STATES, nextAction.state)) return null;
  if (!isNullableOneOf(CHANGE_DIRECTIONS, stressChange)) return null;
  if (!isNullableOneOf(CHANGE_DIRECTIONS, controlChange)) return null;

  const play: Play = {
    id,
    createdAt,
    problemOccurredAt,
    completedAt,
    deletedAt,
    situation,
    cause,
    problem,
    response,
    execution: { state: execution.state, explanation: execution.explanation },
    result: { state: result.state, explanation: result.explanation },
    stressChange,
    controlChange,
    nextAction: { state: nextAction.state, content: nextAction.content },
    insight,
  };

  if (!isStageComplete(play, 1)) return null;
  if (play.completedAt !== null && !canComplete(play)) return null;
  return play;
}

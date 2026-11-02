import { describe, expect, it } from 'vitest';
import { canComplete, getCurrentStage, getPlayStatus, parsePlay } from './play';
import type { Play } from './play';

const AT = '2026-11-02T00:00:00.000Z';

function inProgress(overrides: Partial<Play> = {}): Play {
  return {
    id: 'play-1',
    createdAt: AT,
    problemOccurredAt: null,
    completedAt: null,
    deletedAt: null,
    situation: '상황',
    cause: '',
    problem: '',
    response: '',
    execution: { state: null, explanation: '' },
    result: { state: null, explanation: '' },
    stressChange: null,
    controlChange: null,
    nextAction: { state: null, content: '' },
    insight: '',
    ...overrides,
  };
}

function filled(overrides: Partial<Play> = {}): Play {
  return inProgress({
    cause: '원인',
    problem: '문제',
    response: '대응',
    execution: { state: 'NOT_EXECUTED', explanation: '' },
    result: { state: 'UNCERTAIN', explanation: '' },
    stressChange: 'NO_CHANGE',
    controlChange: 'NO_CHANGE',
    nextAction: { state: 'UNKNOWN', content: '' },
    ...overrides,
  });
}

describe('getPlayStatus', () => {
  it('완료와 삭제 시각으로 상태를 판별하고 휴지통을 우선한다', () => {
    expect(getPlayStatus({ completedAt: null, deletedAt: null })).toBe('IN_PROGRESS');
    expect(getPlayStatus({ completedAt: AT, deletedAt: null })).toBe('COMPLETED');
    expect(getPlayStatus({ completedAt: null, deletedAt: AT })).toBe('TRASHED');
    expect(getPlayStatus({ completedAt: AT, deletedAt: AT })).toBe('TRASHED');
  });
});

describe('getCurrentStage', () => {
  it('필수값이 비어 있는 첫 단계를 반환한다', () => {
    expect(getCurrentStage(inProgress())).toBe(2);
    expect(getCurrentStage(inProgress({ cause: '원인' }))).toBe(3);
    expect(getCurrentStage(filled({ execution: { state: null, explanation: '' } }))).toBe(5);
  });

  it('공백만 입력한 값은 비어 있는 것으로 본다', () => {
    expect(getCurrentStage(inProgress({ cause: '   ' }))).toBe(2);
  });

  it('뒤 단계가 채워져 있어도 앞 단계가 비면 앞 단계로 돌아간다', () => {
    expect(getCurrentStage(filled({ cause: '' }))).toBe(2);
  });

  it('⑥은 결과와 스트레스, 통제감 변화가 모두 있어야 끝난다', () => {
    expect(getCurrentStage(filled({ controlChange: null }))).toBe(6);
  });

  it('모든 단계가 채워지면 ⑦을 반환한다', () => {
    expect(getCurrentStage(filled())).toBe(7);
  });
});

describe('canComplete', () => {
  it.each(['NO_CHANGE', 'UNKNOWN'] as const)('다음 행동 %s는 그 자체로 완료할 수 있다', (state) => {
    expect(canComplete(filled({ nextAction: { state, content: '' } }))).toBe(true);
  });

  it('다음 행동을 정했으면 내용이 있어야 한다', () => {
    expect(canComplete(filled({ nextAction: { state: 'DEFINED', content: ' ' } }))).toBe(false);
    expect(canComplete(filled({ nextAction: { state: 'DEFINED', content: '행동' } }))).toBe(true);
  });

  it.each(['UNRESOLVED', 'UNCERTAIN'] as const)('결과가 %s여도 완료할 수 있다', (state) => {
    expect(canComplete(filled({ result: { state, explanation: '' } }))).toBe(true);
  });

  it('인사이트와 선택 입력 없이도 완료할 수 있다', () => {
    expect(canComplete(filled({ insight: '', problemOccurredAt: null }))).toBe(true);
  });
});

describe('parsePlay', () => {
  it('올바른 PLAY를 통과시키고 정의되지 않은 필드는 버린다', () => {
    const play = inProgress();
    expect(parsePlay({ ...play, status: 'DONE' })).toEqual(play);
  });

  it.each([
    ['허용되지 않은 실행 상태', { execution: { state: 'DONE', explanation: '' } }],
    ['허용되지 않은 변화 값', { stressChange: 'UP' }],
    ['잘못된 시각', { createdAt: 'yesterday' }],
    ['없는 날짜', { problemOccurredAt: '2026-02-30' }],
    ['빈 상황', { situation: ' ' }],
    ['문자열이 아닌 원인', { cause: 1 }],
    ['빈 식별자', { id: '' }],
    ['필수값이 빠진 완료 PLAY', { completedAt: AT }],
  ])('%s은 거부한다', (_name, overrides) => {
    expect(parsePlay({ ...inProgress(), ...overrides })).toBeNull();
  });

  it('필드가 빠지거나 객체가 아니면 거부한다', () => {
    const { insight: _insight, ...missing } = inProgress();
    expect(parsePlay(missing)).toBeNull();
    expect(parsePlay(null)).toBeNull();
    expect(parsePlay([])).toBeNull();
  });
});

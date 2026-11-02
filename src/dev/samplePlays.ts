import type { Play } from '../domain/play';

/** 개발 서버에서 화면을 직접 확인하기 위한 예시 PLAY. 배포본에는 포함하지 않는다. */
export const SAMPLE_PLAYS: Play[] = [
  {
    id: '6f1c2a10-0000-4000-8000-000000000001',
    createdAt: '2026-10-26T09:00:00.000Z',
    problemOccurredAt: '2026-10-26',
    completedAt: '2026-10-30T09:00:00.000Z',
    deletedAt: null,
    situation:
      '이번 주 월요일부터 수요일까지 하루 평균 5시간을 회의에 썼다. 정작 맡은 기능 개발은 거의 진행하지 못했고, 결국 수요일 밤 11시까지 야근했다.',
    cause:
      '안건 없이 열리는 정기 회의가 많다. 내가 꼭 필요하지 않은 회의에도 "혹시 몰라서" 초대된다. 거절하면 협조하지 않는 사람처럼 보일까 봐 다 들어갔다.',
    problem: '회의 때문에 내 업무 시간이 확보되지 않는다',
    response:
      '다음 주부터 안건이 공유되지 않은 회의는 참석 전에 안건을 요청한다. 내 역할이 없는 회의는 회의록 공유로 대신해도 되는지 물어본다.',
    execution: {
      state: 'PARTIALLY_EXECUTED',
      explanation:
        '안건 요청은 3번 했고 2번은 안건을 받았다. 회의 불참 요청은 팀장 회의라 말을 꺼내지 못했다.',
    },
    result: {
      state: 'PARTIALLY_RESOLVED',
      explanation: '회의 시간이 주 15시간에서 11시간으로 줄었다. 팀장 회의는 그대로다.',
    },
    stressChange: 'DECREASE',
    controlChange: 'INCREASE',
    nextAction: {
      state: 'DEFINED',
      content: '1:1 면담 때 팀장 회의에서 내 역할이 무엇인지 직접 물어본다',
    },
    insight: '안건을 요청하는 것만으로도 회의의 절반은 짧아진다. 거절보다 질문이 말하기 쉽다.',
  },
  {
    id: '6f1c2a10-0000-4000-8000-000000000002',
    createdAt: '2026-10-28T09:00:00.000Z',
    problemOccurredAt: null,
    completedAt: '2026-11-01T09:00:00.000Z',
    deletedAt: null,
    situation:
      '2주 전에 제출한 기획안에 아무 피드백이 없다. 오늘 아침 회의에서 다른 사람의 안이 채택됐다는 얘기를 우연히 들었다.',
    cause: '잘 모르겠다. 내 기획안이 부족했을 수도 있고, 검토 자체가 안 됐을 수도 있다.',
    problem: '내 결과물이 어떻게 평가되는지 알 수 없다',
    response: '이번 주 안에 리더에게 기획안이 어떻게 검토됐는지 직접 물어본다',
    execution: { state: 'NOT_EXECUTED', explanation: '리더가 출장 중이라 기회가 없었다' },
    result: { state: 'UNCERTAIN', explanation: '' },
    stressChange: 'NO_CHANGE',
    controlChange: 'DECREASE',
    nextAction: { state: 'UNKNOWN', content: '' },
    insight: '',
  },
  {
    id: '6f1c2a10-0000-4000-8000-000000000003',
    createdAt: '2026-11-02T09:00:00.000Z',
    problemOccurredAt: null,
    completedAt: null,
    deletedAt: null,
    situation: '새 프로젝트가 시작되면서 주간 회의가 3개 더 생겼다.',
    cause: '프로젝트마다 별도 회의를 만드는 관행이 있다.',
    problem: '회의 일정이 겹쳐서 집중할 시간이 없다',
    response: '',
    execution: { state: null, explanation: '' },
    result: { state: null, explanation: '' },
    stressChange: null,
    controlChange: null,
    nextAction: { state: null, content: '' },
    insight: '',
  },
];

/** 백업 가져오기와 같은 검증을 거치도록 백업 형식으로 만든다. */
export function createSampleBackup(): string {
  return JSON.stringify({
    format: 'longrun',
    version: 1,
    exportedAt: '2026-11-02T09:00:00.000Z',
    plays: SAMPLE_PLAYS,
  });
}

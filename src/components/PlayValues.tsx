import type { ReactNode } from 'react';
import {
  CHANGE_LABELS,
  EXECUTION_LABELS,
  NEXT_ACTION_LABELS,
  RESULT_LABELS,
} from '../domain/labels';
import type { PlayContent, PlayStage } from '../domain/play';

function Value({ label, children }: { label?: string; children: ReactNode }) {
  if (children === null || children === '') return null;
  return (
    <div className="value">
      {label !== undefined && <div className="value-label">{label}</div>}
      <div className="value-text">{children}</div>
    </div>
  );
}

/** 사용자가 기록한 한 단계의 내용을 읽기 전용으로 보여준다. */
export function PlayValues({ play, stage }: { play: PlayContent; stage: PlayStage }) {
  switch (stage) {
    case 1:
      return (
        <>
          <Value>{play.situation}</Value>
          <Value label="문제 발생일">{play.problemOccurredAt}</Value>
        </>
      );
    case 2:
      return <Value>{play.cause}</Value>;
    case 3:
      return <Value>{play.problem}</Value>;
    case 4:
      return <Value>{play.response}</Value>;
    case 5:
      return (
        <>
          <Value label="실행 여부">
            {play.execution.state && EXECUTION_LABELS[play.execution.state]}
          </Value>
          <Value label="실행 내용 / 이유">{play.execution.explanation}</Value>
        </>
      );
    case 6:
      return (
        <>
          <Value label="결과">{play.result.state && RESULT_LABELS[play.result.state]}</Value>
          <Value label="결과 설명">{play.result.explanation}</Value>
          <Value label="스트레스">{play.stressChange && CHANGE_LABELS[play.stressChange]}</Value>
          <Value label="통제감">{play.controlChange && CHANGE_LABELS[play.controlChange]}</Value>
        </>
      );
    case 7:
      return (
        <>
          <Value label="다음 행동">
            {play.nextAction.state && NEXT_ACTION_LABELS[play.nextAction.state]}
          </Value>
          {play.nextAction.state === 'DEFINED' && (
            <Value label="행동 내용">{play.nextAction.content}</Value>
          )}
          <Value label="인사이트">{play.insight}</Value>
        </>
      );
  }
}

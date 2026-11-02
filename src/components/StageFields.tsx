import {
  CHANGE_LABELS,
  EXECUTION_LABELS,
  NEXT_ACTION_LABELS,
  RESULT_LABELS,
  STAGE_QUESTIONS,
} from '../domain/labels';
import {
  CHANGE_DIRECTIONS,
  EXECUTION_STATES,
  NEXT_ACTION_STATES,
  RESULT_STATES,
} from '../domain/play';
import type { PlayContent, PlayStage } from '../domain/play';

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function TextField({ label, value, onChange }: TextFieldProps) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea rows={5} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

interface ChoiceFieldProps<T extends string> {
  legend: string;
  options: readonly T[];
  labels: Record<T, string>;
  value: T | null;
  onChange: (value: T) => void;
}

function ChoiceField<T extends string>({
  legend,
  options,
  labels,
  value,
  onChange,
}: ChoiceFieldProps<T>) {
  return (
    <fieldset className="field">
      <legend>{legend}</legend>
      {options.map((option) => (
        <label key={option} className="choice">
          <input
            type="radio"
            name={legend}
            checked={value === option}
            onChange={() => onChange(option)}
          />
          {labels[option]}
        </label>
      ))}
    </fieldset>
  );
}

interface StageFieldsProps {
  stage: PlayStage;
  draft: PlayContent;
  onChange: (changes: Partial<PlayContent>) => void;
}

export function StageFields({ stage, draft, onChange }: StageFieldsProps) {
  const question = STAGE_QUESTIONS[stage];

  switch (stage) {
    case 1:
      return (
        <>
          <TextField
            label={question}
            value={draft.situation}
            onChange={(situation) => onChange({ situation })}
          />
          <label className="field">
            <span>문제 발생일 (선택)</span>
            <input
              type="date"
              value={draft.problemOccurredAt ?? ''}
              onChange={(event) => onChange({ problemOccurredAt: event.target.value || null })}
            />
          </label>
        </>
      );
    case 2:
      return (
        <TextField label={question} value={draft.cause} onChange={(cause) => onChange({ cause })} />
      );
    case 3:
      return (
        <TextField
          label={question}
          value={draft.problem}
          onChange={(problem) => onChange({ problem })}
        />
      );
    case 4:
      return (
        <TextField
          label={question}
          value={draft.response}
          onChange={(response) => onChange({ response })}
        />
      );
    case 5:
      return (
        <>
          <div className="value">
            <div className="value-label">④에서 정한 대응</div>
            <div className="value-text">{draft.response}</div>
          </div>
          <ChoiceField
            legend={question}
            options={EXECUTION_STATES}
            labels={EXECUTION_LABELS}
            value={draft.execution.state}
            onChange={(state) => onChange({ execution: { ...draft.execution, state } })}
          />
          <TextField
            label="실행 내용 또는 실행하지 않은 이유 (선택)"
            value={draft.execution.explanation}
            onChange={(explanation) => onChange({ execution: { ...draft.execution, explanation } })}
          />
        </>
      );
    case 6:
      return (
        <>
          <ChoiceField
            legend={question}
            options={RESULT_STATES}
            labels={RESULT_LABELS}
            value={draft.result.state}
            onChange={(state) => onChange({ result: { ...draft.result, state } })}
          />
          <TextField
            label="결과 설명 (선택)"
            value={draft.result.explanation}
            onChange={(explanation) => onChange({ result: { ...draft.result, explanation } })}
          />
          <ChoiceField
            legend="스트레스는 어떻게 변했는가?"
            options={CHANGE_DIRECTIONS}
            labels={CHANGE_LABELS}
            value={draft.stressChange}
            onChange={(stressChange) => onChange({ stressChange })}
          />
          <ChoiceField
            legend="상황을 통제할 수 있다는 감각은 어떻게 변했는가?"
            options={CHANGE_DIRECTIONS}
            labels={CHANGE_LABELS}
            value={draft.controlChange}
            onChange={(controlChange) => onChange({ controlChange })}
          />
        </>
      );
    case 7:
      return (
        <>
          <ChoiceField
            legend={question}
            options={NEXT_ACTION_STATES}
            labels={NEXT_ACTION_LABELS}
            value={draft.nextAction.state}
            onChange={(state) => onChange({ nextAction: { ...draft.nextAction, state } })}
          />
          {draft.nextAction.state === 'DEFINED' && (
            <TextField
              label="다음에 할 행동"
              value={draft.nextAction.content}
              onChange={(content) => onChange({ nextAction: { ...draft.nextAction, content } })}
            />
          )}
          <TextField
            label="이번 경험에서 알게 된 점 (선택)"
            value={draft.insight}
            onChange={(insight) => onChange({ insight })}
          />
        </>
      );
  }
}

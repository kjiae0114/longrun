import { useEffect, useRef, useState } from 'react';
import { useBlocker, useNavigate } from 'react-router-dom';
import {
  NEXT_BUTTON_LABELS,
  REQUIRED_MESSAGES,
  STAGE_GUIDES,
  STAGE_NAMES,
} from '../domain/labels';
import { isStageComplete, PLAY_STAGES } from '../domain/play';
import type { Play, PlayContent, PlayStage } from '../domain/play';
import { getStoreErrorMessage } from '../storage/errorMessages';
import { playStore } from '../storage/playStore';
import { ConfirmDialog } from './ConfirmDialog';
import { PastPlayReference } from './PastPlayReference';
import { PlayValues } from './PlayValues';
import { StageFields } from './StageFields';

const STAGE_FIELDS: Record<PlayStage, readonly (keyof PlayContent)[]> = {
  1: ['situation', 'problemOccurredAt'],
  2: ['cause'],
  3: ['problem'],
  4: ['response'],
  5: ['execution'],
  6: ['result', 'stressChange', 'controlChange'],
  7: ['nextAction', 'insight'],
};

const EMPTY_CONTENT: PlayContent = {
  problemOccurredAt: null,
  situation: '',
  cause: '',
  problem: '',
  response: '',
  execution: { state: null, explanation: '' },
  result: { state: null, explanation: '' },
  stressChange: null,
  controlChange: null,
  nextAction: { state: null, content: '' },
  insight: '',
};

function pickStage(content: PlayContent, stage: PlayStage): Partial<PlayContent> {
  return Object.fromEntries(STAGE_FIELDS[stage].map((field) => [field, content[field]]));
}

interface StageEditorProps {
  /** 아직 저장되지 않은 새 PLAY면 null이다. */
  play: Play | null;
  stage: PlayStage;
  /** 완료 PLAY를 수정하는 중이면 true다. */
  editing: boolean;
}

export function StageEditor({ play, stage, editing }: StageEditorProps) {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<PlayContent>(play ?? EMPTY_CONTENT);
  const [error, setError] = useState<string | null>(null);
  const leaving = useRef(false);

  const hasUnsavedChanges =
    play === null
      ? isStageComplete(draft, 1)
      : JSON.stringify(pickStage(draft, stage)) !== JSON.stringify(pickStage(play, stage));

  const blocker = useBlocker(() => hasUnsavedChanges && !leaving.current);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [hasUnsavedChanges]);

  const stagePath = (id: string, target: PlayStage) =>
    editing ? `/history/${id}/edit/${target}` : `/plays/${id}/stages/${target}`;
  const exitPath = editing && play !== null ? `/history/${play.id}` : '/';

  function save(): Play {
    if (play === null) {
      return playStore.create({
        situation: draft.situation,
        problemOccurredAt: draft.problemOccurredAt,
      });
    }
    return playStore.update(play.id, pickStage(draft, stage));
  }

  /** 저장에 성공했을 때만 화면을 떠나고, 실패하면 현재 화면에 남는다. */
  function saveAndLeave(leave: (saved: Play) => void) {
    try {
      const saved = save();
      leaving.current = true;
      leave(saved);
    } catch (caught) {
      leaving.current = false;
      setError(getStoreErrorMessage(caught));
    }
  }

  function goNext() {
    if (!isStageComplete(draft, stage)) {
      setError(REQUIRED_MESSAGES[stage]);
      return;
    }
    saveAndLeave((saved) => navigate(stagePath(saved.id, (stage + 1) as PlayStage)));
  }

  function goPrevious() {
    saveAndLeave((saved) => navigate(stagePath(saved.id, (stage - 1) as PlayStage)));
  }

  function finish() {
    if (!isStageComplete(draft, stage)) {
      setError(REQUIRED_MESSAGES[stage]);
      return;
    }
    saveAndLeave((saved) => {
      if (editing) {
        navigate(`/history/${saved.id}`);
      } else {
        playStore.complete(saved.id);
        navigate('/history');
      }
    });
  }

  function saveAndExit() {
    if (play === null && !isStageComplete(draft, 1)) {
      leaving.current = true;
      navigate('/');
      return;
    }
    saveAndLeave(() => navigate(exitPath));
  }

  return (
    <article>
      <ol className="stages" aria-label="PLAY 단계">
        {PLAY_STAGES.map((target) => (
          <li
            key={target}
            className={target < stage ? 'done' : undefined}
            aria-current={target === stage ? 'step' : undefined}
          >
            <span>{target}</span>
          </li>
        ))}
      </ol>
      <h1>{STAGE_NAMES[stage]}</h1>
      <p className="page-intro">{STAGE_GUIDES[stage]}</p>

      <form
        className="panel"
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <StageFields
          stage={stage}
          draft={draft}
          onChange={(changes) => {
            setDraft((current) => ({ ...current, ...changes }));
            setError(null);
          }}
        />

        {stage === 4 && <PastPlayReference currentPlayId={play?.id ?? null} />}

        {error !== null && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <div className="actions">
          {stage === 7 ? (
            <button type="button" className="primary" onClick={finish}>
              {editing ? '수정 저장하기' : 'PLAY 마치기'}
            </button>
          ) : (
            <button type="button" className="primary" onClick={goNext}>
              {NEXT_BUTTON_LABELS[stage]}
            </button>
          )}
          {stage > 1 && (
            <button type="button" onClick={goPrevious}>
              이전 단계로
            </button>
          )}
          <button type="button" onClick={saveAndExit}>
            저장하고 나가기
          </button>
        </div>
      </form>

      {play !== null && stage > 1 && (
        <details className="previous">
          <summary>이전 판단 보기</summary>
          {PLAY_STAGES.filter((target) => target < stage).map((target) => (
            <details key={target}>
              <summary>{STAGE_NAMES[target]}</summary>
              <PlayValues play={play} stage={target} />
            </details>
          ))}
        </details>
      )}

      {blocker.state === 'blocked' && (
        <ConfirmDialog
          message="작성한 내용을 저장하고 나갈까요?"
          confirmLabel="저장하고 나가기"
          onConfirm={() => saveAndLeave(() => blocker.proceed())}
          onCancel={() => blocker.reset()}
        />
      )}
    </article>
  );
}

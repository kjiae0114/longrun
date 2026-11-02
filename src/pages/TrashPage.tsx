import { useReducer, useState } from 'react';
import { Link } from 'react-router-dom';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { formatDate, RESULT_LABELS, STAGE_NAMES } from '../domain/labels';
import { getCurrentStage } from '../domain/play';
import type { Play } from '../domain/play';
import { getStoreErrorMessage } from '../storage/errorMessages';
import { playStore } from '../storage/playStore';

type PendingDeletion = { kind: 'one'; id: string } | { kind: 'all' };

function describeProgress(play: Play): string {
  if (play.completedAt === null) return `진행 중 · ${STAGE_NAMES[getCurrentStage(play)]}`;
  return `완료 · ${play.result.state && RESULT_LABELS[play.result.state]}`;
}

export function TrashPage() {
  const [, refresh] = useReducer((count: number) => count + 1, 0);
  const [pending, setPending] = useState<PendingDeletion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const plays = playStore.listTrashed();

  function run(action: () => void) {
    try {
      action();
      setError(null);
    } catch (caught) {
      setError(getStoreErrorMessage(caught));
    }
    setPending(null);
    refresh();
  }

  return (
    <>
      <h1>휴지통</h1>
      {error !== null && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {plays.length === 0 ? (
        <p>휴지통이 비어 있습니다.</p>
      ) : (
        <>
          <div className="actions">
            <button type="button" onClick={() => run(() => playStore.restoreAll())}>
              전체 복구
            </button>
            <button type="button" className="danger" onClick={() => setPending({ kind: 'all' })}>
              휴지통 비우기
            </button>
          </div>
          <ul className="cards">
            {plays.map((play) => (
              <li key={play.id} className="card">
                <h2 className="card-title">{play.problem.trim() || '문제 없음'}</h2>
                <div className="card-meta">
                  {describeProgress(play)} · 삭제일 {play.deletedAt && formatDate(play.deletedAt)}
                </div>
                <p className="card-excerpt">{play.situation}</p>
                <div className="actions">
                  <Link className="button" to={`/trash/${play.id}`}>
                    보기
                  </Link>
                  <button type="button" onClick={() => run(() => playStore.restore(play.id))}>
                    복구
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => setPending({ kind: 'one', id: play.id })}
                  >
                    영구 삭제
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
      {pending?.kind === 'one' && (
        <ConfirmDialog
          message="영구 삭제하면 복구할 수 없습니다."
          confirmLabel="영구 삭제"
          danger
          onConfirm={() => run(() => playStore.deletePermanently(pending.id))}
          onCancel={() => setPending(null)}
        />
      )}
      {pending?.kind === 'all' && (
        <ConfirmDialog
          message="휴지통의 모든 PLAY를 영구 삭제합니다. 복구할 수 없습니다."
          confirmLabel="휴지통 비우기"
          danger
          onConfirm={() => run(() => playStore.emptyTrash())}
          onCancel={() => setPending(null)}
        />
      )}
    </>
  );
}

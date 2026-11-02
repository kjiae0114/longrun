import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { PlayDetail } from '../components/PlayDetail';
import { getPlayStatus } from '../domain/play';
import { getStoreErrorMessage } from '../storage/errorMessages';
import { findPlay } from '../storage/findPlay';
import { playStore } from '../storage/playStore';
import { NotFoundPage } from './NotFoundPage';

/** 휴지통의 PLAY는 읽기 전용이다. 복구와 영구 삭제만 할 수 있다. */
export function TrashDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const play = findPlay(id);
  if (play === null) return <NotFoundPage />;

  const status = getPlayStatus(play);
  if (status === 'COMPLETED') return <Navigate to={`/history/${id}`} replace />;
  if (status === 'IN_PROGRESS') return <Navigate to="/" replace />;

  function run(action: () => void) {
    try {
      action();
      navigate('/trash');
    } catch (caught) {
      setConfirming(false);
      setError(getStoreErrorMessage(caught));
    }
  }

  return (
    <article>
      <h1>{play.problem.trim() || '문제 없음'}</h1>
      <PlayDetail play={play} />
      {error !== null && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="actions">
        <Link className="button" to="/trash">
          목록으로
        </Link>
        <button type="button" onClick={() => run(() => playStore.restore(id))}>
          복구
        </button>
        <button type="button" className="danger" onClick={() => setConfirming(true)}>
          영구 삭제
        </button>
      </div>
      {confirming && (
        <ConfirmDialog
          message="영구 삭제하면 복구할 수 없습니다."
          confirmLabel="영구 삭제"
          danger
          onConfirm={() => run(() => playStore.deletePermanently(id))}
          onCancel={() => setConfirming(false)}
        />
      )}
    </article>
  );
}

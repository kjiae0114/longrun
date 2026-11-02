import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { MoveToTrashButton } from '../components/MoveToTrashButton';
import { PlayDetail } from '../components/PlayDetail';
import { formatDate } from '../domain/labels';
import { getPlayStatus } from '../domain/play';
import { findPlay } from '../storage/findPlay';
import { NotFoundPage } from './NotFoundPage';

export function HistoryDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const play = findPlay(id);
  if (play === null) return <NotFoundPage />;

  const status = getPlayStatus(play);
  if (status === 'TRASHED') return <Navigate to={`/trash/${id}`} replace />;
  if (status === 'IN_PROGRESS') return <Navigate to={`/plays/${id}/stages/1`} replace />;

  return (
    <article>
      <h1>{play.problem}</h1>
      <p className="card-meta">완료일 {play.completedAt && formatDate(play.completedAt)}</p>
      <PlayDetail
        play={play}
        renderStageAction={(stage) => (
          <Link className="button" to={`/history/${id}/edit/${stage}`}>
            수정
          </Link>
        )}
      />
      <div className="actions">
        <Link className="button" to="/history">
          목록으로
        </Link>
        <MoveToTrashButton playId={id} onMoved={() => navigate('/history')} />
      </div>
    </article>
  );
}

import { useReducer, useState } from 'react';
import { Link } from 'react-router-dom';
import { MoveToTrashButton } from '../components/MoveToTrashButton';
import { formatDate, RESULT_LABELS } from '../domain/labels';
import { playStore } from '../storage/playStore';

export function HistoryPage() {
  const [, refresh] = useReducer((count: number) => count + 1, 0);
  const [query, setQuery] = useState('');

  const completed = playStore.listCompleted();
  const plays = query.trim() === '' ? completed : playStore.searchCompleted(query);

  if (completed.length === 0) {
    return (
      <>
        <h1>HISTORY</h1>
        <Link className="button primary" to="/plays/new">
          새 PLAY 시작
        </Link>
      </>
    );
  }

  return (
    <>
      <h1>HISTORY</h1>
      <label className="field">
        <span>문제 검색</span>
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {plays.length === 0 ? (
        <p>검색 결과가 없습니다.</p>
      ) : (
        <ul className="cards">
          {plays.map((play) => (
            <li key={play.id} className="card">
              <h2 className="card-title">{play.problem}</h2>
              <div className="card-meta">
                {play.result.state && RESULT_LABELS[play.result.state]} · 완료일{' '}
                {play.completedAt && formatDate(play.completedAt)}
              </div>
              <div className="actions">
                <Link className="button" to={`/history/${play.id}`}>
                  보기
                </Link>
                <Link className="button" to={`/history/${play.id}/edit/1`}>
                  수정
                </Link>
                <MoveToTrashButton playId={play.id} onMoved={refresh} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

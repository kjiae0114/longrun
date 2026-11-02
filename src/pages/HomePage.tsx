import { useReducer } from 'react';
import { Link } from 'react-router-dom';
import { InProgressList } from '../components/InProgressList';
import { playStore } from '../storage/playStore';

const HOME_LIMIT = 3;

export function HomePage() {
  const [, refresh] = useReducer((count: number) => count + 1, 0);
  const plays = playStore.listInProgress();

  return (
    <>
      <h1>HOME</h1>
      <Link className="button primary" to="/plays/new">
        새 PLAY 시작
      </Link>
      {plays.length > 0 && (
        <InProgressList plays={plays.slice(0, HOME_LIMIT)} onChange={refresh} />
      )}
      {plays.length > HOME_LIMIT && <Link to="/plays">전체 진행 중 PLAY 보기</Link>}
    </>
  );
}

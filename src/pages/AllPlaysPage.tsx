import { useReducer } from 'react';
import { Link } from 'react-router-dom';
import { InProgressList } from '../components/InProgressList';
import { playStore } from '../storage/playStore';

export function AllPlaysPage() {
  const [, refresh] = useReducer((count: number) => count + 1, 0);
  const plays = playStore.listInProgress();

  return (
    <>
      <h1>전체 진행 중 PLAY</h1>
      {plays.length > 0 ? (
        <InProgressList plays={plays} onChange={refresh} />
      ) : (
        <Link className="button primary" to="/plays/new">
          새 PLAY 시작
        </Link>
      )}
    </>
  );
}

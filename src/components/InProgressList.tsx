import { Link } from 'react-router-dom';
import { STAGE_NAMES } from '../domain/labels';
import { getCurrentStage } from '../domain/play';
import type { Play } from '../domain/play';
import { MoveToTrashButton } from './MoveToTrashButton';

interface InProgressListProps {
  plays: Play[];
  onChange: () => void;
}

/** 여러 진행 중 PLAY를 동등하게 보여준다. 특정 PLAY를 추천하거나 강조하지 않는다. */
export function InProgressList({ plays, onChange }: InProgressListProps) {
  return (
    <ul className="cards">
      {plays.map((play) => {
        const stage = getCurrentStage(play);
        const hasProblem = play.problem.trim() !== '';
        return (
          <li key={play.id} className="card">
            <h2 className="card-title">{hasProblem ? play.problem : '진행 중'}</h2>
            <div className="card-meta">{STAGE_NAMES[stage]}</div>
            {!hasProblem && <p className="card-excerpt">{play.situation}</p>}
            <div className="actions">
              <Link className="button" to={`/plays/${play.id}/stages/${stage}`}>
                이어하기
              </Link>
              <MoveToTrashButton playId={play.id} onMoved={onChange} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

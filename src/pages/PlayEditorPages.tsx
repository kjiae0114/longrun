import { Navigate, useParams } from 'react-router-dom';
import { StageEditor } from '../components/StageEditor';
import { getCurrentStage, getPlayStatus, PLAY_STAGES } from '../domain/play';
import type { PlayStage } from '../domain/play';
import { findPlay } from '../storage/findPlay';
import { NotFoundPage } from './NotFoundPage';

function parseStage(value: string | undefined): PlayStage | null {
  return PLAY_STAGES.find((stage) => String(stage) === value) ?? null;
}

export function NewPlayPage() {
  return <StageEditor play={null} stage={1} editing={false} />;
}

/** 진행 중 PLAY 작성. 아직 도달하지 않은 단계로는 이동하지 않는다. */
export function PlayStagePage() {
  const { id = '', stage: stageParam } = useParams();
  const play = findPlay(id);
  if (play === null) return <NotFoundPage />;

  const status = getPlayStatus(play);
  if (status === 'COMPLETED') return <Navigate to={`/history/${id}`} replace />;
  if (status === 'TRASHED') return <Navigate to={`/trash/${id}`} replace />;

  const current = getCurrentStage(play);
  const stage = parseStage(stageParam);
  if (stage === null || stage > current) {
    return <Navigate to={`/plays/${id}/stages/${current}`} replace />;
  }
  return <StageEditor key={`${id}-${stage}`} play={play} stage={stage} editing={false} />;
}

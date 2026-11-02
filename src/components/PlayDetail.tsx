import type { ReactNode } from 'react';
import { STAGE_NAMES } from '../domain/labels';
import { PLAY_STAGES } from '../domain/play';
import type { Play, PlayStage } from '../domain/play';
import { PlayValues } from './PlayValues';

interface PlayDetailProps {
  play: Play;
  renderStageAction?: (stage: PlayStage) => ReactNode;
}

export function PlayDetail({ play, renderStageAction }: PlayDetailProps) {
  return (
    <>
      {PLAY_STAGES.map((stage) => (
        <section key={stage} className="detail-section">
          <div className="detail-heading">
            <h2>{STAGE_NAMES[stage]}</h2>
            {renderStageAction?.(stage)}
          </div>
          <PlayValues play={play} stage={stage} />
        </section>
      ))}
    </>
  );
}

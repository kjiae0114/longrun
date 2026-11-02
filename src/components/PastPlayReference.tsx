import { useState } from 'react';
import { NEXT_ACTION_LABELS, RESULT_LABELS } from '../domain/labels';
import type { Play } from '../domain/play';
import { playStore } from '../storage/playStore';

const MAX_OPEN = 3;

function PastPlayContent({ play }: { play: Play }) {
  const rows: [string, string | null][] = [
    ['대응', play.response],
    ['결과', play.result.state && RESULT_LABELS[play.result.state]],
    ['다음 행동', play.nextAction.state && NEXT_ACTION_LABELS[play.nextAction.state]],
    ['행동 내용', play.nextAction.state === 'DEFINED' ? play.nextAction.content : null],
    ['인사이트', play.insight],
  ];
  return (
    <>
      {rows
        .filter(([, text]) => text !== null && text !== '')
        .map(([label, text]) => (
          <div key={label} className="value">
            <div className="value-label">{label}</div>
            <div className="value-text">{text}</div>
          </div>
        ))}
    </>
  );
}

/**
 * 사용자가 직접 찾아보는 참고 자료다.
 * 유사도 판단이나 추천, 자동 복사를 하지 않으며 검색 전에는 아무것도 보여주지 않는다.
 */
export function PastPlayReference({ currentPlayId }: { currentPlayId: string | null }) {
  const [query, setQuery] = useState('');
  const [openIds, setOpenIds] = useState<string[]>([]);

  const plays = playStore.searchCompleted(query).filter((play) => play.id !== currentPlayId);
  const searched = query.trim() !== '';

  function toggle(id: string) {
    setOpenIds((current) =>
      current.includes(id)
        ? current.filter((openId) => openId !== id)
        : [...current, id].slice(-MAX_OPEN),
    );
  }

  return (
    <details className="reference">
      <summary>과거 PLAY 참고</summary>
      <label className="field">
        <span>과거 문제 검색</span>
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {searched && plays.length === 0 && <p>검색 결과가 없습니다.</p>}
      <ul className="cards">
        {plays.map((play) => {
          const open = openIds.includes(play.id);
          return (
            <li key={play.id} className="card">
              <button
                type="button"
                className="reference-toggle"
                aria-expanded={open}
                onClick={() => toggle(play.id)}
              >
                {play.problem}
              </button>
              {open && <PastPlayContent play={play} />}
            </li>
          );
        })}
      </ul>
    </details>
  );
}

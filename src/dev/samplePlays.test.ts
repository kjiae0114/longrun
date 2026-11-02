import { describe, expect, it } from 'vitest';
import { canComplete, getCurrentStage, parsePlay } from '../domain/play';
import { createPlayStore } from '../storage/playStore';
import { createSampleBackup, SAMPLE_PLAYS } from './samplePlays';

describe('샘플 PLAY', () => {
  it('모두 데이터 검증을 통과한다', () => {
    for (const play of SAMPLE_PLAYS) expect(parsePlay(play)).toEqual(play);
  });

  it('완료 PLAY는 완료 조건을 충족하고 진행 중 PLAY는 ④에서 이어진다', () => {
    const [first, second, third] = SAMPLE_PLAYS;
    expect(canComplete(first)).toBe(true);
    expect(canComplete(second)).toBe(true);
    expect(getCurrentStage(third)).toBe(4);
  });

  it('백업 가져오기로 저장할 수 있다', () => {
    const items = new Map<string, string>();
    const store = createPlayStore({
      getStorage: () => ({
        getItem: (key) => items.get(key) ?? null,
        setItem: (key, value) => void items.set(key, value),
      }),
    });
    store.importBackup(createSampleBackup());
    expect(store.listCompleted()).toHaveLength(2);
    expect(store.listInProgress()).toHaveLength(1);
    expect(store.searchCompleted('회의')).toHaveLength(1);
  });
});

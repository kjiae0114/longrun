import { beforeEach, describe, expect, it } from 'vitest';
import type { PlayContent } from '../domain/play';
import { createPlayStore, STORAGE_KEY } from './playStore';
import type { PlayStore } from './playStore';

const FILLED: Partial<PlayContent> = {
  cause: '원인',
  problem: '회의가 너무 많다',
  response: '대응',
  execution: { state: 'EXECUTED', explanation: '' },
  result: { state: 'UNRESOLVED', explanation: '' },
  stressChange: 'INCREASE',
  controlChange: 'DECREASE',
  nextAction: { state: 'UNKNOWN', content: '' },
};

class FakeStorage {
  items = new Map<string, string>();
  failWrites = false;
  getItem(key: string) {
    return this.items.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    if (this.failWrites) throw new Error('QuotaExceededError');
    this.items.set(key, value);
  }
}

describe('playStore', () => {
  let storage: FakeStorage;
  let store: PlayStore;
  let tick: number;
  let nextId: number;

  const start = (situation = '상황') => store.create({ situation, problemOccurredAt: null });
  const complete = (changes: Partial<PlayContent> = {}) => {
    const play = start();
    store.update(play.id, { ...FILLED, ...changes });
    return store.complete(play.id);
  };

  beforeEach(() => {
    storage = new FakeStorage();
    tick = 0;
    nextId = 0;
    store = createPlayStore({
      getStorage: () => storage,
      now: () => new Date(Date.UTC(2026, 10, 2, 0, 0, tick++)),
      createId: () => `play-${++nextId}`,
    });
  });

  describe('생성과 저장', () => {
    it('상황이 비어 있으면 생성하지 않는다', () => {
      expect(() => start('  ')).toThrowError('SITUATION_REQUIRED');
      expect(storage.items.size).toBe(0);
    });

    it('새 PLAY는 진행 중이며 다시 읽어도 유지된다', () => {
      const play = start();
      const reopened = createPlayStore({ getStorage: () => storage });
      expect(reopened.get(play.id)).toEqual(play);
      expect(reopened.listInProgress()).toEqual([play]);
    });

    it('입력 원문의 공백을 보존한다', () => {
      expect(start('  상황  ').situation).toBe('  상황  ');
    });

    it('진행 중에는 필수값 없이 일부만 저장할 수 있다', () => {
      const play = start();
      expect(store.update(play.id, { cause: '' }).cause).toBe('');
    });

    it('저장된 PLAY의 상황은 비울 수 없다', () => {
      const play = start();
      expect(() => store.update(play.id, { situation: '' })).toThrowError('SITUATION_REQUIRED');
      expect(store.get(play.id).situation).toBe('상황');
    });

    it('수정해도 식별자와 시스템 시각은 바뀌지 않는다', () => {
      const play = start();
      const forged = { id: 'x', createdAt: 'x', completedAt: 'x', deletedAt: 'x', cause: '원인' };
      expect(store.update(play.id, forged)).toEqual({ ...play, cause: '원인' });
    });

    it('저장에 실패하면 오류를 내고 기존 데이터를 유지한다', () => {
      const play = start();
      storage.failWrites = true;
      expect(() => store.update(play.id, { cause: '원인' })).toThrowError('WRITE_FAILED');
      expect(store.get(play.id).cause).toBe('');
    });

    it('저장소 접근이 막혀 있으면 읽기 오류를 낸다', () => {
      const blocked = createPlayStore({
        getStorage: () => {
          throw new Error('SecurityError');
        },
      });
      expect(() => blocked.listInProgress()).toThrowError('READ_FAILED');
    });

    it('손상된 데이터를 읽으면 빈 목록으로 덮어쓰지 않는다', () => {
      storage.items.set(STORAGE_KEY, '{broken');
      expect(() => store.listInProgress()).toThrowError('READ_FAILED');
      expect(() => start()).toThrowError('READ_FAILED');
      expect(storage.items.get(STORAGE_KEY)).toBe('{broken');
    });
  });

  describe('완료와 수정', () => {
    it('필수 판단이 부족하면 완료할 수 없다', () => {
      const play = start();
      expect(() => store.complete(play.id)).toThrowError('INCOMPLETE');
      expect(store.get(play.id).completedAt).toBeNull();
    });

    it('해결되지 않은 결과도 완료된다', () => {
      const play = complete();
      expect(play.completedAt).not.toBeNull();
      expect(store.listCompleted()).toEqual([play]);
      expect(store.listInProgress()).toEqual([]);
    });

    it('완료 시각을 다시 기록하지 않는다', () => {
      const play = complete();
      expect(() => store.complete(play.id)).toThrowError('INVALID_STATE');
    });

    it('완료 PLAY를 수정해도 완료 상태와 최초 완료 시각을 유지한다', () => {
      const play = complete();
      const edited = store.update(play.id, { cause: '다른 원인' });
      expect(edited.cause).toBe('다른 원인');
      expect(edited.completedAt).toBe(play.completedAt);
      expect(edited.problem).toBe(play.problem);
    });

    it('완료 PLAY의 필수값을 비우는 수정은 거부한다', () => {
      const play = complete();
      expect(() => store.update(play.id, { cause: ' ' })).toThrowError('INCOMPLETE');
      expect(store.get(play.id).cause).toBe('원인');
    });
  });

  describe('목록과 검색', () => {
    it('진행 중은 생성일, 완료는 완료일 최신순이다', () => {
      const first = start();
      const second = start();
      expect(store.listInProgress().map((play) => play.id)).toEqual([second.id, first.id]);

      store.update(first.id, FILLED);
      store.update(second.id, FILLED);
      store.complete(second.id);
      store.complete(first.id);
      expect(store.listCompleted().map((play) => play.id)).toEqual([first.id, second.id]);
    });

    it('완료 PLAY의 문제만 검색한다', () => {
      const match = complete({ problem: '회의가 많다', situation: '상황' });
      complete({ problem: '야근', cause: '회의' });
      const pending = start();
      store.update(pending.id, { problem: '회의 준비' });
      const trashed = complete({ problem: '회의 지각' });
      store.moveToTrash(trashed.id);

      expect(store.searchCompleted(' 회의 ')).toEqual([match]);
    });

    it('검색어가 비어 있으면 검색하지 않는다', () => {
      complete();
      expect(store.searchCompleted('   ')).toEqual([]);
    });
  });

  describe('휴지통', () => {
    it('삭제한 PLAY는 일반 목록에서 빠지고 삭제일 최신순으로 표시된다', () => {
      const first = start();
      const second = complete();
      store.moveToTrash(first.id);
      store.moveToTrash(second.id);
      expect(store.listInProgress()).toEqual([]);
      expect(store.listCompleted()).toEqual([]);
      expect(store.listTrashed().map((play) => play.id)).toEqual([second.id, first.id]);
    });

    it('복구하면 삭제 전 상태와 완료 시각으로 돌아간다', () => {
      const pending = start();
      const done = complete();
      store.moveToTrash(pending.id);
      store.moveToTrash(done.id);
      store.restore(pending.id);
      store.restore(done.id);
      expect(store.listInProgress().map((play) => play.id)).toEqual([pending.id]);
      expect(store.listCompleted()).toEqual([done]);
    });

    it('허용되지 않은 동작을 거부한다', () => {
      const active = start();
      expect(() => store.restore(active.id)).toThrowError('INVALID_STATE');
      expect(() => store.deletePermanently(active.id)).toThrowError('INVALID_STATE');

      store.moveToTrash(active.id);
      expect(() => store.moveToTrash(active.id)).toThrowError('INVALID_STATE');
      expect(() => store.update(active.id, { cause: '원인' })).toThrowError('INVALID_STATE');
      expect(() => store.complete(active.id)).toThrowError('INVALID_STATE');
      expect(() => store.get('missing')).toThrowError('NOT_FOUND');
    });

    it('영구 삭제한 PLAY는 다시 나타나지 않는다', () => {
      const play = start();
      store.moveToTrash(play.id);
      store.deletePermanently(play.id);
      expect(() => store.get(play.id)).toThrowError('NOT_FOUND');
      expect(storage.items.get(STORAGE_KEY)).toBe('[]');
    });

    it('전체 복구는 휴지통의 PLAY를 모두 되돌린다', () => {
      const pending = start();
      const done = complete();
      store.moveToTrash(pending.id);
      store.moveToTrash(done.id);
      store.restoreAll();
      expect(store.listTrashed()).toEqual([]);
      expect(store.listInProgress()).toHaveLength(1);
      expect(store.listCompleted()).toEqual([done]);
    });

    it('휴지통 비우기는 휴지통의 PLAY만 제거한다', () => {
      const keep = start();
      const trashed = complete();
      store.moveToTrash(trashed.id);
      store.emptyTrash();
      expect(store.listTrashed()).toEqual([]);
      expect(store.listInProgress()).toEqual([keep]);
      expect(() => store.get(trashed.id)).toThrowError('NOT_FOUND');
    });
  });

  describe('백업', () => {
    it('내보낸 데이터를 가져오면 모든 상태가 그대로 복원된다', () => {
      const pending = start();
      const done = complete();
      const trashed = complete();
      store.moveToTrash(trashed.id);
      const before = {
        pending: store.get(pending.id),
        done: store.get(done.id),
        trashed: store.get(trashed.id),
      };

      const backup = store.exportBackup();
      store.emptyTrash();
      store.moveToTrash(pending.id);
      store.importBackup(backup);

      expect(store.listInProgress()).toEqual([before.pending]);
      expect(store.listCompleted()).toEqual([before.done]);
      expect(store.listTrashed()).toEqual([before.trashed]);
    });

    it('가져오면 병합하지 않고 기존 데이터를 교체한다', () => {
      const backup = store.exportBackup();
      start();
      store.importBackup(backup);
      expect(store.listInProgress()).toEqual([]);
    });

    it.each([
      ['JSON이 아닌 파일', 'not json'],
      ['null', 'null'],
      ['다른 형식', JSON.stringify({ format: 'other', version: 1, plays: [] })],
      ['지원하지 않는 버전', JSON.stringify({ format: 'longrun', version: 2, plays: [] })],
      ['배열이 아닌 plays', JSON.stringify({ format: 'longrun', version: 1, plays: {} })],
      ['잘못된 PLAY', JSON.stringify({ format: 'longrun', version: 1, plays: [{ id: 'a' }] })],
    ])('%s은 거부하고 기존 데이터를 유지한다', (_name, text) => {
      const play = start();
      expect(() => store.importBackup(text)).toThrowError('INVALID_BACKUP');
      expect(store.listInProgress()).toEqual([play]);
    });

    it('식별자가 중복된 백업은 거부한다', () => {
      const play = start();
      const text = JSON.stringify({ format: 'longrun', version: 1, plays: [play, play] });
      expect(() => store.importBackup(text)).toThrowError('INVALID_BACKUP');
    });
  });
});

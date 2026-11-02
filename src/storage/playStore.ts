import { canComplete, getPlayStatus, isStageComplete, parsePlay } from '../domain/play';
import type { Play, PlayContent } from '../domain/play';

export const STORAGE_KEY = 'longrun:plays';
const BACKUP_FORMAT = 'longrun';
const BACKUP_VERSION = 1;

export type PlayStoreErrorCode =
  | 'READ_FAILED'
  | 'WRITE_FAILED'
  | 'NOT_FOUND'
  | 'SITUATION_REQUIRED'
  | 'INCOMPLETE'
  | 'INVALID_STATE'
  | 'INVALID_BACKUP';

export class PlayStoreError extends Error {
  constructor(readonly code: PlayStoreErrorCode) {
    super(code);
    this.name = 'PlayStoreError';
  }
}

interface PlayStoreOptions {
  getStorage: () => Pick<Storage, 'getItem' | 'setItem'>;
  now?: () => Date;
  createId?: () => string;
}

const byLatest = (getTime: (play: Play) => string | null) => (a: Play, b: Play) =>
  Date.parse(getTime(b) ?? '') - Date.parse(getTime(a) ?? '');

/** 저장된 PLAY는 수정할 수 있는 값만 바꾼다. 동작마다 저장소를 다시 읽어 다른 탭의 변경을 반영한다. */
export function createPlayStore({
  getStorage,
  now = () => new Date(),
  createId = () => crypto.randomUUID(),
}: PlayStoreOptions) {
  const timestamp = () => now().toISOString();

  function parsePlays(value: unknown): Play[] | null {
    if (!Array.isArray(value)) return null;
    const plays = value.map(parsePlay);
    if (plays.some((play) => play === null)) return null;
    const valid = plays as Play[];
    return new Set(valid.map((play) => play.id)).size === valid.length ? valid : null;
  }

  // 읽지 못한 데이터는 빈 목록으로 취급하지 않는다. 그 위에 저장하면 기존 기록을 덮어쓰게 된다.
  function load(): Play[] {
    try {
      const raw = getStorage().getItem(STORAGE_KEY);
      if (raw === null) return [];
      const plays = parsePlays(JSON.parse(raw));
      if (plays !== null) return plays;
    } catch {
      throw new PlayStoreError('READ_FAILED');
    }
    throw new PlayStoreError('READ_FAILED');
  }

  function save(plays: Play[]) {
    try {
      getStorage().setItem(STORAGE_KEY, JSON.stringify(plays));
    } catch {
      throw new PlayStoreError('WRITE_FAILED');
    }
  }

  function findIn(plays: Play[], id: string): Play {
    const play = plays.find((candidate) => candidate.id === id);
    if (play === undefined) throw new PlayStoreError('NOT_FOUND');
    return play;
  }

  function replace(plays: Play[], next: Play): Play {
    save(plays.map((play) => (play.id === next.id ? next : play)));
    return next;
  }

  const withStatus = (status: ReturnType<typeof getPlayStatus>) =>
    load().filter((play) => getPlayStatus(play) === status);

  function listCompleted(): Play[] {
    return withStatus('COMPLETED').sort(byLatest((play) => play.completedAt));
  }

  return {
    get(id: string): Play {
      return findIn(load(), id);
    },

    listInProgress(): Play[] {
      return withStatus('IN_PROGRESS').sort(byLatest((play) => play.createdAt));
    },

    listCompleted,

    listTrashed(): Play[] {
      return withStatus('TRASHED').sort(byLatest((play) => play.deletedAt));
    },

    /** 검색어가 비어 있으면 검색하지 않는다. */
    searchCompleted(query: string): Play[] {
      const keyword = query.trim();
      if (keyword === '') return [];
      return listCompleted().filter((play) => play.problem.includes(keyword));
    },

    create(input: Pick<PlayContent, 'situation' | 'problemOccurredAt'>): Play {
      const play: Play = {
        id: createId(),
        createdAt: timestamp(),
        problemOccurredAt: input.problemOccurredAt,
        completedAt: null,
        deletedAt: null,
        situation: input.situation,
        cause: '',
        problem: '',
        response: '',
        execution: { state: null, explanation: '' },
        result: { state: null, explanation: '' },
        stressChange: null,
        controlChange: null,
        nextAction: { state: null, content: '' },
        insight: '',
      };
      if (!isStageComplete(play, 1)) throw new PlayStoreError('SITUATION_REQUIRED');
      save([...load(), play]);
      return play;
    },

    /** 진행 중에는 입력한 만큼 저장하고, 완료 PLAY는 수정 후에도 완료 조건을 충족해야 한다. */
    update(id: string, changes: Partial<PlayContent>): Play {
      const plays = load();
      const play = findIn(plays, id);
      const status = getPlayStatus(play);
      if (status === 'TRASHED') throw new PlayStoreError('INVALID_STATE');

      const next: Play = {
        ...play,
        ...changes,
        id: play.id,
        createdAt: play.createdAt,
        completedAt: play.completedAt,
        deletedAt: play.deletedAt,
      };
      if (!isStageComplete(next, 1)) throw new PlayStoreError('SITUATION_REQUIRED');
      if (status === 'COMPLETED' && !canComplete(next)) throw new PlayStoreError('INCOMPLETE');
      return replace(plays, next);
    },

    complete(id: string): Play {
      const plays = load();
      const play = findIn(plays, id);
      if (getPlayStatus(play) !== 'IN_PROGRESS') throw new PlayStoreError('INVALID_STATE');
      if (!canComplete(play)) throw new PlayStoreError('INCOMPLETE');
      return replace(plays, { ...play, completedAt: timestamp() });
    },

    moveToTrash(id: string): Play {
      const plays = load();
      const play = findIn(plays, id);
      if (getPlayStatus(play) === 'TRASHED') throw new PlayStoreError('INVALID_STATE');
      return replace(plays, { ...play, deletedAt: timestamp() });
    },

    restore(id: string): Play {
      const plays = load();
      const play = findIn(plays, id);
      if (getPlayStatus(play) !== 'TRASHED') throw new PlayStoreError('INVALID_STATE');
      return replace(plays, { ...play, deletedAt: null });
    },

    deletePermanently(id: string): void {
      const plays = load();
      const play = findIn(plays, id);
      if (getPlayStatus(play) !== 'TRASHED') throw new PlayStoreError('INVALID_STATE');
      save(plays.filter((candidate) => candidate.id !== id));
    },

    restoreAll(): void {
      save(load().map((play) => ({ ...play, deletedAt: null })));
    },

    emptyTrash(): void {
      save(load().filter((play) => getPlayStatus(play) !== 'TRASHED'));
    },

    /** 진행 중, 완료, 휴지통을 모두 포함한다. */
    exportBackup(): string {
      return JSON.stringify(
        {
          format: BACKUP_FORMAT,
          version: BACKUP_VERSION,
          exportedAt: timestamp(),
          plays: load(),
        },
        null,
        2,
      );
    },

    /** 검증을 통과해야 기존 데이터를 교체한다. 실패하면 기존 데이터는 그대로 남는다. */
    importBackup(text: string): void {
      let backup: unknown;
      try {
        backup = JSON.parse(text);
      } catch {
        throw new PlayStoreError('INVALID_BACKUP');
      }
      if (typeof backup !== 'object' || backup === null) {
        throw new PlayStoreError('INVALID_BACKUP');
      }
      const { format, version, plays } = backup as Record<string, unknown>;
      if (format !== BACKUP_FORMAT || version !== BACKUP_VERSION) {
        throw new PlayStoreError('INVALID_BACKUP');
      }
      const parsed = parsePlays(plays);
      if (parsed === null) throw new PlayStoreError('INVALID_BACKUP');
      save(parsed);
    },
  };
}

export type PlayStore = ReturnType<typeof createPlayStore>;

export const playStore = createPlayStore({ getStorage: () => window.localStorage });

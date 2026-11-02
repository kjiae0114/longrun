import type { Play } from '../domain/play';
import { playStore, PlayStoreError } from './playStore';

/** 없는 PLAY는 null을 반환한다. 저장소를 읽지 못한 경우는 그대로 오류를 던진다. */
export function findPlay(id: string): Play | null {
  try {
    return playStore.get(id);
  } catch (error) {
    if (error instanceof PlayStoreError && error.code === 'NOT_FOUND') return null;
    throw error;
  }
}

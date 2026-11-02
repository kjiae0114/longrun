import { PlayStoreError } from './playStore';

export function getStoreErrorMessage(error: unknown): string {
  if (error instanceof PlayStoreError) {
    switch (error.code) {
      case 'READ_FAILED':
        return '저장된 데이터를 읽을 수 없습니다.';
      case 'WRITE_FAILED':
        return '저장하지 못했습니다. 작성한 내용은 화면에 그대로 남아 있습니다.';
      case 'NOT_FOUND':
        return '해당 PLAY를 찾을 수 없습니다.';
      case 'SITUATION_REQUIRED':
        return '상황을 입력해 주세요.';
      case 'INCOMPLETE':
        return '필수 판단이 비어 있어 처리할 수 없습니다.';
      case 'INVALID_STATE':
        return '현재 상태에서는 할 수 없는 동작입니다.';
      case 'INVALID_BACKUP':
        return 'LONG RUN 백업 파일이 아니거나 내용이 올바르지 않습니다. 기존 데이터는 변경되지 않았습니다.';
    }
  }
  return '문제가 발생했습니다.';
}

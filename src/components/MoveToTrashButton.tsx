import { useState } from 'react';
import { getStoreErrorMessage } from '../storage/errorMessages';
import { playStore } from '../storage/playStore';
import { ConfirmDialog } from './ConfirmDialog';

interface MoveToTrashButtonProps {
  playId: string;
  onMoved: () => void;
}

export function MoveToTrashButton({ playId, onMoved }: MoveToTrashButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function moveToTrash() {
    try {
      playStore.moveToTrash(playId);
      setConfirming(false);
      onMoved();
    } catch (caught) {
      setConfirming(false);
      setError(getStoreErrorMessage(caught));
    }
  }

  return (
    <>
      <button type="button" className="danger" onClick={() => setConfirming(true)}>
        삭제
      </button>
      {error !== null && (
        <span className="error" role="alert">
          {error}
        </span>
      )}
      {confirming && (
        <ConfirmDialog
          message="이 PLAY를 휴지통으로 이동할까요?"
          confirmLabel="휴지통으로 이동"
          danger
          onConfirm={moveToTrash}
          onCancel={() => setConfirming(false)}
        />
      )}
    </>
  );
}

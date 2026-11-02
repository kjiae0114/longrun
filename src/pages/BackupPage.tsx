import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { getStoreErrorMessage } from '../storage/errorMessages';
import { playStore } from '../storage/playStore';

function downloadText(text: string, fileName: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function BackupPage() {
  const [pendingText, setPendingText] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function showResult(action: () => void, success: string) {
    try {
      action();
      setMessage(success);
      setError(null);
    } catch (caught) {
      setMessage(null);
      setError(getStoreErrorMessage(caught));
    }
  }

  function exportBackup() {
    showResult(() => {
      const date = new Date().toISOString().slice(0, 10);
      downloadText(playStore.exportBackup(), `longrun-backup-${date}.json`);
    }, '백업 파일을 내보냈습니다.');
  }

  async function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const file = input.files?.[0];
    if (file === undefined) return;
    try {
      setPendingText(await file.text());
    } catch {
      setMessage(null);
      setError('파일을 읽을 수 없습니다. 기존 데이터는 변경되지 않았습니다.');
    }
    input.value = '';
  }

  function importBackup(text: string) {
    showResult(() => playStore.importBackup(text), '백업 데이터를 가져왔습니다.');
    setPendingText(null);
  }

  return (
    <>
      <h1>데이터 백업</h1>
      <p>LONG RUN의 기록은 이 브라우저에만 저장됩니다. 파일로 직접 보관하고 복원할 수 있습니다.</p>

      <section className="detail-section">
        <h2>내보내기</h2>
        <p>진행 중, 완료, 휴지통의 모든 PLAY를 JSON 파일로 저장합니다.</p>
        <button type="button" className="primary" onClick={exportBackup}>
          내보내기
        </button>
      </section>

      <section className="detail-section">
        <h2>가져오기</h2>
        <p>LONG RUN 백업 파일만 가져올 수 있습니다. 현재 데이터와 합치지 않고 교체합니다.</p>
        <label className="field">
          <span>백업 파일 선택</span>
          <input type="file" accept=".json,application/json" onChange={selectFile} />
        </label>
      </section>

      {message !== null && <p role="status">{message}</p>}
      {error !== null && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {pendingText !== null && (
        <ConfirmDialog
          message="현재 데이터를 백업 파일의 내용으로 교체할까요? 교체한 데이터는 되돌릴 수 없습니다."
          confirmLabel="가져오기"
          danger
          onConfirm={() => importBackup(pendingText)}
          onCancel={() => setPendingText(null)}
        />
      )}
    </>
  );
}

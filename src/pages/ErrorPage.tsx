import { useRouteError } from 'react-router-dom';
import { getStoreErrorMessage } from '../storage/errorMessages';

export function ErrorPage() {
  return (
    <>
      <h1>{getStoreErrorMessage(useRouteError())}</h1>
      <p>기존 데이터는 변경하지 않았습니다. 백업 파일이 있다면 가져와서 복원할 수 있습니다.</p>
    </>
  );
}

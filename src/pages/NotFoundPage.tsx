import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <>
      <h1>페이지를 찾을 수 없습니다.</h1>
      <Link to="/">HOME으로 이동</Link>
    </>
  );
}

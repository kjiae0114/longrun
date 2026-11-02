import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <>
      <h1>HOME</h1>
      <Link className="button primary" to="/plays/new">
        새 PLAY 시작
      </Link>
    </>
  );
}

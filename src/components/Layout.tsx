import { Link, NavLink, Outlet, ScrollRestoration } from 'react-router-dom';

export function Layout() {
  return (
    <div className="layout">
      <header className="header">
        <Link to="/" className="brand">
          LONG RUN
        </Link>
        <nav aria-label="메인">
          <NavLink to="/" end>
            HOME
          </NavLink>
          <NavLink to="/history">HISTORY</NavLink>
        </nav>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <footer className="footer">
        <span>관리</span>
        <Link to="/trash">휴지통</Link>
        <Link to="/backup">데이터 백업</Link>
      </footer>
      <ScrollRestoration />
    </div>
  );
}

import { Link, NavLink, Outlet } from 'react-router-dom';

export function AppLayout(): JSX.Element {
  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/needs" className="app-logo">
          <span aria-hidden="true">🐾</span>
          <span>Лапа рядом</span>
        </Link>
        <nav aria-label="Основная навигация">
          <NavLink to="/needs" className={navClassName}>
            Потребности
          </NavLink>
          <NavLink to="/shelters" className={navClassName}>
            Приюты
          </NavLink>
          <NavLink to="/login" className={navClassName}>
            Вход для приютов
          </NavLink>
        </nav>
      </header>

      <div className="demo-banner" role="note">
        Демонстрационный проект. Приюты и заявки вымышлены.
      </div>

      <main className="app-main">
        <Outlet />
      </main>

      <footer className="app-footer">
        <small>
          «Лапа рядом» — учебный проект. См. <code>docs/IMPLEMENTATION_STATUS.md</code>.
        </small>
      </footer>
    </div>
  );
}

function navClassName({ isActive }: { isActive: boolean }): string {
  return isActive ? 'app-nav-link active' : 'app-nav-link';
}

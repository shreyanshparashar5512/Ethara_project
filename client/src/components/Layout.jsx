import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

const linkBase =
  'px-3 py-2 rounded-lg text-sm font-medium transition';
const inactive = 'text-slate-600 hover:bg-slate-100';
const active = 'bg-brand-50 text-brand-700';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold">
                T
              </div>
              <span className="font-semibold text-slate-900">Team Tasks</span>
            </div>
            <nav className="flex gap-1">
              <NavLink
                to="/"
                end
                className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`}
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/projects"
                className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`}
              >
                Projects
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-slate-900">{user?.name}</div>
              <div className="text-xs text-slate-500 flex items-center gap-1 justify-end">
                {user?.email}
                {user?.role === 'admin' && <span className="badge-admin">admin</span>}
              </div>
            </div>
            <button onClick={onLogout} className="btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">{children}</main>
      <footer className="border-t bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4 text-xs text-slate-500 text-center">
          Team Task Manager · Built with Express, React, MongoDB
        </div>
      </footer>
    </div>
  );
}

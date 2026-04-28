import { Link, NavLink } from 'react-router-dom';
import { Shield, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const AppShell = ({ children }) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/10 bg-slate-950/30 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="rounded-2xl bg-accent/15 p-2 text-accent">
              <Shield size={22} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-soft/60">AI Review</p>
              <p className="text-lg font-semibold">Secure Code Studio</p>
            </div>
          </Link>

          <nav className="flex items-center gap-4 text-sm text-soft">
            <NavLink to="/" className="transition hover:text-white">
              Dashboard
            </NavLink>
            <NavLink to="/projects" className="transition hover:text-white">
              Projects
            </NavLink>
            <div className="rounded-full border border-white/10 px-3 py-2">
              {user?.name} · {user?.role}
            </div>
            <button onClick={logout} className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 hover:bg-white/5">
              <LogOut size={14} />
              Logout
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
};

export default AppShell;

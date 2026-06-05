import { NavLink } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

function BottomNavItem({ path, label, children }) {
  return (
    <NavLink
      to={path}
      className={({ isActive }) =>
        `flex flex-col items-center gap-1 py-2 px-3 text-xs font-medium transition-colors duration-base min-w-0 flex-1 ${
          isActive
            ? 'text-accent'
            : 'text-text-tertiary'
        }`
      }
    >
      {children}
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

export default function BottomNav() {
  const { user } = useAuthStore();

  return (
    <nav className="flex md:hidden items-center justify-around px-2 h-16 border-t border-border bg-surface fixed bottom-0 inset-x-0 z-40">
      <BottomNavItem path="/" label="Home">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </BottomNavItem>
      <BottomNavItem path="/ledger" label="Ledger">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6h16M4 12h16M4 18h12" />
        </svg>
      </BottomNavItem>
      <BottomNavItem path="/analytics" label="Analytics">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="14" width="4" height="7" rx="1" />
          <rect x="10" y="9" width="4" height="12" rx="1" />
          <rect x="17" y="3" width="4" height="18" rx="1" />
        </svg>
      </BottomNavItem>
      <BottomNavItem path="/categories" label="Categories">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 4h4l3 3h7a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
        </svg>
      </BottomNavItem>
      <BottomNavItem path="/profile" label="Profile">
        {user?.picture ? (
          <img src={user.picture} alt="" className="w-6 h-6 rounded-full border border-border" />
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
        )}
      </BottomNavItem>
    </nav>
  );
}

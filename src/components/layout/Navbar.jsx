import { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useSyncStore from '../../store/syncStore';

function NavIcon({ path, children }) {
  return (
    <NavLink
      to={path}
      className={({ isActive }) =>
        `flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors duration-base ${
          isActive
            ? 'text-accent bg-accent-light'
            : 'text-text-secondary hover:text-text-primary hover:bg-accent-light'
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export default function Navbar() {
  const { user } = useAuthStore();
  const { status } = useSyncStore();
  const [showSuccess, setShowSuccess] = useState(false);
  const prevStatus = useRef(status);

  useEffect(() => {
    if (prevStatus.current === 'syncing' && status === 'idle') {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
    prevStatus.current = status;
  }, [status]);

  return (
    <nav className="hidden md:flex items-center px-6 h-14 border-b border-border bg-surface fixed top-0 inset-x-0 z-40">
      <span className="text-base font-semibold text-text-secondary shrink-0">OpenAccounts</span>
      <div className="flex-1 flex items-center justify-center gap-1">
        <NavIcon path="/">Home</NavIcon>
        <NavIcon path="/ledger">Ledger</NavIcon>
        <NavIcon path="/analytics">Analytics</NavIcon>
        <NavIcon path="/categories">Categories</NavIcon>
      </div>
      {user?.picture && (
        <NavLink to="/profile" className="relative block shrink-0">
          <img
            src={user.picture}
            alt="Profile"
            className="w-8 h-8 rounded-full border border-border hover:ring-2 hover:ring-accent/30 transition-all duration-base"
          />
          {status === 'syncing' && (
            <div className="absolute inset-0 rounded-full border-2 border-t-warning border-border/50 animate-spin" />
          )}
          {status === 'error' && (
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-warning flex items-center justify-center">
              <span className="text-[10px] font-bold text-accent leading-none">!</span>
            </div>
          )}
          {showSuccess && (
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-warning flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          )}
        </NavLink>
      )}
    </nav>
  );
}

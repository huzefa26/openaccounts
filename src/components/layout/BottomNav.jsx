import { useState } from 'react';
import { NavLink } from 'react-router-dom';

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
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('oa_theme', next ? 'dark' : 'light');
  }

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
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
      </BottomNavItem>
      <button
        type="button"
        onClick={toggleTheme}
        className="flex flex-col items-center gap-1 py-2 px-2 text-xs font-medium transition-colors duration-base text-text-tertiary hover:text-text-primary flex-shrink-0"
        aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {dark ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
          </svg>
        )}
      </button>
    </nav>
  );
}

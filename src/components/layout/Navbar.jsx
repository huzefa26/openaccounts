import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';

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
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('oa_theme', next ? 'dark' : 'light');
  }

  return (
    <nav className="hidden md:flex items-center gap-1 px-6 h-14 border-b border-border bg-surface fixed top-0 inset-x-0 z-40">
      <span className="text-base font-bold text-text-primary mr-6">OpenAccounts</span>
      <NavIcon path="/">Home</NavIcon>
      <NavIcon path="/ledger">Ledger</NavIcon>
      <NavIcon path="/analytics">Analytics</NavIcon>
      <NavIcon path="/categories">Categories</NavIcon>
      <NavIcon path="/profile">Profile</NavIcon>
      <button
        type="button"
        onClick={toggleTheme}
        className="ml-auto inline-flex items-center justify-center w-9 h-9 rounded-md text-text-tertiary hover:text-text-primary hover:bg-accent-light transition-colors duration-base"
        aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {dark ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
          </svg>
        )}
      </button>
    </nav>
  );
}

import { NavLink } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useSyncStore from '../../store/syncStore';
import AvatarWithSync from './AvatarWithSync';

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

function SyncButton() {
  const { status, syncNow } = useSyncStore();

  let icon;
  if (status === 'syncing') {
    icon = (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin text-accent">
        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
      </svg>
    );
  } else if (status === 'error') {
    icon = (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-expense">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    );
  } else {
    icon = (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary">
        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
      </svg>
    );
  }

  return (
    <button
      type="button"
      onClick={() => syncNow()}
      className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-md hover:bg-accent-light transition-colors duration-base"
      aria-label="Sync"
    >
      {icon}
    </button>
  );
}

export default function Navbar() {
  const { user } = useAuthStore();

  return (
    <nav className="hidden md:flex items-center px-6 h-14 border-b border-border bg-surface fixed top-0 inset-x-0 z-40">
      <span className="text-base font-semibold text-text-secondary shrink-0">OpenAccounts</span>
      <div className="flex-1 flex items-center justify-center gap-1">
        <NavIcon path="/">Home</NavIcon>
        <NavIcon path="/ledger">Ledger</NavIcon>
        <NavIcon path="/analytics">Analytics</NavIcon>
        <NavIcon path="/categories">Categories</NavIcon>
      </div>
      <div className="flex items-center gap-1">
        <SyncButton />
        {user?.picture && (
          <NavLink to="/profile" aria-label="Profile" className="shrink-0">
            <AvatarWithSync size="md" />
          </NavLink>
        )}
      </div>
    </nav>
  );
}

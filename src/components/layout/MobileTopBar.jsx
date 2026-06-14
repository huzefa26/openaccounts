import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import useSyncStore from '../../store/syncStore';

const ROUTE_TITLES = {
  '/': 'Home',
  '/ledger': 'Ledger',
  '/analytics': 'Analytics',
  '/categories': 'Categories',
  '/profile': 'Profile',
};

function SyncIcon() {
  const { status } = useSyncStore();

  if (status === 'syncing') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin text-accent">
        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
      </svg>
    );
  }

  if (status === 'error') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-expense">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    );
  }

  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary">
      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
    </svg>
  );
}

export default function MobileTopBar() {
  const location = useLocation();

  const title = useMemo(() => {
    return ROUTE_TITLES[location.pathname] || 'OpenAccounts';
  }, [location.pathname]);

  return (
    <div className="md:hidden fixed top-0 inset-x-0 h-14 bg-surface border-b border-border z-50 flex items-center justify-between px-4">
      <h1 className="text-base font-semibold text-text-primary">{title}</h1>
      <button
        type="button"
        className="inline-flex items-center justify-center w-9 h-9 rounded-md hover:bg-accent-light transition-colors duration-base"
        aria-label="Sync"
      >
        <SyncIcon />
      </button>
    </div>
  );
}

import { NavLink } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
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
      {user?.picture && (
        <NavLink to="/profile" aria-label="Profile" className="shrink-0">
          <AvatarWithSync size="md" />
        </NavLink>
      )}
    </nav>
  );
}

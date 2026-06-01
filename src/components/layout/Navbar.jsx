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
  return (
    <nav className="hidden md:flex items-center gap-1 px-6 h-14 border-b border-border bg-surface fixed top-0 inset-x-0 z-40">
      <span className="text-base font-bold text-text-primary mr-6">OpenAccounts</span>
      <NavIcon path="/">Home</NavIcon>
      <NavIcon path="/ledger">Ledger</NavIcon>
      <NavIcon path="/analytics">Analytics</NavIcon>
      <NavIcon path="/categories">Categories</NavIcon>
      <NavIcon path="/profile">Profile</NavIcon>
    </nav>
  );
}

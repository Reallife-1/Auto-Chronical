import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

const pageLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/expenses', label: 'Expenses' },
  { to: '/vehicles', label: 'Vehicles' },
  { to: '/reports', label: 'Reports' },
  { to: '/car-fund', label: 'Car Fund' },
  { to: '/fleet', label: 'Fleet' },
  { to: '/profile', label: 'Profile' },
  { to: '/settings', label: 'Settings' },
];

interface AppPageLayoutProps {
  children: ReactNode;
  /** Use for full-width dashboard content; default caps at max-w-7xl */
  wide?: boolean;
}

/** Shared horizontal padding and max-width for in-app (fleet) pages — one layout, all breakpoints. */
export default function AppPageLayout({
  children,
  wide = false,
}: AppPageLayoutProps) {
  return (
    <div className="app-shell min-h-screen">
      <header className="app-topbar">
        <nav
          aria-label="Main navigation"
          className="app-nav mx-auto flex w-full max-w-7xl gap-1 overflow-x-auto px-4 py-3 sm:gap-2 sm:px-6 md:px-8"
        >
          <NavLink
            to="/"
            className="app-brand mr-3 shrink-0 self-center text-xs font-bold tracking-[0.12em] sm:mr-5 sm:text-sm"
          >
            AUTO CHRONICLE
          </NavLink>
          {pageLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `app-nav-link shrink-0 rounded-lg px-3 py-2 text-xs transition-colors sm:text-sm ${
                  isActive ? 'active font-medium' : ''
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main
        className={`mx-auto w-full px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8 lg:px-10 ${wide ? '' : 'max-w-7xl'}`}
      >
        {children}
      </main>
    </div>
  );
}

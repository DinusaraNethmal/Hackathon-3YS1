import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

type ViewMode = 'home' | 'login' | 'register' | 'admin' | 'user-dashboard';

interface NavbarProps {
  activeView: ViewMode;
  setActiveView: (view: ViewMode) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeView, setActiveView }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const getRoleClass = (role: string) => {
    if (role === 'admin') return 'role-admin';
    if (role === 'owner') return 'role-owner';
    return 'role-passenger';
  };

  const handleDashboardClick = () => {
    setDropdownOpen(false);
    setActiveView(user?.role === 'admin' ? 'admin' : 'user-dashboard');
  };

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    setActiveView('home');
  };

  return (
    <header className="navbar-container">
      <div className="navbar-inner">
        {/* Brand */}
        <button
          className="navbar-brand"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          onClick={() => setActiveView('home')}
        >
          <div className="brand-icon-box">
            {/* Bus Icon */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="14" rx="2" />
              <path d="M8 4v14" />
              <path d="M16 4v14" />
              <path d="M2 8h20" />
              <circle cx="7" cy="20" r="1.5" fill="#ffffff" stroke="none" />
              <circle cx="17" cy="20" r="1.5" fill="#ffffff" stroke="none" />
              <path d="M7 18v2" strokeWidth="1.5" />
              <path d="M17 18v2" strokeWidth="1.5" />
            </svg>
          </div>
          <div className="brand-text-group">
            <span className="brand-name">RouteLK</span>
            <span className="brand-tagline">Sri Lanka Transit</span>
          </div>
        </button>

        {/* Nav */}
        <nav className="navbar-nav">
          {(!isAuthenticated || user?.role !== 'admin') && (
            <button
              className={`nav-link-btn ${activeView === 'home' ? 'active' : ''}`}
              onClick={() => setActiveView('home')}
            >
              {/* Home icon */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Home
            </button>
          )}

          {isAuthenticated && user?.role !== 'admin' && (
            <button
              className={`nav-link-btn ${activeView === 'user-dashboard' ? 'active' : ''}`}
              onClick={() => setActiveView('user-dashboard')}
            >
              {/* Ticket icon */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9a1 1 0 0 0 0 6v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4a1 1 0 0 0 0-6V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v4z" />
                <line x1="9" y1="5" x2="9" y2="19" strokeDasharray="2 2" />
              </svg>
              My Trips
            </button>
          )}

          {isAuthenticated && user?.role === 'admin' && (
            <button
              className={`nav-link-btn ${activeView === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveView('admin')}
            >
              {/* Dashboard icon */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="9" rx="1.5" />
                <rect x="14" y="3" width="7" height="5" rx="1.5" />
                <rect x="14" y="12" width="7" height="9" rx="1.5" />
                <rect x="3" y="16" width="7" height="5" rx="1.5" />
              </svg>
              Dashboard
            </button>
          )}

          {isAuthenticated && user ? (
            <div className="user-dropdown-wrapper" ref={dropdownRef}>
              <button
                type="button"
                className={`user-dropdown-trigger ${dropdownOpen ? 'active' : ''}`}
                onClick={() => setDropdownOpen((p) => !p)}
                aria-haspopup="true"
                aria-expanded={dropdownOpen}
              >
                <span className="user-avatar-small">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </span>
                <span className="user-name-text">{user.name.split(' ')[0]}</span>
                <span className={`role-badge ${getRoleClass(user.role)}`}>{user.role}</span>
                <span className={`dropdown-chevron ${dropdownOpen ? 'open' : ''}`}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              </button>

              {dropdownOpen && (
                <div className="user-dropdown-menu">
                  <div className="dropdown-header-info">
                    <span className="dropdown-user-name">{user.name}</span>
                    <span className="dropdown-user-email">{user.email}</span>
                    <div className="dropdown-role-row">
                      <span className={`role-badge ${getRoleClass(user.role)}`}>
                        {user.role.toUpperCase()} ACCOUNT
                      </span>
                    </div>
                  </div>
                  <div className="dropdown-menu-list">
                    <button type="button" className="dropdown-item-btn highlight" onClick={handleDashboardClick}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20" />
                        <path d="M12 12 16.5 8" />
                        <circle cx="12" cy="12" r="2" />
                      </svg>
                      <span>{user.role === 'admin' ? 'Admin Dashboard' : 'My Dashboard'}</span>
                    </button>

                    {user.role !== 'admin' && (
                      <button
                        type="button"
                        className="dropdown-item-btn"
                        onClick={() => { setDropdownOpen(false); setActiveView('home'); }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="11" cy="11" r="8" />
                          <path d="m21 21-4.35-4.35" />
                        </svg>
                        <span>Search Buses</span>
                      </button>
                    )}

                    <div className="dropdown-item-divider" />

                    <button type="button" className="dropdown-item-btn logout" onClick={handleLogout}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="nav-signin-btn"
                onClick={() => setActiveView('login')}
              >
                Log In
              </button>
              <button
                className="nav-signup-btn"
                onClick={() => setActiveView('register')}
              >
                Sign Up
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

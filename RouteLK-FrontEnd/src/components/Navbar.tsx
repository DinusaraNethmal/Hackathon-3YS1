import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  activeView: 'home' | 'login' | 'register' | 'admin' | 'user-dashboard';
  setActiveView: (view: 'home' | 'login' | 'register' | 'admin' | 'user-dashboard') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeView, setActiveView }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const getRoleClass = (role: string) => {
    switch (role) {
      case 'admin':
        return 'role-admin';
      case 'owner':
        return 'role-owner';
      default:
        return 'role-passenger';
    }
  };

  const handleDashboardClick = () => {
    setDropdownOpen(false);
    if (user?.role === 'admin') {
      setActiveView('admin');
    } else {
      setActiveView('user-dashboard');
    }
  };

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    setActiveView('login');
  };

  return (
    <header className="navbar-container">
      <div className="navbar-inner">
        {/* Brand */}
        <div
          className="navbar-brand"
          style={{ cursor: 'pointer' }}
          onClick={() => {
            if (isAuthenticated && user?.role === 'admin') {
              setActiveView('admin');
            } else {
              setActiveView('home');
            }
          }}
        >
          <div className="brand-icon-box">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8 6v6" />
              <path d="M15 6v6" />
              <path d="M2 12h19.6" />
              <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.6 19.1 6 18 6H4c-1.1 0-2.1.6-2.4 1.8l-1.4 5c-.1.4-.2.8-.2 1.2 0 .4.1.8.2 1.2.3 1.1.8 2.8.8 2.8h3" />
              <circle cx="7" cy="18" r="2" />
              <path d="M9 18h5" />
              <circle cx="16" cy="18" r="2" />
            </svg>
          </div>
          <div className="brand-text-group">
            <span className="brand-name">RouteLK</span>
            <span className="brand-tagline">SRI LANKA TRANSIT NETWORK</span>
          </div>
        </div>

        {/* Navigation & Auth */}
        <nav className="navbar-nav">
          {(!isAuthenticated || user?.role !== 'admin') && (
            <button
              className={`nav-link-btn ${activeView === 'home' ? 'active' : ''}`}
              onClick={() => setActiveView('home')}
            >
              Home
            </button>
          )}

          {isAuthenticated && user?.role !== 'admin' && (
            <button
              className={`nav-link-btn ${activeView === 'user-dashboard' ? 'active' : ''}`}
              onClick={() => setActiveView('user-dashboard')}
            >
              My Trips
            </button>
          )}

          {isAuthenticated && user?.role === 'admin' && (
            <button
              className={`nav-link-btn ${activeView === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveView('admin')}
            >
              Dashboard
            </button>
          )}

          {isAuthenticated && user ? (
            /* User Avatar Button with Dropdown Menu */
            <div className="user-dropdown-wrapper" ref={dropdownRef}>
              <button
                type="button"
                className={`user-dropdown-trigger ${dropdownOpen ? 'active' : ''}`}
                onClick={() => setDropdownOpen((prev) => !prev)}
                aria-haspopup="true"
                aria-expanded={dropdownOpen}
              >
                <span className="user-avatar-small">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </span>
                <span className="user-name-text">{user.name.split(' ')[0]}</span>
                <span className={`role-badge ${getRoleClass(user.role)}`}>
                  {user.role}
                </span>
                <span className={`dropdown-chevron ${dropdownOpen ? 'open' : ''}`}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              </button>

              {/* Dropdown Menu Panel */}
              {dropdownOpen && (
                <div className="user-dropdown-menu">
                  {/* User Details Header */}
                  <div className="dropdown-header-info">
                    <span className="dropdown-user-name">{user.name}</span>
                    <span className="dropdown-user-email">{user.email}</span>
                    <div className="dropdown-role-row">
                      <span className={`role-badge ${getRoleClass(user.role)}`}>
                        {user.role.toUpperCase()} ACCOUNT
                      </span>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="dropdown-menu-list">
                    <button
                      type="button"
                      className="dropdown-item-btn highlight"
                      onClick={handleDashboardClick}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect width="7" height="9" x="3" y="3" rx="1" />
                        <rect width="7" height="5" x="14" y="3" rx="1" />
                        <rect width="7" height="9" x="14" y="12" rx="1" />
                        <rect width="7" height="5" x="3" y="16" rx="1" />
                      </svg>
                      <span>
                        {user.role === 'admin' ? 'Admin Dashboard' : 'My Dashboard'}
                      </span>
                    </button>

                    {user.role !== 'admin' && (
                      <button
                        type="button"
                        className="dropdown-item-btn"
                        onClick={() => {
                          setDropdownOpen(false);
                          setActiveView('home');
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="11" cy="11" r="8" />
                          <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <span>Search Buses & Routes</span>
                      </button>
                    )}

                    <div className="dropdown-item-divider" />

                    <button
                      type="button"
                      className="dropdown-item-btn logout"
                      onClick={handleLogout}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                className={`nav-link-btn ${activeView === 'login' ? 'active' : ''}`}
                onClick={() => setActiveView('login')}
              >
                Log In
              </button>
              <button
                className="search-submit-btn"
                style={{
                  height: '38px',
                  padding: '0 16px',
                  fontSize: '13.5px',
                  borderRadius: '18px',
                }}
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

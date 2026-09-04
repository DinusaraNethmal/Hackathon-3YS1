import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="footer-container">
      <div className="footer-inner">
        {/* Brand column */}
        <div className="footer-col-brand">
          <div className="footer-brand-header">
            <div className="brand-icon-box small">
              <svg
                width="18"
                height="18"
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
                <circle cx="7" cy="18" r="2" />
                <circle cx="16" cy="18" r="2" />
              </svg>
            </div>
            <span className="footer-brand-name">RouteLK</span>
          </div>
          <p className="footer-brand-desc">
            Sri Lanka’s smart public transportation platform. Connecting commuters and bus operators with transparent schedules, clear fares, and guaranteed seat reservations.
          </p>
        </div>

        {/* Popular Routes */}
        <div>
          <h4 className="footer-heading">Popular Express Routes</h4>
          <ul className="footer-links-list">
            <li><a href="#search">Colombo ↔ Kandy (AC Express)</a></li>
            <li><a href="#search">Colombo ↔ Galle (Southern Highway)</a></li>
            <li><a href="#search">Colombo ↔ Matara (Expressway)</a></li>
            <li><a href="#search">Colombo ↔ Jaffna (Night Mail)</a></li>
          </ul>
        </div>

        {/* Roles & Info */}
        <div>
          <h4 className="footer-heading">Platform Roles</h4>
          <ul className="footer-links-list">
            <li><a href="#passenger">Passenger Booking</a></li>
            <li><a href="#owner">Bus Fleet Operators</a></li>
            <li><a href="#admin">System Administrator Portal</a></li>
            <li><a href="#status">MongoDB Atlas Status: Connected</a></li>
          </ul>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '40px', color: '#64748b', fontSize: '13px' }}>
        © {new Date().getFullYear()} RouteLK. Built for Sri Lankan University Hackathon.
      </div>
    </footer>
  );
};

import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="footer-container">
      <div className="footer-inner">
        {/* Brand Column */}
        <div className="footer-col-brand">
          <div className="footer-brand-header">
            <div className="brand-icon-box small">
              {/* Bus icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="14" rx="2" />
                <path d="M8 4v14" />
                <path d="M16 4v14" />
                <path d="M2 8h20" />
                <circle cx="7" cy="20" r="1.5" fill="#ffffff" stroke="none" />
                <circle cx="17" cy="20" r="1.5" fill="#ffffff" stroke="none" />
              </svg>
            </div>
            <span className="footer-brand-name">RouteLK</span>
          </div>
          <p className="footer-brand-desc">
            Sri Lanka's smart public transportation platform. Connecting commuters and bus operators with transparent schedules, live seat maps, and guaranteed reservations.
          </p>

          {/* Payment badge */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '20px', alignItems: 'center' }}>
            <div style={{
              background: '#000',
              borderRadius: '6px',
              padding: '4px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}>
              {/* Google G logo SVG */}
              <svg width="14" height="14" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"/>
                <path fill="#FBBC05" d="M5.28 14.27a7.17 7.17 0 0 1 0-4.54V6.58H1.25a11.98 11.98 0 0 0 0 10.84l4.03-3.15Z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"/>
              </svg>
              <span style={{ color: '#fff', fontSize: '12px', fontWeight: 700, letterSpacing: '0.3px' }}>Pay</span>
            </div>
            <div style={{ fontSize: '11.5px', color: '#4A6785', fontWeight: 600 }}>Powered by Google Pay</div>
          </div>
        </div>

        {/* Popular Routes */}
        <div>
          <h4 className="footer-heading">Popular Express Routes</h4>
          <ul className="footer-links-list">
            <li>
              <a href="#">
                {/* Route arrow icon */}
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
                Colombo ↔ Kandy (AC Express)
              </a>
            </li>
            <li>
              <a href="#">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
                Colombo ↔ Galle (Southern Expressway)
              </a>
            </li>
            <li>
              <a href="#">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
                Colombo ↔ Matara (Highway)
              </a>
            </li>
            <li>
              <a href="#">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
                Colombo ↔ Jaffna (Night Mail)
              </a>
            </li>
            <li>
              <a href="#">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
                Kandy ↔ Nuwara Eliya (Hill Country)
              </a>
            </li>
          </ul>
        </div>

        {/* Platform Info */}
        <div>
          <h4 className="footer-heading">Platform</h4>
          <ul className="footer-links-list">
            <li>
              <a href="#">
                {/* Passenger icon */}
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Passenger Booking
              </a>
            </li>
            <li>
              <a href="#">
                {/* Bus icon */}
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <rect x="2" y="4" width="20" height="14" rx="2" />
                  <path d="M8 4v14M16 4v14M2 8h20" />
                </svg>
                Bus Fleet Operators
              </a>
            </li>
            <li>
              <a href="#">
                {/* Shield icon */}
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Admin Control Panel
              </a>
            </li>
            <li>
              <a href="#">
                {/* AI icon */}
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M9 9h.01M15 9h.01M9 15s1 1 3 1 3-1 3-1" />
                </svg>
                Gemini AI Assistant
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <span className="footer-bottom-text">
          © {new Date().getFullYear()} RouteLK — Sri Lanka University Hackathon Project
        </span>
        <div className="footer-db-badge">
          <svg width="8" height="8" viewBox="0 0 8 8" fill="#00A86B">
            <circle cx="4" cy="4" r="4" />
          </svg>
          MongoDB Atlas Connected
        </div>
      </div>
    </footer>
  );
};

import React, { useState, useEffect } from 'react';
import { SeatBookingModal } from './SeatBookingModal';

interface BusResult {
  id: string;
  busNumber: string;
  operatorName: string;
  busType: 'AC' | 'NON_AC';
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  fare: number;
  totalSeats: number;
  availableSeats: number;
}

interface HeroSearchProps {
  onNavigateToDashboard?: () => void;
  onNavigateToLogin?: () => void;
}

// Popular route pairs in Sri Lanka to showcase live in the animated hero banner
const FEATURED_ROUTES: [string, string][] = [
  ['Colombo', 'Kandy'],
  ['Kandy', 'Galle'],
  ['Galle', 'Matara'],
  ['Colombo', 'Jaffna'],
  ['Colombo', 'Badulla'],
  ['Kurunegala', 'Anuradhapura'],
  ['Colombo', 'Trincomalee'],
];

const SRI_LANKA_CITIES = [
  'Colombo',
  'Kandy',
  'Galle',
  'Matara',
  'Jaffna',
  'Kurunegala',
  'Negombo',
  'Anuradhapura',
  'Badulla',
  'Nuwara Eliya',
  'Trincomalee',
];

const CITY_TERMINALS: Record<string, string> = {
  Colombo: 'Fort / Bastian Mawatha',
  Kandy: 'Goods Shed Terminal',
  Galle: 'Galle Central',
  Matara: 'Matara Bus Stand',
  Jaffna: 'Jaffna Central',
  Kurunegala: 'Puttalam Road Stand',
  Negombo: 'Negombo Bus Stand',
  Anuradhapura: 'New Bus Stand',
  Badulla: 'Badulla Terminal',
  'Nuwara Eliya': 'Nuwara Eliya Stand',
  Trincomalee: 'Eastern Bus Stand',
};

export const HeroSearch: React.FC<HeroSearchProps> = ({
  onNavigateToDashboard,
  onNavigateToLogin,
}) => {
  const [fromLocation, setFromLocation] = useState('Colombo');
  const [toLocation, setToLocation] = useState('Kandy');

  // Animated visual route showcase with timed transitions
  const [routeIndex, setRouteIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // 4500ms matches the moveBus animation cycle time
    const interval = setInterval(() => {
      // 1. Fade out the current city names slightly before the new cycle begins
      setIsFading(true);
      setTimeout(() => {
        // 2. Change city names
        setRouteIndex((prev) => (prev + 1) % FEATURED_ROUTES.length);
        // 3. Fade in new city names
        setIsFading(false);
      }, 300);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  const currentRoute = FEATURED_ROUTES[routeIndex];
  const activeDisplayFrom = currentRoute[0];
  const activeDisplayTo = currentRoute[1];
  const [busType, setBusType] = useState('ALL');
  const [travelDate, setTravelDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });

  const [buses, setBuses] = useState<BusResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [selectedBusForSeats, setSelectedBusForSeats] = useState<BusResult | null>(null);
  const [showSeatModal, setShowSeatModal] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const handleSwap = () => {
    const tmp = fromLocation;
    setFromLocation(toLocation);
    setToLocation(tmp);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setSearchError('');

    try {
      const queryParams = new URLSearchParams({ from: fromLocation, to: toLocation, travelDate, busType });
      const res = await fetch(`${API_BASE}/buses/search?${queryParams.toString()}`);
      const data = await res.json();

      if (data.success && data.data && data.data.length > 0) {
        setBuses(data.data);
      } else {
        setBuses([]);
        setSearchError(data.message || `No active buses found from ${fromLocation} to ${toLocation} on ${travelDate}.`);
      }
      setShowModal(true);
    } catch {
      setBuses([]);
      setSearchError('Could not reach RouteLK database server. Please ensure backend is running.');
      setShowModal(true);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <>
      {/* ============ HERO SECTION ============ */}
      <section className="hero-section">
        <div className="hero-container">
          {/* Left: Text content */}
          <div className="hero-content">
            {/* Badge */}
            <div className="hero-badge-pill">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4l3 3" />
              </svg>
              <span>🇱🇰 Sri Lanka's Smart Transit Network</span>
            </div>

            <h1 className="hero-title">
              Find Your Bus,<br />
              <span className="highlight-green">Reserve Your Seat</span>
            </h1>

            <p className="hero-subtitle">
              Skip the terminal queues. Browse AC & Non-AC intercity express buses, compare live fares, and book verified seats in advance — all in one place.
            </p>

            {/* Route animation bar */}
            <div className="hero-route-visual">
              <div className="hero-route-city">
                <span className="hero-route-city-label">From</span>
                <span
                  className={`hero-route-city-name ${isFading ? 'fade-exit' : 'fade-enter'}`}
                  key={`from-${activeDisplayFrom}`}
                >
                  {activeDisplayFrom}
                </span>
              </div>
              <div className="hero-route-line" style={{ minWidth: '100px' }}>
                <span className="hero-route-bus-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <rect x="2" y="4" width="20" height="14" rx="2" />
                    <path d="M8 4v14M16 4v14M2 8h20" />
                  </svg>
                </span>
              </div>
              <div className="hero-route-city destination">
                <span className="hero-route-city-label">To</span>
                <span
                  className={`hero-route-city-name ${isFading ? 'fade-exit' : 'fade-enter'}`}
                  key={`to-${activeDisplayTo}`}
                >
                  {activeDisplayTo}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="hero-stats-row">
              <div className="hero-stat">
                <span className="hero-stat-value">17+</span>
                <span className="hero-stat-label">Live Buses</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-value">11</span>
                <span className="hero-stat-label">Cities</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-value">100%</span>
                <span className="hero-stat-label">Seat Guarantee</span>
              </div>
            </div>
          </div>

          {/* Right: Search Panel */}
          <div className="hero-search-panel">
            <div className="search-card-wrapper">
              {/* Card header */}
              <div className="search-card-header">
                <div className="search-card-header-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00A86B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                </div>
                <div>
                  <div className="search-card-header-text">Search Bus Routes</div>
                  <div className="search-card-header-sub">Date-specific live availability</div>
                </div>
              </div>

              <form className="search-card-form" onSubmit={handleSearch}>
                {/* Route row */}
                <div className="search-route-row">
                  {/* From */}
                  <div className="search-input-group">
                    <label className="input-label">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#00A86B" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" />
                        <circle cx="12" cy="12" r="3" fill="#00A86B" />
                      </svg>
                      Leaving From
                    </label>
                    <div className="input-field-box">
                      <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00A86B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      <select
                        className="custom-select"
                        value={fromLocation}
                        onChange={(e) => setFromLocation(e.target.value)}
                      >
                        {SRI_LANKA_CITIES.map((city) => (
                          <option key={city} value={city}>
                            {city} {CITY_TERMINALS[city] ? `(${CITY_TERMINALS[city]})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Swap */}
                  <button type="button" className="swap-btn" onClick={handleSwap} title="Swap origin and destination">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8 3 4 7l4 4" />
                      <path d="M4 7h16" />
                      <path d="m16 21 4-4-4-4" />
                      <path d="M20 17H4" />
                    </svg>
                  </button>

                  {/* To */}
                  <div className="search-input-group">
                    <label className="input-label">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#00A86B" strokeWidth="2.5">
                        <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                        <circle cx="12" cy="10" r="2.5" fill="#00A86B" />
                      </svg>
                      Going To
                    </label>
                    <div className="input-field-box">
                      <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00A86B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <select
                        className="custom-select"
                        value={toLocation}
                        onChange={(e) => setToLocation(e.target.value)}
                      >
                        {SRI_LANKA_CITIES.map((city) => (
                          <option key={city} value={city}>
                            {city} {CITY_TERMINALS[city] ? `(${CITY_TERMINALS[city]})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Date + Bus Type */}
                <div className="search-bottom-row">
                  {/* Date */}
                  <div className="search-input-group">
                    <label className="input-label">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5">
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      Travel Date
                    </label>
                    <div className="input-field-box">
                      <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00A86B" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <input
                        type="date"
                        className="custom-select"
                        style={{ border: 'none', background: 'transparent' }}
                        value={travelDate}
                        onChange={(e) => setTravelDate(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Bus Type */}
                  <div className="search-input-group">
                    <label className="input-label">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5">
                        <rect x="2" y="4" width="20" height="14" rx="2" />
                        <path d="M8 4v14M16 4v14M2 8h20" />
                      </svg>
                      Bus Type
                    </label>
                    <div className="bus-type-toggle" style={{ height: '44px', alignItems: 'center' }}>
                      {[
                        { val: 'ALL', label: 'All' },
                        { val: 'AC', label: 'AC ❄' },
                        { val: 'NON_AC', label: 'Non-AC' },
                      ].map((opt) => (
                        <button
                          key={opt.val}
                          type="button"
                          className={`bus-type-tab ${busType === opt.val ? 'active' : ''}`}
                          onClick={() => setBusType(opt.val)}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <button type="submit" className="search-submit-btn" disabled={isSearching}>
                  {isSearching ? (
                    <>
                      <div className="search-spinner" />
                      <span>Searching schedule...</span>
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.35-4.35" />
                      </svg>
                      <span>Search Available Buses</span>
                    </>
                  )}
                </button>

                {/* Trust badges */}
                <div className="trust-badges-row">
                  <div className="trust-badge-item">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Live Seat Maps</span>
                  </div>
                  <div className="trust-badge-item">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Instant Confirmation</span>
                  </div>
                  <div className="trust-badge-item">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Verified Express Routes</span>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ============ PROBLEM SECTION ============ */}
      <section className="problem-section">
        <div className="problem-container">
          <div className="problem-card">
            <div className="problem-badge">THE PROBLEM IN SRI LANKA</div>
            <h2 className="problem-title">
              Public bus travel in Sri Lanka is stressful, unpredictable, and inefficient.
            </h2>
            <p className="problem-description">
              Thousands of daily commuters stand in crowded terminals like Bastian Mawatha with no certainty of getting a seat. RouteLK centralises schedules, live availability, and direct booking in one accessible web application.
            </p>

            <div className="problem-grid">
              <div className="problem-grid-item">
                <div className="problem-icon-wrapper">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <h3 className="problem-item-title">No Real-time Schedules</h3>
                <p className="problem-item-desc">Passengers rely on word-of-mouth with no reliable updates on departure or arrival times.</p>
              </div>

              <div className="problem-grid-item">
                <div className="problem-icon-wrapper">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 9V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10c0 1.1.9 2 2 2h4" />
                    <circle cx="17" cy="17" r="3" />
                    <path d="m21 21-1.5-1.5" />
                  </svg>
                </div>
                <h3 className="problem-item-title">Zero Seat Guarantee</h3>
                <p className="problem-item-desc">Passengers often stand for 3+ hours on intercity routes due to overcrowded buses.</p>
              </div>

              <div className="problem-grid-item">
                <div className="problem-icon-wrapper">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <h3 className="problem-item-title">Unclear Fares</h3>
                <p className="problem-item-desc">Inconsistent fare expectations between AC highway express and regular route buses.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section className="how-it-works-section">
        <div className="how-it-works-container">
          <div className="section-header-center">
            <h2 className="section-main-title">How RouteLK Works</h2>
            <p className="section-sub-title">Book your next trip in 3 effortless steps</p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-card-top">
                <div className="step-icon-badge">
                  {/* Search icon */}
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                </div>
                <span className="step-number-text">01</span>
              </div>
              <h3 className="step-title">Search Routes</h3>
              <p className="step-desc">Select your origin, destination, travel date, and preferred bus type (AC or Non-AC).</p>
            </div>

            <div className="step-card">
              <div className="step-card-top">
                <div className="step-icon-badge">
                  {/* Seat map icon */}
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3" />
                    <path d="M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H6v-2a2 2 0 0 0-4 0Z" />
                    <path d="M4 18v2" />
                    <path d="M20 18v2" />
                    <path d="M12 4v9" />
                  </svg>
                </div>
                <span className="step-number-text">02</span>
              </div>
              <h3 className="step-title">Select Your Seat</h3>
              <p className="step-desc">View the interactive date-specific seat layout and pick your exact seat numbers from the live map.</p>
            </div>

            <div className="step-card">
              <div className="step-card-top">
                <div className="step-icon-badge">
                  {/* Ticket / confirm icon */}
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9a1 1 0 0 0 0 6v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4a1 1 0 0 0 0-6V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v4z" />
                    <line x1="9" y1="5" x2="9" y2="19" strokeDasharray="2 2" />
                    <polyline points="13 10 15 12 19 8" />
                  </svg>
                </div>
                <span className="step-number-text">03</span>
              </div>
              <h3 className="step-title">Instant Confirmation</h3>
              <p className="step-desc">Receive your unique booking reference ID (e.g. RLK-10001) with server-verified fares.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ BUS RESULTS MODAL ============ */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="modal-header">
              <div className="modal-route-header">
                <div className="modal-route-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00A86B" strokeWidth="2.2">
                    <rect x="2" y="4" width="20" height="14" rx="2" />
                    <path d="M8 4v14M16 4v14M2 8h20" />
                  </svg>
                </div>
                <div>
                  <h3 className="modal-route-title">
                    <span>{fromLocation}</span>
                    <span className="modal-route-arrow">→</span>
                    <span>{toLocation}</span>
                  </h3>
                  <p className="modal-route-sub">
                    {travelDate} · Found <strong>{buses.length}</strong> bus{buses.length !== 1 ? 'es' : ''}
                    {busType !== 'ALL' && ` · ${busType}`}
                  </p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              {searchError && (
                <div className="alert-banner alert-error" style={{ marginBottom: '16px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{searchError}</span>
                </div>
              )}

              <div className="bus-list">
                {buses.map((bus) => (
                  <div key={bus.id} className="bus-result-card">
                    {/* Left accent stripe */}
                    <div className={`bus-card-stripe ${bus.busType === 'NON_AC' ? 'non-ac' : ''}`} />

                    {/* Left info */}
                    <div className="bus-card-left">
                      {/* Operator row */}
                      <div className="bus-operator-row">
                        <span className="bus-operator-name">{bus.operatorName}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className={`bus-type-tag ${bus.busType === 'AC' ? 'ac' : 'non-ac'}`}>
                            {bus.busType === 'AC' ? '❄ AC' : 'Non-AC'}
                          </span>
                          <span className="bus-number-mono">#{bus.busNumber}</span>
                        </div>
                      </div>

                      {/* Schedule timeline */}
                      <div className="bus-schedule-row">
                        <div className="schedule-point">
                          <span className="time">{bus.departureTime}</span>
                          <span className="station">{bus.from}</span>
                        </div>
                        <div className="schedule-duration">
                          <span className="schedule-duration-label">Express</span>
                          <div className="duration-line" />
                        </div>
                        <div className="schedule-point">
                          <span className="time">{bus.arrivalTime}</span>
                          <span className="station">{bus.to}</span>
                        </div>
                      </div>

                      {/* Feature chips */}
                      <div className="features-tags-row">
                        <span className="feat-chip">
                          {bus.busType === 'AC' ? 'Air Conditioned' : 'Standard Comfort'}
                        </span>
                        <span className="feat-chip">Luggage Space</span>
                        <span className="feat-chip">Reserved Seats</span>
                      </div>
                    </div>

                    {/* Dashed divider */}
                    <div className="bus-card-divider" />

                    {/* Right: Price + Book */}
                    <div className="bus-card-right">
                      <div className="price-tag-group">
                        <span className="price-amount">Rs. {bus.fare}</span>
                        <span className="price-sub">per seat</span>
                      </div>

                      <div className="seats-avail-tag">
                        <span className="dot" />
                        <span>{bus.availableSeats} seats left</span>
                      </div>

                      <button
                        type="button"
                        className="book-now-btn"
                        onClick={() => {
                          setSelectedBusForSeats(bus);
                          setShowSeatModal(true);
                        }}
                      >
                        Select Seats
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Seat Booking Modal */}
      {showSeatModal && (
        <SeatBookingModal
          isOpen={showSeatModal}
          onClose={() => setShowSeatModal(false)}
          bus={selectedBusForSeats}
          travelDate={travelDate}
          onNavigateToDashboard={onNavigateToDashboard}
          onNavigateToLogin={onNavigateToLogin}
        />
      )}
    </>
  );
};

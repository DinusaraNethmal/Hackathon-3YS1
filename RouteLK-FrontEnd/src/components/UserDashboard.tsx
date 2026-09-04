import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getMyBookingsApi,
  cancelBookingApi,
  getWalletApi,
  topUpWalletApi,
  type Booking,
  type WalletData,
} from '../services/api';

interface UserDashboardProps {
  onBackToSearch: () => void;
}

type UserTab = 'bookings' | 'wallet' | 'profile';

export const UserDashboard: React.FC<UserDashboardProps> = ({ onBackToSearch }) => {
  const { user, token } = useAuth();

  const [activeTab, setActiveTab] = useState<UserTab>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Wallet States
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<number>(1000);
  const [customAmountStr, setCustomAmountStr] = useState<string>('');
  const [isCustomAmount, setIsCustomAmount] = useState<boolean>(false);
  const [isSubmittingTopUp, setIsSubmittingTopUp] = useState(false);

  const loadBookings = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError('');
      const res = await getMyBookingsApi(token);
      if (res.success) setBookings(res.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load your bookings.');
    } finally {
      setLoading(false);
    }
  };

  const loadWallet = async () => {
    if (!token) return;
    try {
      setWalletLoading(true);
      const res = await getWalletApi(token);
      if (res.success) setWalletData(res.data);
    } catch (err: any) {
      console.error('Wallet fetch error:', err);
    } finally {
      setWalletLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
    loadWallet();
  }, [token]);

  const handleCancelBooking = async (bookingId: string) => {
    if (!token) return;
    if (!window.confirm('Are you sure you want to cancel this booking? This will release your reserved seats.')) return;
    try {
      await cancelBookingApi(bookingId, token);
      setSuccessMsg('Booking cancelled successfully. Your seats have been released.');
      loadBookings();
      loadWallet();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel booking.');
    }
  };

  const handleGooglePayCheckout = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!token) return;

    const finalAmount = isCustomAmount ? Number(customAmountStr) : topUpAmount;

    if (isNaN(finalAmount) || finalAmount < 100) {
      setError('Minimum top-up amount is Rs. 100 LKR.');
      return;
    }
    if (finalAmount > 50000) {
      setError('Maximum top-up amount is Rs. 50,000 LKR.');
      return;
    }

    setIsSubmittingTopUp(true);
    setError('');

    try {
      const google = (window as any).google;

      if (google?.payments?.api?.PaymentsClient) {
        const paymentsClient = new google.payments.api.PaymentsClient({ environment: 'TEST' });

        const paymentDataRequest = {
          apiVersion: 2,
          apiVersionMinor: 0,
          allowedPaymentMethods: [{
            type: 'CARD',
            parameters: {
              allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
              allowedCardNetworks: ['MASTERCARD', 'VISA', 'AMEX', 'DISCOVER'],
            },
            tokenizationSpecification: {
              type: 'PAYMENT_GATEWAY',
              parameters: { gateway: 'example', gatewayMerchantId: 'exampleGatewayMerchantId' },
            },
          }],
          merchantInfo: { merchantName: 'RouteLK Transit Sri Lanka', merchantId: '12345678901234567890' },
          transactionInfo: {
            totalPriceStatus: 'FINAL',
            totalPrice: finalAmount.toFixed(2),
            currencyCode: 'LKR',
            countryCode: 'LK',
          },
        };

        const paymentData = await paymentsClient.loadPaymentData(paymentDataRequest);
        const cardDescription = paymentData?.paymentMethodData?.description || 'Google Account Card';

        const res = await topUpWalletApi({
          amount: finalAmount,
          paymentMethod: 'GOOGLE_PAY',
          reference: `Google Pay (${cardDescription})`,
        }, token);

        if (res.success) {
          setSuccessMsg(`Google Pay Successful! Added Rs. ${finalAmount.toLocaleString()} to your RouteLK Wallet.`);
          setShowTopUpModal(false);
          loadWallet();
        }
      } else {
        const res = await topUpWalletApi({
          amount: finalAmount,
          paymentMethod: 'GOOGLE_PAY',
          reference: 'Google Pay Instant Deposit',
        }, token);

        if (res.success) {
          setSuccessMsg(`Google Pay Successful! Added Rs. ${finalAmount.toLocaleString()} to your RouteLK Wallet.`);
          setShowTopUpModal(false);
          loadWallet();
        }
      }
    } catch (err: any) {
      if (err.statusCode === 'CANCELED') {
        console.log('[Google Pay] Sheet closed by user');
      } else {
        console.error('[Google Pay Error]', err);
        setError(err.message || 'Google Pay payment was cancelled or failed.');
      }
    } finally {
      setIsSubmittingTopUp(false);
    }
  };

  const totalBookingsCount = bookings.length;
  const confirmedCount = bookings.filter((b) => b.status === 'CONFIRMED').length;
  const totalSpent = bookings
    .filter((b) => b.status === 'CONFIRMED')
    .reduce((acc, curr) => acc + (curr.totalFare || 0), 0);

  const walletBalance = walletData?.balance ?? 0;

  return (
    <div className="admin-layout-wrapper">
      {/* ====== SIDEBAR ====== */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-title">
            {/* Ticket icon */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00A86B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9a1 1 0 0 0 0 6v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4a1 1 0 0 0 0-6V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v4z" />
              <line x1="9" y1="5" x2="9" y2="19" strokeDasharray="2 2" />
            </svg>
            <span>Passenger Portal</span>
          </div>
          <p className="admin-sidebar-role-label">{user?.name}</p>
        </div>

        <nav className="admin-sidebar-nav">
          {/* Bookings tab */}
          <button
            type="button"
            className={`admin-sidebar-btn ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            <div className="admin-nav-label-group">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9a1 1 0 0 0 0 6v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4a1 1 0 0 0 0-6V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v4z" />
                <line x1="9" y1="5" x2="9" y2="19" strokeDasharray="2 2" />
              </svg>
              <span>My Bookings</span>
            </div>
            <span className="admin-sidebar-badge">{bookings.length}</span>
          </button>

          {/* Wallet tab */}
          <button
            type="button"
            className={`admin-sidebar-btn ${activeTab === 'wallet' ? 'active' : ''}`}
            onClick={() => { setActiveTab('wallet'); loadWallet(); }}
          >
            <div className="admin-nav-label-group">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="14" x="2" y="5" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
                <circle cx="7" cy="14.5" r="1" fill="currentColor" />
              </svg>
              <span>My Wallet</span>
            </div>
            <span
              className="admin-sidebar-badge"
              style={{ background: 'rgba(0,168,107,0.15)', color: '#00A86B', fontWeight: 700 }}
            >
              Rs. {walletBalance.toLocaleString()}
            </span>
          </button>

          {/* Profile tab */}
          <button
            type="button"
            className={`admin-sidebar-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <div className="admin-nav-label-group">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>My Profile</span>
            </div>
          </button>
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
          <button
            type="button"
            className="search-submit-btn"
            style={{ height: '42px', fontSize: '13px', borderRadius: '10px' }}
            onClick={onBackToSearch}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            Book New Bus
          </button>
        </div>
      </aside>

      {/* ====== MAIN CONTENT ====== */}
      <main className="admin-main-panel">
        {error && (
          <div className="alert-banner alert-error" style={{ marginBottom: '18px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="alert-banner alert-success" style={{ marginBottom: '18px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{successMsg}</span>
          </div>
        )}

        {/* ============================ */}
        {/* TAB: MY BOOKINGS            */}
        {/* ============================ */}
        {activeTab === 'bookings' && (
          <div>
            <div className="admin-panel-header">
              <div className="admin-panel-title">
                <h2>My Reserved Trips</h2>
                <p>Track your scheduled bus journeys and seat allocations</p>
              </div>
              <button type="button" className="admin-btn-primary" onClick={loadBookings} disabled={loading}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0" strokeDasharray="3 3" />
                  <path d="M12 3c4.97 0 9 4.03 9 9" />
                </svg>
                Refresh
              </button>
            </div>

            {/* Stat tiles */}
            <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '24px' }}>
              <div className="admin-stat-tile">
                <div className="stat-tile-top">
                  <span>Total Trips</span>
                  <div className="stat-tile-icon" style={{ background: '#EFF4F9', color: '#2A4160' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9a1 1 0 0 0 0 6v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4a1 1 0 0 0 0-6V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v4z" />
                    </svg>
                  </div>
                </div>
                <span className="stat-tile-value">{totalBookingsCount}</span>
                <span className="stat-tile-sub">All reservations</span>
              </div>

              <div className="admin-stat-tile">
                <div className="stat-tile-top">
                  <span>Confirmed</span>
                  <div className="stat-tile-icon" style={{ background: '#ECFDF5', color: '#00A86B' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                </div>
                <span className="stat-tile-value" style={{ color: '#00A86B' }}>{confirmedCount}</span>
                <span className="stat-tile-sub">Active seat tickets</span>
              </div>

              <div className="admin-stat-tile">
                <div className="stat-tile-top">
                  <span>Total Fare</span>
                  <div className="stat-tile-icon" style={{ background: '#FFFBEB', color: '#D97706' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="1" x2="12" y2="23" />
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </div>
                </div>
                <span className="stat-tile-value" style={{ fontSize: '22px' }}>
                  Rs.{totalSpent.toLocaleString()}
                </span>
                <span className="stat-tile-sub">LKR spent</span>
              </div>
            </div>

            {/* Bookings table */}
            <div className="admin-table-container">
              <div className="admin-table-header">
                <h3>Booking Records</h3>
                <span style={{ fontSize: '12px', color: 'var(--gray-400)' }}>{bookings.length} total</span>
              </div>
              <div className="admin-table-responsive">
                <table className="admin-data-table">
                  <thead>
                    <tr>
                      <th>Booking Ref</th>
                      <th>Route</th>
                      <th>Bus & Operator</th>
                      <th>Travel Date</th>
                      <th>Seats</th>
                      <th>Fare</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '48px 20px' }}>
                          <div className="loading-center">
                            <div className="spinner-lg" />
                            <span>Loading your bookings...</span>
                          </div>
                        </td>
                      </tr>
                    ) : bookings.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '56px 20px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--gray-300)" strokeWidth="1.5">
                              <path d="M3 9a1 1 0 0 0 0 6v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4a1 1 0 0 0 0-6V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v4z" />
                            </svg>
                            <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--navy-900)' }}>No bookings yet</p>
                            <p style={{ fontSize: '13px', color: 'var(--gray-500)', marginBottom: '8px' }}>
                              Ready to travel? Search intercity express routes across Sri Lanka!
                            </p>
                            <button type="button" className="admin-btn-primary" onClick={onBackToSearch}>
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.35-4.35" />
                              </svg>
                              Find Buses Now
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      bookings.map((b) => {
                        const bookingId = b._id || b.id || '';
                        const busObj: any = b.busId || {};
                        const isConfirmed = b.status === 'CONFIRMED';
                        return (
                          <tr key={bookingId}>
                            <td>
                              <span className="booking-id-mono">{b.bookingId}</span>
                            </td>
                            <td>
                              <strong style={{ color: 'var(--navy-900)' }}>{busObj.from || 'Colombo'}</strong>{' '}
                              <span style={{ color: 'var(--emerald-500)', fontWeight: 700 }}>→</span>{' '}
                              <strong style={{ color: 'var(--navy-900)' }}>{busObj.to || 'Kandy'}</strong>
                            </td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{busObj.operatorName || 'RouteLK Travels'}</div>
                              <span style={{ fontSize: '11px', color: 'var(--gray-400)', fontFamily: 'var(--font-mono)' }}>
                                {busObj.busNumber} · {busObj.busType || 'AC'}
                              </span>
                            </td>
                            <td>
                              <strong>{b.travelDate}</strong>
                              <div style={{ fontSize: '11px', color: 'var(--gray-400)', fontFamily: 'var(--font-mono)' }}>
                                {busObj.departureTime || '08:00'} – {busObj.arrivalTime || '11:00'}
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                {b.seats.map((s) => (
                                  <span key={s} className="seat-badge">#{s}</span>
                                ))}
                              </div>
                            </td>
                            <td>
                              <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '14px' }}>
                                Rs.{b.totalFare}
                              </strong>
                              <div style={{ fontSize: '10.5px', color: 'var(--gray-400)' }}>
                                (Rs.{b.farePerSeat} × {b.passengerCount})
                              </div>
                            </td>
                            <td>
                              <span className={`admin-status-pill ${isConfirmed ? 'admin-status-active' : 'admin-status-cancelled'}`}>
                                {b.status}
                              </span>
                            </td>
                            <td>
                              {isConfirmed ? (
                                <button
                                  type="button"
                                  className="admin-btn-sm-danger"
                                  onClick={() => handleCancelBooking(bookingId)}
                                >
                                  Cancel
                                </button>
                              ) : (
                                <span style={{ color: 'var(--gray-300)', fontSize: '12px' }}>—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================ */}
        {/* TAB: MY WALLET              */}
        {/* ============================ */}
        {activeTab === 'wallet' && (
          <div>
            <div className="admin-panel-header">
              <div className="admin-panel-title">
                <h2>Digital Transit Wallet</h2>
                <p>Instant seat reservations, seamless top-ups, and transaction statements</p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={loadWallet}
                  disabled={walletLoading}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 12a9 9 0 1 1-18 0" />
                    <path d="M12 3 8 7l4 4" />
                  </svg>
                  Refresh
                </button>
                <button
                  type="button"
                  className="admin-btn-primary"
                  onClick={() => { setError(''); setSuccessMsg(''); setShowTopUpModal(true); }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Top Up Wallet
                </button>
              </div>
            </div>

            {/* Wallet card */}
            <div className="wallet-balance-card">
              <div className="wallet-card-inner">
                <div>
                  {/* Chip row */}
                  <div className="wallet-chip-row">
                    <div className="wallet-chip-icon">
                      <svg width="24" height="18" viewBox="0 0 24 18" fill="none">
                        <rect width="24" height="18" rx="3" fill="url(#chip-grad)" />
                        <rect x="3" y="5" width="18" height="8" rx="1.5" fill="rgba(0,0,0,0.2)" />
                        <line x1="8" y1="5" x2="8" y2="13" stroke="rgba(0,0,0,0.3)" strokeWidth="0.5" />
                        <line x1="12" y1="5" x2="12" y2="13" stroke="rgba(0,0,0,0.3)" strokeWidth="0.5" />
                        <line x1="16" y1="5" x2="16" y2="13" stroke="rgba(0,0,0,0.3)" strokeWidth="0.5" />
                        <defs>
                          <linearGradient id="chip-grad" x1="0" y1="0" x2="24" y2="18" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#d4af37" />
                            <stop offset="100%" stopColor="#f0c040" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '2px' }}>
                      ROUTELK TRANSIT
                    </span>
                  </div>
                  <div className="wallet-card-label">AVAILABLE BALANCE</div>
                  <div className="wallet-balance-amount">
                    Rs. {walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="wallet-status-dot-row">
                    <div className="wallet-status-dot" />
                    <span className="wallet-status-label">Active · Ready for instant seat reservations</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="wallet-topup-hero-btn"
                  onClick={() => { setError(''); setSuccessMsg(''); setShowTopUpModal(true); }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Top Up
                </button>
              </div>
            </div>

            {/* Wallet metrics */}
            <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '24px' }}>
              <div className="admin-stat-tile">
                <div className="stat-tile-top">
                  <span>Total Credited</span>
                  <div className="stat-tile-icon" style={{ background: 'var(--emerald-50)', color: 'var(--emerald-600)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                      <polyline points="17 6 23 6 23 12" />
                    </svg>
                  </div>
                </div>
                <span className="stat-tile-value" style={{ color: 'var(--emerald-600)' }}>
                  Rs.{(walletData?.summary?.totalTopUp || 0).toLocaleString()}
                </span>
                <span className="stat-tile-sub">All wallet deposits</span>
              </div>

              <div className="admin-stat-tile">
                <div className="stat-tile-top">
                  <span>Total Spent</span>
                  <div className="stat-tile-icon" style={{ background: 'var(--sky-100)', color: 'var(--sky-600)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="4" width="20" height="14" rx="2" />
                      <path d="M8 4v14M16 4v14M2 8h20" />
                    </svg>
                  </div>
                </div>
                <span className="stat-tile-value" style={{ color: 'var(--sky-600)' }}>
                  Rs.{(walletData?.summary?.totalSpent || 0).toLocaleString()}
                </span>
                <span className="stat-tile-sub">Ticket purchases</span>
              </div>

              <div className="admin-stat-tile">
                <div className="stat-tile-top">
                  <span>Transactions</span>
                  <div className="stat-tile-icon" style={{ background: 'var(--gray-100)', color: 'var(--gray-600)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="5" y="2" width="14" height="20" rx="2" />
                      <line x1="9" y1="9" x2="15" y2="9" />
                      <line x1="9" y1="13" x2="15" y2="13" />
                      <line x1="9" y1="17" x2="11" y2="17" />
                    </svg>
                  </div>
                </div>
                <span className="stat-tile-value">{walletData?.summary?.transactionCount || 0}</span>
                <span className="stat-tile-sub">Statement entries</span>
              </div>
            </div>

            {/* Transaction history */}
            <div className="admin-table-container">
              <div className="admin-table-header">
                <h3>Transaction History</h3>
                <span style={{ fontSize: '12px', color: 'var(--gray-400)' }}>Latest transactions</span>
              </div>
              <div className="admin-table-responsive">
                <table className="admin-data-table">
                  <thead>
                    <tr>
                      <th>Txn Ref</th>
                      <th>Date & Time</th>
                      <th>Description</th>
                      <th>Method</th>
                      <th>Amount (LKR)</th>
                      <th>Balance After</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!walletData?.transactions || walletData.transactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '56px 20px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--gray-300)" strokeWidth="1.5">
                              <rect width="20" height="14" x="2" y="5" rx="2" />
                              <line x1="2" y1="10" x2="22" y2="10" />
                            </svg>
                            <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--navy-900)' }}>No transactions yet</p>
                            <p style={{ fontSize: '13px', color: 'var(--gray-500)', marginBottom: '8px' }}>
                              Top up your wallet to enable fast 1-click seat booking!
                            </p>
                            <button type="button" className="admin-btn-primary" onClick={() => setShowTopUpModal(true)}>
                              Top Up Now
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      walletData.transactions.map((t) => {
                        const isCredit = t.type === 'TOPUP' || t.type === 'REFUND';
                        return (
                          <tr key={t.transactionId}>
                            <td>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: 'var(--navy-900)' }}>
                                {t.transactionId}
                              </span>
                            </td>
                            <td style={{ fontSize: '12px', color: 'var(--gray-500)', fontFamily: 'var(--font-mono)' }}>
                              {new Date(t.createdAt).toLocaleDateString()}<br />
                              {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td>
                              <div style={{ fontWeight: 600, fontSize: '13px' }}>{t.description}</div>
                              {t.reference && (
                                <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>Ref: {t.reference}</div>
                              )}
                            </td>
                            <td>
                              <span style={{
                                display: 'inline-block',
                                padding: '3px 8px',
                                borderRadius: '5px',
                                fontSize: '11px',
                                fontWeight: 700,
                                background: 'var(--gray-100)',
                                color: 'var(--gray-700)',
                              }}>
                                {t.paymentMethod}
                              </span>
                            </td>
                            <td>
                              <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: isCredit ? 'var(--emerald-600)' : 'var(--red-600)' }}>
                                {isCredit ? '+' : '-'} Rs.{t.amount.toLocaleString()}
                              </strong>
                            </td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                              Rs.{t.balanceAfter.toLocaleString()}
                            </td>
                            <td>
                              <span className="admin-status-pill admin-status-active">
                                {t.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================ */}
        {/* TAB: PROFILE                */}
        {/* ============================ */}
        {activeTab === 'profile' && (
          <div>
            <div className="admin-panel-header">
              <div className="admin-panel-title">
                <h2>Account Profile</h2>
                <p>Your personal information and account details</p>
              </div>
            </div>

            <div className="admin-action-card" style={{ maxWidth: '600px' }}>
              {/* Avatar row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '28px', paddingBottom: '24px', borderBottom: '1px solid var(--gray-100)' }}>
                <div
                  className="user-avatar-small"
                  style={{ width: '60px', height: '60px', fontSize: '24px', borderRadius: '50%' }}
                >
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--navy-900)', letterSpacing: '-0.3px' }}>
                    {user?.name}
                  </h3>
                  <span
                    className="role-badge role-passenger"
                    style={{ marginTop: '6px', display: 'inline-block', fontSize: '11px' }}
                  >
                    {user?.role?.toUpperCase()} ACCOUNT
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {[
                  {
                    label: 'Email Address',
                    value: user?.email,
                    icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect width="20" height="16" x="2" y="4" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                    ),
                  },
                  {
                    label: 'Contact Phone',
                    value: user?.phone || 'Not provided',
                    icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.06 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    ),
                  },
                  {
                    label: 'Wallet Balance',
                    value: `Rs. ${walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} LKR`,
                    valueStyle: { color: 'var(--emerald-600)', fontFamily: 'var(--font-mono)', fontSize: '18px' },
                    icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect width="20" height="14" x="2" y="5" rx="2" />
                        <line x1="2" y1="10" x2="22" y2="10" />
                      </svg>
                    ),
                  },
                ].map((field, idx) => (
                  <div
                    key={field.label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '16px 0',
                      borderBottom: idx < 2 ? '1px solid var(--gray-100)' : 'none',
                    }}
                  >
                    <div style={{ width: '36px', height: '36px', background: 'var(--gray-50)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-500)', flexShrink: 0 }}>
                      {field.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>
                        {field.label}
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--navy-900)', ...((field as any).valueStyle || {}) }}>
                        {field.value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Security note */}
              <div style={{ marginTop: '20px', padding: '14px', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--emerald-500)" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}>
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <p style={{ fontSize: '12.5px', color: 'var(--gray-600)', lineHeight: 1.55 }}>
                  Your password is encrypted using bcrypt hashing. Sessions are authenticated with signed JWT tokens stored in your browser.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ============================ */}
      {/* GOOGLE PAY TOP-UP MODAL     */}
      {/* ============================ */}
      {showTopUpModal && (
        <div className="modal-overlay" onClick={() => setShowTopUpModal(false)}>
          <div className="gpay-modal-card" onClick={(e) => e.stopPropagation()}>
            {/* Dark header */}
            <div className="gpay-modal-header">
              <div className="gpay-header-left">
                <div className="gpay-logo-wrapper">
                  {/* Google G SVG */}
                  <svg width="28" height="28" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"/>
                    <path fill="#FBBC05" d="M5.28 14.27a7.17 7.17 0 0 1 0-4.54V6.58H1.25a11.98 11.98 0 0 0 0 10.84l4.03-3.15Z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"/>
                  </svg>
                </div>
                <div>
                  <div className="gpay-header-text">Google Pay Wallet Top-Up</div>
                  <div className="gpay-header-sub">RouteLK Transit · Secure Checkout · LKR</div>
                </div>
              </div>
              <button type="button" className="gpay-close-btn" onClick={() => setShowTopUpModal(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="gpay-modal-body">
              <form onSubmit={handleGooglePayCheckout}>
                {/* Amount label */}
                <div className="gpay-amount-label">Select Top-Up Amount (LKR)</div>

                {/* Preset amounts */}
                <div className="gpay-amount-grid">
                  {[500, 1000, 2500, 5000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      className={`gpay-amount-chip ${!isCustomAmount && topUpAmount === amt ? 'selected' : ''}`}
                      onClick={() => { setIsCustomAmount(false); setTopUpAmount(amt); }}
                    >
                      Rs.{amt.toLocaleString()}
                    </button>
                  ))}
                </div>

                {/* Custom amount */}
                <div className="gpay-custom-row">
                  <button
                    type="button"
                    className={`gpay-custom-btn ${isCustomAmount ? 'active' : ''}`}
                    onClick={() => setIsCustomAmount(true)}
                  >
                    Custom Amount
                  </button>
                  {isCustomAmount && (
                    <input
                      type="number"
                      className="gpay-custom-input"
                      placeholder="Enter Rs. (min 100)"
                      value={customAmountStr}
                      onChange={(e) => setCustomAmountStr(e.target.value)}
                      min="100"
                      max="50000"
                      required
                      autoFocus
                    />
                  )}
                </div>

                {/* Security block */}
                <div className="gpay-security-block">
                  <div className="gpay-security-title">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--emerald-500)" strokeWidth="2.2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    Secure Google Account Checkout
                  </div>
                  <div className="gpay-security-item">
                    <span className="gpay-security-check">✓</span>
                    <span>Card numbers are tokenised and never shared directly with merchants</span>
                  </div>
                  <div className="gpay-security-item">
                    <span className="gpay-security-check">✓</span>
                    <span>Supports any Visa, Mastercard, or Amex linked to your Google Account</span>
                  </div>
                  <div className="gpay-security-item">
                    <span className="gpay-security-check">✓</span>
                    <span>Fast 1-tap authorization — no manual card entry required</span>
                  </div>
                </div>

                {/* Test mode banner */}
                <div className="gpay-test-banner">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span><strong>TEST MODE:</strong> Runs in Google Pay sandbox — zero real charges on localhost.</span>
                </div>

                {/* Deposit total */}
                <div className="gpay-total-row">
                  <span className="gpay-total-label">Total Deposit</span>
                  <span className="gpay-total-amount">
                    Rs. {(isCustomAmount ? Number(customAmountStr || 0) : topUpAmount).toLocaleString()} LKR
                  </span>
                </div>

                {/* Action buttons */}
                <div className="gpay-actions">
                  <button
                    type="button"
                    className="gpay-cancel-btn"
                    onClick={() => setShowTopUpModal(false)}
                    disabled={isSubmittingTopUp}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="gpay-pay-btn"
                    disabled={isSubmittingTopUp}
                  >
                    {isSubmittingTopUp ? (
                      <>
                        <div className="search-spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.25)' }} />
                        <span>Connecting...</span>
                      </>
                    ) : (
                      <>
                        {/* GPay G */}
                        <svg width="20" height="20" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"/>
                          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"/>
                          <path fill="#FBBC05" d="M5.28 14.27a7.17 7.17 0 0 1 0-4.54V6.58H1.25a11.98 11.98 0 0 0 0 10.84l4.03-3.15Z"/>
                          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"/>
                        </svg>
                        <span>
                          Pay Rs.{(isCustomAmount ? Number(customAmountStr || 0) : topUpAmount).toLocaleString()} with GPay
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getMyBookingsApi,
  cancelBookingApi,
  getWalletApi,
  topUpWalletApi,
  initPayHereTopUpApi,
  confirmPayHereTopUpApi,
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

  // Fetch current user bookings
  const loadBookings = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError('');
      const res = await getMyBookingsApi(token);
      if (res.success) {
        setBookings(res.data || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load your bookings.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch current user wallet details
  const loadWallet = async () => {
    if (!token) return;
    try {
      setWalletLoading(true);
      const res = await getWalletApi(token);
      if (res.success) {
        setWalletData(res.data);
      }
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

  // Cancel Booking
  const handleCancelBooking = async (bookingId: string) => {
    if (!token) return;
    if (!window.confirm('Are you sure you want to cancel this booking? This will release your reserved seats.')) {
      return;
    }

    try {
      await cancelBookingApi(bookingId, token);
      setSuccessMsg('Booking cancelled successfully.');
      loadBookings();
      loadWallet();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel booking.');
    }
  };

  // Handle Top-Up Submission
  const handleTopUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      const res = await topUpWalletApi(
        {
          amount: finalAmount,
          paymentMethod: 'CARD',
          reference: 'Direct Demo Deposit',
        },
        token
      );

      if (res.success) {
        setSuccessMsg(`Successfully added Rs. ${finalAmount.toLocaleString()} to your RouteLK Wallet!`);
        setShowTopUpModal(false);
        // Refresh wallet
        loadWallet();
      }
    } catch (err: any) {
      setError(err.message || 'Top-up failed. Please check payment details.');
    } finally {
      setIsSubmittingTopUp(false);
    }
  };

  // Handle Real PayHere Sri Lanka Gateway Checkout
  const handlePayHereCheckout = async (e?: React.FormEvent) => {
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
      const res = await initPayHereTopUpApi(finalAmount, token);
      if (!res.success || !res.data) {
        throw new Error('Failed to initialize PayHere payment session.');
      }

      const payment = res.data;
      const payhere = (window as any).payhere;

      if (!payhere) {
        throw new Error('PayHere payment gateway is loading. Please refresh and try again.');
      }

      payhere.onCompleted = async function onCompleted(orderId: string) {
        console.log('[PayHere] Payment completed successfully for order:', orderId);
        try {
          const confirmRes = await confirmPayHereTopUpApi(orderId, token);
          if (confirmRes.success) {
            setSuccessMsg(`PayHere Payment Successful! Rs. ${finalAmount.toLocaleString()} credited to your wallet.`);
          }
        } catch (confirmErr: any) {
          console.error('[PayHere] Confirm error:', confirmErr);
          setSuccessMsg(`Payment completed! Updated your wallet balance.`);
        } finally {
          setIsSubmittingTopUp(false);
          setShowTopUpModal(false);
          loadWallet();
        }
      };

      payhere.onDismissed = function onDismissed() {
        console.log('[PayHere] Payment modal dismissed.');
        setIsSubmittingTopUp(false);
      };

      payhere.onError = function onError(err: any) {
        console.error('[PayHere] Gateway error:', err);
        setError(typeof err === 'string' ? err : 'PayHere encountered an error during transaction.');
        setIsSubmittingTopUp(false);
      };

      // Launch official PayHere interactive popup modal
      payhere.startPayment(payment);
    } catch (err: any) {
      setError(err.message || 'PayHere checkout initialization failed.');
      setIsSubmittingTopUp(false);
    }
  };

  // Metrics
  const totalBookingsCount = bookings.length;
  const confirmedCount = bookings.filter((b) => b.status === 'CONFIRMED').length;
  const totalSpent = bookings
    .filter((b) => b.status === 'CONFIRMED')
    .reduce((acc, curr) => acc + (curr.totalFare || 0), 0);

  const walletBalance = walletData?.balance ?? 0;

  return (
    <div className="admin-layout-wrapper">
      {/* Sidebar Navigation */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-title">
            <span style={{ fontSize: '20px' }}>🎫</span>
            <span>Passenger Portal</span>
          </div>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            {user?.name}
          </p>
        </div>

        <nav className="admin-sidebar-nav">
          <button
            type="button"
            className={`admin-sidebar-btn ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            <div className="admin-nav-label-group">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M7 7h10" />
                <path d="M7 12h10" />
                <path d="M7 17h10" />
              </svg>
              <span>My Bookings</span>
            </div>
            <span className="admin-sidebar-badge">{bookings.length}</span>
          </button>

          <button
            type="button"
            className={`admin-sidebar-btn ${activeTab === 'wallet' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('wallet');
              loadWallet();
            }}
          >
            <div className="admin-nav-label-group">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="20" height="14" x="2" y="5" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
              <span>My Wallet</span>
            </div>
            <span
              className="admin-sidebar-badge"
              style={{
                backgroundColor: '#e8f8f0',
                color: '#059669',
                fontWeight: 700,
              }}
            >
              Rs. {walletBalance.toLocaleString()}
            </span>
          </button>

          <button
            type="button"
            className={`admin-sidebar-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <div className="admin-nav-label-group">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
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
            🔍 Book New Bus
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main-panel">
        {error && (
          <div className="alert-banner alert-error" style={{ marginBottom: '18px' }}>
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="alert-banner alert-success" style={{ marginBottom: '18px' }}>
            <span>{successMsg}</span>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 1: MY BOOKINGS                                   */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'bookings' && (
          <div>
            <div className="admin-panel-header">
              <div className="admin-panel-title">
                <h2>My Reserved Trips</h2>
                <p>Track your scheduled bus journeys and seat allocations</p>
              </div>
              <button
                type="button"
                className="admin-btn-primary"
                onClick={loadBookings}
                disabled={loading}
              >
                🔄 Refresh Trips
              </button>
            </div>

            {/* Quick Stat Tiles */}
            <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '24px' }}>
              <div className="admin-stat-tile">
                <div className="stat-tile-top">
                  <span>Total Trips</span>
                  <span>🎫</span>
                </div>
                <span className="stat-tile-value">{totalBookingsCount}</span>
                <span className="stat-tile-sub">All reservations</span>
              </div>

              <div className="admin-stat-tile">
                <div className="stat-tile-top">
                  <span>Confirmed</span>
                  <span>✅</span>
                </div>
                <span className="stat-tile-value" style={{ color: '#059669' }}>
                  {confirmedCount}
                </span>
                <span className="stat-tile-sub">Active seat tickets</span>
              </div>

              <div className="admin-stat-tile">
                <div className="stat-tile-top">
                  <span>Total Fare</span>
                  <span>💵</span>
                </div>
                <span className="stat-tile-value" style={{ fontSize: '24px' }}>
                  Rs. {totalSpent.toLocaleString()}
                </span>
                <span className="stat-tile-sub">LKR spent</span>
              </div>
            </div>

            {/* Bookings Table */}
            <div className="admin-table-container">
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
                    {bookings.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '44px 20px', color: '#64748b' }}>
                          <p style={{ fontSize: '15px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                            You have no bus bookings yet.
                          </p>
                          <p style={{ fontSize: '13px', marginBottom: '16px' }}>
                            Ready to travel? Search intercity express routes across Sri Lanka!
                          </p>
                          <button
                            type="button"
                            className="admin-btn-primary"
                            onClick={onBackToSearch}
                          >
                            Find Buses Now
                          </button>
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
                              <strong style={{ color: '#059669', letterSpacing: '0.04em' }}>
                                {b.bookingId}
                              </strong>
                            </td>
                            <td>
                              <strong>{busObj.from || 'Colombo'}</strong>{' '}
                              <span style={{ color: '#059669' }}>→</span>{' '}
                              <strong>{busObj.to || 'Kandy'}</strong>
                            </td>
                            <td>
                              <div>{busObj.operatorName || 'RouteLK Travels'}</div>
                              <span style={{ fontSize: '11px', color: '#64748b' }}>
                                {busObj.busNumber} • {busObj.busType || 'AC'}
                              </span>
                            </td>
                            <td>
                              <strong>{b.travelDate}</strong>
                              <div style={{ fontSize: '11px', color: '#64748b' }}>
                                {busObj.departureTime || '08:00'} - {busObj.arrivalTime || '11:00'}
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                {b.seats.map((seatNum) => (
                                  <span
                                    key={seatNum}
                                    style={{
                                      background: '#e8f8f0',
                                      color: '#059669',
                                      fontWeight: 700,
                                      fontSize: '11px',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                    }}
                                  >
                                    #{seatNum}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td>
                              <strong>Rs. {b.totalFare}</strong>
                              <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                                (Rs. {b.farePerSeat} × {b.passengerCount})
                              </div>
                            </td>
                            <td>
                              <span
                                className="bus-type-tag"
                                style={{
                                  backgroundColor: isConfirmed ? '#e8f8f0' : '#fef2f2',
                                  color: isConfirmed ? '#059669' : '#dc2626',
                                  fontWeight: 700,
                                }}
                              >
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
                                <span style={{ color: '#94a3b8', fontSize: '12px' }}>Cancelled</span>
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

        {/* ---------------------------------------------------- */}
        {/* TAB 2: MY WALLET & TOP-UP                            */}
        {/* ---------------------------------------------------- */}
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
                  className="nav-link-btn"
                  style={{ border: '1px solid #cbd5e1', borderRadius: '10px' }}
                  onClick={loadWallet}
                  disabled={walletLoading}
                >
                  🔄 Refresh
                </button>
                <button
                  type="button"
                  className="admin-btn-primary"
                  onClick={() => {
                    setError('');
                    setSuccessMsg('');
                    setShowTopUpModal(true);
                  }}
                >
                  + Top Up Wallet
                </button>
              </div>
            </div>

            {/* Hero Wallet Balance Card */}
            <div
              style={{
                background: 'linear-gradient(135deg, #064e3b 0%, #059669 100%)',
                color: '#ffffff',
                borderRadius: '16px',
                padding: '28px 32px',
                marginBottom: '24px',
                boxShadow: '0 10px 25px -5px rgba(5, 150, 105, 0.25)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '20px',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    opacity: 0.85,
                  }}
                >
                  CURRENT AVAILABLE BALANCE
                </span>
                <div style={{ fontSize: '38px', fontWeight: 900, marginTop: '6px', letterSpacing: '-0.02em' }}>
                  Rs. {walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#34d399',
                    }}
                  />
                  <span style={{ fontSize: '13px', opacity: 0.9 }}>
                    Active & ready for 1-click bus seat reservations
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#065f46',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  }}
                  onClick={() => {
                    setError('');
                    setSuccessMsg('');
                    setShowTopUpModal(true);
                  }}
                >
                  ⚡ Instant Top-Up
                </button>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '24px' }}>
              <div className="admin-stat-tile">
                <div className="stat-tile-top">
                  <span>Total Credited</span>
                  <span>💳</span>
                </div>
                <span className="stat-tile-value" style={{ color: '#059669' }}>
                  Rs. {(walletData?.summary?.totalTopUp || 0).toLocaleString()}
                </span>
                <span className="stat-tile-sub">All wallet deposits</span>
              </div>

              <div className="admin-stat-tile">
                <div className="stat-tile-top">
                  <span>Total Spent</span>
                  <span>🚌</span>
                </div>
                <span className="stat-tile-value" style={{ color: '#0284c7' }}>
                  Rs. {(walletData?.summary?.totalSpent || 0).toLocaleString()}
                </span>
                <span className="stat-tile-sub">Ticket purchases</span>
              </div>

              <div className="admin-stat-tile">
                <div className="stat-tile-top">
                  <span>Transactions</span>
                  <span>🧾</span>
                </div>
                <span className="stat-tile-value">
                  {walletData?.summary?.transactionCount || 0}
                </span>
                <span className="stat-tile-sub">Statement entries</span>
              </div>
            </div>

            {/* Transaction History Section */}
            <div className="admin-table-container">
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid #f1f5f9',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0d1926' }}>
                  Transaction History & Statements
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Showing latest transactions
                </span>
              </div>

              <div className="admin-table-responsive">
                <table className="admin-data-table">
                  <thead>
                    <tr>
                      <th>Txn Ref</th>
                      <th>Date & Time</th>
                      <th>Description</th>
                      <th>Payment Method</th>
                      <th>Amount (LKR)</th>
                      <th>Balance After</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!walletData?.transactions || walletData.transactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '44px 20px', color: '#64748b' }}>
                          <p style={{ fontSize: '15px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                            No wallet transactions yet.
                          </p>
                          <p style={{ fontSize: '13px', marginBottom: '16px' }}>
                            Top up your wallet to enjoy fast 1-click booking without entering card details each time!
                          </p>
                          <button
                            type="button"
                            className="admin-btn-primary"
                            onClick={() => setShowTopUpModal(true)}
                          >
                            + Top Up Your Wallet Now
                          </button>
                        </td>
                      </tr>
                    ) : (
                      walletData.transactions.map((t) => {
                        const isCredit = t.type === 'TOPUP' || t.type === 'REFUND';
                        return (
                          <tr key={t.transactionId}>
                            <td>
                              <strong style={{ letterSpacing: '0.02em', color: '#0d1926' }}>
                                {t.transactionId}
                              </strong>
                            </td>
                            <td style={{ fontSize: '12.5px', color: '#64748b' }}>
                              {new Date(t.createdAt).toLocaleDateString()} •{' '}
                              {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td>
                              <strong style={{ color: '#1e293b', fontSize: '13px' }}>
                                {t.description}
                              </strong>
                              {t.reference && (
                                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                                  Ref: {t.reference}
                                </div>
                              )}
                            </td>
                            <td>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  backgroundColor: '#f1f5f9',
                                  color: '#334155',
                                }}
                              >
                                {t.paymentMethod}
                              </span>
                            </td>
                            <td>
                              <strong
                                style={{
                                  fontSize: '14px',
                                  color: isCredit ? '#059669' : '#dc2626',
                                }}
                              >
                                {isCredit ? '+' : '-'} Rs. {t.amount.toLocaleString()}
                              </strong>
                            </td>
                            <td style={{ fontSize: '13px', color: '#334155' }}>
                              Rs. {t.balanceAfter.toLocaleString()}
                            </td>
                            <td>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  backgroundColor: '#e8f8f0',
                                  color: '#059669',
                                }}
                              >
                                ● {t.status}
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

        {/* ---------------------------------------------------- */}
        {/* TAB 3: MY PROFILE                                    */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'profile' && (
          <div>
            <div className="admin-panel-header">
              <div className="admin-panel-title">
                <h2>Account Profile</h2>
                <p>Personal information and registration details</p>
              </div>
            </div>

            <div className="admin-action-card" style={{ maxWidth: '640px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '24px' }}>
                <div
                  className="user-avatar-small"
                  style={{ width: '56px', height: '56px', fontSize: '22px' }}
                >
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0d1926' }}>{user?.name}</h3>
                  <span
                    className="role-badge"
                    style={{
                      background: '#e8f8f0',
                      color: '#059669',
                      fontSize: '11px',
                      marginTop: '4px',
                      display: 'inline-block',
                    }}
                  >
                    {user?.role?.toUpperCase()} ACCOUNT
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                  <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                    Email Address
                  </span>
                  <p style={{ fontSize: '15px', color: '#0d1926', fontWeight: 600, marginTop: '2px' }}>
                    {user?.email}
                  </p>
                </div>

                <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                  <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                    Contact Phone
                  </span>
                  <p style={{ fontSize: '15px', color: '#0d1926', fontWeight: 600, marginTop: '2px' }}>
                    {user?.phone || 'Not provided'}
                  </p>
                </div>

                <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                  <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                    Wallet Balance
                  </span>
                  <p style={{ fontSize: '17px', color: '#059669', fontWeight: 800, marginTop: '2px' }}>
                    Rs. {walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div>
                  <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                    Account Security
                  </span>
                  <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '2px' }}>
                    Your password is encrypted using salted bcrypt hashes. Authenticated using JWT Bearer sessions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ---------------------------------------------------- */}
      {/* TOP-UP MODAL FORM                                    */}
      {/* ---------------------------------------------------- */}
      {showTopUpModal && (
        <div className="modal-overlay" onClick={() => setShowTopUpModal(false)}>
          <div
            className="modal-content-card"
            style={{ maxWidth: '540px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 className="modal-route-title">Top Up RouteLK Wallet</h3>
                  <span
                    style={{
                      background: '#dcfce7',
                      color: '#15803d',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    PayHere 🇱🇰
                  </span>
                </div>
                <p className="modal-route-sub">
                  Secure instant payments powered by PayHere (CBSL Approved Gateway)
                </p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowTopUpModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <form onSubmit={handlePayHereCheckout} className="auth-form">
                {/* Preset Amount Chips */}
                <div className="form-group">
                  <label className="form-label">Select Top-Up Amount (LKR)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '10px' }}>
                    {[500, 1000, 2500, 5000].map((amt) => {
                      const isSelected = !isCustomAmount && topUpAmount === amt;
                      return (
                        <button
                          key={amt}
                          type="button"
                          style={{
                            padding: '10px 0',
                            textAlign: 'center',
                            borderRadius: '10px',
                            border: isSelected ? '2px solid #059669' : '1px solid #e2e8f0',
                            backgroundColor: isSelected ? '#e8f8f0' : '#ffffff',
                            color: isSelected ? '#059669' : '#334155',
                            fontWeight: 700,
                            fontSize: '13px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          onClick={() => {
                            setIsCustomAmount(false);
                            setTopUpAmount(amt);
                          }}
                        >
                          Rs. {amt.toLocaleString()}
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: isCustomAmount ? '2px solid #059669' : '1px solid #cbd5e1',
                        backgroundColor: isCustomAmount ? '#e8f8f0' : '#f8fafc',
                        color: isCustomAmount ? '#059669' : '#64748b',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                      onClick={() => setIsCustomAmount(true)}
                    >
                      Custom Amount
                    </button>
                    {isCustomAmount && (
                      <input
                        type="number"
                        className="auth-input"
                        style={{ paddingLeft: '14px', flex: 1 }}
                        placeholder="Enter amount in LKR (min Rs. 100)"
                        value={customAmountStr}
                        onChange={(e) => setCustomAmountStr(e.target.value)}
                        min="100"
                        max="50000"
                        required
                        autoFocus
                      />
                    )}
                  </div>
                </div>

                {/* Accepted Sri Lankan Payment Options on PayHere */}
                <div className="form-group" style={{ marginTop: '14px' }}>
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Payment Methods Accepted by PayHere:</span>
                    <span style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>All-in-One Gateway</span>
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {[
                      { id: 'CARD', label: 'Credit / Debit Cards', icon: '💳', sub: 'Visa, Mastercard, Amex' },
                      { id: 'LANKAPAY', label: 'LankaPay National QR', icon: '🇱🇰', sub: 'All Sri Lankan banking apps' },
                      { id: 'EZCASH', label: 'eZ Cash / mCash', icon: '📱', sub: 'Dialog & Mobitel mobile money' },
                      { id: 'GENIE', label: 'Genie / FriMi', icon: '⚡', sub: 'Sampath Vishwa & Smart Apps' },
                    ].map((m) => (
                      <div
                        key={m.id}
                        style={{
                          border: '1px solid #e2e8f0',
                          backgroundColor: '#f8fafc',
                          borderRadius: '10px',
                          padding: '8px 10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <span style={{ fontSize: '18px' }}>{m.icon}</span>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>{m.label}</div>
                          <div style={{ fontSize: '10px', color: '#64748b' }}>{m.sub}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sandbox Test Mode Helper Info */}
                <div
                  style={{
                    backgroundColor: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    marginTop: '12px',
                    fontSize: '12px',
                    color: '#1e40af',
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🧪</span>
                    <span>PayHere Sandbox Test Mode Active</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px', fontSize: '11px', color: '#2563eb' }}>
                    <div>Visa Card: <strong>4111 1111 1111 1111</strong></div>
                    <div>Expiry: <strong>12/28</strong> | CVV: <strong>123</strong></div>
                    <div>SMS OTP: <strong>123456</strong></div>
                    <div>Gateway: <strong>PayHere Popup</strong></div>
                  </div>
                </div>

                {/* Amount Confirmation Banner */}
                <div
                  style={{
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    marginTop: '14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '13px', color: '#166534', fontWeight: 600 }}>Total Deposit:</span>
                  <strong style={{ fontSize: '18px', color: '#15803d' }}>
                    Rs. {(isCustomAmount ? Number(customAmountStr || 0) : topUpAmount).toLocaleString()} LKR
                  </strong>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                  <button
                    type="button"
                    className="nav-link-btn"
                    style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '10px' }}
                    onClick={() => setShowTopUpModal(false)}
                    disabled={isSubmittingTopUp}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="auth-submit-btn"
                    style={{
                      flex: 2,
                      marginTop: 0,
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontWeight: 700,
                    }}
                    disabled={isSubmittingTopUp}
                  >
                    {isSubmittingTopUp ? (
                      <span>Opening PayHere Gateway...</span>
                    ) : (
                      <>
                        <span>💳 Pay with PayHere 🇱🇰</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Secondary Option for Direct Simulation */}
                <div style={{ textAlign: 'center', marginTop: '10px' }}>
                  <button
                    type="button"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      fontSize: '11px',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                    }}
                    disabled={isSubmittingTopUp}
                    onClick={handleTopUpSubmit}
                  >
                    Or use Instant Direct Deposit (Offline Demo) →
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

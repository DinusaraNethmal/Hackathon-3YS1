import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getAdminStatsApi,
  getUsersApi,
  deleteUserApi,
  getBusesApi,
  createBusApi,
  updateBusApi,
  deleteBusApi,
  type AdminStats,
  type User,
  type Bus,
} from '../services/api';

interface AdminDashboardProps {
  onBackToHome?: () => void;
}

type AdminTab = 'overview' | 'buses' | 'users';

const CITIES = [
  'Colombo',
  'Kandy',
  'Galle',
  'Matara',
  'Jaffna',
  'Kurunegala',
  'Negombo',
  'Anuradhapura',
  'Badulla',
  'Trincomalee',
  'Batticaloa',
  'Nuwara Eliya',
  'Ratnapura',
  'Hambantota',
];

export const AdminDashboard: React.FC<AdminDashboardProps> = () => {
  const { user, token } = useAuth();

  // Active Sidebar Tab
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Data States
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);

  // UI States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Bus Filter & Search States
  const [busSearchQuery, setBusSearchQuery] = useState('');
  const [busTypeFilter, setBusTypeFilter] = useState<'ALL' | 'AC' | 'NON_AC'>('ALL');
  const [busStatusFilter, setBusStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Add Bus Modal State
  const [showAddBusModal, setShowAddBusModal] = useState(false);
  const [newBusNumber, setNewBusNumber] = useState('');
  const [newOperatorName, setNewOperatorName] = useState('');
  const [newBusType, setNewBusType] = useState<'AC' | 'NON_AC'>('AC');
  const [newFrom, setNewFrom] = useState('Colombo');
  const [newTo, setNewTo] = useState('Kandy');
  const [newDeparture, setNewDeparture] = useState('07:30');
  const [newArrival, setNewArrival] = useState('10:45');
  const [newFare, setNewFare] = useState('850');
  const [newSeats, setNewSeats] = useState('40');
  const [newIsActive, setNewIsActive] = useState(true);
  const [isSubmittingBus, setIsSubmittingBus] = useState(false);

  // Edit Bus Modal State
  const [showEditBusModal, setShowEditBusModal] = useState(false);
  const [editingBusId, setEditingBusId] = useState<string>('');
  const [editBusNumber, setEditBusNumber] = useState('');
  const [editOperatorName, setEditOperatorName] = useState('');
  const [editBusType, setEditBusType] = useState<'AC' | 'NON_AC'>('AC');
  const [editFrom, setEditFrom] = useState('Colombo');
  const [editTo, setEditTo] = useState('Kandy');
  const [editDeparture, setEditDeparture] = useState('07:30');
  const [editArrival, setEditArrival] = useState('10:45');
  const [editFare, setEditFare] = useState('850');
  const [editSeats, setEditSeats] = useState('40');
  const [editIsActive, setEditIsActive] = useState(true);
  const [isUpdatingBus, setIsUpdatingBus] = useState(false);

  // Fetch admin overview, users, and buses
  const loadData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError('');

      const [statsRes, usersRes, busesRes] = await Promise.all([
        getAdminStatsApi(token),
        getUsersApi(token),
        getBusesApi(true), // true = load all buses (including inactive)
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (usersRes.success) setUsers(usersRes.data);
      if (busesRes.success) setBuses(busesRes.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load admin dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  // Handle Delete User
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!token) return;
    if (!window.confirm(`Are you sure you want to delete user "${userName}"?`)) {
      return;
    }

    try {
      await deleteUserApi(userId, token);
      setSuccessMsg(`User "${userName}" deleted successfully.`);
      setUsers((prev) => prev.filter((u) => (u.id || u._id) !== userId));
      // Refresh stats
      const statsRes = await getAdminStatsApi(token);
      if (statsRes.success) setStats(statsRes.data);
    } catch (err: any) {
      setError(err.message || 'Failed to delete user.');
    }
  };

  // Handle Delete Bus
  const handleDeleteBus = async (busId: string, busNumber: string) => {
    if (!token) return;
    if (!window.confirm(`Are you sure you want to delete bus "${busNumber}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteBusApi(busId, token);
      setSuccessMsg(`Bus "${busNumber}" deleted successfully.`);
      setBuses((prev) => prev.filter((b) => (b.id || b._id) !== busId));
      // Refresh stats
      const statsRes = await getAdminStatsApi(token);
      if (statsRes.success) setStats(statsRes.data);
    } catch (err: any) {
      setError(err.message || 'Failed to delete bus.');
    }
  };

  // Handle Toggle Bus Active Status
  const handleToggleBusStatus = async (bus: Bus) => {
    if (!token) return;
    const busId = bus.id || bus._id;
    if (!busId) return;

    const newStatus = !bus.isActive;
    try {
      await updateBusApi(busId, { isActive: newStatus }, token);
      setSuccessMsg(
        `Bus "${bus.busNumber}" is now ${newStatus ? 'ACTIVE (in service)' : 'PAUSED (inactive)'}.`
      );
      setBuses((prev) =>
        prev.map((b) => ((b.id || b._id) === busId ? { ...b, isActive: newStatus } : b))
      );
      const statsRes = await getAdminStatsApi(token);
      if (statsRes.success) setStats(statsRes.data);
    } catch (err: any) {
      setError(err.message || 'Failed to update bus status.');
    }
  };

  // Handle Add Bus Submit
  const handleAddBusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!newBusNumber.trim() || !newOperatorName.trim()) {
      setError('Please provide both bus registration number and operator name.');
      return;
    }

    if (newFrom.trim().toLowerCase() === newTo.trim().toLowerCase()) {
      setError('Departure and destination locations cannot be identical.');
      return;
    }

    setIsSubmittingBus(true);
    setError('');

    try {
      const res = await createBusApi(
        {
          busNumber: newBusNumber.trim().toUpperCase(),
          operatorName: newOperatorName.trim(),
          busType: newBusType,
          from: newFrom.trim(),
          to: newTo.trim(),
          departureTime: newDeparture,
          arrivalTime: newArrival,
          fare: Number(newFare),
          totalSeats: Number(newSeats),
          routeStops: [newFrom.trim(), newTo.trim()],
          isActive: newIsActive,
        },
        token
      );

      if (res.success) {
        setSuccessMsg(`Bus "${newBusNumber.toUpperCase()}" added to fleet successfully!`);
        setShowAddBusModal(false);
        // Reset form
        setNewBusNumber('');
        setNewOperatorName('');
        // Reload buses & stats
        const [busesRes, statsRes] = await Promise.all([
          getBusesApi(true),
          getAdminStatsApi(token),
        ]);
        if (busesRes.success) setBuses(busesRes.data);
        if (statsRes.success) setStats(statsRes.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create bus.');
    } finally {
      setIsSubmittingBus(false);
    }
  };

  // Handle Open Edit Modal
  const handleOpenEditModal = (bus: Bus) => {
    const busId = bus.id || bus._id;
    if (!busId) return;

    setEditingBusId(busId);
    setEditBusNumber(bus.busNumber);
    setEditOperatorName(bus.operatorName);
    setEditBusType(bus.busType);
    setEditFrom(bus.from);
    setEditTo(bus.to);
    setEditDeparture(bus.departureTime);
    setEditArrival(bus.arrivalTime);
    setEditFare(bus.fare.toString());
    setEditSeats(bus.totalSeats.toString());
    setEditIsActive(bus.isActive !== undefined ? bus.isActive : true);
    setShowEditBusModal(true);
  };

  // Handle Edit Bus Submit
  const handleEditBusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingBusId) return;

    if (!editBusNumber.trim() || !editOperatorName.trim()) {
      setError('Please provide bus number and operator name.');
      return;
    }

    if (editFrom.trim().toLowerCase() === editTo.trim().toLowerCase()) {
      setError('Departure and destination locations cannot be identical.');
      return;
    }

    setIsUpdatingBus(true);
    setError('');

    try {
      const res = await updateBusApi(
        editingBusId,
        {
          busNumber: editBusNumber.trim().toUpperCase(),
          operatorName: editOperatorName.trim(),
          busType: editBusType,
          from: editFrom.trim(),
          to: editTo.trim(),
          departureTime: editDeparture,
          arrivalTime: editArrival,
          fare: Number(editFare),
          totalSeats: Number(editSeats),
          routeStops: [editFrom.trim(), editTo.trim()],
          isActive: editIsActive,
        },
        token
      );

      if (res.success) {
        setSuccessMsg(`Bus "${editBusNumber.toUpperCase()}" updated successfully.`);
        setShowEditBusModal(false);
        // Refresh buses list & stats
        const [busesRes, statsRes] = await Promise.all([
          getBusesApi(true),
          getAdminStatsApi(token),
        ]);
        if (busesRes.success) setBuses(busesRes.data);
        if (statsRes.success) setStats(statsRes.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update bus.');
    } finally {
      setIsUpdatingBus(false);
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin':
        return 'role-admin';
      case 'owner':
        return 'role-owner';
      default:
        return 'role-passenger';
    }
  };

  // Filtered Buses
  const filteredBuses = buses.filter((bus) => {
    const q = busSearchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      bus.busNumber.toLowerCase().includes(q) ||
      bus.operatorName.toLowerCase().includes(q) ||
      bus.from.toLowerCase().includes(q) ||
      bus.to.toLowerCase().includes(q);

    const matchesType =
      busTypeFilter === 'ALL' || bus.busType === busTypeFilter;

    const matchesStatus =
      busStatusFilter === 'ALL' ||
      (busStatusFilter === 'ACTIVE' && bus.isActive !== false) ||
      (busStatusFilter === 'INACTIVE' && bus.isActive === false);

    return matchesQuery && matchesType && matchesStatus;
  });

  const totalAcBuses = buses.filter((b) => b.busType === 'AC').length;
  const totalNonAcBuses = buses.filter((b) => b.busType === 'NON_AC').length;
  const totalActiveFleet = buses.filter((b) => b.isActive !== false).length;

  return (
    <div className="admin-layout-wrapper">
      {/* Sidebar Navigation */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-title">
            <span style={{ fontSize: '20px' }}>⚡</span>
            <span>Admin Portal</span>
          </div>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Logged in as {user?.name?.split(' ')[0]}
          </p>
        </div>

        <nav className="admin-sidebar-nav">
          <button
            type="button"
            className={`admin-sidebar-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <div className="admin-nav-label-group">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="7" height="9" x="3" y="3" rx="1" />
                <rect width="7" height="5" x="14" y="3" rx="1" />
                <rect width="7" height="9" x="14" y="12" rx="1" />
                <rect width="7" height="5" x="3" y="16" rx="1" />
              </svg>
              <span>Dashboard</span>
            </div>
            <span className="admin-sidebar-badge">Live</span>
          </button>

          <button
            type="button"
            className={`admin-sidebar-btn ${activeTab === 'buses' ? 'active' : ''}`}
            onClick={() => setActiveTab('buses')}
          >
            <div className="admin-nav-label-group">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 6v6" />
                <path d="M15 6v6" />
                <path d="M2 12h19.6" />
                <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.6 19.1 6 18 6H4c-1.1 0-2.1.6-2.4 1.8l-1.4 5c-.1.4-.2.8-.2 1.2 0 .4.1.8.2 1.2.3 1.1.8 2.8.8 2.8h3" />
                <circle cx="7" cy="18" r="2" />
                <circle cx="16" cy="18" r="2" />
              </svg>
              <span>Bus Management</span>
            </div>
            <span className="admin-sidebar-badge">{buses.length}</span>
          </button>

          <button
            type="button"
            className={`admin-sidebar-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <div className="admin-nav-label-group">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>User Management</span>
            </div>
            <span className="admin-sidebar-badge">{users.length}</span>
          </button>
        </nav>
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
        {/* TAB 1: OVERVIEW / STATISTICS                         */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'overview' && (
          <div>
            <div className="admin-panel-header">
              <div className="admin-panel-title">
                <h2>System Overview</h2>
                <p>Real-time analytics and transit fleet performance</p>
              </div>
              <button
                type="button"
                className="admin-btn-primary"
                onClick={loadData}
                disabled={loading}
              >
                🔄 Refresh Metrics
              </button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
                Loading live statistics from backend...
              </div>
            ) : stats ? (
              <>
                <div className="admin-grid">
                  <div className="admin-stat-tile">
                    <div className="stat-tile-top">
                      <span>Total Users</span>
                      <span>👥</span>
                    </div>
                    <span className="stat-tile-value">{stats.totalUsers}</span>
                    <span className="stat-tile-sub">{stats.totalPassengers} Passengers</span>
                  </div>

                  <div className="admin-stat-tile">
                    <div className="stat-tile-top">
                      <span>Bus Owners</span>
                      <span>🏢</span>
                    </div>
                    <span className="stat-tile-value">{stats.totalOwners}</span>
                    <span className="stat-tile-sub">Fleet operators</span>
                  </div>

                  <div className="admin-stat-tile">
                    <div className="stat-tile-top">
                      <span>Active Buses</span>
                      <span>🚌</span>
                    </div>
                    <span className="stat-tile-value">{stats.totalBuses}</span>
                    <span className="stat-tile-sub">AC & Non-AC</span>
                  </div>

                  <div className="admin-stat-tile">
                    <div className="stat-tile-top">
                      <span>In-Service Buses</span>
                      <span>🟢</span>
                    </div>
                    <span className="stat-tile-value" style={{ color: '#059669' }}>
                      {totalActiveFleet}
                    </span>
                    <span className="stat-tile-sub">Active in service</span>
                  </div>

                  <div className="admin-stat-tile">
                    <div className="stat-tile-top">
                      <span>AC Fleet</span>
                      <span>❄️</span>
                    </div>
                    <span className="stat-tile-value" style={{ color: '#0284c7' }}>
                      {totalAcBuses}
                    </span>
                    <span className="stat-tile-sub">Luxury express</span>
                  </div>

                  <div className="admin-stat-tile">
                    <div className="stat-tile-top">
                      <span>Non-AC Fleet</span>
                      <span>🚌</span>
                    </div>
                    <span className="stat-tile-value" style={{ color: '#475569' }}>
                      {totalNonAcBuses}
                    </span>
                    <span className="stat-tile-sub">Standard routes</span>
                  </div>

                  <div className="admin-stat-tile">
                    <div className="stat-tile-top">
                      <span>Database Engine</span>
                      <span>🍃</span>
                    </div>
                    <span className="stat-tile-value" style={{ fontSize: '22px', color: '#059669' }}>
                      Atlas
                    </span>
                    <span className="stat-tile-sub">Connected: routelk db</span>
                  </div>

                  <div className="admin-stat-tile">
                    <div className="stat-tile-top">
                      <span>System Status</span>
                      <span>⚡</span>
                    </div>
                    <span className="stat-tile-value" style={{ fontSize: '20px', color: '#059669', paddingTop: '4px' }}>
                      Operational
                    </span>
                    <span className="stat-tile-sub">Zero downtime</span>
                  </div>
                </div>

                <div className="admin-action-card">
                  <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0d1926', marginBottom: '8px' }}>
                    Quick Management
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '13.5px', marginBottom: '16px' }}>
                    Choose a management area below to add buses, inspect routes, or manage user permissions across Sri Lanka.
                  </p>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="admin-btn-primary"
                      onClick={() => setActiveTab('buses')}
                    >
                      🚌 Manage Buses ({buses.length})
                    </button>
                    <button
                      type="button"
                      className="nav-link-btn"
                      style={{ border: '1px solid #cbd5e1', borderRadius: '10px' }}
                      onClick={() => setActiveTab('users')}
                    >
                      👥 Manage Users ({users.length})
                    </button>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 2: BUS MANAGEMENT                               */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'buses' && (
          <div>
            <div className="admin-panel-header">
              <div className="admin-panel-title">
                <h2>Bus Fleet Management</h2>
                <p>Register, modify, pause, and inspect buses across all routes</p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="nav-link-btn"
                  style={{ border: '1px solid #cbd5e1', borderRadius: '10px' }}
                  onClick={loadData}
                  disabled={loading}
                >
                  🔄 Refresh
                </button>
                <button
                  type="button"
                  className="admin-btn-primary"
                  onClick={() => setShowAddBusModal(true)}
                >
                  + Add New Bus
                </button>
              </div>
            </div>

            {/* Quick Bus Metrics Strip */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '14px',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '14px 18px',
                }}
              >
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>TOTAL BUSES</span>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#0d1926' }}>{buses.length}</div>
              </div>

              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '14px 18px',
                }}
              >
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>IN SERVICE (ACTIVE)</span>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#059669' }}>{totalActiveFleet}</div>
              </div>

              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '14px 18px',
                }}
              >
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>AC BUSES</span>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#0284c7' }}>{totalAcBuses}</div>
              </div>

              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '14px 18px',
                }}
              >
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>NON-AC BUSES</span>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#475569' }}>{totalNonAcBuses}</div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bus-filter-bar">
              <input
                type="text"
                className="bus-filter-input"
                placeholder="Search bus number, operator, origin, or destination..."
                value={busSearchQuery}
                onChange={(e) => setBusSearchQuery(e.target.value)}
              />

              <select
                className="bus-filter-select"
                value={busTypeFilter}
                onChange={(e) => setBusTypeFilter(e.target.value as any)}
              >
                <option value="ALL">All Types (AC & Non-AC)</option>
                <option value="AC">AC Buses Only</option>
                <option value="NON_AC">Non-AC Buses Only</option>
              </select>

              <select
                className="bus-filter-select"
                value={busStatusFilter}
                onChange={(e) => setBusStatusFilter(e.target.value as any)}
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active in Service</option>
                <option value="INACTIVE">Paused / Inactive</option>
              </select>
            </div>

            {/* Buses Table */}
            <div className="admin-table-container">
              <div className="admin-table-responsive">
                <table className="admin-data-table">
                  <thead>
                    <tr>
                      <th>Bus Number</th>
                      <th>Operator</th>
                      <th>Type</th>
                      <th>Route</th>
                      <th>Schedule</th>
                      <th>Fare</th>
                      <th>Seats</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBuses.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                          {busSearchQuery || busTypeFilter !== 'ALL' || busStatusFilter !== 'ALL'
                            ? 'No buses match your filter criteria.'
                            : 'No buses registered in the system yet. Click "+ Add New Bus" to add one.'}
                        </td>
                      </tr>
                    ) : (
                      filteredBuses.map((bus) => {
                        const busId = bus.id || bus._id || '';
                        const isActive = bus.isActive !== false;
                        return (
                          <tr key={busId}>
                            <td>
                              <strong style={{ color: '#0d1926', letterSpacing: '0.02em' }}>
                                {bus.busNumber}
                              </strong>
                            </td>
                            <td>{bus.operatorName}</td>
                            <td>
                              <span
                                className="bus-type-tag"
                                style={{
                                  backgroundColor: bus.busType === 'AC' ? '#e8f8f0' : '#f1f5f9',
                                  color: bus.busType === 'AC' ? '#059669' : '#475569',
                                }}
                              >
                                {bus.busType}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontWeight: 600 }}>{bus.from}</span>
                              <span style={{ color: '#059669', margin: '0 6px' }}>→</span>
                              <span style={{ fontWeight: 600 }}>{bus.to}</span>
                            </td>
                            <td>
                              <span style={{ fontSize: '12.5px', color: '#334155' }}>
                                {bus.departureTime} - {bus.arrivalTime}
                              </span>
                            </td>
                            <td>
                              <strong style={{ color: '#059669' }}>Rs. {bus.fare}</strong>
                            </td>
                            <td>{bus.totalSeats}</td>
                            <td>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '3px 9px',
                                  borderRadius: '12px',
                                  fontSize: '11.5px',
                                  fontWeight: 700,
                                  backgroundColor: isActive ? '#e8f8f0' : '#fef2f2',
                                  color: isActive ? '#059669' : '#dc2626',
                                }}
                              >
                                {isActive ? '● Active' : '○ Paused'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                                <button
                                  type="button"
                                  className="admin-btn-sm-toggle"
                                  title={isActive ? 'Pause this bus' : 'Activate this bus'}
                                  onClick={() => handleToggleBusStatus(bus)}
                                >
                                  {isActive ? '⏸ Pause' : '▶ Activate'}
                                </button>
                                <button
                                  type="button"
                                  className="admin-btn-sm-edit"
                                  onClick={() => handleOpenEditModal(bus)}
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  type="button"
                                  className="admin-btn-sm-danger"
                                  onClick={() => handleDeleteBus(busId, bus.busNumber)}
                                >
                                  🗑️ Delete
                                </button>
                              </div>
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
        {/* TAB 3: USER MANAGEMENT                              */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'users' && (
          <div>
            <div className="admin-panel-header">
              <div className="admin-panel-title">
                <h2>User Management</h2>
                <p>Registered passengers, fleet owners, and system administrators</p>
              </div>
              <button
                type="button"
                className="admin-btn-primary"
                onClick={loadData}
                disabled={loading}
              >
                🔄 Refresh Users
              </button>
            </div>

            <div className="admin-table-container">
              <div className="admin-table-responsive">
                <table className="admin-data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Role</th>
                      <th>Registered</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                          No users found in database.
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => {
                        const userId = u.id || u._id || '';
                        const isSelf = u.email === user?.email;
                        return (
                          <tr key={userId}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className="user-avatar-small" style={{ width: '26px', height: '26px' }}>
                                  {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                                </span>
                                <strong style={{ color: '#0d1926' }}>{u.name}</strong>
                                {isSelf && (
                                  <span style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>
                                    (You)
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>{u.email}</td>
                            <td>{u.phone || '—'}</td>
                            <td>
                              <span className={`role-badge ${getRoleBadgeClass(u.role)}`}>
                                {u.role}
                              </span>
                            </td>
                            <td style={{ color: '#64748b', fontSize: '12.5px' }}>
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Active'}
                            </td>
                            <td>
                              {isSelf ? (
                                <span style={{ color: '#94a3b8', fontSize: '12px' }}>Protected</span>
                              ) : (
                                <button
                                  type="button"
                                  className="admin-btn-sm-danger"
                                  onClick={() => handleDeleteUser(userId, u.name)}
                                >
                                  🗑️ Delete
                                </button>
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
      </main>

      {/* ---------------------------------------------------- */}
      {/* ADD BUS MODAL                                        */}
      {/* ---------------------------------------------------- */}
      {showAddBusModal && (
        <div className="modal-overlay" onClick={() => setShowAddBusModal(false)}>
          <div
            className="modal-content-card"
            style={{ maxWidth: '580px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3 className="modal-route-title">Register New Bus</h3>
                <p className="modal-route-sub">Add an intercity express or highway bus to RouteLK</p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowAddBusModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleAddBusSubmit} className="auth-form">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Bus Number / Plate</label>
                    <input
                      type="text"
                      className="auth-input"
                      style={{ paddingLeft: '14px' }}
                      placeholder="e.g. ND-5421"
                      value={newBusNumber}
                      onChange={(e) => setNewBusNumber(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Operator Name</label>
                    <input
                      type="text"
                      className="auth-input"
                      style={{ paddingLeft: '14px' }}
                      placeholder="e.g. Southern Superline"
                      value={newOperatorName}
                      onChange={(e) => setNewOperatorName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">From (Origin)</label>
                    <select
                      className="auth-input"
                      style={{ paddingLeft: '14px' }}
                      value={newFrom}
                      onChange={(e) => setNewFrom(e.target.value)}
                    >
                      {CITIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">To (Destination)</label>
                    <select
                      className="auth-input"
                      style={{ paddingLeft: '14px' }}
                      value={newTo}
                      onChange={(e) => setNewTo(e.target.value)}
                    >
                      {CITIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Departure Time</label>
                    <input
                      type="time"
                      className="auth-input"
                      style={{ paddingLeft: '14px' }}
                      value={newDeparture}
                      onChange={(e) => setNewDeparture(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Arrival Time</label>
                    <input
                      type="time"
                      className="auth-input"
                      style={{ paddingLeft: '14px' }}
                      value={newArrival}
                      onChange={(e) => setNewArrival(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Bus Type</label>
                    <select
                      className="auth-input"
                      style={{ paddingLeft: '14px' }}
                      value={newBusType}
                      onChange={(e) => setNewBusType(e.target.value as 'AC' | 'NON_AC')}
                    >
                      <option value="AC">AC</option>
                      <option value="NON_AC">Non-AC</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Fare (LKR)</label>
                    <input
                      type="number"
                      className="auth-input"
                      style={{ paddingLeft: '14px' }}
                      value={newFare}
                      onChange={(e) => setNewFare(e.target.value)}
                      min="10"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Total Seats</label>
                    <input
                      type="number"
                      className="auth-input"
                      style={{ paddingLeft: '14px' }}
                      value={newSeats}
                      onChange={(e) => setNewSeats(e.target.value)}
                      min="10"
                      max="60"
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                  <input
                    type="checkbox"
                    id="newIsActive"
                    checked={newIsActive}
                    onChange={(e) => setNewIsActive(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#059669', cursor: 'pointer' }}
                  />
                  <label htmlFor="newIsActive" style={{ fontSize: '13.5px', color: '#334155', cursor: 'pointer' }}>
                    Active and in service in transit network
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                  <button
                    type="button"
                    className="nav-link-btn"
                    style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '10px' }}
                    onClick={() => setShowAddBusModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="auth-submit-btn"
                    style={{ flex: 2, marginTop: 0 }}
                    disabled={isSubmittingBus}
                  >
                    {isSubmittingBus ? 'Registering...' : 'Register Bus to Fleet'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* EDIT BUS MODAL                                       */}
      {/* ---------------------------------------------------- */}
      {showEditBusModal && (
        <div className="modal-overlay" onClick={() => setShowEditBusModal(false)}>
          <div
            className="modal-content-card"
            style={{ maxWidth: '580px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3 className="modal-route-title">Edit Bus Details</h3>
                <p className="modal-route-sub">Update fleet scheduling, route, or pricing</p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowEditBusModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleEditBusSubmit} className="auth-form">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Bus Number</label>
                    <input
                      type="text"
                      className="auth-input"
                      style={{ paddingLeft: '14px' }}
                      value={editBusNumber}
                      onChange={(e) => setEditBusNumber(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Operator Name</label>
                    <input
                      type="text"
                      className="auth-input"
                      style={{ paddingLeft: '14px' }}
                      value={editOperatorName}
                      onChange={(e) => setEditOperatorName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">From (Origin)</label>
                    <select
                      className="auth-input"
                      style={{ paddingLeft: '14px' }}
                      value={editFrom}
                      onChange={(e) => setEditFrom(e.target.value)}
                    >
                      {CITIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">To (Destination)</label>
                    <select
                      className="auth-input"
                      style={{ paddingLeft: '14px' }}
                      value={editTo}
                      onChange={(e) => setEditTo(e.target.value)}
                    >
                      {CITIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Departure Time</label>
                    <input
                      type="time"
                      className="auth-input"
                      style={{ paddingLeft: '14px' }}
                      value={editDeparture}
                      onChange={(e) => setEditDeparture(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Arrival Time</label>
                    <input
                      type="time"
                      className="auth-input"
                      style={{ paddingLeft: '14px' }}
                      value={editArrival}
                      onChange={(e) => setEditArrival(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Bus Type</label>
                    <select
                      className="auth-input"
                      style={{ paddingLeft: '14px' }}
                      value={editBusType}
                      onChange={(e) => setEditBusType(e.target.value as 'AC' | 'NON_AC')}
                    >
                      <option value="AC">AC</option>
                      <option value="NON_AC">Non-AC</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Fare (LKR)</label>
                    <input
                      type="number"
                      className="auth-input"
                      style={{ paddingLeft: '14px' }}
                      value={editFare}
                      onChange={(e) => setEditFare(e.target.value)}
                      min="10"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Total Seats</label>
                    <input
                      type="number"
                      className="auth-input"
                      style={{ paddingLeft: '14px' }}
                      value={editSeats}
                      onChange={(e) => setEditSeats(e.target.value)}
                      min="10"
                      max="60"
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                  <input
                    type="checkbox"
                    id="editIsActive"
                    checked={editIsActive}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#059669', cursor: 'pointer' }}
                  />
                  <label htmlFor="editIsActive" style={{ fontSize: '13.5px', color: '#334155', cursor: 'pointer' }}>
                    Active in Service (Operating on scheduled route)
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                  <button
                    type="button"
                    className="nav-link-btn"
                    style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '10px' }}
                    onClick={() => setShowEditBusModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="auth-submit-btn"
                    style={{ flex: 2, marginTop: 0 }}
                    disabled={isUpdatingBus}
                  >
                    {isUpdatingBus ? 'Saving...' : 'Update Bus Details'}
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

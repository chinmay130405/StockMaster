import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api, { getCurrentUser, removeToken } from '../api';

function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockProducts: 0,
    pendingReceipts: 0,
    pendingDeliveries: 0,
    pendingTransfers: 0
  });

  useEffect(() => {
    // Check if we should show Operations tab based on navigation state
    if (location.state?.tab === 'Operations') {
      setActiveTab('Operations');
    }
  }, [location]);

  useEffect(() => {
    fetchUserData();
    fetchDashboardStats();
  }, []);

  // Refresh stats when tab becomes active or location changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchDashboardStats();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also refresh when navigating back to dashboard
    fetchDashboardStats();
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [location, activeTab]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await getCurrentUser();
      setUser(response.user);
    } catch (err) {
      setError('Failed to load user data');
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      console.log('Fetching dashboard stats...');
      
      // Fetch products
      const productsRes = await api.get('/data/products');
      console.log('Products response:', productsRes.data);
      const products = productsRes.data.success ? productsRes.data.data : productsRes.data;
      console.log('Products count:', products.length);
      
      // Count low stock products (free_to_use < 10)
      const lowStock = products.filter(p => (p.free_to_use || 0) < 10).length;
      
      // Fetch receipts and deliveries
      const receiptsRes = await api.get('/data/receipts');
      const deliveriesRes = await api.get('/data/deliveries');
      
      console.log('Receipts response:', receiptsRes.data);
      console.log('Deliveries response:', deliveriesRes.data);
      
      const receipts = receiptsRes.data.success ? receiptsRes.data.data : receiptsRes.data;
      const deliveries = deliveriesRes.data.success ? deliveriesRes.data.data : deliveriesRes.data;
      
      // Fetch internal transfers
      let pendingTransfers = 0;
      try {
        const transfersRes = await api.get('/data/internal-transfers');
        const transfers = transfersRes.data.success ? transfersRes.data.data : transfersRes.data;
        pendingTransfers = transfers.filter(t => t.status === 'draft' || t.status === 'waiting').length;
      } catch (err) {
        console.log('Internal transfers not available yet');
      }
      
      // Count pending receipts (draft or ready status)
      const pendingReceipts = receipts.filter(
        r => r.status === 'draft' || r.status === 'ready'
      ).length;
      
      // Count pending deliveries (draft, waiting, or ready status)
      const pendingDeliveries = deliveries.filter(
        d => d.status === 'draft' || d.status === 'waiting' || d.status === 'ready'
      ).length;
      
      const newStats = {
        totalProducts: products.length,
        lowStockProducts: lowStock,
        pendingReceipts,
        pendingDeliveries,
        pendingTransfers
      };
      
      console.log('Dashboard stats:', newStats);
      setStats(newStats);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
      console.error('Error response:', err.response);
    }
  };

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  const getInitials = (loginId) => {
    if (!loginId) return '?';
    return loginId.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <div className="inventory-container">
        <div className="loading-state">
          <div className="spinner-large"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="inventory-container">
        <div className="error-state">
          <div className="alert alert-error">{error || 'Failed to load user data'}</div>
          <button onClick={handleLogout} className="btn-primary">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  const tabs = ['Dashboard', 'Operations', 'Products', 'Move History', 'Settings'];

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    switch(tab) {
      case 'Dashboard':
        // Stay on dashboard page
        break;
      case 'Operations':
        // Stay on dashboard but show operations
        break;
      case 'Products':
        navigate('/stock');
        break;
      case 'Move History':
        navigate('/move-history');
        break;
      case 'Settings':
        navigate('/settings');
        break;
      default:
        break;
    }
  };

  return (
    <div className="inventory-layout">
      {/* Top Navigation Bar */}
      <nav className="top-nav">
        <div className="nav-left">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`nav-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => handleTabClick(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="nav-right">
          <div className="user-menu" ref={dropdownRef}>
            <button 
              className="user-avatar" 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              title={user.loginId}
            >
              {getInitials(user.loginId)}
            </button>
            {dropdownOpen && (
              <div className="dropdown-menu">
                <div className="dropdown-header">
                  <div className="dropdown-user-info">
                    <div className="dropdown-name">{user.loginId}</div>
                    <div className="dropdown-email">{user.email}</div>
                  </div>
                </div>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item" onClick={() => {
                  setDropdownOpen(false);
                  setActiveTab('Settings');
                }}>
                  Account Settings
                </button>
                <button className="dropdown-item" onClick={() => {
                  setDropdownOpen(false);
                  // Add profile action here
                }}>
                  My Profile
                </button>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item logout-item" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="main-content">
        <div className="content-header">
          <h1 className="page-title">{activeTab}</h1>
        </div>

        {/* Database Tab - Navigate to Data Viewer */}
        {activeTab === 'Database' && (
          <div className="info-section">
            <div className="info-card">
              <h3 className="info-title">PostgreSQL Database</h3>
              <p style={{ marginBottom: '20px', color: '#666' }}>
                View and explore all tables in your PostgreSQL database.
              </p>
              <button 
                className="btn-primary"
                onClick={() => navigate('/data')}
                style={{ padding: '12px 24px', fontSize: '16px' }}
              >
                Open Database Viewer
              </button>
            </div>
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'Dashboard' && (
          <>
            {/* Dashboard Cards Grid */}
            <div className="dashboard-grid">
              {/* Receipt Card */}
              <div className="operation-card">
                <div className="card-header">
                  <h2 className="card-title">Receipt</h2>
                  <div className="card-stats">
                    <span className="stat-item">1 Late</span>
                    <span className="stat-item">6 operations</span>
                  </div>
                </div>
                <div className="card-body">
                  <button 
                    className="action-btn"
                    onClick={() => navigate('/receipt')}
                  >
                    <span className="btn-text">4 to receive</span>
                  </button>
                </div>
              </div>

              {/* Delivery Card */}
              <div className="operation-card">
                <div className="card-header">
                  <h2 className="card-title">Delivery</h2>
                  <div className="card-stats">
                    <span className="stat-item">1 Late</span>
                    <span className="stat-item">2 waiting</span>
                    <span className="stat-item">6 operations</span>
                  </div>
                </div>
                <div className="card-body">
                  <button 
                    className="action-btn"
                    onClick={() => navigate('/delivery')}
                  >
                    <span className="btn-text">4 to Deliver</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Additional Info Section */}
            <div className="info-section">
              <div className="info-card">
                <h3 className="info-title">Quick Stats</h3>
                <div className="stats-grid">
                  <div className="stat-box">
                    <div className="stat-value">{stats.totalProducts}</div>
                    <div className="stat-label">Products in Stock</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-value">{stats.lowStockProducts}</div>
                    <div className="stat-label">Low Stock Items</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-value">{stats.pendingReceipts}</div>
                    <div className="stat-label">Pending Receipts</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-value">{stats.pendingDeliveries}</div>
                    <div className="stat-label">Pending Deliveries</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-value">{stats.pendingTransfers}</div>
                    <div className="stat-label">Internal Transfers Scheduled</div>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="info-card" style={{ marginTop: '20px' }}>
                <h3 className="info-title">Quick Links</h3>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
                  <button className="btn-secondary" onClick={() => navigate('/warehouse')}>
                    Warehouses
                  </button>
                  <button className="btn-secondary" onClick={() => navigate('/location')}>
                    Locations
                  </button>
                  <button className="btn-secondary" onClick={() => navigate('/stock')}>
                    Stock Inventory
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Products Tab */}
        {activeTab === 'Products' && (
          <div className="info-section">
            <div className="info-card">
              <h3 className="info-title">Product Management</h3>
              <p style={{ marginBottom: '20px', color: '#666' }}>
                Manage your product catalog, warehouses, and locations.
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button className="btn-primary" onClick={() => navigate('/stock')}>
                  Stock Inventory
                </button>
                <button className="btn-primary" onClick={() => navigate('/warehouse')}>
                  Warehouses
                </button>
                <button className="btn-primary" onClick={() => navigate('/location')}>
                  Locations
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Operations Tab */}
        {activeTab === 'Operations' && (
          <div className="info-section">
            <div className="info-card">
              <h3 className="info-title">Warehouse Operations</h3>
              <p style={{ marginBottom: '20px', color: '#666' }}>
                Manage your warehouse operations including receipts, deliveries, transfers, and adjustments.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <button className="btn-primary" onClick={() => navigate('/receipt')}>
                  Receipts
                </button>
                <button className="btn-primary" onClick={() => navigate('/delivery')}>
                  Deliveries
                </button>
                <button className="btn-primary" onClick={() => navigate('/internal-transfer')}>
                  Internal Transfers
                </button>
                <button className="btn-primary" onClick={() => navigate('/inventory-adjustment')}>
                  Inventory Adjustment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Other tabs - placeholder */}
        {activeTab !== 'Dashboard' && activeTab !== 'Database' && activeTab !== 'Products' && activeTab !== 'Operations' && (
          <div className="info-section">
            <div className="info-card">
              <h3 className="info-title">{activeTab}</h3>
              <p style={{ color: '#666' }}>This section is under development.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;

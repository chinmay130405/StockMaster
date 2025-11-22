import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, removeToken } from '../api';

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchUserData();
  }, []);

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

  const tabs = ['Dashboard', 'Operations', 'Products', 'Move History', 'Database', 'Settings'];

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    switch(tab) {
      case 'Dashboard':
        navigate('/dashboard');
        break;
      case 'Products':
        navigate('/stock');
        break;
      case 'Database':
        navigate('/data');
        break;
      // Operations and other tabs stay on dashboard
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
                  <span className="dropdown-icon">⚙️</span>
                  Account Settings
                </button>
                <button className="dropdown-item" onClick={() => {
                  setDropdownOpen(false);
                  // Add profile action here
                }}>
                  <span className="dropdown-icon">👤</span>
                  My Profile
                </button>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item logout-item" onClick={handleLogout}>
                  <span className="dropdown-icon">🚪</span>
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
                    <span className="btn-icon">→</span>
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
                    <span className="btn-icon">→</span>
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
                    <div className="stat-value">0</div>
                    <div className="stat-label">Products in Stock</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-value">0</div>
                    <div className="stat-label">Low Stock Items</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-value">4</div>
                    <div className="stat-label">Pending Receipts</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-value">4</div>
                    <div className="stat-label">Pending Deliveries</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Other tabs - placeholder */}
        {activeTab !== 'Dashboard' && activeTab !== 'Database' && (
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

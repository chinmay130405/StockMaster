import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { getCurrentUser, removeToken } from '../api';

function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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

  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/dashboard/operations') return 'Operations';
    if (path === '/dashboard/stock') return 'Stock';
    if (path === '/dashboard/move-history') return 'Move History';
    if (path === '/dashboard/settings') return 'Settings';
    return 'Dashboard';
  };

  const navigateToTab = (tab) => {
    switch (tab) {
      case 'Dashboard':
        navigate('/dashboard');
        break;
      case 'Operations':
        navigate('/dashboard/operations');
        break;
      case 'Stock':
        navigate('/dashboard/stock');
        break;
      case 'Move History':
        navigate('/dashboard/move-history');
        break;
      case 'Settings':
        navigate('/dashboard/settings');
        break;
      default:
        navigate('/dashboard');
    }
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

  const tabs = ['Dashboard', 'Operations', 'Stock', 'Move History', 'Settings'];
  const activeTab = getActiveTab();

  return (
    <div className="inventory-layout">
      {/* Top Navigation Bar */}
      <nav className="top-nav">
        <div className="nav-left">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`nav-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => navigateToTab(tab)}
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
                  navigateToTab('Settings');
                }}>
                  <span className="dropdown-icon">⚙️</span>
                  Account Settings
                </button>
                <button className="dropdown-item" onClick={() => {
                  setDropdownOpen(false);
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

      {/* Main Content Area - renders the active page */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default DashboardLayout;

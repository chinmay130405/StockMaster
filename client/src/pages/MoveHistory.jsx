import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getCurrentUser, removeToken } from '../api';

function MoveHistory() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Move History');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [moveHistory, setMoveHistory] = useState([]);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchUserData();
    fetchMoveHistory();
  }, []);

  // Refresh move history when tab becomes active
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchMoveHistory();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
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
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMoveHistory = async () => {
    try {
      const response = await api.get('/data/stock-ledger');
      setMoveHistory(response.data.success ? response.data.data : response.data);
    } catch (err) {
      console.error('Error fetching move history:', err);
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

  const tabs = ['Dashboard', 'Operations', 'Products', 'Move History', 'Settings'];

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    switch(tab) {
      case 'Dashboard':
        navigate('/dashboard');
        break;
      case 'Operations':
        navigate('/dashboard', { state: { tab: 'Operations' } });
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

  const getEventTypeBadge = (eventType) => {
    const badges = {
      receipt: 'badge-ready',
      delivery: 'badge-done',
      transfer: 'badge-draft',
      adjustment: 'badge-danger'
    };
    return badges[eventType] || 'badge-draft';
  };

  const filteredHistory = filterType === 'all' 
    ? moveHistory 
    : moveHistory.filter(m => m.event_type === filterType);

  if (loading) {
    return (
      <div className="inventory-container">
        <div className="loading-state">
          <div className="spinner-large"></div>
          <p>Loading move history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="inventory-layout">
      {/* Top Navigation Bar */}
      <nav className="top-nav">
        <div className="nav-tabs">
          {tabs.map(tab => (
            <button
              key={tab}
              className={`nav-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => handleTabClick(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="user-menu" ref={dropdownRef}>
          <button 
            className="user-avatar"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            title={user?.loginId}
          >
            {getInitials(user?.loginId)}
          </button>
          
          {dropdownOpen && (
            <div className="dropdown-menu">
              <div className="dropdown-header">
                <div className="dropdown-user-name">{user?.loginId}</div>
                <div className="dropdown-user-email">{user?.email}</div>
              </div>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item" onClick={() => navigate('/settings')}>
                Settings
              </button>
              <button className="dropdown-item" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="main-content">
        <div className="content-header">
          <h1 className="page-title">Stock Move History</h1>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <label style={{ fontWeight: 'bold' }}>Filter:</label>
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              <option value="all">All Moves</option>
              <option value="receipt">Receipts</option>
              <option value="delivery">Deliveries</option>
              <option value="transfer">Transfers</option>
              <option value="adjustment">Adjustments</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Product SKU</th>
                <th>Product Name</th>
                <th>Quantity</th>
                <th>From Location</th>
                <th>To Location</th>
                <th>Source</th>
                <th>Created By</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    No move history found
                  </td>
                </tr>
              ) : (
                filteredHistory.map((move) => (
                  <tr key={move.id}>
                    <td>{new Date(move.created_at).toLocaleString()}</td>
                    <td>
                      <span className={`badge ${getEventTypeBadge(move.event_type)}`}>
                        {move.event_type}
                      </span>
                    </td>
                    <td>{move.product_sku || '-'}</td>
                    <td>{move.product_name || '-'}</td>
                    <td style={{ 
                      textAlign: 'right', 
                      fontWeight: 'bold',
                      color: move.qty_delta >= 0 ? '#28a745' : '#dc3545'
                    }}>
                      {move.qty_delta > 0 ? '+' : ''}{move.qty_delta} {move.uom}
                    </td>
                    <td>{move.from_location_code || '-'}</td>
                    <td>{move.to_location_code || '-'}</td>
                    <td>{move.source_type || '-'}</td>
                    <td>{move.created_by_username || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredHistory.length > 0 && (
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <strong>Total Moves:</strong> {filteredHistory.length}
          </div>
        )}
      </main>
    </div>
  );
}

export default MoveHistory;

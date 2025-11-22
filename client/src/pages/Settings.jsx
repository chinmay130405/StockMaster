import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getCurrentUser, removeToken } from '../api';

function Settings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Settings');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [settings, setSettings] = useState([]);
  const [editingKey, setEditingKey] = useState(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    fetchUserData();
    fetchSettings();
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

  const fetchSettings = async () => {
    try {
      const response = await api.get('/data/settings');
      setSettings(response.data.success ? response.data.data : response.data);
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const handleEdit = (setting) => {
    setEditingKey(setting.key);
    setEditValue(setting.value);
  };

  const handleSave = async (id, key) => {
    try {
      await api.put(`/data/settings/${id}`, { key, value: editValue });
      await fetchSettings();
      setEditingKey(null);
      setEditValue('');
    } catch (err) {
      console.error('Error updating setting:', err);
      alert('Failed to update setting');
    }
  };

  const handleCancel = () => {
    setEditingKey(null);
    setEditValue('');
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
        break;
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <div className="inventory-container">
        <div className="loading-state">
          <div className="spinner-large"></div>
          <p>Loading settings...</p>
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
          <h1 className="page-title">System Settings</h1>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
          <div style={{ display: 'grid', gap: '20px', maxWidth: '900px', width: '100%' }}>
            {/* User Profile Section */}
            <div className="info-card">
              <h3 className="info-title">User Profile</h3>
              <div style={{ display: 'grid', gap: '15px', marginTop: '20px' }}>
                <div>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px', color: '#333' }}>Username</label>
                  <input 
                    type="text" 
                    value={user?.loginId || ''} 
                    disabled 
                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', backgroundColor: '#f8f9fa', color: '#666' }}
                  />
                </div>
                <div>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px', color: '#333' }}>Email</label>
                  <input 
                    type="email" 
                    value={user?.email || ''} 
                    disabled 
                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', backgroundColor: '#f8f9fa', color: '#666' }}
                  />
                </div>
              </div>
            </div>

            {/* Application Settings */}
            <div className="info-card">
              <h3 className="info-title">Application Settings</h3>
              <div className="table-container" style={{ marginTop: '20px' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Setting</th>
                      <th>Value</th>
                      <th>Last Updated</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settings.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                          No settings configured
                        </td>
                      </tr>
                    ) : (
                      settings.map((setting) => (
                        <tr key={setting.id}>
                          <td style={{ fontWeight: 'bold' }}>{setting.key}</td>
                          <td>
                            {editingKey === setting.key ? (
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                                autoFocus
                              />
                            ) : (
                              setting.value
                            )}
                          </td>
                          <td>{new Date(setting.updated_at).toLocaleString()}</td>
                          <td>
                            {editingKey === setting.key ? (
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  onClick={() => handleSave(setting.id, setting.key)}
                                  className="btn-primary"
                                  style={{ padding: '6px 12px', fontSize: '14px' }}
                                >
                                  Save
                                </button>
                                <button
                                  onClick={handleCancel}
                                  className="btn-secondary"
                                  style={{ padding: '6px 12px', fontSize: '14px' }}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleEdit(setting)}
                                className="btn-secondary"
                                style={{ padding: '6px 12px', fontSize: '14px' }}
                              >
                                Edit
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* System Information */}
            <div className="info-card">
              <h3 className="info-title">System Information</h3>
              <div style={{ display: 'grid', gap: '10px', marginTop: '20px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                  <span style={{ fontWeight: 'bold' }}>Application:</span>
                  <span>StockMaster v1.0.0</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                  <span style={{ fontWeight: 'bold' }}>Database:</span>
                  <span>PostgreSQL</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                  <span style={{ fontWeight: 'bold' }}>Environment:</span>
                  <span>Development</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Settings;

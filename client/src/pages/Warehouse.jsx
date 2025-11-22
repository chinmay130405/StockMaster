import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getCurrentUser, removeToken } from '../api';

function Warehouse() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Products');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [warehouses, setWarehouses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    contact: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUserData();
    fetchWarehouses();
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

  const fetchWarehouses = async () => {
    try {
      const response = await api.get('/data/warehouses');
      if (response.data.success) {
        setWarehouses(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching warehouses:', err);
      setError('Failed to load warehouses');
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

  const handleNewWarehouse = () => {
    setFormData({ name: '', code: '', address: '', contact: '' });
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (warehouse) => {
    setFormData({
      name: warehouse.name,
      code: warehouse.code,
      address: warehouse.address || '',
      contact: warehouse.contact || ''
    });
    setEditingId(warehouse.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        // Update existing warehouse
        const response = await api.put(`/data/warehouses/${editingId}`, formData);
        if (response.data.success) {
          await fetchWarehouses();
        }
      } else {
        // Create new warehouse
        const response = await api.post('/data/warehouses', formData);
        if (response.data.success) {
          await fetchWarehouses();
        }
      }
      setShowForm(false);
      setFormData({ name: '', code: '', address: '', contact: '' });
      setEditingId(null);
    } catch (err) {
      console.error('Error saving warehouse:', err);
      setError('Failed to save warehouse');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setFormData({ name: '', code: '', address: '', contact: '' });
    setEditingId(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this warehouse?')) {
      try {
        const response = await api.delete(`/data/warehouses/${id}`);
        if (response.data.success) {
          await fetchWarehouses();
        }
      } catch (err) {
        console.error('Error deleting warehouse:', err);
        setError('Failed to delete warehouse');
      }
    }
  };

  if (loading) {
    return (
      <div className="inventory-container">
        <div className="loading-state">
          <div className="spinner-large"></div>
          <p>Loading warehouses...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="inventory-container">
        <div className="error-state">
          <div className="alert alert-error">Failed to load user data</div>
          <button onClick={handleLogout} className="btn-primary">Back to Login</button>
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
                <button className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                  Account Settings
                </button>
                <button className="dropdown-item" onClick={() => setDropdownOpen(false)}>
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
          <h1 className="page-title">Warehouses</h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-primary" onClick={() => navigate('/stock')}>
              View Stock
            </button>
            <button className="btn-primary" onClick={() => navigate('/location')}>
              View Locations
            </button>
            <button className="btn-primary" onClick={handleNewWarehouse}>
              + New Warehouse
            </button>
          </div>
        </div>

        {/* Warehouse Form */}
        {showForm && (
          <div className="info-section">
            <div className="info-card">
              <h3 className="info-title">{editingId ? 'Edit Warehouse' : 'New Warehouse'}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter warehouse name"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Short Code *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., WH, WH2"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Address *</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Enter warehouse address"
                    rows="3"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Contact</label>
                  <input
                    type="text"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    placeholder="Phone number"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button 
                  onClick={handleSave}
                  disabled={!formData.name || !formData.code || !formData.address}
                  style={{ padding: '8px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: formData.name && formData.code && formData.address ? 'pointer' : 'not-allowed' }}
                >
                  Save
                </button>
                <button 
                  onClick={handleCancel}
                  style={{ padding: '8px 16px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Warehouses List */}
        <div className="info-section">
          <div className="info-card">
            <div style={{ display: 'grid', gap: '20px' }}>
              {warehouses.map((warehouse) => (
                <div 
                  key={warehouse.id}
                  style={{ 
                    padding: '20px', 
                    border: '1px solid #ddd', 
                    borderRadius: '8px',
                    backgroundColor: '#f8f9fa'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                        <h3 style={{ margin: 0, fontSize: '20px' }}>{warehouse.name}</h3>
                        <span 
                          style={{ 
                            padding: '4px 12px', 
                            backgroundColor: '#007bff', 
                            color: 'white', 
                            borderRadius: '4px',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                          }}
                          onClick={() => navigate('/location', { state: { warehouseCode: warehouse.code } })}
                          title="Click to view locations"
                        >
                          {warehouse.code}
                        </span>
                      </div>
                      <div style={{ color: '#666', marginBottom: '8px' }}>
                        <strong>Address:</strong> {warehouse.address}
                      </div>
                      {warehouse.contact && (
                        <div style={{ color: '#666' }}>
                          <strong>Contact:</strong> {warehouse.contact}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        onClick={() => handleEdit(warehouse)}
                        style={{ padding: '6px 12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(warehouse.id)}
                        style={{ padding: '6px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Warehouse;

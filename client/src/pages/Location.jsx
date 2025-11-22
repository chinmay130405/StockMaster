import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api, { getCurrentUser, removeToken } from '../api';

function Location() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Products');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [locations, setLocations] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    warehouse_id: ''
  });
  const [filterWarehouse, setFilterWarehouse] = useState(location.state?.warehouseCode || 'ALL');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUserData();
    fetchWarehouses();
    fetchLocations();
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

  const fetchLocations = async () => {
    try {
      const response = await api.get('/data/locations');
      if (response.data.success) {
        setLocations(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching locations:', err);
      setError('Failed to load locations');
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

  const handleNewLocation = () => {
    const warehouseId = filterWarehouse !== 'ALL' ? warehouses.find(w => w.code === filterWarehouse)?.id : '';
    setFormData({ name: '', code: '', warehouse_id: warehouseId });
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (loc) => {
    setFormData({
      name: loc.name,
      code: loc.code,
      warehouse_id: loc.warehouse_id
    });
    setEditingId(loc.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        const response = await api.put(`/data/locations/${editingId}`, formData);
        if (response.data.success) {
          await fetchLocations();
        }
      } else {
        const response = await api.post('/data/locations', formData);
        if (response.data.success) {
          await fetchLocations();
        }
      }
      setShowForm(false);
      setFormData({ name: '', code: '', warehouse_id: '' });
      setEditingId(null);
    } catch (err) {
      console.error('Error saving location:', err);
      setError('Failed to save location');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setFormData({ name: '', code: '', warehouse_id: '' });
    setEditingId(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this location?')) {
      try {
        const response = await api.delete(`/data/locations/${id}`);
        if (response.data.success) {
          await fetchLocations();
        }
      } catch (err) {
        console.error('Error deleting location:', err);
        setError('Failed to delete location');
      }
    }
  };

  const filteredLocations = filterWarehouse === 'ALL' 
    ? locations 
    : locations.filter(l => l.warehouse_code === filterWarehouse);

  if (loading) {
    return (
      <div className="inventory-container">
        <div className="loading-state">
          <div className="spinner-large"></div>
          <p>Loading locations...</p>
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
                  <span className="dropdown-icon">⚙</span>
                  Account Settings
                </button>
                <button className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                  <span className="dropdown-icon">👤</span>
                  My Profile
                </button>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item logout-item" onClick={handleLogout}>
                  <span className="dropdown-icon">→</span>
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
          <h1 className="page-title">Locations</h1>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select
              value={filterWarehouse}
              onChange={(e) => setFilterWarehouse(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
            >
              <option value="ALL">All Warehouses</option>
              {warehouses.map(w => (
                <option key={w.code} value={w.code}>{w.code} - {w.name}</option>
              ))}
            </select>
            <button className="btn-primary" onClick={() => navigate('/stock')}>
              View Stock
            </button>
            <button className="btn-primary" onClick={() => navigate('/warehouse')}>
              View Warehouses
            </button>
            <button className="btn-primary" onClick={handleNewLocation}>
              + New Location
            </button>
          </div>
        </div>

        {/* Location Form */}
        {showForm && (
          <div className="info-section">
            <div className="info-card">
              <h3 className="info-title">{editingId ? 'Edit Location' : 'New Location'}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Shelf A1, Room B, Section C"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Short Code *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., SA1, RB, SC"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Warehouse *</label>
                  <select
                    value={formData.warehouse_id}
                    onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
                  >
                    <option value="">Select Warehouse</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.code} - {w.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button 
                  onClick={handleSave}
                  disabled={!formData.name || !formData.code || !formData.warehouse_id}
                  style={{ padding: '8px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: formData.name && formData.code && formData.warehouse_id ? 'pointer' : 'not-allowed' }}
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

        {/* Locations Table */}
        <div className="info-section">
          <div className="info-card">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: 'bold' }}>Name</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: 'bold' }}>Short Code</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: 'bold' }}>Warehouse</th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd', fontWeight: 'bold' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLocations.length > 0 ? (
                    filteredLocations.map((loc) => (
                      <tr key={loc.id} style={{ borderBottom: '1px solid #ddd' }}>
                        <td style={{ padding: '12px' }}>{loc.name}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ padding: '4px 8px', backgroundColor: '#007bff', color: 'white', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                            {loc.code}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ padding: '4px 8px', backgroundColor: '#28a745', color: 'white', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                            {loc.warehouse_code}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                            <button 
                              onClick={() => handleEdit(loc)}
                              style={{ padding: '4px 12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDelete(loc.id)}
                              style={{ padding: '4px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                        No locations found{filterWarehouse !== 'ALL' && ` for warehouse ${filterWarehouse}`}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Location;

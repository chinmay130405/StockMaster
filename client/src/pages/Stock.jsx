import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getCurrentUser, removeToken } from '../api';

function Stock() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Products');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [stockData, setStockData] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUserData();
    fetchStockData();
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

  const fetchStockData = async () => {
    try {
      console.log('Fetching stock data from /data/products...');
      const response = await api.get('/data/products');
      console.log('Products API response:', response.data);
      console.log('Response status:', response.status);
      
      // Handle both response formats
      const productsArray = response.data.success ? response.data.data : response.data;
      console.log('Products array:', productsArray);
      
      if (!Array.isArray(productsArray)) {
        console.error('Products data is not an array:', productsArray);
        setError('Invalid data format received');
        return;
      }
      
      const products = productsArray.map(item => ({
        id: item.id,
        product: item.name,
        sku: item.sku,
        perUnitCost: parseFloat(item.cost_price) || 0,
        onHand: parseFloat(item.on_hand) || 0,
        freeToUse: parseFloat(item.free_to_use) || 0,
      }));
      console.log('Mapped products:', products);
      setStockData(products);
    } catch (err) {
      console.error('Error fetching stock data:', err);
      console.error('Error response:', err.response);
      setError(err.response?.data?.error || 'Failed to load stock data');
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

  const handleEdit = (id, field, currentValue) => {
    setEditingId(id);
    setEditingField(field);
    setEditValue(currentValue);
  };

  const handleSave = (id) => {
    setStockData(stockData.map(item => {
      if (item.id === id) {
        return { ...item, [editingField]: editingField === 'product' || editingField === 'sku' ? editValue : parseFloat(editValue) || 0 };
      }
      return item;
    }));
    setEditingId(null);
    setEditingField(null);
    setEditValue('');
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingField(null);
    setEditValue('');
  };

  if (loading) {
    return (
      <div className="inventory-container">
        <div className="loading-state">
          <div className="spinner-large"></div>
          <p>Loading stock...</p>
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
                <span>⚙</span> Settings
              </button>
              <button className="dropdown-item" onClick={handleLogout}>
                <span>→</span> Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="main-content">
        <div className="content-header">
          <h1 className="page-title">Stock Inventory</h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-primary" onClick={() => navigate('/warehouse')}>
              View Warehouses
            </button>
            <button className="btn-primary" onClick={() => navigate('/location')}>
              View Locations
            </button>
          </div>
        </div>

        {/* Stock Table */}
        <div className="info-section">
          <div className="info-card">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: 'bold' }}>Product</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: 'bold' }}>SKU</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #ddd', fontWeight: 'bold' }}>Per Unit Cost (Rs)</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #ddd', fontWeight: 'bold' }}>On Hand</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #ddd', fontWeight: 'bold' }}>Free to Use</th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd', fontWeight: 'bold' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stockData.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #ddd' }}>
                      <td style={{ padding: '12px' }}>
                        {editingId === item.id && editingField === 'product' ? (
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            style={{ width: '100%', padding: '4px 8px' }}
                            autoFocus
                          />
                        ) : (
                          <span 
                            onDoubleClick={() => handleEdit(item.id, 'product', item.product)}
                            style={{ cursor: 'pointer' }}
                            title="Double click to edit"
                          >
                            {item.product}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px', color: '#666' }}>{item.sku}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        {editingId === item.id && editingField === 'perUnitCost' ? (
                          <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            style={{ width: '100%', padding: '4px 8px', textAlign: 'right' }}
                            autoFocus
                          />
                        ) : (
                          <span 
                            onDoubleClick={() => handleEdit(item.id, 'perUnitCost', item.perUnitCost)}
                            style={{ cursor: 'pointer' }}
                            title="Double click to edit"
                          >
                            ₹{item.perUnitCost.toLocaleString()}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>
                        {editingId === item.id && editingField === 'onHand' ? (
                          <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            style={{ width: '100%', padding: '4px 8px', textAlign: 'right' }}
                            autoFocus
                          />
                        ) : (
                          <span 
                            onDoubleClick={() => handleEdit(item.id, 'onHand', item.onHand)}
                            style={{ cursor: 'pointer' }}
                            title="Double click to edit"
                          >
                            {item.onHand}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', color: item.freeToUse < 10 ? '#dc3545' : '#28a745' }}>
                        {item.freeToUse}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {editingId === item.id ? (
                          <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                            <button 
                              onClick={() => handleSave(item.id)}
                              style={{ padding: '4px 12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              Save
                            </button>
                            <button 
                              onClick={handleCancel}
                              style={{ padding: '4px 12px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleEdit(item.id, 'onHand', item.onHand)}
                            style={{ padding: '4px 12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            Update Stock
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Stock;

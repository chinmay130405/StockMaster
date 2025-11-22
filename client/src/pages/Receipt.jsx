import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { getCurrentUser, removeToken } from '../api';

function Receipt() {
  const navigate = useNavigate();
  const { docNo } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Operations');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  
  const [receiptData, setReceiptData] = useState({
    documentNo: docNo || 'WH/IN/0001',
    receiveFrom: '',
    responsible: '',
    scheduleDate: new Date().toISOString().split('T')[0],
    status: 'draft',
    products: []
  });

  useEffect(() => {
    fetchUserData();
    fetchProducts();
    fetchSuppliers();
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
      setReceiptData(prev => ({ ...prev, responsible: response.user.loginId }));
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get('/data/products');
      setAvailableProducts(response.data.map(p => ({
        id: p.id,
        sku: p.sku,
        name: p.name
      })));
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await api.get('/data/suppliers');
      setSuppliers(response.data);
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
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

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'draft': return '#6c757d';
      case 'ready': return '#ffc107';
      case 'done': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getStatusDisplay = (status) => {
    if (!status) return 'Draft';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const handleStatusChange = (newStatus) => {
    setReceiptData(prev => ({ ...prev, status: newStatus.toLowerCase() }));
  };

  const handleValidate = () => {
    if (receiptData.status === 'draft') {
      handleStatusChange('ready');
    } else if (receiptData.status === 'ready') {
      handleStatusChange('done');
    }
  };

  const handleNew = () => {
    const newDocNo = `WH/IN/${String(parseInt(receiptData.documentNo.split('/')[2]) + 1).padStart(4, '0')}`;
    setReceiptData({
      documentNo: newDocNo,
      receiveFrom: '',
      responsible: user.loginId,
      scheduleDate: new Date().toISOString().split('T')[0],
      status: 'draft',
      products: []
    });
  };

  const handleAddProduct = () => {
    setReceiptData(prev => ({
      ...prev,
      products: [...prev.products, { id: Date.now(), product_id: '', sku: '', product: '', quantity: 0 }]
    }));
  };

  const handleProductChange = (id, field, value) => {
    setReceiptData(prev => ({
      ...prev,
      products: prev.products.map(p => {
        if (p.id === id) {
          if (field === 'product_id') {
            const product = availableProducts.find(ap => ap.id === value);
            return { ...p, product_id: value, sku: product?.sku || '', product: product?.name || '' };
          }
          return { ...p, [field]: value };
        }
        return p;
      })
    }));
  };

  const handleRemoveProduct = (id) => {
    setReceiptData(prev => ({
      ...prev,
      products: prev.products.filter(p => p.id !== id)
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel this receipt?')) {
      navigate('/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="inventory-container">
        <div className="loading-state">
          <div className="spinner-large"></div>
          <p>Loading receipt...</p>
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
        {/* Header with Action Buttons */}
        <div className="content-header" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <h1 className="page-title">Receipt: {receiptData.documentNo}</h1>
            <span 
              style={{ 
                padding: '6px 16px', 
                backgroundColor: getStatusColor(receiptData.status), 
                color: 'white', 
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              {getStatusDisplay(receiptData.status)}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className="btn-primary" 
              onClick={handleNew}
              disabled={receiptData.status !== 'done'}
              style={{ opacity: receiptData.status !== 'done' ? 0.6 : 1 }}
            >
              New
            </button>
            <button 
              className="btn-primary" 
              onClick={handleValidate}
              disabled={receiptData.status === 'done'}
              style={{ backgroundColor: '#28a745', opacity: receiptData.status === 'done' ? 0.6 : 1 }}
            >
              {receiptData.status === 'draft' ? 'Mark Ready' : 'Validate'}
            </button>
            <button className="btn-primary" onClick={handlePrint} style={{ backgroundColor: '#17a2b8' }}>
              Print
            </button>
            <button 
              className="btn-primary" 
              onClick={handleCancel}
              style={{ backgroundColor: '#dc3545' }}
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Receipt Form */}
        <div className="info-section">
          <div className="info-card">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Document No</label>
                <input
                  type="text"
                  value={receiptData.documentNo}
                  readOnly
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f8f9fa' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Schedule Date</label>
                <input
                  type="date"
                  value={receiptData.scheduleDate}
                  onChange={(e) => setReceiptData(prev => ({ ...prev, scheduleDate: e.target.value }))}
                  disabled={receiptData.status === 'done'}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Receive From</label>
                <select
                  value={receiptData.receiveFrom}
                  onChange={(e) => setReceiptData(prev => ({ ...prev, receiveFrom: e.target.value }))}
                  disabled={receiptData.status === 'done'}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Responsible</label>
                <input
                  type="text"
                  value={receiptData.responsible}
                  readOnly
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f8f9fa' }}
                />
              </div>
            </div>

            {/* Products Table */}
            <h3 style={{ marginBottom: '15px' }}>Products</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: 'bold', width: '40%' }}>Product</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #ddd', fontWeight: 'bold', width: '20%' }}>Quantity</th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd', fontWeight: 'bold', width: '15%' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {receiptData.products.map((product) => (
                    <tr key={product.id} style={{ borderBottom: '1px solid #ddd' }}>
                      <td style={{ padding: '12px' }}>
                        <select
                          value={product.product_id || ''}
                          onChange={(e) => handleProductChange(product.id, 'product_id', e.target.value)}
                          disabled={receiptData.status === 'done'}
                          style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                        >
                          <option value="">Select Product</option>
                          {availableProducts.map(p => (
                            <option key={p.id} value={p.id}>[{p.sku}] {p.name}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <input
                          type="number"
                          value={product.quantity}
                          onChange={(e) => handleProductChange(product.id, 'quantity', parseInt(e.target.value) || 0)}
                          disabled={receiptData.status === 'done'}
                          min="0"
                          style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', textAlign: 'right' }}
                        />
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleRemoveProduct(product.id)}
                          disabled={receiptData.status === 'done'}
                          style={{ padding: '6px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: receiptData.status === 'done' ? 'not-allowed' : 'pointer', opacity: receiptData.status === 'done' ? 0.6 : 1 }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  {receiptData.status !== 'done' && (
                    <tr>
                      <td colSpan="3" style={{ padding: '12px', textAlign: 'center' }}>
                        <button
                          onClick={handleAddProduct}
                          style={{ padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          + Add New Product
                        </button>
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

export default Receipt;

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getCurrentUser, removeToken } from '../api';

function InventoryAdjustment() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Operations');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  
  const [adjustmentData, setAdjustmentData] = useState({
    documentNo: 'WH/ADJ/0001',
    location: '',
    responsible: '',
    adjustmentDate: new Date().toISOString().split('T')[0],
    reason: '',
    status: 'draft',
    products: []
  });

  const reasonOptions = [
    'Physical Count',
    'Damaged Goods',
    'Expired Items',
    'Theft/Loss',
    'Quality Issue',
    'System Error',
    'Other'
  ];

  useEffect(() => {
    fetchUserData();
    fetchProducts();
    fetchLocations();
    fetchAdjustmentsAndGenerateDocNo();
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
      setAdjustmentData(prev => ({ ...prev, responsible: response.user.loginId }));
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
      const productsArray = response.data.success ? response.data.data : response.data;
      setAvailableProducts(productsArray.map(p => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        currentStock: p.free_to_use || 0
      })));
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await api.get('/data/locations');
      setLocations(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Failed to fetch locations:', err);
    }
  };

  const fetchAdjustmentsAndGenerateDocNo = async () => {
    try {
      const response = await api.get('/data/stock-adjustments');
      const adjustments = response.data.success ? response.data.data : response.data;
      
      let maxNum = 0;
      adjustments.forEach(adj => {
        const match = adj.adjustment_no?.match(/WH\/ADJ\/(\d+)/);
        if (match) {
          const num = parseInt(match[1]);
          if (num > maxNum) maxNum = num;
        }
      });
      
      const nextNum = String(maxNum + 1).padStart(4, '0');
      const newDocNo = `WH/ADJ/${nextNum}`;
      
      setAdjustmentData(prev => ({ ...prev, documentNo: newDocNo }));
    } catch (err) {
      console.error('Failed to fetch adjustments:', err);
    }
  };

  const handleSave = async () => {
    try {
      const loc = locations.find(l => l.code === adjustmentData.location);
      
      const payload = {
        adjustment_no: adjustmentData.documentNo,
        location_id: loc?.id,
        adjustment_date: adjustmentData.adjustmentDate,
        reason: adjustmentData.reason,
        status: adjustmentData.status,
        products: adjustmentData.products.filter(p => p.product_id && p.counted_qty !== null)
      };
      
      const response = await api.post('/data/stock-adjustments', payload);
      console.log('Adjustment saved:', response.data);
      alert('Stock adjustment saved successfully!');
      
      await fetchAdjustmentsAndGenerateDocNo();
      setAdjustmentData(prev => ({
        ...prev,
        location: '',
        adjustmentDate: new Date().toISOString().split('T')[0],
        reason: '',
        status: 'draft',
        products: []
      }));
      
      return true;
    } catch (err) {
      console.error('Error saving adjustment:', err);
      alert('Failed to save adjustment: ' + (err.response?.data?.error || err.message));
      return false;
    }
  };

  const handleValidate = () => {
    if (adjustmentData.products.length === 0) {
      alert('Please add at least one product to adjust');
      return;
    }
    if (!adjustmentData.location) {
      alert('Please select a location');
      return;
    }
    if (!adjustmentData.reason) {
      alert('Please select a reason for adjustment');
      return;
    }
    
    setAdjustmentData(prev => ({ ...prev, status: 'done' }));
    setTimeout(() => handleSave(), 100);
  };

  const handleAddProduct = () => {
    setAdjustmentData(prev => ({
      ...prev,
      products: [...prev.products, { 
        product_id: '', 
        product_name: '', 
        current_qty: 0,
        counted_qty: 0,
        difference: 0 
      }]
    }));
  };

  const handleProductChange = (index, field, value) => {
    const updatedProducts = [...adjustmentData.products];
    
    if (field === 'product_id') {
      const product = availableProducts.find(p => p.id === parseInt(value));
      updatedProducts[index].product_id = value;
      updatedProducts[index].product_name = product ? product.name : '';
      updatedProducts[index].sku = product ? product.sku : '';
      updatedProducts[index].current_qty = product ? product.currentStock : 0;
      updatedProducts[index].counted_qty = product ? product.currentStock : 0;
      updatedProducts[index].difference = 0;
    } else if (field === 'counted_qty') {
      updatedProducts[index].counted_qty = parseInt(value) || 0;
      updatedProducts[index].difference = updatedProducts[index].counted_qty - updatedProducts[index].current_qty;
    } else {
      updatedProducts[index][field] = value;
    }
    
    setAdjustmentData(prev => ({ ...prev, products: updatedProducts }));
  };

  const handleRemoveProduct = (index) => {
    setAdjustmentData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }));
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

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'draft': return '#6c757d';
      case 'waiting': return '#ffc107';
      case 'done': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getStatusDisplay = (status) => {
    if (!status) return 'Draft';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  if (loading) {
    return (
      <div className="inventory-container">
        <div className="loading-state">
          <div className="spinner-large"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="inventory-layout">
      {/* Top Navigation Bar */}
      <nav className="top-nav">
        <div className="nav-left">
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
        <div className="nav-right">
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
                  <div className="dropdown-user-info">
                    <div className="dropdown-name">{user?.loginId}</div>
                    <div className="dropdown-user-email">{user?.email}</div>
                  </div>
                </div>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item" onClick={() => navigate('/settings')}>
                  Settings
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
        {/* Header with Action Buttons */}
        <div className="content-header" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <h1 className="page-title">Inventory Adjustment: {adjustmentData.documentNo}</h1>
            <span 
              style={{ 
                padding: '6px 16px', 
                backgroundColor: getStatusColor(adjustmentData.status), 
                color: 'white', 
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              {getStatusDisplay(adjustmentData.status)}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className="btn-primary" 
              onClick={handleSave}
              disabled={adjustmentData.status === 'done' || adjustmentData.products.length === 0}
              style={{ backgroundColor: '#007bff', opacity: (adjustmentData.status === 'done' || adjustmentData.products.length === 0) ? 0.6 : 1 }}
            >
              Save
            </button>
            <button 
              className="btn-primary" 
              onClick={handleValidate}
              disabled={adjustmentData.status === 'done'}
              style={{ backgroundColor: '#28a745', opacity: adjustmentData.status === 'done' ? 0.6 : 1 }}
            >
              Validate
            </button>
          </div>
        </div>

        {/* Adjustment Form */}
        <div className="info-section">
          <div className="info-card">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Adjustment Number</label>
                <input
                  type="text"
                  value={adjustmentData.documentNo}
                  readOnly
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f8f9fa' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Adjustment Date</label>
                <input
                  type="date"
                  value={adjustmentData.adjustmentDate}
                  onChange={(e) => setAdjustmentData(prev => ({ ...prev, adjustmentDate: e.target.value }))}
                  disabled={adjustmentData.status === 'done'}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Location</label>
                <select
                  value={adjustmentData.location}
                  onChange={(e) => setAdjustmentData(prev => ({ ...prev, location: e.target.value }))}
                  disabled={adjustmentData.status === 'done'}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="">Select location...</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.code}>{loc.code} - {loc.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Reason</label>
                <select
                  value={adjustmentData.reason}
                  onChange={(e) => setAdjustmentData(prev => ({ ...prev, reason: e.target.value }))}
                  disabled={adjustmentData.status === 'done'}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="">Select reason...</option>
                  {reasonOptions.map(reason => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Responsible</label>
                <input
                  type="text"
                  value={adjustmentData.responsible}
                  readOnly
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f8f9fa' }}
                />
              </div>
            </div>

            {/* Products Table */}
            <h3 style={{ marginBottom: '15px' }}>Stock Count</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Product</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>SKU</th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Current Stock</th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Counted Qty</th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Difference</th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adjustmentData.products.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                        No products added. Click "+ Add Line" to begin stock count.
                      </td>
                    </tr>
                  ) : (
                    adjustmentData.products.map((product, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #ddd' }}>
                        <td style={{ padding: '12px' }}>
                          <select
                            value={product.product_id}
                            onChange={(e) => handleProductChange(index, 'product_id', e.target.value)}
                            disabled={adjustmentData.status === 'done'}
                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                          >
                            <option value="">Select product...</option>
                            {availableProducts.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: '12px' }}>{product.sku || '-'}</td>
                        <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>{product.current_qty || 0}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <input
                            type="number"
                            value={product.counted_qty}
                            onChange={(e) => handleProductChange(index, 'counted_qty', e.target.value)}
                            disabled={adjustmentData.status === 'done'}
                            min="0"
                            style={{ width: '100px', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', textAlign: 'center' }}
                          />
                        </td>
                        <td style={{ 
                          padding: '12px', 
                          textAlign: 'center',
                          fontWeight: 'bold',
                          color: product.difference > 0 ? '#28a745' : product.difference < 0 ? '#dc3545' : '#000'
                        }}>
                          {product.difference > 0 ? '+' : ''}{product.difference || 0}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button
                            onClick={() => handleRemoveProduct(index)}
                            disabled={adjustmentData.status === 'done'}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: adjustmentData.status === 'done' ? 'not-allowed' : 'pointer',
                              opacity: adjustmentData.status === 'done' ? 0.6 : 1
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <button
              onClick={handleAddProduct}
              disabled={adjustmentData.status === 'done'}
              style={{
                marginTop: '15px',
                padding: '10px 20px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: adjustmentData.status === 'done' ? 'not-allowed' : 'pointer',
                opacity: adjustmentData.status === 'done' ? 0.6 : 1
              }}
            >
              + Add Line
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default InventoryAdjustment;

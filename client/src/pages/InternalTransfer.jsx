import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getCurrentUser, removeToken } from '../api';

function InternalTransfer() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Operations');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations] = useState([]);
  
  const [transferData, setTransferData] = useState({
    documentNo: 'WH/INT/0001',
    fromWarehouse: '',
    toWarehouse: '',
    fromLocation: '',
    toLocation: '',
    responsible: '',
    scheduleDate: new Date().toISOString().split('T')[0],
    status: 'draft',
    products: []
  });

  useEffect(() => {
    fetchUserData();
    fetchProducts();
    fetchWarehouses();
    fetchLocations();
    fetchTransfersAndGenerateDocNo();
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
      setTransferData(prev => ({ ...prev, responsible: response.user.loginId }));
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
        stock: p.free_to_use || 0
      })));
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await api.get('/data/warehouses');
      setWarehouses(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Failed to fetch warehouses:', err);
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

  const fetchTransfersAndGenerateDocNo = async () => {
    try {
      const response = await api.get('/data/internal-transfers');
      const transfers = response.data.success ? response.data.data : response.data;
      
      let maxNum = 0;
      transfers.forEach(transfer => {
        const match = transfer.transfer_no?.match(/WH\/INT\/(\d+)/);
        if (match) {
          const num = parseInt(match[1]);
          if (num > maxNum) maxNum = num;
        }
      });
      
      const nextNum = String(maxNum + 1).padStart(4, '0');
      const newDocNo = `WH/INT/${nextNum}`;
      
      setTransferData(prev => ({ ...prev, documentNo: newDocNo }));
    } catch (err) {
      console.error('Failed to fetch transfers:', err);
    }
  };

  const handleSave = async () => {
    try {
      const fromLoc = locations.find(l => l.code === transferData.fromLocation);
      const toLoc = locations.find(l => l.code === transferData.toLocation);
      
      const payload = {
        transfer_no: transferData.documentNo,
        from_location_id: fromLoc?.id,
        to_location_id: toLoc?.id,
        transfer_date: transferData.scheduleDate,
        status: transferData.status,
        products: transferData.products.filter(p => p.product_id && p.quantity > 0)
      };
      
      const response = await api.post('/data/internal-transfers', payload);
      console.log('Transfer saved:', response.data);
      alert('Internal transfer saved successfully!');
      
      await fetchTransfersAndGenerateDocNo();
      setTransferData(prev => ({
        ...prev,
        fromWarehouse: '',
        toWarehouse: '',
        fromLocation: '',
        toLocation: '',
        scheduleDate: new Date().toISOString().split('T')[0],
        status: 'draft',
        products: []
      }));
      
      return true;
    } catch (err) {
      console.error('Error saving transfer:', err);
      alert('Failed to save transfer: ' + (err.response?.data?.error || err.message));
      return false;
    }
  };

  const handleValidate = () => {
    if (transferData.products.length === 0) {
      alert('Please add at least one product to transfer');
      return;
    }
    if (!transferData.fromLocation || !transferData.toLocation) {
      alert('Please select both source and destination locations');
      return;
    }
    
    setTransferData(prev => ({ ...prev, status: 'done' }));
    setTimeout(() => handleSave(), 100);
  };

  const handleAddProduct = () => {
    setTransferData(prev => ({
      ...prev,
      products: [...prev.products, { product_id: '', product_name: '', quantity: 0 }]
    }));
  };

  const handleProductChange = (index, field, value) => {
    const updatedProducts = [...transferData.products];
    
    if (field === 'product_id') {
      const product = availableProducts.find(p => p.id === parseInt(value));
      updatedProducts[index].product_id = value;
      updatedProducts[index].product_name = product ? product.name : '';
      updatedProducts[index].sku = product ? product.sku : '';
      updatedProducts[index].available = product ? product.stock : 0;
    } else {
      updatedProducts[index][field] = value;
    }
    
    setTransferData(prev => ({ ...prev, products: updatedProducts }));
  };

  const handleRemoveProduct = (index) => {
    setTransferData(prev => ({
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
            <h1 className="page-title">Internal Transfer: {transferData.documentNo}</h1>
            <span 
              style={{ 
                padding: '6px 16px', 
                backgroundColor: getStatusColor(transferData.status), 
                color: 'white', 
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              {getStatusDisplay(transferData.status)}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className="btn-primary" 
              onClick={handleSave}
              disabled={transferData.status === 'done' || transferData.products.length === 0}
              style={{ backgroundColor: '#007bff', opacity: (transferData.status === 'done' || transferData.products.length === 0) ? 0.6 : 1 }}
            >
              Save
            </button>
            <button 
              className="btn-primary" 
              onClick={handleValidate}
              disabled={transferData.status === 'done'}
              style={{ backgroundColor: '#28a745', opacity: transferData.status === 'done' ? 0.6 : 1 }}
            >
              Validate
            </button>
          </div>
        </div>

        {/* Transfer Form */}
        <div className="info-section">
          <div className="info-card">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Transfer Number</label>
                <input
                  type="text"
                  value={transferData.documentNo}
                  readOnly
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f8f9fa' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Schedule Date</label>
                <input
                  type="date"
                  value={transferData.scheduleDate}
                  onChange={(e) => setTransferData(prev => ({ ...prev, scheduleDate: e.target.value }))}
                  disabled={transferData.status === 'done'}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>From Location</label>
                <select
                  value={transferData.fromLocation}
                  onChange={(e) => setTransferData(prev => ({ ...prev, fromLocation: e.target.value }))}
                  disabled={transferData.status === 'done'}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="">Select source location...</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.code}>{loc.code} - {loc.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>To Location</label>
                <select
                  value={transferData.toLocation}
                  onChange={(e) => setTransferData(prev => ({ ...prev, toLocation: e.target.value }))}
                  disabled={transferData.status === 'done'}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="">Select destination location...</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.code}>{loc.code} - {loc.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Responsible</label>
                <input
                  type="text"
                  value={transferData.responsible}
                  readOnly
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f8f9fa' }}
                />
              </div>
            </div>

            {/* Products Table */}
            <h3 style={{ marginBottom: '15px' }}>Products to Transfer</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Product</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>SKU</th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Quantity</th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transferData.products.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                        No products added. Click "+ Add Line" to begin.
                      </td>
                    </tr>
                  ) : (
                    transferData.products.map((product, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #ddd' }}>
                        <td style={{ padding: '12px' }}>
                          <select
                            value={product.product_id}
                            onChange={(e) => handleProductChange(index, 'product_id', e.target.value)}
                            disabled={transferData.status === 'done'}
                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                          >
                            <option value="">Select product...</option>
                            {availableProducts.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: '12px' }}>{product.sku || '-'}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <input
                            type="number"
                            value={product.quantity}
                            onChange={(e) => handleProductChange(index, 'quantity', parseInt(e.target.value) || 0)}
                            disabled={transferData.status === 'done'}
                            min="0"
                            style={{ width: '100px', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', textAlign: 'center' }}
                          />
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button
                            onClick={() => handleRemoveProduct(index)}
                            disabled={transferData.status === 'done'}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: transferData.status === 'done' ? 'not-allowed' : 'pointer',
                              opacity: transferData.status === 'done' ? 0.6 : 1
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
              disabled={transferData.status === 'done'}
              style={{
                marginTop: '15px',
                padding: '10px 20px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: transferData.status === 'done' ? 'not-allowed' : 'pointer',
                opacity: transferData.status === 'done' ? 0.6 : 1
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

export default InternalTransfer;

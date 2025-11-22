import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { getCurrentUser, removeToken } from '../api';

function Delivery() {
  const navigate = useNavigate();
  const { docNo } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Operations');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  
  const [deliveryData, setDeliveryData] = useState({
    documentNo: docNo || 'WH/OUT/0001',
    deliveryAddress: '',
    responsible: '',
    scheduleDate: new Date().toISOString().split('T')[0],
    operationType: 'Delivery',
    status: 'draft',
    products: []
  });

  const [operationTypes] = useState([
    'Delivery',
    'Internal Transfer',
    'Return'
  ]);

  useEffect(() => {
    fetchUserData();
    fetchProducts();
    fetchCustomers();
    fetchDeliveriesAndGenerateDocNo();
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
      setDeliveryData(prev => ({ ...prev, responsible: response.user.loginId }));
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
      console.log('Products API response:', response.data);
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

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/data/customers');
      console.log('Customers API response:', response.data);
      setCustomers(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    }
  };

  const fetchDeliveriesAndGenerateDocNo = async () => {
    try {
      const response = await api.get('/data/deliveries');
      const deliveries = response.data.success ? response.data.data : response.data;
      
      // Find the highest delivery number
      let maxNum = 0;
      deliveries.forEach(delivery => {
        const match = delivery.delivery_no?.match(/WH\/OUT\/(\d+)/);
        if (match) {
          const num = parseInt(match[1]);
          if (num > maxNum) maxNum = num;
        }
      });
      
      // Generate next delivery number
      const nextNum = String(maxNum + 1).padStart(4, '0');
      const newDocNo = `WH/OUT/${nextNum}`;
      
      setDeliveryData(prev => ({ ...prev, documentNo: newDocNo }));
      console.log('Generated next delivery number:', newDocNo);
    } catch (err) {
      console.error('Failed to fetch deliveries:', err);
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
      case 'waiting': return '#dc3545';
      case 'ready': return '#ffc107';
      case 'done': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getStatusDisplay = (status) => {
    if (!status) return 'draft';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const checkStockAvailability = () => {
    const hasOutOfStock = deliveryData.products.some(p => p.outOfStock || p.quantity > p.available);
    return !hasOutOfStock;
  };

  const handleStatusChange = (newStatus) => {
    if (newStatus === 'ready' && !checkStockAvailability()) {
      alert('Cannot mark as Ready. Some products are out of stock!');
      return;
    }
    setDeliveryData(prev => ({ ...prev, status: newStatus.toLowerCase() }));
  };

  const handleSave = async () => {
    try {
      // Find customer ID from delivery address (or use null for now)
      const payload = {
        delivery_no: deliveryData.documentNo,
        order_id: null, // No order for now
        delivery_address: deliveryData.deliveryAddress,
        schedule_date: deliveryData.scheduleDate,
        status: deliveryData.status,
        products: deliveryData.products.filter(p => p.product_id && p.quantity > 0)
      };
      
      const response = await api.post('/data/deliveries', payload);
      console.log('Delivery saved:', response.data);
      alert('Delivery saved successfully!');
      
      // After successful save, generate new document number and reset form
      await fetchDeliveriesAndGenerateDocNo();
      setDeliveryData(prev => ({
        ...prev,
        deliveryAddress: '',
        scheduleDate: new Date().toISOString().split('T')[0],
        operationType: 'Delivery',
        status: 'draft',
        products: []
      }));
      
      return true;
    } catch (err) {
      console.error('Error saving delivery:', err);
      console.error('Error response:', err.response);
      alert('Failed to save delivery: ' + (err.response?.data?.error || err.message));
      return false;
    }
  };

  const handleValidate = async () => {
    if (deliveryData.status === 'draft') {
      if (checkStockAvailability()) {
        handleStatusChange('ready');
        setTimeout(async () => {
          const success = await handleSave();
          if (success) console.log('Delivery validated to ready status');
        }, 100);
      } else {
        handleStatusChange('waiting');
        setTimeout(async () => {
          const success = await handleSave();
          if (success) {
            console.log('Delivery set to waiting status');
            alert('Some products are out of stock. Status set to Waiting.');
          }
        }, 100);
      }
    } else if (deliveryData.status === 'ready') {
      handleStatusChange('done');
      setTimeout(async () => {
        const success = await handleSave();
        if (success) console.log('Delivery validated to done status');
      }, 100);
    } else if (deliveryData.status === 'waiting') {
      if (checkStockAvailability()) {
        handleStatusChange('ready');
        setTimeout(async () => {
          const success = await handleSave();
          if (success) console.log('Delivery validated from waiting to ready');
        }, 100);
      } else {
        alert('Cannot validate. Products still out of stock!');
      }
    }
  };

  const handleNew = () => {
    const newDocNo = `WH/OUT/${String(parseInt(deliveryData.documentNo.split('/')[2]) + 1).padStart(4, '0')}`;
    setDeliveryData({
      documentNo: newDocNo,
      deliveryAddress: '',
      responsible: user.loginId,
      scheduleDate: new Date().toISOString().split('T')[0],
      operationType: 'Delivery',
      status: 'draft',
      products: []
    });
  };

  const handleAddProduct = () => {
    setDeliveryData(prev => ({
      ...prev,
      products: [...prev.products, { id: Date.now(), product_id: '', sku: '', product: '', quantity: 0, available: 0, outOfStock: false }]
    }));
  };

  const handleProductChange = (id, field, value) => {
    setDeliveryData(prev => ({
      ...prev,
      products: prev.products.map(p => {
        if (p.id === id) {
          if (field === 'product_id') {
            const product = availableProducts.find(ap => ap.id === value);
            return { 
              ...p, 
              product_id: value,
              sku: product?.sku || '', 
              product: product?.name || '',
              available: product?.stock || 0,
              outOfStock: product ? product.stock === 0 : false
            };
          } else if (field === 'quantity') {
            const qty = parseInt(value) || 0;
            return {
              ...p,
              quantity: qty,
              outOfStock: qty > p.available
            };
          }
          return { ...p, [field]: value };
        }
        return p;
      })
    }));
  };

  const handleRemoveProduct = (id) => {
    setDeliveryData(prev => ({
      ...prev,
      products: prev.products.filter(p => p.id !== id)
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel this delivery?')) {
      navigate('/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="inventory-container">
        <div className="loading-state">
          <div className="spinner-large"></div>
          <p>Loading delivery...</p>
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
        {/* Header with Action Buttons */}
        <div className="content-header" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <h1 className="page-title">Delivery: {deliveryData.documentNo}</h1>
            <span 
              style={{ 
                padding: '6px 16px', 
                backgroundColor: getStatusColor(deliveryData.status), 
                color: 'white', 
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              {getStatusDisplay(deliveryData.status)}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className="btn-primary" 
              onClick={handleSave}
              disabled={deliveryData.status === 'done' || deliveryData.products.length === 0}
              style={{ backgroundColor: '#007bff', opacity: (deliveryData.status === 'done' || deliveryData.products.length === 0) ? 0.6 : 1 }}
            >
              Save
            </button>
            <button 
              className="btn-primary" 
              onClick={handleNew}
              disabled={deliveryData.status !== 'done'}
              style={{ opacity: deliveryData.status !== 'done' ? 0.6 : 1 }}
            >
              New
            </button>
            <button 
              className="btn-primary" 
              onClick={handleValidate}
              disabled={deliveryData.status === 'done'}
              style={{ backgroundColor: '#28a745', opacity: deliveryData.status === 'done' ? 0.6 : 1 }}
            >
              {deliveryData.status === 'draft' ? 'Check Stock' : deliveryData.status === 'waiting' ? 'Recheck Stock' : 'Validate'}
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

        {/* Out of Stock Alert */}
        {deliveryData.status === 'waiting' && (
          <div style={{ padding: '15px', backgroundColor: '#f8d7da', color: '#721c24', marginBottom: '20px', borderRadius: '4px', border: '1px solid #f5c6cb' }}>
            <strong>⚠️ Warning:</strong> Some products are out of stock or insufficient quantity available. Please check the highlighted items below.
          </div>
        )}

        {/* Delivery Form */}
        <div className="info-section">
          <div className="info-card">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Document No</label>
                <input
                  type="text"
                  value={deliveryData.documentNo}
                  readOnly
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f8f9fa' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Schedule Date</label>
                <input
                  type="date"
                  value={deliveryData.scheduleDate}
                  onChange={(e) => setDeliveryData(prev => ({ ...prev, scheduleDate: e.target.value }))}
                  disabled={deliveryData.status === 'done'}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Delivery Address</label>
                <select
                  value={deliveryData.deliveryAddress}
                  onChange={(e) => setDeliveryData(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                  disabled={deliveryData.status === 'done'}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="">Select Customer</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.name}>{c.name} - {c.address}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Responsible</label>
                <input
                  type="text"
                  value={deliveryData.responsible}
                  readOnly
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f8f9fa' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Operation Type</label>
                <select
                  value={deliveryData.operationType}
                  onChange={(e) => setDeliveryData(prev => ({ ...prev, operationType: e.target.value }))}
                  disabled={deliveryData.status === 'done'}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  {operationTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Products Table */}
            <h3 style={{ marginBottom: '15px' }}>Products</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: 'bold', width: '35%' }}>Product</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #ddd', fontWeight: 'bold', width: '15%' }}>Requested</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #ddd', fontWeight: 'bold', width: '15%' }}>Available</th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd', fontWeight: 'bold', width: '15%' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd', fontWeight: 'bold', width: '15%' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveryData.products.map((product) => (
                    <tr 
                      key={product.id} 
                      style={{ 
                        borderBottom: '1px solid #ddd',
                        backgroundColor: product.outOfStock ? '#f8d7da' : 'transparent'
                      }}
                    >
                      <td style={{ padding: '12px' }}>
                        <select
                          value={product.product_id || ''}
                          onChange={(e) => handleProductChange(product.id, 'product_id', e.target.value)}
                          disabled={deliveryData.status === 'done'}
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
                          onChange={(e) => handleProductChange(product.id, 'quantity', e.target.value)}
                          disabled={deliveryData.status === 'done'}
                          min="0"
                          style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', textAlign: 'right' }}
                        />
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: product.available === 0 ? '#dc3545' : '#28a745' }}>
                        {product.available}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {product.outOfStock ? (
                          <span style={{ padding: '4px 12px', backgroundColor: '#dc3545', color: 'white', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                            OUT OF STOCK
                          </span>
                        ) : (
                          <span style={{ padding: '4px 12px', backgroundColor: '#28a745', color: 'white', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                            OK
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleRemoveProduct(product.id)}
                          disabled={deliveryData.status === 'done'}
                          style={{ padding: '6px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: deliveryData.status === 'done' ? 'not-allowed' : 'pointer', opacity: deliveryData.status === 'done' ? 0.6 : 1 }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  {deliveryData.status !== 'done' && (
                    <tr>
                      <td colSpan="5" style={{ padding: '12px', textAlign: 'center' }}>
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

export default Delivery;

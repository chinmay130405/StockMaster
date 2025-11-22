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
  const [categories, setCategories] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    sku: '',
    category_id: '',
    cost_price: '',
    min_stock: '',
    reorder_point: ''
  });

  useEffect(() => {
    fetchUserData();
    fetchStockData();
    fetchCategories();
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
        category_id: item.category_id,
        category_name: item.category_name || 'Uncategorized',
        perUnitCost: parseFloat(item.cost_price) || 0,
        onHand: parseFloat(item.on_hand) || 0,
        freeToUse: parseFloat(item.free_to_use) || 0,
        min_stock: parseFloat(item.min_stock) || 0,
        reorder_point: parseFloat(item.reorder_point) || 0,
      }));
      console.log('Mapped products:', products);
      setStockData(products);
    } catch (err) {
      console.error('Error fetching stock data:', err);
      console.error('Error response:', err.response);
      setError(err.response?.data?.error || 'Failed to load stock data');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/data/categories');
      const categoriesArray = response.data.success ? response.data.data : response.data;
      setCategories(categoriesArray || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    
    try {
      await api.post('/data/categories', { name: newCategory });
      setNewCategory('');
      setShowCategoryModal(false);
      fetchCategories();
      fetchStockData();
    } catch (err) {
      console.error('Error adding category:', err);
      alert('Failed to add category');
    }
  };

  const handleAddProduct = async () => {
    try {
      await api.post('/data/products', newProduct);
      setShowAddProduct(false);
      setNewProduct({
        name: '',
        sku: '',
        category_id: '',
        cost_price: '',
        min_stock: '',
        reorder_point: ''
      });
      fetchStockData();
    } catch (err) {
      console.error('Error adding product:', err);
      alert('Failed to add product');
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

  // Filter products
  const filteredProducts = stockData.filter(item => {
    const matchesSearch = item.product.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || item.category_id === parseInt(filterCategory);
    const matchesLowStock = !filterLowStock || item.freeToUse < item.reorder_point;
    
    return matchesSearch && matchesCategory && matchesLowStock;
  });

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
        <div className="content-header" style={{ marginBottom: '25px' }}>
          <h1 className="page-title">Stock Inventory</h1>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button 
              className="btn-primary" 
              onClick={() => setShowCategoryModal(true)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
            >
              Manage Categories
            </button>
            <button 
              className="btn-primary" 
              onClick={() => setShowAddProduct(true)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
            >
              Add New Product
            </button>
            <button 
              className="btn-secondary" 
              onClick={() => navigate('/warehouse')}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
            >
              Warehouses
            </button>
            <button 
              className="btn-secondary" 
              onClick={() => navigate('/location')}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
            >
              Locations
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="info-section">
          <div className="info-card" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '15px', alignItems: 'end' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Search</label>
                <input
                  type="text"
                  placeholder="Search by product name or SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={filterLowStock}
                    onChange={(e) => setFilterLowStock(e.target.checked)}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span style={{ fontWeight: 'bold' }}>Low Stock Only</span>
                </label>
              </div>
              {(searchTerm || filterCategory || filterLowStock) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterCategory('');
                    setFilterLowStock(false);
                  }}
                  style={{ padding: '8px 16px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stock Table */}
        <div className="info-section">
          <div className="info-card">
            <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Products ({filteredProducts.length})</h3>
              <span style={{ color: '#666' }}>
                Low Stock Items: {filteredProducts.filter(p => p.freeToUse < p.reorder_point).length}
              </span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: 'bold' }}>Product</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: 'bold' }}>SKU</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: 'bold' }}>Category</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #ddd', fontWeight: 'bold' }}>Cost (₹)</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #ddd', fontWeight: 'bold' }}>On Hand</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #ddd', fontWeight: 'bold' }}>Available</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #ddd', fontWeight: 'bold' }}>Min Stock</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #ddd', fontWeight: 'bold' }}>Reorder At</th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd', fontWeight: 'bold' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                        No products found. {searchTerm || filterCategory || filterLowStock ? 'Try adjusting your filters.' : 'Add your first product!'}
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((item) => {
                      const isLowStock = item.freeToUse < item.reorder_point;
                      const isOutOfStock = item.freeToUse === 0;
                      
                      return (
                        <tr key={item.id} style={{ borderBottom: '1px solid #ddd', backgroundColor: isLowStock ? '#fff3cd' : 'white' }}>
                          <td style={{ padding: '12px' }}>{item.product}</td>
                          <td style={{ padding: '12px', color: '#666', fontFamily: 'monospace' }}>{item.sku}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ 
                              padding: '4px 8px', 
                              backgroundColor: '#e7f3ff', 
                              borderRadius: '12px',
                              fontSize: '12px',
                              color: '#0066cc'
                            }}>
                              {item.category_name}
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>₹{item.perUnitCost.toLocaleString()}</td>
                          <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>{item.onHand}</td>
                          <td style={{ 
                            padding: '12px', 
                            textAlign: 'right', 
                            fontWeight: 'bold',
                            color: isOutOfStock ? '#dc3545' : isLowStock ? '#ff9800' : '#28a745'
                          }}>
                            {item.freeToUse}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', color: '#666' }}>{item.min_stock}</td>
                          <td style={{ padding: '12px', textAlign: 'right', color: '#666' }}>{item.reorder_point}</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            {isOutOfStock ? (
                              <span style={{ 
                                padding: '4px 12px', 
                                backgroundColor: '#dc3545', 
                                color: 'white',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: 'bold'
                              }}>
                                OUT OF STOCK
                              </span>
                            ) : isLowStock ? (
                              <span style={{ 
                                padding: '4px 12px', 
                                backgroundColor: '#ff9800', 
                                color: 'white',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: 'bold'
                              }}>
                                LOW STOCK
                              </span>
                            ) : (
                              <span style={{ 
                                padding: '4px 12px', 
                                backgroundColor: '#28a745', 
                                color: 'white',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: 'bold'
                              }}>
                                IN STOCK
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Category Management Modal */}
      {showCategoryModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '30px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h2 style={{ marginBottom: '20px' }}>Manage Product Categories</h2>
            
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '10px', fontSize: '16px' }}>Add New Category</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Category name..."
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                  style={{ flex: 1, padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
                <button
                  onClick={handleAddCategory}
                  style={{ padding: '8px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Add
                </button>
              </div>
            </div>

            <div>
              <h3 style={{ marginBottom: '10px', fontSize: '16px' }}>Existing Categories</h3>
              <div style={{ border: '1px solid #ddd', borderRadius: '4px', maxHeight: '300px', overflow: 'auto' }}>
                {categories.length === 0 ? (
                  <p style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No categories yet</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      {categories.map(cat => (
                        <tr key={cat.id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '12px' }}>{cat.name}</td>
                          <td style={{ padding: '12px', textAlign: 'right', color: '#666' }}>
                            {stockData.filter(p => p.category_id === cat.id).length} products
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCategoryModal(false)}
                style={{ padding: '8px 24px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddProduct && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '30px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h2 style={{ marginBottom: '20px' }}>Add New Product</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Product Name *</label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>SKU *</label>
                <input
                  type="text"
                  value={newProduct.sku}
                  onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Category *</label>
                <select
                  value={newProduct.category_id}
                  onChange={(e) => setNewProduct({...newProduct, category_id: e.target.value})}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="">Select category...</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Cost Price (₹) *</label>
                <input
                  type="number"
                  value={newProduct.cost_price}
                  onChange={(e) => setNewProduct({...newProduct, cost_price: e.target.value})}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Minimum Stock</label>
                <input
                  type="number"
                  value={newProduct.min_stock}
                  onChange={(e) => setNewProduct({...newProduct, min_stock: e.target.value})}
                  placeholder="e.g., 10"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Reorder Point</label>
                <input
                  type="number"
                  value={newProduct.reorder_point}
                  onChange={(e) => setNewProduct({...newProduct, reorder_point: e.target.value})}
                  placeholder="e.g., 20"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowAddProduct(false);
                  setNewProduct({
                    name: '',
                    sku: '',
                    category_id: '',
                    cost_price: '',
                    min_stock: '',
                    reorder_point: ''
                  });
                }}
                style={{ padding: '8px 24px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddProduct}
                disabled={!newProduct.name || !newProduct.sku || !newProduct.category_id || !newProduct.cost_price}
                style={{ 
                  padding: '8px 24px', 
                  backgroundColor: '#007bff', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px', 
                  cursor: 'pointer',
                  opacity: (!newProduct.name || !newProduct.sku || !newProduct.category_id || !newProduct.cost_price) ? 0.5 : 1
                }}
              >
                Add Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Stock;

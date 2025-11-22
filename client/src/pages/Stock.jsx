import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Stock() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('Products');
  const [showProductModal, setShowProductModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingStock, setEditingStock] = useState(null);
  
  const [productForm, setProductForm] = useState({
    sku: '',
    name: '',
    category_id: '',
    uom: 'pcs',
    description: '',
    default_cost: 0,
    default_price: 0,
    manufacturer_id: '',
    preferred_supplier_id: '',
    status: 'Active',
    reorder_level: 0,
    lead_time_days: 0,
    initial_stock: 0,
    location_id: ''
  });
  
  const [stockForm, setStockForm] = useState({
    location_id: '',
    quantity: 0,
    adjustment_reason: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, warehousesRes, locationsRes, categoriesRes] = await Promise.all([
        axios.get('http://localhost:5000/api/inventory/products'),
        axios.get('http://localhost:5000/api/inventory/warehouses'),
        axios.get('http://localhost:5000/api/inventory/locations'),
        axios.get('http://localhost:5000/api/inventory/product-categories')
      ]);
      
      setProducts(productsRes.data.products || []);
      setWarehouses(warehousesRes.data.warehouses || []);
      setLocations(locationsRes.data.locations || []);
      setCategories(categoriesRes.data.categories || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/inventory/products', productForm);
      await fetchData();
      setShowProductModal(false);
      setProductForm({ sku: '', name: '', category_id: '', uom: 'pcs', description: '', default_cost: 0, default_price: 0, manufacturer_id: '', preferred_supplier_id: '', status: 'Active', reorder_level: 0, lead_time_days: 0, initial_stock: 0, location_id: '' });
      alert('Product created successfully!');
    } catch (err) {
      console.error('Error creating product:', err);
      alert('Error creating product: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleUpdateProduct = async () => {
    try {
      await axios.put(`http://localhost:5000/api/inventory/products/${editingProduct.id}`, productForm);
      await fetchData();
      setShowProductModal(false);
      setEditingProduct(null);
      setProductForm({ sku: '', name: '', category_id: '', uom: 'pcs', description: '', default_cost: 0, default_price: 0, manufacturer_id: '', preferred_supplier_id: '', status: 'Active', reorder_level: 0, lead_time_days: 0, initial_stock: 0, location_id: '' });
      alert('Product updated successfully!');
    } catch (err) {
      console.error('Error updating product:', err);
      alert('Error updating product: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleUpdateStock = async () => {
    try {
      await axios.put(`http://localhost:5000/api/inventory/products/${editingStock.id}/stock`, stockForm);
      await fetchData();
      setShowStockModal(false);
      setEditingStock(null);
      setStockForm({ location_id: '', quantity: 0, adjustment_reason: '' });
      alert('Stock updated successfully!');
    } catch (err) {
      console.error('Error updating stock:', err);
      alert('Error updating stock: ' + (err.response?.data?.error || err.message));
    }
  };

  const openEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      sku: product.sku,
      name: product.name,
      category_id: product.category_id || '',
      uom: product.uom,
      description: product.description || '',
      default_cost: product.default_cost || 0,
      default_price: product.default_price || 0,
      manufacturer_id: product.manufacturer_id || '',
      preferred_supplier_id: product.preferred_supplier_id || '',
      status: product.status,
      reorder_level: product.reorder_level || 0,
      lead_time_days: product.lead_time_days || 0,
      initial_stock: 0,
      location_id: ''
    });
    setShowProductModal(true);
  };

  const openEditStock = (product) => {
    setEditingStock(product);
    setStockForm({ location_id: '', quantity: product.on_hand || 0, adjustment_reason: '' });
    setShowStockModal(true);
  };

  const tabs = ['Dashboard', 'Operations', 'Products', 'Move History', 'Settings'];

  const navigateToTab = (tab) => {
    setActiveTab(tab);
    const routes = {
      'Dashboard': '/',
      'Operations': '/operations',
      'Products': '/products',
      'Move History': '/move-history',
      'Settings': '/settings'
    };
    navigate(routes[tab]);
  };

  const filteredProducts = products.filter(product =>
    product?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalItems: products.length,
    lowStock: products.filter(p => {
      const qty = parseInt(p.on_hand || 0);
      return qty > 0 && qty < (p.reorder_level || 10);
    }).length,
    outOfStock: products.filter(p => {
      const qty = parseInt(p.on_hand || 0);
      return qty === 0;
    }).length,
    totalValue: products.reduce((sum, p) => {
      const qty = parseInt(p.on_hand || 0);
      const price = parseFloat(p.default_cost || 0);
      return sum + (price * qty);
    }, 0)
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Top Navigation */}
      <nav style={{
        backgroundColor: '#fff',
        borderBottom: '1px solid #e0e0e0',
        padding: '0 20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', gap: '5px' }}>
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => navigateToTab(tab)}
                style={{
                  padding: '16px 24px',
                  border: 'none',
                  backgroundColor: activeTab === tab ? '#f0f0f0' : 'transparent',
                  borderBottom: activeTab === tab ? '3px solid #1976d2' : '3px solid transparent',
                  color: activeTab === tab ? '#1976d2' : '#666',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: activeTab === tab ? '600' : '500'
                }}
              >
                {tab}
              </button>
            ))}
          </div>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#1976d2',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '600'
          }}>
            SM
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 20px' }}>
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
            Stock Inventory
          </h1>
          <p style={{ color: '#666', fontSize: '14px' }}>
            View and manage available stock across all warehouses
          </p>
        </div>

        {/* Search Bar */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search stock items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: '1',
              minWidth: '300px',
              padding: '12px 16px',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
          <select
            style={{
              padding: '12px 16px',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              minWidth: '200px'
            }}
          >
            <option value="all">All Warehouses</option>
            {warehouses.map(wh => (
              <option key={wh.id} value={wh.id}>{wh.name}</option>
            ))}
          </select>
          <button
            onClick={() => setShowProductModal(true)}
            style={{
              padding: '12px 24px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            + Add Stock Item
          </button>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '36px', fontWeight: '700', color: '#1976d2', marginBottom: '8px' }}>
              {stats.totalItems}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>TOTAL ITEMS</div>
          </div>
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '36px', fontWeight: '700', color: '#ff9800', marginBottom: '8px' }}>
              {stats.lowStock}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>LOW STOCK</div>
          </div>
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '36px', fontWeight: '700', color: '#f44336', marginBottom: '8px' }}>
              {stats.outOfStock}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>OUT OF STOCK</div>
          </div>
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '36px', fontWeight: '700', color: '#4caf50', marginBottom: '8px' }}>
              ${stats.totalValue.toFixed(2)}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>TOTAL VALUE</div>
          </div>
        </div>

        {/* Stock Table */}
        <div style={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #e0e0e0' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#333' }}>Available Stock</h2>
          </div>
          
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
              Loading products...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
              No stock items found. Add stock items to start tracking inventory.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#f5f5f5' }}>
                  <tr>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#666', borderBottom: '1px solid #e0e0e0' }}>
                      Product
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#666', borderBottom: '1px solid #e0e0e0' }}>
                      Category
                    </th>
                    <th style={{ padding: '16px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#666', borderBottom: '1px solid #e0e0e0' }}>
                      Per Unit Cost
                    </th>
                    <th style={{ padding: '16px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#666', borderBottom: '1px solid #e0e0e0' }}>
                      On Hand
                    </th>
                    <th style={{ padding: '16px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#666', borderBottom: '1px solid #e0e0e0' }}>
                      Free to Use
                    </th>
                    <th style={{ padding: '16px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#666', borderBottom: '1px solid #e0e0e0' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product, index) => {
                    const onHand = parseInt(product.on_hand || 0);
                    const freeToUse = parseInt(product.free_to_use || onHand);
                    const costPrice = parseFloat(product.default_cost || 0);
                    
                    return (
                      <tr key={product.id || index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '16px', fontSize: '14px', color: '#333' }}>
                          <div>{product.name}</div>
                          {product.sku && (
                            <div style={{ fontSize: '12px', color: '#999', marginTop: '4px', fontFamily: 'monospace' }}>
                              {product.sku}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', color: '#666' }}>
                          {product.category_name || 'Uncategorized'}
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', color: '#333', textAlign: 'right' }}>
                          ₹{costPrice.toFixed(2)}
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', color: '#333', textAlign: 'right', fontWeight: '600' }}>
                          {onHand}
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', color: '#4caf50', textAlign: 'right', fontWeight: '600' }}>
                          {freeToUse}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button
                              onClick={() => openEditProduct(product)}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: '#1976d2',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => openEditStock(product)}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: '#ff9800',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              Stock
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Product Modal */}
      {showProductModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            width: '500px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: '600' }}>
              {editingProduct ? 'Edit Product' : 'Create Product'}
            </h2>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>SKU (Product Code) *</label>
              <input
                type="text"
                value={productForm.sku}
                onChange={(e) => setProductForm({...productForm, sku: e.target.value})}
                placeholder="e.g., ABC123, PROD001"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px'
                }}
              />
              <small style={{ color: '#666', fontSize: '12px' }}>Unique identifier for the product</small>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Product Name *</label>
              <input
                type="text"
                value={productForm.name}
                onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                placeholder="e.g., Widget A, Office Chair"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Category</label>
              <select
                value={productForm.category_id}
                onChange={(e) => setProductForm({...productForm, category_id: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px'
                }}
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>UOM (Unit of Measure) *</label>
              <select
                value={productForm.uom}
                onChange={(e) => setProductForm({...productForm, uom: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px'
                }}
              >
                <option value="pcs">Pieces</option>
                <option value="kg">Kilograms</option>
                <option value="ltr">Liters</option>
                <option value="mtr">Meters</option>
                <option value="box">Box</option>
                <option value="pack">Pack</option>
              </select>
              <small style={{ color: '#666', fontSize: '12px' }}>How you count/measure this product</small>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Cost Price</label>
                <input
                  type="number"
                  value={productForm.default_cost}
                  onChange={(e) => setProductForm({...productForm, default_cost: parseFloat(e.target.value) || 0})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Sale Price</label>
                <input
                  type="number"
                  value={productForm.default_price}
                  onChange={(e) => setProductForm({...productForm, default_price: parseFloat(e.target.value) || 0})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px'
                  }}
                />
              </div>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Description</label>
              <textarea
                value={productForm.description}
                onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                placeholder="Optional product description"
                rows="3"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  resize: 'vertical'
                }}
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Reorder Level</label>
                <input
                  type="number"
                  value={productForm.reorder_level}
                  onChange={(e) => setProductForm({...productForm, reorder_level: parseInt(e.target.value) || 0})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px'
                  }}
                />
                <small style={{ color: '#666', fontSize: '12px' }}>Alert when stock falls below this level</small>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Lead Time (Days)</label>
                <input
                  type="number"
                  value={productForm.lead_time_days}
                  onChange={(e) => setProductForm({...productForm, lead_time_days: parseInt(e.target.value) || 0})}
                  placeholder="0"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px'
                  }}
                />
                <small style={{ color: '#666', fontSize: '12px' }}>Days to deliver after ordering</small>
              </div>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Status</label>
              <select
                value={productForm.status}
                onChange={(e) => setProductForm({...productForm, status: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px'
                }}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Discontinued">Discontinued</option>
              </select>
            </div>
            
            {!editingProduct && (
              <>
                <div style={{ marginBottom: '15px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '600' }}>Initial Stock (Optional)</h4>
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Location</label>
                    <select
                      value={productForm.location_id}
                      onChange={(e) => setProductForm({...productForm, location_id: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '4px'
                      }}
                    >
                      <option value="">No initial stock</option>
                      {locations.map(loc => (
                        <option key={loc.id} value={loc.id}>{loc.warehouse_name} - {loc.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Stock Quantity</label>
                    <input
                      type="number"
                      value={productForm.initial_stock}
                      onChange={(e) => setProductForm({...productForm, initial_stock: parseInt(e.target.value) || 0})}
                      placeholder="0"
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                </div>
              </>
            )}
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowProductModal(false);
                  setEditingProduct(null);
                  setProductForm({ sku: '', name: '', category_id: '', uom: 'pcs', description: '', default_cost: 0, default_price: 0, manufacturer_id: '', preferred_supplier_id: '', status: 'Active', reorder_level: 0, lead_time_days: 0, initial_stock: 0, location_id: '' });
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={editingProduct ? handleUpdateProduct : handleCreateProduct}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#1976d2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {editingProduct ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Modal */}
      {showStockModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            width: '400px'
          }}>
            <h2 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: '600' }}>
              Update Stock: {editingStock?.name}
            </h2>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Location *</label>
              <select
                value={stockForm.location_id}
                onChange={(e) => setStockForm({...stockForm, location_id: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px'
                }}
              >
                <option value="">Select Location</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.warehouse_name} - {loc.name}</option>
                ))}
              </select>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Quantity *</label>
              <input
                type="number"
                value={stockForm.quantity}
                onChange={(e) => setStockForm({...stockForm, quantity: parseInt(e.target.value) || 0})}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Reason</label>
              <input
                type="text"
                value={stockForm.adjustment_reason}
                onChange={(e) => setStockForm({...stockForm, adjustment_reason: e.target.value})}
                placeholder="Optional: reason for adjustment"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowStockModal(false);
                  setEditingStock(null);
                  setStockForm({ location_id: '', quantity: 0, adjustment_reason: '' });
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStock}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#1976d2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Update Stock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Stock;

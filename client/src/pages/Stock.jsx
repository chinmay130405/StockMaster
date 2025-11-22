import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Stock() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('Products');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, warehousesRes] = await Promise.all([
        axios.get('http://localhost:5000/api/inventory/products'),
        axios.get('http://localhost:5000/api/inventory/warehouses')
      ]);
      
      setProducts(productsRes.data.products || []);
      setWarehouses(warehousesRes.data.warehouses || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Stock;

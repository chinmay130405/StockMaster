import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalWarehouses: 0,
    totalLocations: 0,
    pendingReceipts: 0,
    pendingDeliveries: 0,
    lowStockItems: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('Dashboard');

  const tabs = ['Dashboard', 'Operations', 'Products', 'Move History', 'Settings'];
  
  // Fetch dashboard stats on component mount
  useEffect(() => {
    fetchDashboardStats();
  }, []);
  
  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('http://localhost:5000/api/inventory/dashboard-stats');
      console.log('Dashboard stats received:', response.data);
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const navigateToTab = (tab) => {
    setActiveTab(tab);
    switch(tab) {
      case 'Dashboard':
        navigate('/');
        break;
      case 'Operations':
        navigate('/operations');
        break;
      case 'Products':
        navigate('/products');
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

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Loading dashboard...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ 
          backgroundColor: '#ffebee', 
          color: '#c62828', 
          padding: '20px', 
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <p style={{ margin: '0 0 10px 0', fontWeight: '600' }}>Error Loading Dashboard</p>
          <p style={{ margin: 0 }}>{error}</p>
        </div>
        <button 
          onClick={fetchDashboardStats}
          style={{
            padding: '10px 20px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

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
        <h1 style={{ fontSize: '32px', fontWeight: '600', color: '#333', marginBottom: '30px' }}>
          Dashboard
        </h1>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '40px'
        }}>
          <div style={{
            backgroundColor: '#fff',
            padding: '24px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Total Products</div>
            <div style={{ fontSize: '36px', fontWeight: '700', color: '#1976d2' }}>
              {stats.totalProducts}
            </div>
          </div>

          <div style={{
            backgroundColor: '#fff',
            padding: '24px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Warehouses</div>
            <div style={{ fontSize: '36px', fontWeight: '700', color: '#4caf50' }}>
              {stats.totalWarehouses}
            </div>
          </div>

          <div style={{
            backgroundColor: '#fff',
            padding: '24px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Locations</div>
            <div style={{ fontSize: '36px', fontWeight: '700', color: '#ff9800' }}>
              {stats.totalLocations}
            </div>
          </div>

          <div style={{
            backgroundColor: '#fff',
            padding: '24px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Low Stock Items</div>
            <div style={{ fontSize: '36px', fontWeight: '700', color: '#f44336' }}>
              {stats.lowStockItems}
            </div>
          </div>
        </div>

        {/* Operation Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '24px',
          marginBottom: '40px'
        }}>
          {/* Receipt Card */}
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #e0e0e0',
              backgroundColor: '#f8f9fa'
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#333', marginBottom: '10px' }}>
                📦 Receipt
              </h2>
              <div style={{ display: 'flex', gap: '15px', fontSize: '13px' }}>
                <span style={{ backgroundColor: '#ffebee', color: '#c62828', padding: '4px 8px', borderRadius: '4px' }}>
                  1 Late
                </span>
                <span style={{ backgroundColor: '#e3f2fd', color: '#1976d2', padding: '4px 8px', borderRadius: '4px' }}>
                  {stats.pendingReceipts} operations
                </span>
              </div>
            </div>
            <div style={{ padding: '20px' }}>
              <button
                onClick={() => navigate('/receipts')}
                style={{
                  width: '100%',
                  padding: '16px',
                  backgroundColor: '#1976d2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span>{stats.pendingReceipts} to receive</span>
                <span>→</span>
              </button>
            </div>
          </div>

          {/* Delivery Card */}
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #e0e0e0',
              backgroundColor: '#f8f9fa'
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#333', marginBottom: '10px' }}>
                🚚 Delivery
              </h2>
              <div style={{ display: 'flex', gap: '15px', fontSize: '13px', flexWrap: 'wrap' }}>
                <span style={{ backgroundColor: '#ffebee', color: '#c62828', padding: '4px 8px', borderRadius: '4px' }}>
                  1 Late
                </span>
                <span style={{ backgroundColor: '#fff3e0', color: '#ef6c00', padding: '4px 8px', borderRadius: '4px' }}>
                  2 waiting
                </span>
                <span style={{ backgroundColor: '#e3f2fd', color: '#1976d2', padding: '4px 8px', borderRadius: '4px' }}>
                  {stats.pendingDeliveries} operations
                </span>
              </div>
            </div>
            <div style={{ padding: '20px' }}>
              <button
                onClick={() => navigate('/deliveries')}
                style={{
                  width: '100%',
                  padding: '16px',
                  backgroundColor: '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span>{stats.pendingDeliveries} to Deliver</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{
          backgroundColor: '#fff',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '20px' }}>
            Quick Actions
          </h3>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/products')}
              style={{
                padding: '12px 24px',
                backgroundColor: '#f5f5f5',
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                color: '#333'
              }}
            >
              📦 View Products
            </button>
            <button
              onClick={() => navigate('/warehouses')}
              style={{
                padding: '12px 24px',
                backgroundColor: '#f5f5f5',
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                color: '#333'
              }}
            >
              🏢 Manage Warehouses
            </button>
            <button
              onClick={() => navigate('/locations')}
              style={{
                padding: '12px 24px',
                backgroundColor: '#f5f5f5',
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                color: '#333'
              }}
            >
              📍 View Locations
            </button>
            <button
              onClick={() => navigate('/move-history')}
              style={{
                padding: '12px 24px',
                backgroundColor: '#f5f5f5',
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                color: '#333'
              }}
            >
              📋 Move History
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;

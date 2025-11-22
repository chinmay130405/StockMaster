import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('Dashboard');

  const tabs = ['Dashboard', 'Operations', 'Products', 'Move History', 'Settings'];

  // Update active tab based on current route
  useEffect(() => {
    const path = location.pathname;
    switch(path) {
      case '/':
        setActiveTab('Dashboard');
        break;
      case '/operations':
        setActiveTab('Operations');
        break;
      case '/products':
        setActiveTab('Products');
        break;
      case '/move-history':
        setActiveTab('Move History');
        break;
      case '/settings':
        setActiveTab('Settings');
        break;
      default:
        break;
    }
  }, [location.pathname]);

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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Top Navigation */}
      <nav style={{
        backgroundColor: '#fff',
        borderBottom: '1px solid #e0e0e0',
        padding: '0 20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 1000
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
                  fontWeight: activeTab === tab ? '600' : '500',
                  transition: 'all 0.2s'
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
            fontWeight: '600',
            fontSize: '14px'
          }}>
            SM
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 20px' }}>
        {children}
      </main>
    </div>
  );
}

export default Layout;

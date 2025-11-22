import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

function Locations() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Products');
  const warehouseFilter = searchParams.get('warehouse');

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/inventory/locations');
      setLocations(response.data.locations || []);
    } catch (err) {
      console.error('Error fetching locations:', err);
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

  const filteredLocations = warehouseFilter
    ? locations.filter(loc => loc.warehouse_id === warehouseFilter)
    : locations;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
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

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 20px' }}>
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
            Locations
          </h1>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Manage warehouse locations, rooms, and sections
          </p>
        </div>

        <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#333' }}>
            Total Locations: {filteredLocations.length}
          </div>
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
            + Add Location
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
            Loading locations...
          </div>
        ) : filteredLocations.length === 0 ? (
          <div style={{ backgroundColor: '#fff', padding: '60px', borderRadius: '8px', textAlign: 'center', color: '#666' }}>
            No locations found. Add locations to organize your inventory.
          </div>
        ) : (
          <div style={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f5f5f5' }}>
                <tr>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#666', borderBottom: '1px solid #e0e0e0' }}>
                    Location Name
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#666', borderBottom: '1px solid #e0e0e0' }}>
                    Short Code
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#666', borderBottom: '1px solid #e0e0e0' }}>
                    Warehouse
                  </th>
                  <th style={{ padding: '16px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#666', borderBottom: '1px solid #e0e0e0' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLocations.map((location) => (
                  <tr key={location.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#333' }}>
                      📍 {location.name}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#666', fontFamily: 'monospace', fontWeight: '600' }}>
                      {location.code || 'N/A'}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#666' }}>
                      {location.warehouse_name || 'N/A'}
                      {location.warehouse_code && (
                        <span style={{ marginLeft: '8px', color: '#999', fontSize: '12px' }}>
                          ({location.warehouse_code})
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <button
                        style={{
                          padding: '6px 16px',
                          backgroundColor: '#f5f5f5',
                          border: '1px solid #e0e0e0',
                          borderRadius: '4px',
                          fontSize: '13px',
                          cursor: 'pointer',
                          color: '#333'
                        }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

export default Locations;

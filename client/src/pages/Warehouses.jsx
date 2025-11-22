import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Warehouses() {
  const navigate = useNavigate();
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/inventory/warehouses');
      setWarehouses(response.data.warehouses || []);
    } catch (err) {
      console.error('Error fetching warehouses:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 style={{ fontSize: '32px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
        Warehouses
      </h1>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '30px' }}>
        Manage warehouse details and locations
      </p>

      {/* Add Warehouse Button */}
      <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#333' }}>
            Total Warehouses: {warehouses.length}
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
            + Add Warehouse
          </button>
        </div>

        {/* Warehouses Grid */}
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
            Loading warehouses...
          </div>
        ) : warehouses.length === 0 ? (
          <div style={{ backgroundColor: '#fff', padding: '60px', borderRadius: '8px', textAlign: 'center', color: '#666' }}>
            No warehouses found. Add a warehouse to get started.
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '24px'
          }}>
            {warehouses.map((warehouse) => (
              <div
                key={warehouse.id}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  padding: '24px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  border: '1px solid #e0e0e0',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '8px',
                    backgroundColor: '#e3f2fd',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px'
                  }}>
                    🏢
                  </div>
                  {warehouse.code && (
                    <div style={{
                      padding: '4px 12px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#666',
                      fontFamily: 'monospace'
                    }}>
                      {warehouse.code}
                    </div>
                  )}
                </div>
                
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
                  {warehouse.name}
                </h3>
                
                {warehouse.address && (
                  <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px', lineHeight: '1.5' }}>
                    📍 {warehouse.address}
                  </p>
                )}
                
                <div style={{ display: 'flex', gap: '8px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
                  <button
                    style={{
                      flex: 1,
                      padding: '8px 16px',
                      backgroundColor: '#f5f5f5',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      color: '#333'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/locations?warehouse=${warehouse.id}`);
                    }}
                  >
                    View Locations
                  </button>
                  <button
                    style={{
                      flex: 1,
                      padding: '8px 16px',
                      backgroundColor: '#1976d2',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      color: 'white'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Edit warehouse
                    }}
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
    </>
  );
}

export default Warehouses;

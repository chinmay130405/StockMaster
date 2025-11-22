import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

function Locations() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const filteredLocations = warehouseFilter
    ? locations.filter(loc => loc.warehouse_id === warehouseFilter)
    : locations;

  return (
    <>
      <h1 style={{ fontSize: '32px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
        Locations
      </h1>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '30px' }}>
        Manage storage locations within warehouses
      </p>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center' }}>
          <p style={{ color: '#666' }}>Loading locations...</p>
        </div>
      ) : filteredLocations.length === 0 ? (
        <div style={{ backgroundColor: '#fff', padding: '60px', borderRadius: '8px', textAlign: 'center', color: '#666' }}>
          No locations found. Add locations to organize your inventory.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {filteredLocations.map((location) => (
            <div
              key={location.id}
              style={{
                backgroundColor: '#fff',
                padding: '24px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
                {location.name}
              </h3>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                Code: {location.code}
              </p>
              <p style={{ fontSize: '14px', color: '#666' }}>
                Warehouse: {location.warehouse_name}
              </p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default Locations;

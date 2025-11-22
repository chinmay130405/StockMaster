import React, { useState, useEffect } from 'react';
import axios from 'axios';

function TestDatabase() {
  const [users, setUsers] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      // Fetch users
      const usersResponse = await axios.get('http://localhost:5000/api/auth/test-users');
      setUsers(usersResponse.data.users || []);
      
      // Fetch tables
      const tablesResponse = await axios.get('http://localhost:5000/api/auth/test-tables');
      setTables(tablesResponse.data.tables || []);
      
      setError('');
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.error || 'Failed to fetch data from database');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner-large"></div>
          <p>Loading users from database...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px', color: '#333' }}>Database Test - StockMaster PostgreSQL</h1>
      
      {error && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#fee', 
          border: '1px solid #fcc',
          borderRadius: '4px',
          marginBottom: '20px',
          color: '#c33'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Database Tables Section */}
      {!error && tables.length > 0 && (
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ marginBottom: '15px', color: '#444' }}>📊 Database Tables</h2>
          <div style={{ 
            padding: '15px', 
            backgroundColor: '#e3f2fd', 
            border: '1px solid #90caf9',
            borderRadius: '4px',
            marginBottom: '20px'
          }}>
            <strong>Found {tables.length} table(s):</strong>
            <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {tables.map((table, index) => (
                <span key={index} style={{
                  padding: '6px 12px',
                  backgroundColor: '#1976d2',
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  {table}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Users Table Section */}
      {!error && users.length === 0 && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#ffc', 
          border: '1px solid #ee9',
          borderRadius: '4px',
          marginBottom: '20px',
          color: '#660'
        }}>
          No users found in database
        </div>
      )}

      {!error && users.length > 0 && (
        <>
          <h2 style={{ marginBottom: '15px', color: '#444' }}>👥 Users Table</h2>
          <div style={{ 
            padding: '15px', 
            backgroundColor: '#efe', 
            border: '1px solid #9c9',
            borderRadius: '4px',
            marginBottom: '20px',
            color: '#363'
          }}>
            <strong>✅ Success!</strong> Found {users.length} user(s) in the database
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              backgroundColor: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>ID</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Email</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Name</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Phone</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Role</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Active</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr key={user.id || index} style={{ 
                    borderBottom: '1px solid #eee',
                    '&:hover': { backgroundColor: '#f9f9f9' }
                  }}>
                    <td style={{ padding: '12px', fontSize: '12px', fontFamily: 'monospace' }}>
                      {user.id ? user.id.substring(0, 8) + '...' : 'N/A'}
                    </td>
                    <td style={{ padding: '12px' }}>{user.email || 'N/A'}</td>
                    <td style={{ padding: '12px' }}>{user.name || 'N/A'}</td>
                    <td style={{ padding: '12px' }}>{user.phone || 'N/A'}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '12px',
                        backgroundColor: user.role === 'admin' ? '#e3f2fd' : '#f3e5f5',
                        color: user.role === 'admin' ? '#1976d2' : '#7b1fa2',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {user.role || 'N/A'}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {user.is_active ? (
                        <span style={{ color: '#4caf50' }}>✅ Active</span>
                      ) : (
                        <span style={{ color: '#f44336' }}>❌ Inactive</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ 
            marginTop: '20px',
            padding: '15px',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px'
          }}>
            <h3 style={{ marginBottom: '10px' }}>Raw Data (JSON):</h3>
            <pre style={{ 
              backgroundColor: '#fff',
              padding: '15px',
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '12px',
              border: '1px solid #ddd'
            }}>
              {JSON.stringify(users, null, 2)}
            </pre>
          </div>
        </>
      )}

      <div style={{ marginTop: '30px', textAlign: 'center' }}>
        <button 
          onClick={fetchAllData}
          style={{
            padding: '10px 20px',
            backgroundColor: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          🔄 Refresh Data
        </button>
      </div>
    </div>
  );
}

export default TestDatabase;

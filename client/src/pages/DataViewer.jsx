import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function DataViewer() {
  const navigate = useNavigate();
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [tableData, setTableData] = useState(null);
  const [schema, setSchema] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const response = await api.get('/data/tables');
      setTables(response.data.tables);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch tables');
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTableData = async (tableName) => {
    try {
      setLoading(true);
      setSelectedTable(tableName);
      
      // Fetch both data and schema
      const [dataResponse, schemaResponse] = await Promise.all([
        api.get(`/data/${tableName}?limit=50`),
        api.get(`/data/${tableName}/schema`)
      ]);
      
      setTableData(dataResponse.data);
      setSchema(schemaResponse.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch table data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>PostgreSQL Database Viewer</h1>
        <div>
          <button 
            onClick={() => navigate('/dashboard')}
            style={{ marginRight: '10px', padding: '8px 16px', cursor: 'pointer' }}
          >
            Dashboard
          </button>
          <button 
            onClick={handleLogout}
            style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#dc3545', color: 'white', border: 'none' }}
          >
            Logout
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '10px', backgroundColor: '#f8d7da', color: '#721c24', marginBottom: '20px', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Tables List */}
        <div style={{ width: '250px', borderRight: '1px solid #ddd', paddingRight: '20px' }}>
          <h3>Tables</h3>
          {loading && !selectedTable && <p>Loading tables...</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {tables.map(table => (
              <button
                key={table}
                onClick={() => fetchTableData(table)}
                style={{
                  padding: '10px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  backgroundColor: selectedTable === table ? '#007bff' : '#f8f9fa',
                  color: selectedTable === table ? 'white' : 'black',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              >
                {table}
              </button>
            ))}
          </div>
        </div>

        {/* Table Data */}
        <div style={{ flex: 1 }}>
          {!selectedTable && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <p>Select a table to view its data</p>
            </div>
          )}

          {loading && selectedTable && <p>Loading data...</p>}

          {selectedTable && schema && tableData && (
            <div>
              <h2>{selectedTable}</h2>
              <p style={{ color: '#666', marginBottom: '20px' }}>
                Showing {tableData.data.length} of {tableData.total} records
              </p>

              {/* Schema Info */}
              <details style={{ marginBottom: '20px' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                  Table Schema ({schema.columns.length} columns)
                </summary>
                <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                  {schema.columns.map(col => (
                    <div key={col.column_name} style={{ padding: '5px', borderBottom: '1px solid #ddd' }}>
                      <strong>{col.column_name}</strong>: {col.data_type}
                      {col.is_nullable === 'NO' && <span style={{ color: '#dc3545' }}> *required</span>}
                    </div>
                  ))}
                </div>
              </details>

              {/* Data Table */}
              {tableData.data.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8f9fa' }}>
                        {Object.keys(tableData.data[0]).map(column => (
                          <th key={column} style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: 'bold' }}>
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.data.map((row, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid #ddd' }}>
                          {Object.values(row).map((value, i) => (
                            <td key={i} style={{ padding: '12px' }}>
                              {value === null ? (
                                <span style={{ color: '#999', fontStyle: 'italic' }}>null</span>
                              ) : typeof value === 'object' ? (
                                JSON.stringify(value)
                              ) : typeof value === 'boolean' ? (
                                value ? '✓' : '✗'
                              ) : (
                                String(value)
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  No data in this table
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DataViewer;

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

function MoveHistory() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    receipts: 0,
    deliveries: 0,
    adjustments: 0
  });

  useEffect(() => {
    fetchMovements();
  }, [filterType, dateRange]);

  const fetchMovements = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterType !== 'all') {
        params.movementType = filterType === 'receipt' ? 'in' : filterType === 'delivery' ? 'out' : 'adjustment';
      }

      const response = await axios.get(`${API_URL}/inventory/stock-movements`, { params });
      const data = response.data.movements || [];
      setMovements(data);

      const statsData = {
        total: data.length,
        receipts: data.filter(m => m.movement_type === 'receipt').length,
        deliveries: data.filter(m => m.movement_type === 'delivery').length,
        adjustments: data.filter(m => m.movement_type === 'transfer').length
      };
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching movements:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMovements = movements.filter(item => {
    if (filterType === 'all') return true;
    if (filterType === 'receipt') return item.movement_type === 'receipt';
    if (filterType === 'delivery') return item.movement_type === 'delivery';
    if (filterType === 'adjustment') return item.movement_type === 'transfer';
    return true;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMovementTypeBadge = (type) => {
    const types = {
      receipt: { bg: '#dbeafe', color: '#1e40af', label: 'Receipt' },
      delivery: { bg: '#fef3c7', color: '#92400e', label: 'Delivery' },
      transfer: { bg: '#f3e8ff', color: '#6b21a8', label: 'Transfer' }
    };
    const typeInfo = types[type] || types.transfer;
    return (
      <span style={{
        padding: '4px 12px',
        backgroundColor: typeInfo.bg,
        color: typeInfo.color,
        borderRadius: '12px',
        fontSize: '13px',
        fontWeight: '600'
      }}>
        {typeInfo.label}
      </span>
    );
  };

  return (
    <>
      <h1 style={{ fontSize: '32px', fontWeight: '600', color: '#333', marginBottom: '10px' }}>
        Move History
      </h1>
      <p style={{ fontSize: '16px', color: '#666', marginBottom: '30px' }}>
        Track all stock movements including receipts, deliveries, and adjustments
      </p>

        {/* Summary Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#1976d2', marginBottom: '4px' }}>
              {stats.total}
            </div>
            <div style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>
              Total Movements
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#1e40af', marginBottom: '4px' }}>
              {stats.receipts}
            </div>
            <div style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>
              Receipts
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#92400e', marginBottom: '4px' }}>
              {stats.deliveries}
            </div>
            <div style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>
              Deliveries
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#6b21a8', marginBottom: '4px' }}>
              {stats.adjustments}
            </div>
            <div style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>
              Adjustments
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap'
        }}>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              padding: '12px 16px',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '15px',
              cursor: 'pointer',
              minWidth: '200px'
            }}
          >
            <option value="all">All Operations</option>
            <option value="receipt">Receipt</option>
            <option value="delivery">Delivery</option>
            <option value="adjustment">Adjustment</option>
          </select>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            style={{
              padding: '12px 16px',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '15px',
              cursor: 'pointer',
              minWidth: '200px'
            }}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="custom">Custom Range</option>
          </select>

          <button
            onClick={() => alert('Export history')}
            style={{
              padding: '12px 24px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              marginLeft: 'auto'
            }}
          >
            📊 Export History
          </button>
        </div>

        {/* History List */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e0e0e0'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a1a' }}>
              Movement History
            </h2>
          </div>

          {loading ? (
            <div style={{
              padding: '60px',
              textAlign: 'center',
              fontSize: '16px',
              color: '#666'
            }}>
              Loading movement history...
            </div>
          ) : filteredMovements.length === 0 ? (
            <div style={{
              padding: '60px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
              <div style={{ fontSize: '16px', color: '#666' }}>
                No movement history found. Stock movements will appear here once operations are performed.
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb' }}>
                    <th style={{
                      padding: '16px 24px',
                      textAlign: 'left',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Date/Time</th>
                    <th style={{
                      padding: '16px 24px',
                      textAlign: 'left',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Type</th>
                    <th style={{
                      padding: '16px 24px',
                      textAlign: 'left',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Product</th>
                    <th style={{
                      padding: '16px 24px',
                      textAlign: 'left',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Reference</th>
                    <th style={{
                      padding: '16px 24px',
                      textAlign: 'left',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Quantity</th>
                    <th style={{
                      padding: '16px 24px',
                      textAlign: 'left',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Document</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMovements.map((item, index) => (
                    <tr key={index} style={{
                      borderBottom: '1px solid #f3f4f6',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '16px 24px', fontSize: '14px', color: '#374151' }}>
                        {formatDate(item.movement_date || item.created_at)}
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        {getMovementTypeBadge(item.movement_type)}
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a', marginBottom: '4px' }}>
                          {item.product_name}
                        </div>
                        {item.sku && (
                          <div style={{ fontSize: '13px', color: '#6b7280' }}>
                            {item.sku}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '14px', color: '#374151' }}>
                        {item.reference || 'N/A'}
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: item.direction === 'in' ? '#059669' : item.direction === 'out' ? '#dc2626' : '#6b21a8'
                        }}>
                          {item.direction === 'in' ? '+' : item.direction === 'out' ? '-' : '↔'}{item.quantity} {item.uom || ''}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '14px', color: '#374151' }}>
                        {item.document_no || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
    </>
  );
}

export default MoveHistory;
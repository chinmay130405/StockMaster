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

      // Calculate stats
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
        padding: '4px 8px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '600',
        background: typeInfo.bg,
        color: typeInfo.color
      }}>
        {typeInfo.label}
      </span>
    );
  };

  return (
    <div className="move-history-page">
      <div className="content-header" style={{ marginBottom: '2rem' }}>
        <h1 className="page-title">Move History</h1>
        <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
          Track all stock movements including receipts, deliveries, and adjustments
        </p>
      </div>

      {/* Filter Bar */}
      <div className="history-filters" style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem',
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
          className="btn btn-secondary"
          style={{
            padding: '12px 24px',
            whiteSpace: 'nowrap'
          }}
          onClick={() => alert('Export history')}
        >
          📊 Export History
        </button>
      </div>

      {/* Summary Stats */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-box">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Movements</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{stats.receipts}</div>
          <div className="stat-label">Receipts</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{stats.deliveries}</div>
          <div className="stat-label">Deliveries</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{stats.adjustments}</div>
          <div className="stat-label">Adjustments</div>
        </div>
      </div>

      {/* History List */}
      <div className="history-list">
        <div className="info-card">
          <h3 className="info-title">Movement History</h3>
          
          {loading ? (
            <div className="loading-state" style={{ padding: '3rem' }}>
              <div className="spinner-large"></div>
              <p>Loading movement history...</p>
            </div>
          ) : filteredMovements.length === 0 ? (
            <div className="alert alert-info" style={{ marginTop: '1rem' }}>
              No movement history found. Stock movements will appear here once operations are performed.
            </div>
          ) : (
            <div className="history-table" style={{ marginTop: '1.5rem', overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px'
              }}>
                <thead>
                  <tr style={{
                    background: '#f8fafc',
                    borderBottom: '2px solid #e2e8f0'
                  }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#1e293b' }}>Date/Time</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#1e293b' }}>Type</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#1e293b' }}>Product</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#1e293b' }}>Reference</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#1e293b' }}>Quantity</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#1e293b' }}>Document</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMovements.map((item, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px' }}>{formatDate(item.movement_date || item.created_at)}</td>
                      <td style={{ padding: '12px' }}>
                        {getMovementTypeBadge(item.movement_type)}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: '600' }}>{item.product_name}</div>
                        {item.sku && (
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{item.sku}</div>
                        )}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontSize: '13px' }}>{item.reference || 'N/A'}</div>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>
                        <span style={{ 
                          color: item.direction === 'in' ? '#16a34a' : item.direction === 'out' ? '#dc2626' : '#6b21a8' 
                        }}>
                          {item.direction === 'in' ? '+' : item.direction === 'out' ? '-' : '↔'}{item.quantity} {item.uom || ''}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: '#3b82f6', fontWeight: '600' }}>
                        {item.document_no || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MoveHistory;

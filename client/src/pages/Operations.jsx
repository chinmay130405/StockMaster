import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

function Operations() {
  const navigate = useNavigate();
  const [activeOperation, setActiveOperation] = useState('receipt');
  const [receipts, setReceipts] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operations, setOperations] = useState({
    receipt: {
      late: 0,
      waiting: 0,
      total: 0,
      toReceive: 0
    },
    delivery: {
      late: 0,
      waiting: 0,
      total: 0,
      toDeliver: 0
    }
  });

  useEffect(() => {
    fetchOperations();
  }, []);

  const fetchOperations = async () => {
    try {
      setLoading(true);
      const [receiptsRes, deliveriesRes] = await Promise.all([
        axios.get(`${API_URL}/inventory/receipts`),
        axios.get(`${API_URL}/inventory/deliveries`)
      ]);

      setReceipts(receiptsRes.data.receipts || []);
      setDeliveries(deliveriesRes.data.deliveries || []);

      // Calculate stats
      const receiptStats = {
        late: receiptsRes.data.receipts?.filter(r => r.status === 'Ready' && new Date(r.schedule_date) < new Date()).length || 0,
        waiting: receiptsRes.data.receipts?.filter(r => r.status === 'Ready').length || 0,
        total: receiptsRes.data.receipts?.length || 0,
        toReceive: receiptsRes.data.receipts?.filter(r => r.status === 'Ready').length || 0
      };

      const deliveryStats = {
        late: deliveriesRes.data.deliveries?.filter(d => d.status === 'Ready' && new Date(d.schedule_date) < new Date()).length || 0,
        waiting: deliveriesRes.data.deliveries?.filter(d => d.status === 'Waiting' || d.status === 'Ready').length || 0,
        total: deliveriesRes.data.deliveries?.length || 0,
        toDeliver: deliveriesRes.data.deliveries?.filter(d => d.status === 'Ready').length || 0
      };

      setOperations({
        receipt: receiptStats,
        delivery: deliveryStats
      });
    } catch (error) {
      console.error('Error fetching operations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      Draft: { bg: '#f1f5f9', color: '#475569' },
      Ready: { bg: '#dbeafe', color: '#1e40af' },
      Waiting: { bg: '#fef3c7', color: '#92400e' },
      Done: { bg: '#dcfce7', color: '#166534' }
    };

    const colors = statusColors[status] || statusColors.Draft;

    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600',
        background: colors.bg,
        color: colors.color
      }}>
        {status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="operations-page">
      <div className="content-header">
        <h1 className="page-title">Operations</h1>
        <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
          Manage receipt, delivery, and adjustment operations
        </p>
      </div>

      {/* Operation Type Selector */}
      <div className="operation-selector" style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '2rem',
        borderBottom: '2px solid #e2e8f0',
        paddingBottom: '0'
      }}>
        <button
          className={`operation-tab ${activeOperation === 'receipt' ? 'active' : ''}`}
          onClick={() => setActiveOperation('receipt')}
          style={{
            padding: '1rem 2rem',
            border: 'none',
            background: 'transparent',
            color: activeOperation === 'receipt' ? '#3b82f6' : '#64748b',
            fontWeight: '600',
            fontSize: '15px',
            cursor: 'pointer',
            borderBottom: activeOperation === 'receipt' ? '3px solid #3b82f6' : '3px solid transparent',
            transition: 'all 0.3s'
          }}
        >
          Receipt
        </button>
        <button
          className={`operation-tab ${activeOperation === 'delivery' ? 'active' : ''}`}
          onClick={() => setActiveOperation('delivery')}
          style={{
            padding: '1rem 2rem',
            border: 'none',
            background: 'transparent',
            color: activeOperation === 'delivery' ? '#3b82f6' : '#64748b',
            fontWeight: '600',
            fontSize: '15px',
            cursor: 'pointer',
            borderBottom: activeOperation === 'delivery' ? '3px solid #3b82f6' : '3px solid transparent',
            transition: 'all 0.3s'
          }}
        >
          Delivery
        </button>
        <button
          className={`operation-tab ${activeOperation === 'adjustment' ? 'active' : ''}`}
          onClick={() => setActiveOperation('adjustment')}
          style={{
            padding: '1rem 2rem',
            border: 'none',
            background: 'transparent',
            color: activeOperation === 'adjustment' ? '#3b82f6' : '#64748b',
            fontWeight: '600',
            fontSize: '15px',
            cursor: 'pointer',
            borderBottom: activeOperation === 'adjustment' ? '3px solid #3b82f6' : '3px solid transparent',
            transition: 'all 0.3s'
          }}
        >
          Adjustment
        </button>
      </div>

      {/* Receipt Operations */}
      {activeOperation === 'receipt' && (
        <div className="operation-content">
          <div className="operation-card">
            <div className="card-header">
              <h2 className="card-title">Receipt Operations</h2>
              <div className="card-stats">
                <span className="stat-item">{operations.receipt.late} Late</span>
                <span className="stat-item">{operations.receipt.waiting} Waiting</span>
                <span className="stat-item">{operations.receipt.total} Total Operations</span>
              </div>
            </div>
            <div className="card-body">
              <button 
                className="action-btn" 
                onClick={() => navigate('/create-receipt')}
                style={{
                  background: '#3b82f6',
                  color: 'white',
                  padding: '14px 28px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '2rem'
                }}
              >
                <span>+ Create New Receipt</span>
              </button>
              
              <div style={{ marginTop: '2rem' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '1rem', color: '#1e293b' }}>
                  Recent Receipt Operations ({receipts.length})
                </h3>
                
                {loading ? (
                  <div className="loading-state" style={{ padding: '2rem' }}>
                    <div className="spinner-large"></div>
                    <p>Loading receipts...</p>
                  </div>
                ) : receipts.length === 0 ? (
                  <div className="alert alert-info">
                    No receipt operations found. Create a new receipt to get started.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
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
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#1e293b' }}>Document No</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#1e293b' }}>Receive From</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#1e293b' }}>Responsible</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#1e293b' }}>Schedule Date</th>
                          <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#1e293b' }}>Items</th>
                          <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#1e293b' }}>Status</th>
                          <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#1e293b' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {receipts.map((receipt) => (
                          <tr key={receipt.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '12px', fontWeight: '600', color: '#3b82f6' }}>
                              {receipt.receipt_no || 'N/A'}
                            </td>
                            <td style={{ padding: '12px' }}>{receipt.supplier_invoice_no || 'N/A'}</td>
                            <td style={{ padding: '12px' }}>{receipt.received_by || 'N/A'}</td>
                            <td style={{ padding: '12px' }}>{formatDate(receipt.receipt_date)}</td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>{receipt.line_count || 0}</td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                              {getStatusBadge(receipt.status)}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                              <button 
                                onClick={() => navigate(`/receipt/${receipt.id}`)}
                                style={{
                                  padding: '6px 12px',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: '6px',
                                  background: 'white',
                                  cursor: 'pointer',
                                  fontSize: '13px'
                                }}
                              >
                                View
                              </button>
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
        </div>
      )}

      {/* Delivery Operations */}
      {activeOperation === 'delivery' && (
        <div className="operation-content">
          <div className="operation-card">
            <div className="card-header">
              <h2 className="card-title">Delivery Operations</h2>
              <div className="card-stats">
                <span className="stat-item">{operations.delivery.late} Late</span>
                <span className="stat-item">{operations.delivery.waiting} Waiting</span>
                <span className="stat-item">{operations.delivery.total} Total Operations</span>
              </div>
            </div>
            <div className="card-body">
              <button 
                className="action-btn" 
                onClick={() => navigate('/create-delivery')}
                style={{
                  background: '#f59e0b',
                  color: 'white',
                  padding: '14px 28px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '2rem'
                }}
              >
                <span>+ Create New Delivery</span>
              </button>
              
              <div style={{ marginTop: '2rem' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '1rem', color: '#1e293b' }}>
                  Recent Delivery Operations ({deliveries.length})
                </h3>
                
                {loading ? (
                  <div className="loading-state" style={{ padding: '2rem' }}>
                    <div className="spinner-large"></div>
                    <p>Loading deliveries...</p>
                  </div>
                ) : deliveries.length === 0 ? (
                  <div className="alert alert-info">
                    No delivery operations found. Create a new delivery to get started.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
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
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#1e293b' }}>Document No</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#1e293b' }}>Delivery Address</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#1e293b' }}>Responsible</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#1e293b' }}>Schedule Date</th>
                          <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#1e293b' }}>Items</th>
                          <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#1e293b' }}>Status</th>
                          <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#1e293b' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deliveries.map((delivery) => (
                          <tr key={delivery.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '12px', fontWeight: '600', color: '#f59e0b' }}>
                              {delivery.delivery_no || 'N/A'}
                            </td>
                            <td style={{ padding: '12px' }}>{delivery.delivery_address || 'N/A'}</td>
                            <td style={{ padding: '12px' }}>{delivery.delivered_by || 'N/A'}</td>
                            <td style={{ padding: '12px' }}>{formatDate(delivery.delivery_date || delivery.expected_delivery_date)}</td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>{delivery.line_count || 0}</td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                              {getStatusBadge(delivery.status)}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                              <button 
                                onClick={() => navigate(`/delivery/${delivery.id}`)}
                                style={{
                                  padding: '6px 12px',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: '6px',
                                  background: 'white',
                                  cursor: 'pointer',
                                  fontSize: '13px'
                                }}
                              >
                                View
                              </button>
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
        </div>
      )}

      {/* Adjustment Operations */}
      {activeOperation === 'adjustment' && (
        <div className="operation-content">
          <div className="operation-card">
            <div className="card-header">
              <h2 className="card-title">Adjustment Operations</h2>
              <div className="card-stats">
                <span className="stat-item">Inventory Adjustments</span>
              </div>
            </div>
            <div className="card-body">
              <button className="action-btn" onClick={() => alert('Create new adjustment')}>
                <span className="btn-text">Create New Adjustment</span>
                <span className="btn-icon">+</span>
              </button>
              
              <div style={{ marginTop: '2rem' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '1rem', color: '#1e293b' }}>
                  Recent Adjustments
                </h3>
                <div className="operations-list" style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '0.75rem' 
                }}>
                  {/* Placeholder for adjustment operations list */}
                  <div className="alert alert-info">
                    No recent adjustments. Create an adjustment to modify inventory levels.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Operations;

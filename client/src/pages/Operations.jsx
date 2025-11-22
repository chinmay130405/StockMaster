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
        fetch(`${API_URL}/inventory/receipts`).then(r => r.json()),
        fetch(`${API_URL}/inventory/deliveries`).then(r => r.json())
      ]);

      setReceipts(receiptsRes.receipts || []);
      setDeliveries(deliveriesRes.deliveries || []);

      // Calculate stats
      const receiptStats = {
        late: receiptsRes.receipts?.filter(r => r.status === 'Ready' && new Date(r.schedule_date) < new Date()).length || 0,
        waiting: receiptsRes.receipts?.filter(r => r.status === 'Ready').length || 0,
        total: receiptsRes.receipts?.length || 0,
        toReceive: receiptsRes.receipts?.filter(r => r.status === 'Ready').length || 0
      };

      const deliveryStats = {
        late: deliveriesRes.deliveries?.filter(d => d.status === 'Ready' && new Date(d.schedule_date) < new Date()).length || 0,
        waiting: deliveriesRes.deliveries?.filter(d => d.status === 'Waiting' || d.status === 'Ready').length || 0,
        total: deliveriesRes.deliveries?.length || 0,
        toDeliver: deliveriesRes.deliveries?.filter(d => d.status === 'Ready').length || 0
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
        borderRadius: '6px',
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
    <>
      <h1 style={{ fontSize: '32px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
        Operations
      </h1>
      <p style={{ color: '#666', marginBottom: '30px', fontSize: '14px' }}>
        Manage receipt, delivery, and adjustment operations
      </p>

        {/* Operation Type Selector */}
        <div style={{ 
          display: 'flex', 
          gap: '15px', 
          marginBottom: '30px',
          borderBottom: '2px solid #e0e0e0',
          paddingBottom: '0'
        }}>
          <button
            onClick={() => setActiveOperation('receipt')}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: 'transparent',
              color: activeOperation === 'receipt' ? '#1976d2' : '#666',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              borderBottom: activeOperation === 'receipt' ? '3px solid #1976d2' : '3px solid transparent',
              transition: 'all 0.3s'
            }}
          >
            📦 Receipt
          </button>
          <button
            onClick={() => setActiveOperation('delivery')}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: 'transparent',
              color: activeOperation === 'delivery' ? '#1976d2' : '#666',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              borderBottom: activeOperation === 'delivery' ? '3px solid #1976d2' : '3px solid transparent',
              transition: 'all 0.3s'
            }}
          >
            🚚 Delivery
          </button>
          <button
            onClick={() => setActiveOperation('adjustment')}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: 'transparent',
              color: activeOperation === 'adjustment' ? '#1976d2' : '#666',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              borderBottom: activeOperation === 'adjustment' ? '3px solid #1976d2' : '3px solid transparent',
              transition: 'all 0.3s'
            }}
          >
            ⚙️ Adjustment
          </button>
        </div>

        {/* Receipt Operations */}
        {activeOperation === 'receipt' && (
          <div>
            {/* Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
              marginBottom: '30px'
            }}>
              <div style={{
                backgroundColor: '#fff',
                padding: '24px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Late</div>
                <div style={{ fontSize: '36px', fontWeight: '700', color: '#f44336' }}>
                  {operations.receipt.late}
                </div>
              </div>
              <div style={{
                backgroundColor: '#fff',
                padding: '24px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Waiting</div>
                <div style={{ fontSize: '36px', fontWeight: '700', color: '#ff9800' }}>
                  {operations.receipt.waiting}
                </div>
              </div>
              <div style={{
                backgroundColor: '#fff',
                padding: '24px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Total Operations</div>
                <div style={{ fontSize: '36px', fontWeight: '700', color: '#1976d2' }}>
                  {operations.receipt.total}
                </div>
              </div>
            </div>

            {/* Content Card */}
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '24px',
                borderBottom: '1px solid #e0e0e0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333' }}>
                  Recent Receipt Operations ({receipts.length})
                </h3>
                <button 
                  onClick={() => console.log('Create new receipt')}
                  style={{
                    background: '#1976d2',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  + Create New Receipt
                </button>
              </div>
              
              {loading ? (
                <div style={{ padding: '60px', textAlign: 'center' }}>
                  <p style={{ color: '#666' }}>Loading receipts...</p>
                </div>
              ) : receipts.length === 0 ? (
                <div style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: '#666'
                }}>
                  <p>No receipt operations found. Create a new receipt to get started.</p>
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
                        background: '#f8f9fa',
                        borderBottom: '2px solid #e0e0e0'
                      }}>
                        <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#333' }}>Document No</th>
                        <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#333' }}>Receive From</th>
                        <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#333' }}>Responsible</th>
                        <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#333' }}>Schedule Date</th>
                        <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#333' }}>Items</th>
                        <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#333' }}>Status</th>
                        <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#333' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receipts.map((receipt) => (
                        <tr key={receipt.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '16px', fontWeight: '600', color: '#1976d2' }}>
                            {receipt.receipt_no || 'N/A'}
                          </td>
                          <td style={{ padding: '16px', color: '#333' }}>{receipt.supplier_invoice_no || 'N/A'}</td>
                          <td style={{ padding: '16px', color: '#333' }}>{receipt.received_by || 'N/A'}</td>
                          <td style={{ padding: '16px', color: '#666' }}>{formatDate(receipt.receipt_date)}</td>
                          <td style={{ padding: '16px', textAlign: 'center', color: '#333' }}>{receipt.line_count || 0}</td>
                          <td style={{ padding: '16px', textAlign: 'center' }}>
                            {getStatusBadge(receipt.status)}
                          </td>
                          <td style={{ padding: '16px', textAlign: 'center' }}>
                            <button 
                              onClick={() => console.log('View receipt', receipt.id)}
                              style={{
                                padding: '8px 16px',
                                border: '1px solid #e0e0e0',
                                borderRadius: '6px',
                                background: 'white',
                                cursor: 'pointer',
                                fontSize: '13px',
                                color: '#333',
                                fontWeight: '500'
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
        )}

        {/* Delivery Operations */}
        {activeOperation === 'delivery' && (
          <div>
            {/* Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
              marginBottom: '30px'
            }}>
              <div style={{
                backgroundColor: '#fff',
                padding: '24px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Late</div>
                <div style={{ fontSize: '36px', fontWeight: '700', color: '#f44336' }}>
                  {operations.delivery.late}
                </div>
              </div>
              <div style={{
                backgroundColor: '#fff',
                padding: '24px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Waiting</div>
                <div style={{ fontSize: '36px', fontWeight: '700', color: '#ff9800' }}>
                  {operations.delivery.waiting}
                </div>
              </div>
              <div style={{
                backgroundColor: '#fff',
                padding: '24px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Total Operations</div>
                <div style={{ fontSize: '36px', fontWeight: '700', color: '#1976d2' }}>
                  {operations.delivery.total}
                </div>
              </div>
            </div>

            {/* Content Card */}
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '24px',
                borderBottom: '1px solid #e0e0e0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333' }}>
                  Recent Delivery Operations ({deliveries.length})
                </h3>
                <button 
                  onClick={() => console.log('Create new delivery')}
                  style={{
                    background: '#4caf50',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  + Create New Delivery
                </button>
              </div>
              
              {loading ? (
                <div style={{ padding: '60px', textAlign: 'center' }}>
                  <p style={{ color: '#666' }}>Loading deliveries...</p>
                </div>
              ) : deliveries.length === 0 ? (
                <div style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: '#666'
                }}>
                  <p>No delivery operations found. Create a new delivery to get started.</p>
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
                        background: '#f8f9fa',
                        borderBottom: '2px solid #e0e0e0'
                      }}>
                        <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#333' }}>Document No</th>
                        <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#333' }}>Delivery Address</th>
                        <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#333' }}>Responsible</th>
                        <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#333' }}>Schedule Date</th>
                        <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#333' }}>Items</th>
                        <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#333' }}>Status</th>
                        <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#333' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deliveries.map((delivery) => (
                        <tr key={delivery.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '16px', fontWeight: '600', color: '#4caf50' }}>
                            {delivery.delivery_no || 'N/A'}
                          </td>
                          <td style={{ padding: '16px', color: '#333' }}>{delivery.delivery_address || 'N/A'}</td>
                          <td style={{ padding: '16px', color: '#333' }}>{delivery.delivered_by || 'N/A'}</td>
                          <td style={{ padding: '16px', color: '#666' }}>{formatDate(delivery.delivery_date || delivery.expected_delivery_date)}</td>
                          <td style={{ padding: '16px', textAlign: 'center', color: '#333' }}>{delivery.line_count || 0}</td>
                          <td style={{ padding: '16px', textAlign: 'center' }}>
                            {getStatusBadge(delivery.status)}
                          </td>
                          <td style={{ padding: '16px', textAlign: 'center' }}>
                            <button 
                              onClick={() => console.log('View delivery', delivery.id)}
                              style={{
                                padding: '8px 16px',
                                border: '1px solid #e0e0e0',
                                borderRadius: '6px',
                                background: 'white',
                                cursor: 'pointer',
                                fontSize: '13px',
                                color: '#333',
                                fontWeight: '500'
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
        )}

        {/* Adjustment Operations */}
        {activeOperation === 'adjustment' && (
          <div>
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '24px',
                borderBottom: '1px solid #e0e0e0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333' }}>
                  Inventory Adjustments
                </h3>
                <button 
                  onClick={() => console.log('Create new adjustment')}
                  style={{
                    background: '#9c27b0',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  + Create New Adjustment
                </button>
              </div>
              
              <div style={{
                padding: '40px',
                textAlign: 'center',
                color: '#666'
              }}>
                <p>No recent adjustments. Create an adjustment to modify inventory levels.</p>
              </div>
            </div>
          </div>
        )}
    </>
  );
}

export default Operations;
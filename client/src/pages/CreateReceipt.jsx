import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

function CreateReceipt() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  
  const [formData, setFormData] = useState({
    receiveFrom: '',
    responsible: '',
    scheduleDate: new Date().toISOString().split('T')[0],
    warehouseId: '',
    notes: ''
  });

  const [receiptLines, setReceiptLines] = useState([
    {
      productId: '',
      quantity: '',
      unitCost: ''
    }
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.warehouseId) {
      console.log('=== LOCATION FILTERING DEBUG ===');
      console.log('Selected Warehouse ID:', formData.warehouseId, typeof formData.warehouseId);
      console.log('All locations:', locations);
      
      // Try both string and number comparison
      const filtered = locations.filter(loc => {
        console.log(`Location ${loc.name}: warehouse_id =`, loc.warehouse_id, typeof loc.warehouse_id);
        return loc.warehouse_id == formData.warehouseId; // Use == for loose comparison
      });
      
      console.log('Filtered locations:', filtered);
      console.log('================================');
      setFilteredLocations(filtered);
    } else {
      setFilteredLocations([]);
    }
  }, [formData.warehouseId, locations]);

  const fetchData = async () => {
    try {
      const [productsRes, warehousesRes, locationsRes] = await Promise.all([
        axios.get(`${API_URL}/inventory/products`),
        axios.get(`${API_URL}/inventory/warehouses`),
        axios.get(`${API_URL}/inventory/locations`)
      ]);

      console.log('Fetched products:', productsRes.data.products?.length);
      console.log('Fetched warehouses:', warehousesRes.data.warehouses?.length);
      console.log('Fetched locations:', locationsRes.data.locations?.length);
      console.log('Locations data:', locationsRes.data.locations);

      setProducts(productsRes.data.products || []);
      setWarehouses(warehousesRes.data.warehouses || []);
      setLocations(locationsRes.data.locations || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to load form data');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLineChange = (index, field, value) => {
    const newLines = [...receiptLines];
    newLines[index][field] = value;

    // Auto-fill unit cost when product is selected
    if (field === 'productId' && value) {
      const product = products.find(p => p.id === parseInt(value));
      if (product) {
        newLines[index].unitCost = product.default_cost || '';
      }
    }

    setReceiptLines(newLines);
  };

  const addLine = () => {
    setReceiptLines([...receiptLines, {
      productId: '',
      quantity: '',
      unitCost: ''
    }]);
  };

  const removeLine = (index) => {
    if (receiptLines.length > 1) {
      const newLines = receiptLines.filter((_, i) => i !== index);
      setReceiptLines(newLines);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.receiveFrom) {
      alert('Please fill in supplier/receive from field');
      return;
    }

    const validLines = receiptLines.filter(line => 
      line.productId && line.quantity > 0
    );

    if (validLines.length === 0) {
      alert('Please add at least one valid product line');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        receiveFrom: formData.receiveFrom,
        responsible: formData.responsible,
        scheduleDate: formData.scheduleDate,
        warehouseId: formData.warehouseId ? parseInt(formData.warehouseId) : null,
        notes: formData.notes,
        lines: validLines.map(line => ({
          productId: line.productId,
          quantity: parseFloat(line.quantity),
          unitCost: parseFloat(line.unitCost) || 0
        }))
      };

      const response = await axios.post(`${API_URL}/inventory/receipts`, payload);

      alert('Receipt created successfully!');
      navigate('/operations');
    } catch (error) {
      console.error('Error creating receipt:', error);
      alert(error.response?.data?.error || 'Failed to create receipt');
    } finally {
      setLoading(false);
    }
  };

  const getTotalAmount = () => {
    return receiptLines.reduce((sum, line) => {
      const quantity = parseFloat(line.quantity) || 0;
      const cost = parseFloat(line.unitCost) || 0;
      return sum + (quantity * cost);
    }, 0).toFixed(2);
  };

  return (
    <div className="create-receipt-page" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <button 
          onClick={() => navigate('/operations')}
          style={{
            padding: '8px 16px',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            background: 'white',
            cursor: 'pointer',
            marginBottom: '1rem'
          }}
        >
          ← Back to Operations
        </button>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b' }}>Create New Receipt</h1>
        <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
          Receive products into your warehouse inventory
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Receipt Header */}
        <div className="info-card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '1.5rem', color: '#1e293b' }}>
            Receipt Information
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569' }}>
                Receive From *
              </label>
              <input
                type="text"
                name="receiveFrom"
                value={formData.receiveFrom}
                onChange={handleInputChange}
                placeholder="Supplier name"
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '15px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569' }}>
                Responsible Person
              </label>
              <input
                type="text"
                name="responsible"
                value={formData.responsible}
                onChange={handleInputChange}
                placeholder="Person responsible (optional)"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '15px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569' }}>
                Schedule Date *
              </label>
              <input
                type="date"
                name="scheduleDate"
                value={formData.scheduleDate}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '15px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569' }}>
                Warehouse
              </label>
              <select
                name="warehouseId"
                value={formData.warehouseId}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '15px'
                }}
              >
                <option value="">Select Warehouse (Optional)</option>
                {warehouses.map(wh => (
                  <option key={wh.id} value={wh.id}>{wh.name}</option>
                ))}
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569' }}>
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Additional notes..."
                rows="3"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '15px',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>
        </div>

        {/* Receipt Lines */}
        <div className="info-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
              Products to Receive
            </h2>
            <button
              type="button"
              onClick={addLine}
              style={{
                padding: '8px 16px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              + Add Line
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', width: '40%' }}>Product</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Quantity</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Unit Cost</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Total</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {receiptLines.map((line, index) => {
                  const lineTotal = (parseFloat(line.quantity) || 0) * (parseFloat(line.unitCost) || 0);
                  
                  return (
                    <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px' }}>
                        <select
                          value={line.productId}
                          onChange={(e) => handleLineChange(index, 'productId', e.target.value)}
                          required
                          style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}
                        >
                          <option value="">Select Product</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} {p.sku ? `(${p.sku})` : ''}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <input
                          type="number"
                          value={line.quantity}
                          onChange={(e) => handleLineChange(index, 'quantity', e.target.value)}
                          placeholder="0"
                          min="0"
                          step="0.01"
                          required
                          style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            fontSize: '14px',
                            textAlign: 'right'
                          }}
                        />
                      </td>
                      <td style={{ padding: '12px' }}>
                        <input
                          type="number"
                          value={line.unitCost}
                          onChange={(e) => handleLineChange(index, 'unitCost', e.target.value)}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            fontSize: '14px',
                            textAlign: 'right'
                          }}
                        />
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>
                        ${lineTotal.toFixed(2)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => removeLine(index)}
                          disabled={receiptLines.length === 1}
                          style={{
                            padding: '6px 12px',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: receiptLines.length === 1 ? 'not-allowed' : 'pointer',
                            opacity: receiptLines.length === 1 ? 0.5 : 1,
                            fontSize: '13px'
                          }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid #e2e8f0', fontWeight: '700' }}>
                  <td colSpan="4" style={{ padding: '12px', textAlign: 'right' }}>
                    Total Amount:
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontSize: '18px', color: '#3b82f6' }}>
                    ${getTotalAmount()}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => navigate('/operations')}
            style={{
              padding: '12px 24px',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              background: 'white',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '600'
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px 32px',
              background: loading ? '#94a3b8' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '15px',
              fontWeight: '600'
            }}
          >
            {loading ? 'Creating...' : 'Create Receipt'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateReceipt;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

function CreateDelivery() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  
  const [formData, setFormData] = useState({
    deliveryAddress: '',
    responsible: '',
    scheduleDate: new Date().toISOString().split('T')[0],
    warehouseId: '',
    notes: ''
  });

  const [deliveryLines, setDeliveryLines] = useState([
    {
      productId: '',
      quantity: '',
      unitPrice: ''
    }
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.warehouseId) {
      const filtered = locations.filter(loc => {
        return loc.warehouse_id == formData.warehouseId;
      });
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
    const newLines = [...deliveryLines];
    newLines[index][field] = value;

    // Auto-fill unit price when product is selected
    if (field === 'productId' && value) {
      const product = products.find(p => p.id === parseInt(value));
      if (product) {
        newLines[index].unitPrice = product.default_price || product.default_cost || '';
      }
    }

    setDeliveryLines(newLines);
  };

  const addLine = () => {
    setDeliveryLines([...deliveryLines, {
      productId: '',
      quantity: '',
      unitPrice: ''
    }]);
  };

  const removeLine = (index) => {
    if (deliveryLines.length > 1) {
      const newLines = deliveryLines.filter((_, i) => i !== index);
      setDeliveryLines(newLines);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.deliveryAddress) {
      alert('Please fill in delivery address field');
      return;
    }

    const validLines = deliveryLines.filter(line => 
      line.productId && line.quantity > 0
    );

    if (validLines.length === 0) {
      alert('Please add at least one valid product line');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        deliveryAddress: formData.deliveryAddress,
        responsible: formData.responsible,
        scheduleDate: formData.scheduleDate,
        warehouseId: formData.warehouseId ? parseInt(formData.warehouseId) : null,
        notes: formData.notes,
        lines: validLines.map(line => ({
          productId: line.productId,
          quantity: parseFloat(line.quantity),
          unitPrice: parseFloat(line.unitPrice) || 0
        }))
      };

      const response = await axios.post(`${API_URL}/inventory/deliveries`, payload);

      alert('Delivery created successfully!');
      navigate('/operations');
    } catch (error) {
      console.error('Error creating delivery:', error);
      alert(error.response?.data?.error || 'Failed to create delivery');
    } finally {
      setLoading(false);
    }
  };

  const getTotalAmount = () => {
    return deliveryLines.reduce((sum, line) => {
      const quantity = parseFloat(line.quantity) || 0;
      const price = parseFloat(line.unitPrice) || 0;
      return sum + (quantity * price);
    }, 0).toFixed(2);
  };

  return (
    <div className="create-delivery-page" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
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
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b' }}>Create New Delivery</h1>
        <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
          Create a delivery order to ship products from your warehouse
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Delivery Header */}
        <div className="info-card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '1.5rem', color: '#1e293b' }}>
            Delivery Information
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569' }}>
                Delivery Address *
              </label>
              <input
                type="text"
                name="deliveryAddress"
                value={formData.deliveryAddress}
                onChange={handleInputChange}
                placeholder="Customer address"
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

        {/* Delivery Lines */}
        <div className="info-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
              Products to Deliver
            </h2>
            <button
              type="button"
              onClick={addLine}
              style={{
                padding: '8px 16px',
                background: '#4caf50',
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
                  <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Unit Price</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Total</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {deliveryLines.map((line, index) => {
                  const lineTotal = (parseFloat(line.quantity) || 0) * (parseFloat(line.unitPrice) || 0);
                  
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
                          value={line.unitPrice}
                          onChange={(e) => handleLineChange(index, 'unitPrice', e.target.value)}
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
                          disabled={deliveryLines.length === 1}
                          style={{
                            padding: '6px 12px',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: deliveryLines.length === 1 ? 'not-allowed' : 'pointer',
                            opacity: deliveryLines.length === 1 ? 0.5 : 1,
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
                  <td colSpan="3" style={{ padding: '12px', textAlign: 'right' }}>
                    Total Amount:
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontSize: '18px', color: '#4caf50' }}>
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
              background: loading ? '#94a3b8' : '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '15px',
              fontWeight: '600'
            }}
          >
            {loading ? 'Creating...' : 'Create Delivery'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateDelivery;

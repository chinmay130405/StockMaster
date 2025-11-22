import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

function CreateAdjustment() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [stockLevels, setStockLevels] = useState({});
  
  const [formData, setFormData] = useState({
    adjustmentDate: new Date().toISOString().split('T')[0],
    reason: 'Count Correction',
    responsible: '',
    warehouseId: '',
    notes: ''
  });

  const [adjustmentLines, setAdjustmentLines] = useState([
    {
      productId: '',
      locationId: '',
      currentQuantity: 0,
      countedQuantity: '',
      lineReason: ''
    }
  ]);

  const reasonOptions = [
    'Count Correction',
    'Damaged Goods',
    'Lost/Stolen',
    'Found Items',
    'Expired',
    'Quality Issue',
    'System Correction',
    'Other'
  ];

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
      
      // Fetch stock levels separately to avoid blocking the form
      try {
        const stockRes = await axios.get(`${API_URL}/inventory/stock-levels`);
        console.log('Fetched stock levels:', stockRes.data.stockLevels?.length);
        
        // Create stock level lookup
        const stockLookup = {};
        if (stockRes.data.stockLevels) {
          stockRes.data.stockLevels.forEach(stock => {
            const key = `${stock.product_id}_${stock.location_id}`;
            stockLookup[key] = stock.quantity || 0;
          });
        }
        setStockLevels(stockLookup);
      } catch (stockError) {
        console.error('Error fetching stock levels:', stockError);
        // Continue with empty stock levels - user can still create adjustments
        setStockLevels({});
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to load form data: ' + (error.response?.data?.error || error.message));
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
    const newLines = [...adjustmentLines];
    newLines[index][field] = value;

    // Update current quantity when product/location changes
    if ((field === 'productId' || field === 'locationId') && newLines[index].productId && newLines[index].locationId) {
      const key = `${newLines[index].productId}_${newLines[index].locationId}`;
      newLines[index].currentQuantity = stockLevels[key] || 0;
    }

    setAdjustmentLines(newLines);
  };

  const addLine = () => {
    setAdjustmentLines([...adjustmentLines, {
      productId: '',
      locationId: '',
      currentQuantity: 0,
      countedQuantity: '',
      lineReason: ''
    }]);
  };

  const removeLine = (index) => {
    if (adjustmentLines.length > 1) {
      const newLines = adjustmentLines.filter((_, i) => i !== index);
      setAdjustmentLines(newLines);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    const validLines = adjustmentLines.filter(line => 
      line.productId && line.locationId && line.countedQuantity !== ''
    );

    if (validLines.length === 0) {
      alert('Please add at least one valid adjustment line');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        adjustmentDate: formData.adjustmentDate,
        reason: formData.reason,
        responsible: formData.responsible,
        notes: formData.notes,
        lines: validLines.map(line => ({
          productId: line.productId,
          locationId: line.locationId,
          currentQuantity: parseFloat(line.currentQuantity) || 0,
          countedQuantity: parseFloat(line.countedQuantity),
          adjustmentQuantity: parseFloat(line.countedQuantity) - (parseFloat(line.currentQuantity) || 0),
          lineReason: line.lineReason || formData.reason
        }))
      };

      const response = await axios.post(`${API_URL}/inventory/adjustments`, payload);

      alert('Adjustment created successfully!');
      navigate('/operations');
    } catch (error) {
      console.error('Error creating adjustment:', error);
      alert(error.response?.data?.error || 'Failed to create adjustment');
    } finally {
      setLoading(false);
    }
  };

  const getAdjustmentQuantity = (line) => {
    if (line.countedQuantity === '') return 0;
    return parseFloat(line.countedQuantity) - (parseFloat(line.currentQuantity) || 0);
  };

  return (
    <div className="create-adjustment-page" style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
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
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b' }}>Create Inventory Adjustment</h1>
        <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
          Adjust inventory levels for damaged, lost, or found items
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Adjustment Header */}
        <div className="info-card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '1.5rem', color: '#1e293b' }}>
            Adjustment Information
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569' }}>
                Adjustment Date *
              </label>
              <input
                type="date"
                name="adjustmentDate"
                value={formData.adjustmentDate}
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
                Reason *
              </label>
              <select
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '15px'
                }}
              >
                {reasonOptions.map(reason => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </select>
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
                placeholder="Additional notes about this adjustment..."
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

        {/* Adjustment Lines */}
        <div className="info-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
              Adjustment Lines
            </h2>
            <button
              type="button"
              onClick={addLine}
              style={{
                padding: '8px 16px',
                background: '#9c27b0',
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
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', width: '20%' }}>Product</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', width: '15%' }}>Location</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Current Qty</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Counted Qty</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Adjustment</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', width: '15%' }}>Line Reason</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {adjustmentLines.map((line, index) => {
                  const adjustment = getAdjustmentQuantity(line);
                  const adjustmentColor = adjustment > 0 ? '#4caf50' : adjustment < 0 ? '#ef4444' : '#666';
                  
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
                        <select
                          value={line.locationId}
                          onChange={(e) => handleLineChange(index, 'locationId', e.target.value)}
                          required
                          style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}
                        >
                          <option value="">Select Location</option>
                          {(formData.warehouseId ? filteredLocations : locations).map(loc => (
                            <option key={loc.id} value={loc.id}>
                              {loc.name} ({loc.warehouse_name})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#666' }}>
                        {line.currentQuantity}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <input
                          type="number"
                          value={line.countedQuantity}
                          onChange={(e) => handleLineChange(index, 'countedQuantity', e.target.value)}
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
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: adjustmentColor }}>
                        {adjustment > 0 ? '+' : ''}{adjustment.toFixed(2)}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <input
                          type="text"
                          value={line.lineReason}
                          onChange={(e) => handleLineChange(index, 'lineReason', e.target.value)}
                          placeholder="Optional"
                          style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}
                        />
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => removeLine(index)}
                          disabled={adjustmentLines.length === 1}
                          style={{
                            padding: '6px 12px',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: adjustmentLines.length === 1 ? 'not-allowed' : 'pointer',
                            opacity: adjustmentLines.length === 1 ? 0.5 : 1,
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
              background: loading ? '#94a3b8' : '#9c27b0',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '15px',
              fontWeight: '600'
            }}
          >
            {loading ? 'Creating...' : 'Create Adjustment'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateAdjustment;

# Operations Guide - StockMaster

## ✅ What's Implemented

### 1. **Operations Page** (`/operations`)
- View all receipts and deliveries from the database
- Real-time statistics (late, waiting, total operations)
- Tabbed interface for Receipt, Delivery, and Adjustment operations
- Complete table listing with document numbers, responsible persons, schedule dates
- Status badges (Draft, Ready, Waiting, Done)
- Navigate to create new receipts or deliveries

### 2. **Create Receipt Page** (`/create-receipt`)
- Form to create new warehouse receipts
- Fields:
  - Receive From (supplier name)
  - Responsible Person
  - Schedule Date
  - Warehouse Selection
  - Notes
- Add multiple product lines with:
  - Product selection (auto-fills unit cost from default_cost)
  - Location selection (filtered by selected warehouse)
  - Quantity
  - Unit Cost
- Calculate total amount automatically
- Creates receipt in "Draft" status
- Generates document number (WH/IN/0001, WH/IN/0002, etc.)

### 3. **Move History Page** (`/move-history`)
- View all stock movements from the database
- Real-time statistics:
  - Total Movements
  - Receipt movements (in)
  - Delivery movements (out)
  - Adjustment movements
- Filter by operation type (all, receipt, delivery, adjustment)
- Complete movement history with:
  - Date/Time
  - Movement Type (Receipt/Delivery/Adjustment)
  - Product name and SKU
  - Location and Warehouse
  - Quantity with +/- indicators
  - Document reference number

### 4. **Backend API Endpoints**

#### Receipts
- `GET /api/inventory/receipts` - List all receipts
- `POST /api/inventory/receipts` - Create new receipt
- `GET /api/inventory/receipts/:id` - Get receipt details with lines
- `PUT /api/inventory/receipts/:id/validate` - Validate receipt (Draft → Ready)
- `PUT /api/inventory/receipts/:id/process` - Process receipt (Ready → Done, updates stock)

#### Deliveries
- `GET /api/inventory/deliveries` - List all deliveries

#### Stock Movements
- `GET /api/inventory/stock-movements` - Get all stock movements (move history)
  - Supports filters: startDate, endDate, movementType

## 📋 Receipt Workflow

1. **Create Receipt** (Status: Draft)
   - User fills form with supplier info, date, warehouse
   - Adds product lines with quantities and costs
   - System generates document number (WH/IN/0001)
   - Receipt saved to database with status "Draft"

2. **Validate Receipt** (Status: Ready)
   - Review receipt details
   - Call PUT `/api/inventory/receipts/:id/validate`
   - Status changes from "Draft" to "Ready"

3. **Process Receipt** (Status: Done)
   - Call PUT `/api/inventory/receipts/:id/process`
   - System updates stock_levels table:
     - If product+location exists: adds quantity
     - If new: creates stock_level record
   - Creates stock_movements record (movement_type='in')
   - Receipt status changes to "Done"
   - Stock is now available in inventory

## 🗂️ Database Tables Used

### receipts
- id, document_no, receive_from, responsible, schedule_date, status, notes
- Status: Draft, Ready, Done

### receipt_lines
- receipt_id, product_id, location_id, quantity, unit_cost

### deliveries
- id, document_no, delivery_address, responsible, schedule_date, status, operation_type
- Status: Draft, Waiting, Ready, Done

### stock_levels
- product_id, location_id, quantity
- Updated when receipts/deliveries are processed

### stock_movements
- product_id, location_id, movement_type (in/out/adjustment), quantity
- reference_type (receipt/delivery/adjustment), reference_id
- Tracks all inventory changes for audit trail

## 🎯 Next Steps to Complete

1. **Receipt Detail View** (`/receipt/:id`)
   - View complete receipt with all lines
   - Validate button (Draft → Ready)
   - Process button (Ready → Done)
   - Print/Export functionality

2. **Create Delivery Page** (`/create-delivery`)
   - Similar to Create Receipt
   - Document number format: WH/OUT/0001
   - Status workflow: Draft → Waiting → Ready → Done
   - Reduces stock when processed

3. **Delivery Detail View** (`/delivery/:id`)
   - View delivery details
   - Status transition buttons
   - Process delivery (reduces stock)

4. **Adjustments**
   - Create inventory adjustments (stock corrections)
   - Reason codes
   - Movement type: 'adjustment'

## 🔄 How to Test

1. **Create a Receipt**:
   ```
   Navigate to: http://localhost:5174/operations
   Click "Create New Receipt"
   Fill form and add product lines
   Submit
   ```

2. **View Move History**:
   ```
   Navigate to: http://localhost:5174/move-history
   See all movements (currently empty until receipts are processed)
   ```

3. **Process Receipt** (via API):
   ```bash
   # Validate receipt
   curl -X PUT http://localhost:5000/api/inventory/receipts/1/validate

   # Process receipt (updates stock)
   curl -X PUT http://localhost:5000/api/inventory/receipts/1/process
   ```

4. **Check Stock Levels**:
   ```
   Navigate to: http://localhost:5174/products
   See updated quantities after processing receipt
   ```

## 📊 Current Status

✅ Operations page with real database data  
✅ Create Receipt functionality  
✅ Move History page with stock movements  
✅ Backend API for receipts with validation and processing  
✅ Stock level updates when receipts processed  
✅ Stock movement tracking  
⏳ Receipt detail view (pending)  
⏳ Create Delivery (pending)  
⏳ Delivery detail view (pending)  
⏳ Adjustment operations (pending)  

## 🚀 Running the Application

**Backend**: `http://localhost:5000`  
**Frontend**: `http://localhost:5174`

All inventory operations are now connected to your PostgreSQL database!

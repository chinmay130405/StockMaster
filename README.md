# 📦 **StockMaster — Warehouse & Inventory Management System**

A modern, full-stack **warehouse management system** with multi-warehouse stock tracking, receipts, deliveries, internal transfers, and complete movement history.
Built using **React + Node.js + Express + PostgreSQL + SQLite (Auth)**.

---

## 🚀 **Key Features**

### 🔐 Authentication

* Secure JWT login
* Bcrypt password hashing
* OTP-based password reset (email or console)
* Protected API routes

### 🏷️ Products & Categories

* Product catalog with SKU, pricing, description
* Category management
* Real-time stock visibility

### 🏢 Warehouses & Locations

* Multiple warehouses
* Racks, bins, shelves, and other location types
* Stock at location-level (granular control)

### 📥 Inventory Operations

* **Receipts (Incoming stock)**
* **Deliveries (Outgoing stock)**
* **Internal Transfers (Warehouse → Warehouse)**
* **Inventory Adjustments**

### 📊 Stock Tracking

* On-hand, reserved, and available quantities
* Live recalculation via stock ledger
* Full movement audit trail

### 🧩 Utilities

* Built-in PostgreSQL Data Viewer
* Search, filters, dashboards
* Clean & responsive UI (mobile-ready)

---

## 🏗️ **Tech Stack**

### **Frontend**

* React 18
* Vite
* Axios
* React Router
* Modern CSS

### **Backend**

* Node.js + Express
* PostgreSQL (main DB)
* SQLite (authentication DB)
* JWT + bcrypt
* Nodemailer (optional)

### **Tools**

* npm
* dotenv
* pg (Postgres driver)
* better-sqlite3

---

## ⚙️ **Installation Guide**

### **Clone the project**

```powershell
git clone <your-repo-url>
cd StockMaster
```

---

### **Backend Setup**

```powershell
cd server
npm install
```

Create `.env`:

```env
PORT=5000
NODE_ENV=development

JWT_SECRET=your-32-char-secret
JWT_EXPIRES_IN=7d

# SQLite (Auth DB)
DB_FILE=./database.db

# PostgreSQL
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=stockmaster
PG_USER=postgres
PG_PASSWORD=yourpass

CLIENT_URL=http://localhost:5173
```

Start backend:

```powershell
npm run dev
```

---

### 4️⃣ **Frontend Setup**

```powershell
cd client
npm install
npm run dev
```

Runs at:

```
http://localhost:5173
```

---

## 📁 **Project Structure**

```
StockMaster/
│
├── server/               # Backend
│   ├── routes/           # API endpoints
│   ├── middleware/       # Auth & validation
│   ├── utils/            # OTP, validation
│   ├── server.js         # App entry
│   ├── db.js             # Database connections
│   └── *.ps1             # Dev scripts
│
├── client/               # Frontend
│   ├── src/
│   │   ├── pages/        # App screens
│   │   ├── components/
│   │   ├── api.js        # API client
│   │   └── index.css
│   └── vite.config.js
│
└── documentation/

---


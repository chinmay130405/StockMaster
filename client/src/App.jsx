import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import TestDatabase from './pages/TestDatabase';
import Dashboard from './pages/DashboardNew';
import Operations from './pages/Operations';
import Stock from './pages/Stock';
import Warehouses from './pages/Warehouses';
import Locations from './pages/Locations';
import MoveHistory from './pages/MoveHistory';
import Settings from './pages/Settings';
import CreateReceipt from './pages/CreateReceipt';
import './index.css';

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Default route - Dashboard */}
        <Route path="/" element={<Dashboard />} />
        
        {/* Test Database Page */}
        <Route path="/test-database" element={<TestDatabase />} />
        
        {/* Main App Pages */}
        <Route path="/operations" element={<Operations />} />
        <Route path="/products" element={<Stock />} />
        <Route path="/warehouses" element={<Warehouses />} />
        <Route path="/locations" element={<Locations />} />
        <Route path="/move-history" element={<MoveHistory />} />
        <Route path="/settings" element={<Settings />} />
        
        {/* Operations Pages */}
        <Route path="/create-receipt" element={<CreateReceipt />} />
        
        {/* 404 fallback - redirect to dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

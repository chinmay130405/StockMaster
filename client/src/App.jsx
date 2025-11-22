import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import TestDatabase from './pages/TestDatabase';
import Dashboard from './pages/DashboardNew';
import Operations from './pages/Operations';
import Stock from './pages/Stock';
import Warehouses from './pages/Warehouses';
import Locations from './pages/Locations';
import MoveHistory from './pages/MoveHistory';
import Settings from './pages/Settings';
import CreateReceipt from './pages/CreateReceipt';
import CreateDelivery from './pages/CreateDelivery';
import CreateAdjustment from './pages/CreateAdjustment';
import './index.css';

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Routes with Layout */}
        <Route path="/" element={<Layout><Dashboard /></Layout>} />
        <Route path="/operations" element={<Layout><Operations /></Layout>} />
        <Route path="/products" element={<Layout><Stock /></Layout>} />
        <Route path="/move-history" element={<Layout><MoveHistory /></Layout>} />
        <Route path="/settings" element={<Layout><Settings /></Layout>} />
        <Route path="/warehouses" element={<Layout><Warehouses /></Layout>} />
        <Route path="/locations" element={<Layout><Locations /></Layout>} />
        <Route path="/create-receipt" element={<Layout><CreateReceipt /></Layout>} />
        <Route path="/create-delivery" element={<Layout><CreateDelivery /></Layout>} />
        <Route path="/create-adjustment" element={<Layout><CreateAdjustment /></Layout>} />
        
        {/* Test Database Page (without layout) */}
        <Route path="/test-database" element={<TestDatabase />} />
        
        {/* 404 fallback - redirect to dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

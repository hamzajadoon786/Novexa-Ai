import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react_router_dom';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import FeaturesContainer from './pages/FeaturesContainer';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Directly load Dashboard without any auth check */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/features" element={<FeaturesContainer />} />
        
        {/* Redirect any other path to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
      }

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import AuthGuard from './components/layout/AuthGuard';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import FeaturesContainer from './pages/FeaturesContainer';
import Settings from './pages/Settings';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
        {/* Main Application Layout */}
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Application Routes */}
          <Route
            path="/*"
            element={
              <AuthGuard>
                <div className="flex w-full h-full">
                  <Sidebar />
                  <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/chat" element={<FeaturesContainer />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </main>
                </div>
              </AuthGuard>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;

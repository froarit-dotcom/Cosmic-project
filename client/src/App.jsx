import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';

import Dashboard from './pages/Dashboard';
import Masters from './pages/Masters';
import StaffMaster from './pages/StaffMaster';
import Inventory from './pages/Inventory';
import Customers from './pages/Customers';
import Quotations from './pages/Quotations';
import Invoices from './pages/Invoices';

const ProtectedRoute = ({ children, adminOnly, feature }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'ADMIN') return <Navigate to="/invoices" />;
  if (feature && user.role !== 'ADMIN' && !user.permissions?.includes(feature)) return <Navigate to="/invoices" />;

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<ProtectedRoute adminOnly><Dashboard /></ProtectedRoute>} />
        <Route path="invoices" element={<ProtectedRoute feature="invoices"><Invoices /></ProtectedRoute>} />
        <Route path="quotations" element={<ProtectedRoute feature="quotations"><Quotations /></ProtectedRoute>} />
        <Route path="customers" element={<ProtectedRoute feature="customers"><Customers /></ProtectedRoute>} />
        <Route path="inventory" element={<ProtectedRoute feature="inventory"><Inventory /></ProtectedRoute>} />

        {/* Admin Only Masters */}
        <Route path="materials" element={<ProtectedRoute adminOnly><Masters /></ProtectedRoute>} />
        <Route path="staff" element={<ProtectedRoute adminOnly><StaffMaster /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
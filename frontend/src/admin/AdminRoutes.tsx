import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Tests from './pages/Tests';
import Users from './pages/Users';
import AdminLayout from './components/AdminLayout';
import { AdminProvider, useAdmin } from './context/AdminContext';

// Protected route component for admin routes
const ProtectedAdminRoute: React.FC<{ element: React.ReactNode }> = ({ element }) => {
  const { isAdmin, loading, adminChecked } = useAdmin();

  // For debugging
  console.log('ProtectedAdminRoute:', { isAdmin, loading, adminChecked });

  // Show loading state while checking admin status
  if (loading) {
    return <div>Loading...</div>;
  }

  // If check is completed and user is not admin, redirect to login
  if (adminChecked && !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  // If admin status verified, render the element
  return <>{element}</>;
};

// Admin routes wrapped with AdminProvider for context
const AdminRoutesWithProvider: React.FC = () => {
  return (
    <AdminProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/dashboard" element={
          <ProtectedAdminRoute
            element={
              <AdminLayout>
                <Dashboard />
              </AdminLayout>
            }
          />
        } />
        <Route path="/tests" element={
          <ProtectedAdminRoute
            element={
              <AdminLayout>
                <Tests />
              </AdminLayout>
            }
          />
        } />
        <Route path="/users" element={
          <ProtectedAdminRoute
            element={
              <AdminLayout>
                <Users />
              </AdminLayout>
            }
          />
        } />
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </AdminProvider>
  );
};

export default AdminRoutesWithProvider; 
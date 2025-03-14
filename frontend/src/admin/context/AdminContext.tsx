import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface AdminContextType {
  isAdmin: boolean;
  loading: boolean;
  adminChecked: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

interface AdminProviderProps {
  children: ReactNode;
}

export const AdminProvider = ({ children }: AdminProviderProps) => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [adminChecked, setAdminChecked] = useState<boolean>(false);

  useEffect(() => {
    const checkAdmin = async () => {
      // Wait for auth to complete
      if (authLoading) return;

      setLoading(true);

      // Check if user is authenticated and is admin
      if (isAuthenticated && user?.isAdmin) {
        setIsAdmin(true);
      } else if (isAuthenticated && !user?.isAdmin) {
        // User is authenticated but not an admin
        setIsAdmin(false);
        // Redirect to login instead of unauthorized page
        navigate('/login');
      } else if (!isAuthenticated) {
        // Not authenticated, redirect to login
        setIsAdmin(false);
        navigate('/login');
      }

      setAdminChecked(true);
      setLoading(false);
    };

    checkAdmin();
  }, [user, isAuthenticated, authLoading, navigate]);

  return (
    <AdminContext.Provider value={{ isAdmin, loading, adminChecked }}>
      {isAdmin || loading ? children : null}
    </AdminContext.Provider>
  );
};

export default AdminContext; 
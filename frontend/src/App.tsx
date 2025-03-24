import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NavbarProvider, useNavbar } from './context/NavbarContext';
import { ThemeProvider } from './context/ThemeContext';
import { CssBaseline } from '@mui/material';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Pricing from './pages/Pricing';
import PaymentSuccess from './pages/PaymentSuccess';
import TestPage from './pages/TestPage';
import AdminRoutesWithProvider from './admin/AdminRoutes';
import './App.css';
import './styles/Auth.css';

// Layout component that conditionally renders the navbar
const MainLayout = () => {
  const { showNavbar } = useNavbar();
  
  return (
    <>
      {showNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/pricing" element={<Pricing />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/test/:testId" element={<TestPage />} />
        </Route>
      </Routes>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <CssBaseline />
        <NavbarProvider>
          <Router>
            <Routes>
              {/* Admin Routes */}
              <Route path="/admin/*" element={<AdminRoutesWithProvider />} />
              
              {/* Public Routes with conditional Navbar */}
              <Route path="/*" element={<MainLayout />} />
            </Routes>
          </Router>
        </NavbarProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;

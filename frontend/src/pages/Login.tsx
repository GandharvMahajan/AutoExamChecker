import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  
  const { email, password } = formData;

  // Check for message from location state (e.g., from payment redirect)
  useEffect(() => {
    if (location.state && location.state.message) {
      setMessage(location.state.message);
    }
  }, [location.state]);
  
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  
  const validateForm = () => {
    const validationErrors: string[] = [];
    
    if (!email.trim()) {
      validationErrors.push('Email is required');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      validationErrors.push('Email is invalid');
    }
    
    if (!password) {
      validationErrors.push('Password is required');
    }
    
    return validationErrors;
  };
  
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setErrors([]);
    setIsLoading(true);
    
    try {
      const result = await authService.login(email, password);
      login(result.token, result.user);
      
      // Check if there's a pending payment to process
      const pendingPayment = localStorage.getItem('pendingPayment');
      if (pendingPayment) {
        // Clear the pending payment from localStorage
        localStorage.removeItem('pendingPayment');
        
        // Parse the pending payment data
        const { sessionId, plan } = JSON.parse(pendingPayment);
        
        // Redirect to payment success page with the session ID and plan
        navigate(`/payment-success?session_id=${sessionId}&plan=${plan}`);
      } else {
        // If no pending payment, redirect to dashboard
        navigate(location.state?.from || '/dashboard');
      }
    } catch (error) {
      if (error instanceof Error) {
        setErrors([error.message]);
      } else if (typeof error === 'object' && error !== null) {
        // Handle API error response
        const errorObj = error as { message?: string, errors?: Array<{ msg: string }> };
        if (errorObj.message) {
          setErrors([errorObj.message]);
        } else if (errorObj.errors && Array.isArray(errorObj.errors)) {
          setErrors(errorObj.errors.map(e => e.msg));
        } else {
          setErrors(['Login failed']);
        }
      } else {
        setErrors(['Login failed']);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <h2>Login</h2>
        
        {message && (
          <div className="info-container">
            <p className="info-text">{message}</p>
          </div>
        )}
        
        {errors.length > 0 && (
          <div className="error-container">
            {errors.map((error, index) => (
              <p key={index} className="error-text">{error}</p>
            ))}
          </div>
        )}
        
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={onChange}
              placeholder="Enter your email"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={onChange}
              placeholder="Enter your password"
            />
          </div>
          
          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <p className="auth-redirect">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login; 
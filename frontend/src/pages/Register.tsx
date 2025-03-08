import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const { name, email, password, confirmPassword } = formData;
  
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  
  const validateForm = () => {
    const validationErrors: string[] = [];
    
    if (!name.trim()) {
      validationErrors.push('Name is required');
    }
    
    if (!email.trim()) {
      validationErrors.push('Email is required');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      validationErrors.push('Email is invalid');
    }
    
    if (!password) {
      validationErrors.push('Password is required');
    } else if (password.length < 6) {
      validationErrors.push('Password must be at least 6 characters');
    }
    
    if (password !== confirmPassword) {
      validationErrors.push('Passwords do not match');
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
      const result = await authService.register(name, email, password);
      login(result.token, result.user);
      navigate('/dashboard');
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
          setErrors(['Registration failed']);
        }
      } else {
        setErrors(['Registration failed']);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <h2>Register</h2>
        
        {errors.length > 0 && (
          <div className="error-container">
            {errors.map((error, index) => (
              <p key={index} className="error-text">{error}</p>
            ))}
          </div>
        )}
        
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={name}
              onChange={onChange}
              placeholder="Enter your name"
            />
          </div>
          
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
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={confirmPassword}
              onChange={onChange}
              placeholder="Confirm your password"
            />
          </div>
          
          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? 'Registering...' : 'Register'}
          </button>
        </form>
        
        <p className="auth-redirect">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register; 
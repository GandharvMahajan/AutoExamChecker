import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Typography, Box, Paper, Button, CircularProgress, Alert } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAuth } from '../context/AuthContext';
import { useCredits } from '../hooks/useCredits';
import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const query = useQuery();
  const { isAuthenticated, user, token, login } = useAuth();
  const { refreshCredits } = useCredits();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const sessionId = query.get('session_id');
  const plan = query.get('plan');

  useEffect(() => {
    if (!isAuthenticated || !token) {
      navigate('/login');
      return;
    }

    if (!sessionId || !plan) {
      setError('Missing payment information. Please try again.');
      setLoading(false);
      return;
    }

    const verifyPayment = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/v1/payment/payment-success`,
          {
            params: { sessionId, plan },
            headers: {
              'x-auth-token': token
            }
          }
        );

        if (response.data.success) {
          setSuccess(true);
          
          // Update the user in context with new credit information
          if (user && response.data.user) {
            // Create updated user object with new test counts
            const updatedUser = {
              ...user,
              testsPurchased: response.data.user.testsPurchased,
              testsUsed: response.data.user.testsUsed
            };
            
            // Update the user in context with the same token
            login(token, updatedUser);
          }
          
          // Refresh credits from API
          refreshCredits();
          
          // Automatically redirect to dashboard after 3 seconds
          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
        } else {
          setError('Payment verification failed. Please contact support.');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setError('There was an error verifying your payment. Please contact support.');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [isAuthenticated, token, sessionId, plan, navigate, refreshCredits, user, login]);

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        {loading ? (
          <Box display="flex" flexDirection="column" alignItems="center" py={4}>
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="h5">Verifying your payment...</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
              Please wait while we confirm your purchase.
            </Typography>
          </Box>
        ) : error ? (
          <Box>
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
            <Typography variant="body1" sx={{ mb: 3 }}>
              If you believe this is an error, please contact our support team with your reference ID: {sessionId}
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => navigate('/pricing')}
            >
              Return to Plans
            </Button>
          </Box>
        ) : (
          <Box>
            <CheckCircleIcon 
              color="success" 
              sx={{ fontSize: 80, mb: 2 }} 
            />
            <Typography variant="h4" gutterBottom>
              Payment Successful!
            </Typography>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Thank you for your purchase
            </Typography>
            
            <Box sx={{ mb: 4, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
              <Typography variant="body1">
                <strong>Plan:</strong> {plan} test paper{parseInt(plan || '1') > 1 ? 's' : ''}
              </Typography>
              <Typography variant="body1">
                <strong>Total Credits:</strong> {user?.testsPurchased || 0}
              </Typography>
              <Typography variant="body1">
                <strong>Order ID:</strong> {sessionId?.substring(0, 14)}...
              </Typography>
            </Box>
            
            <Box display="flex" justifyContent="center" gap={2}>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard
              </Button>
              <Button 
                variant="outlined"
                onClick={() => navigate('/pricing')}
              >
                Purchase More
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default PaymentSuccess; 
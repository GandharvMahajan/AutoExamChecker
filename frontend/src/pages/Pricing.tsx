import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Grid, Card, CardContent, CardActions, Button, Divider, Alert, CircularProgress, Chip } from '@mui/material';
import axios from 'axios';
import { API_BASE_URL, IS_DEVELOPMENT } from '../config/constants';
import { useAuth } from '../context/AuthContext';
import { useCredits } from '../hooks/useCredits';

// Pricing plan types
interface PricingPlan {
  title: string;
  price: string;
  papers: number;
  description: string;
  features: string[];
}

const plans: PricingPlan[] = [
  {
    title: 'Basic',
    price: '₹829',
    papers: 1,
    description: 'Perfect for a single exam',
    features: [
      '1 Test Paper Analysis',
      'Detailed Scoring',
      'PDF Generation',
      'Email Reports'
    ]
  },
  {
    title: 'Standard',
    price: '₹2,074',
    papers: 3,
    description: 'Great for multiple exams',
    features: [
      '3 Test Paper Analyses',
      'Detailed Scoring',
      'PDF Generation',
      'Email Reports',
      'Statistical Comparisons'
    ]
  },
  {
    title: 'Premium',
    price: '₹3,318',
    papers: 6,
    description: 'Best value for regular testing',
    features: [
      '6 Test Paper Analyses',
      'Detailed Scoring',
      'PDF Generation',
      'Email Reports',
      'Statistical Comparisons',
      'Performance Trends'
    ]
  }
];

const Pricing: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, token } = useAuth();
  const { refreshCredits } = useCredits();
  const [processing, setProcessing] = useState<number | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Function to handle purchase through Stripe checkout
  const handlePurchase = async (plan: number) => {
    if (!isAuthenticated || !token) {
      navigate('/login', { state: { from: '/pricing' } });
      return;
    }

    setProcessing(plan);
    setAlert(null);

    try {
      // Call the Stripe checkout session endpoint
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/payment/create-checkout-session`,
        { plan: plan.toString() },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token
          },
          timeout: 8000 // Increased timeout for Stripe API calls
        }
      );

      if (response.data.success && response.data.checkoutUrl) {
        // Redirect to Stripe checkout
        window.location.href = response.data.checkoutUrl;
        return; // Exit early as we're redirecting
      } else {
        throw new Error('Invalid response from checkout endpoint');
      }
    } catch (error: any) {
      console.error('Payment API error:', error);
      
      // Extract the detailed error message if available
      let errorMessage = 'There was an error processing your payment. Please try again or contact support if the issue persists.';
      
      if (error.response?.data?.details) {
        errorMessage = `Error: ${error.response.data.details}`;
      } else if (error.response?.data?.message) {
        errorMessage = `Error: ${error.response.data.message}`;
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      setAlert({
        type: 'error',
        message: errorMessage
      });
    } finally {
      setProcessing(null);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Box textAlign="center" mb={4}>
        <Typography variant="h2" component="h1" gutterBottom>
          Choose Your Plan
        </Typography>
        <Typography variant="h5" color="text.secondary">
          Affordable options for all your exam checking needs
        </Typography>
        
        {IS_DEVELOPMENT && (
          <Box mt={2}>
            <Chip 
              label="Development Mode" 
              color="info" 
              size="small"
            />
          </Box>
        )}
      </Box>

      {alert && (
        <Alert 
          severity={alert.type} 
          sx={{ mb: 4, whiteSpace: 'pre-line' }}
          onClose={() => setAlert(null)}
        >
          {alert.message}
        </Alert>
      )}

      <Grid container spacing={4} justifyContent="center">
        {plans.map((plan) => (
          <Grid item key={plan.title} xs={12} sm={6} md={4}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.3s, box-shadow 0.3s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h4" component="h2" align="center">
                  {plan.title}
                </Typography>
                <Typography variant="h3" color="primary" align="center" gutterBottom>
                  {plan.price}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary" align="center" gutterBottom>
                  {plan.description}
                </Typography>
                <Divider sx={{ my: 2 }} />
                {plan.features.map((feature, index) => (
                  <Typography key={index} variant="body1" sx={{ py: 0.5 }}>
                    ✓ {feature}
                  </Typography>
                ))}
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
                <Button 
                  size="large" 
                  variant="contained" 
                  color="primary"
                  fullWidth
                  sx={{ mx: 2 }}
                  onClick={() => handlePurchase(plan.papers)}
                  disabled={processing !== null}
                >
                  {processing === plan.papers ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    `Buy Now`
                  )}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Pricing; 
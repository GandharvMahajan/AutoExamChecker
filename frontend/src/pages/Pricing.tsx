import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  Button, 
  Divider, 
  Alert, 
  CircularProgress, 
  Chip, 
  alpha, 
  useTheme 
} from '@mui/material';
import axios from 'axios';
import { API_BASE_URL, IS_DEVELOPMENT } from '../config/constants';
import { useAuth } from '../context/AuthContext';
import { useCredits } from '../hooks/useCredits';
import { motion } from 'framer-motion';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      when: "beforeChildren",
      staggerChildren: 0.1,
      duration: 0.5
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

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
  const theme = useTheme();
  const [processing, setProcessing] = useState<number | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Theme aware styles
  const isDark = theme.palette.mode === 'dark';

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
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <Container 
        maxWidth="lg" 
        sx={{ 
          py: 8,
          color: theme.palette.text.primary
        }}
      >
        <motion.div variants={itemVariants}>
          <Box textAlign="center" mb={6}>
            <Typography 
              variant="h2" 
              component="h1" 
              gutterBottom
              sx={{
                fontWeight: 700,
                letterSpacing: '-0.5px',
                color: isDark
                  ? theme.palette.primary.light
                  : theme.palette.primary.dark
              }}
            >
              Choose Your Plan
            </Typography>
            <Typography 
              variant="h5" 
              sx={{
                color: alpha(theme.palette.text.primary, 0.8),
                maxWidth: 700,
                mx: 'auto',
                mb: 4
              }}
            >
              Affordable options for all your exam checking needs
            </Typography>
            
            {IS_DEVELOPMENT && (
              <Box mt={2}>
                <Chip 
                  label="Development Mode" 
                  color="info" 
                  size="small"
                  sx={{
                    backgroundColor: isDark
                      ? alpha(theme.palette.info.dark, 0.8)
                      : alpha(theme.palette.info.light, 0.8),
                    color: isDark
                      ? theme.palette.info.contrastText
                      : theme.palette.info.dark
                  }}
                />
              </Box>
            )}
          </Box>
        </motion.div>

        {alert && (
          <motion.div variants={itemVariants}>
            <Alert 
              severity={alert.type} 
              sx={{ 
                mb: 4, 
                whiteSpace: 'pre-line',
                color: isDark 
                  ? alert.type === 'error' ? theme.palette.error.light : theme.palette.success.light
                  : alert.type === 'error' ? theme.palette.error.dark : theme.palette.success.dark,
                '& .MuiAlert-icon': {
                  color: isDark 
                    ? alert.type === 'error' ? theme.palette.error.light : theme.palette.success.light
                    : alert.type === 'error' ? theme.palette.error.dark : theme.palette.success.dark
                },
                borderRadius: 2
              }}
              onClose={() => setAlert(null)}
            >
              {alert.message}
            </Alert>
          </motion.div>
        )}

        <Grid container spacing={4} justifyContent="center">
          {plans.map((plan, index) => (
            <Grid item key={plan.title} xs={12} sm={6} md={4}>
              <motion.div 
                variants={itemVariants}
                custom={index}
              >
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'transform 0.3s, box-shadow 0.3s',
                    backgroundColor: isDark
                      ? alpha(theme.palette.background.paper, 0.6)
                      : theme.palette.background.paper,
                    borderRadius: '16px',
                    boxShadow: isDark
                      ? '0 8px 20px rgba(0, 0, 0, 0.3)'
                      : '0 8px 20px rgba(0, 0, 0, 0.08)',
                    border: isDark
                      ? `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                      : 'none',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: isDark
                        ? '0 14px 28px rgba(0, 0, 0, 0.4)'
                        : '0 14px 28px rgba(0, 0, 0, 0.15)'
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, p: 4 }}>
                    <Typography 
                      gutterBottom 
                      variant="h4" 
                      component="h2" 
                      align="center"
                      sx={{
                        fontWeight: 600,
                        mb: 2,
                        color: theme.palette.text.primary
                      }}
                    >
                      {plan.title}
                    </Typography>
                    <Typography 
                      variant="h3" 
                      align="center" 
                      gutterBottom
                      sx={{
                        fontWeight: 700,
                        color: isDark
                          ? theme.palette.primary.light
                          : theme.palette.primary.main
                      }}
                    >
                      {plan.price}
                    </Typography>
                    <Typography 
                      variant="subtitle1" 
                      align="center" 
                      gutterBottom
                      sx={{
                        fontWeight: 500,
                        mb: 2,
                        color: alpha(theme.palette.text.primary, 0.7)
                      }}
                    >
                      {plan.description}
                    </Typography>
                    <Divider sx={{ 
                      my: 2,
                      backgroundColor: isDark
                        ? alpha(theme.palette.divider, 0.2)
                        : theme.palette.divider
                    }} />
                    {plan.features.map((feature, index) => (
                      <Typography 
                        key={index} 
                        variant="body1" 
                        sx={{ 
                          py: 0.8,
                          color: theme.palette.text.primary,
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Box 
                          component="span" 
                          sx={{
                            color: isDark
                              ? theme.palette.success.light
                              : theme.palette.success.main,
                            mr: 1,
                            fontWeight: 'bold'
                          }}
                        >
                          ✓
                        </Box> 
                        {feature}
                      </Typography>
                    ))}
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'center', pb: 4, px: 3 }}>
                    <Button 
                      size="large" 
                      variant="contained" 
                      color="primary"
                      fullWidth
                      onClick={() => handlePurchase(plan.papers)}
                      disabled={processing !== null}
                      sx={{
                        py: 1.5,
                        borderRadius: '10px',
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '1.1rem',
                        boxShadow: isDark
                          ? '0 4px 12px rgba(0, 127, 255, 0.3)'
                          : '0 4px 12px rgba(0, 0, 0, 0.1)',
                        transition: 'all 0.2s ease',
                        backgroundColor: isDark
                          ? theme.palette.primary.dark
                          : theme.palette.primary.main,
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: isDark
                            ? '0 6px 16px rgba(0, 127, 255, 0.4)'
                            : '0 6px 16px rgba(0, 0, 0, 0.15)',
                          backgroundColor: isDark
                            ? theme.palette.primary.dark
                            : theme.palette.primary.dark
                        }
                      }}
                    >
                      {processing === plan.papers ? (
                        <CircularProgress 
                          size={24} 
                          sx={{ 
                            color: theme.palette.primary.contrastText 
                          }} 
                        />
                      ) : (
                        `Buy Now`
                      )}
                    </Button>
                  </CardActions>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>
    </motion.div>
  );
};

export default Pricing; 
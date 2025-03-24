import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, Typography, Button, Container, Grid, Card, CardContent, alpha, useTheme } from '@mui/material';
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

const Home = () => {
  const { isAuthenticated } = useAuth();
  const theme = useTheme();
  
  // Style variables based on theme
  const isDark = theme.palette.mode === 'dark';
  
  return (
    <Container maxWidth="lg">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <Box 
          sx={{
            textAlign: 'center',
            py: 8,
            color: theme.palette.text.primary
          }}
          component={motion.div}
          variants={itemVariants}
        >
          <Typography 
            variant="h2" 
            component="h1" 
            gutterBottom
            sx={{ 
              fontWeight: 700,
              letterSpacing: '-0.5px',
              mb: 2,
              color: theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.dark
            }}
          >
            Welcome to AutoExamChecker
          </Typography>
          
          <Typography 
            variant="h5" 
            sx={{ 
              mb: 4,
              maxWidth: 700,
              mx: 'auto',
              color: alpha(theme.palette.text.primary, 0.8)
            }}
          >
            A powerful platform for automated exam checking and grading
          </Typography>
          
          {!isAuthenticated && (
            <Box sx={{ mb: 6 }}>
              <Button 
                component={Link} 
                to="/register" 
                variant="contained" 
                color="primary"
                size="large"
                sx={{ 
                  mr: 2,
                  px: 4,
                  py: 1.5,
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  boxShadow: isDark ? '0 4px 12px rgba(0, 127, 255, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
              >
                Get Started
              </Button>
              
              <Button 
                component={Link} 
                to="/login" 
                variant="outlined" 
                color="primary"
                size="large"
                sx={{ 
                  px: 4,
                  py: 1.5,
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  borderWidth: '2px',
                  '&:hover': {
                    borderWidth: '2px'
                  }
                }}
              >
                Login
              </Button>
            </Box>
          )}
          
          {isAuthenticated && (
            <Box sx={{ mb: 6 }}>
              <Button 
                component={Link} 
                to="/dashboard" 
                variant="contained" 
                color="primary"
                size="large"
                sx={{ 
                  px: 4,
                  py: 1.5,
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  boxShadow: isDark ? '0 4px 12px rgba(0, 127, 255, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
              >
                Go to Dashboard
              </Button>
            </Box>
          )}
        </Box>
        
        <Box 
          sx={{ 
            py: 8,
            textAlign: 'center'
          }}
          component={motion.div}
          variants={itemVariants}
        >
          <Typography 
            variant="h3" 
            component="h2" 
            gutterBottom 
            sx={{ 
              mb: 6,
              fontWeight: 600,
              color: theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.dark
            }}
          >
            Features
          </Typography>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '16px',
                  boxShadow: isDark 
                    ? '0 4px 20px rgba(0, 0, 0, 0.5)' 
                    : '0 4px 20px rgba(0, 0, 0, 0.08)',
                  backgroundColor: isDark 
                    ? alpha(theme.palette.background.paper, 0.6) 
                    : theme.palette.background.paper,
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: isDark 
                      ? '0 8px 30px rgba(0, 0, 0, 0.7)' 
                      : '0 8px 30px rgba(0, 0, 0, 0.12)'
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1, p: 4 }}>
                  <Typography 
                    variant="h1" 
                    sx={{ 
                      mb: 2, 
                      fontSize: '3rem'
                    }}
                  >
                    📝
                  </Typography>
                  <Typography 
                    variant="h5" 
                    component="h3" 
                    gutterBottom
                    sx={{ 
                      fontWeight: 600,
                      mb: 2,
                      color: theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main
                    }}
                  >
                    Automated Grading
                  </Typography>
                  <Typography 
                    variant="body1"
                    sx={{ 
                      color: alpha(theme.palette.text.primary, 0.8)
                    }}
                  >
                    Save time by automating the exam grading process with our
                    advanced AI technology.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '16px',
                  boxShadow: isDark 
                    ? '0 4px 20px rgba(0, 0, 0, 0.5)' 
                    : '0 4px 20px rgba(0, 0, 0, 0.08)',
                  backgroundColor: isDark 
                    ? alpha(theme.palette.background.paper, 0.6) 
                    : theme.palette.background.paper,
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: isDark 
                      ? '0 8px 30px rgba(0, 0, 0, 0.7)' 
                      : '0 8px 30px rgba(0, 0, 0, 0.12)'
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1, p: 4 }}>
                  <Typography 
                    variant="h1" 
                    sx={{ 
                      mb: 2, 
                      fontSize: '3rem'
                    }}
                  >
                    📊
                  </Typography>
                  <Typography 
                    variant="h5" 
                    component="h3" 
                    gutterBottom
                    sx={{ 
                      fontWeight: 600,
                      mb: 2,
                      color: theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main
                    }}
                  >
                    Detailed Analytics
                  </Typography>
                  <Typography 
                    variant="body1"
                    sx={{ 
                      color: alpha(theme.palette.text.primary, 0.8)
                    }}
                  >
                    Get comprehensive insights into student performance with detailed
                    analytics and reports.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '16px',
                  boxShadow: isDark 
                    ? '0 4px 20px rgba(0, 0, 0, 0.5)' 
                    : '0 4px 20px rgba(0, 0, 0, 0.08)',
                  backgroundColor: isDark 
                    ? alpha(theme.palette.background.paper, 0.6) 
                    : theme.palette.background.paper,
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: isDark 
                      ? '0 8px 30px rgba(0, 0, 0, 0.7)' 
                      : '0 8px 30px rgba(0, 0, 0, 0.12)'
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1, p: 4 }}>
                  <Typography 
                    variant="h1" 
                    sx={{ 
                      mb: 2, 
                      fontSize: '3rem'
                    }}
                  >
                    🔍
                  </Typography>
                  <Typography 
                    variant="h5" 
                    component="h3" 
                    gutterBottom
                    sx={{ 
                      fontWeight: 600,
                      mb: 2,
                      color: theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main
                    }}
                  >
                    Custom Rubrics
                  </Typography>
                  <Typography 
                    variant="body1"
                    sx={{ 
                      color: alpha(theme.palette.text.primary, 0.8)
                    }}
                  >
                    Create custom grading rubrics tailored to your specific exam
                    requirements and criteria.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </motion.div>
    </Container>
  );
};

export default Home; 
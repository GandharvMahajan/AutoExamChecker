import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '@mui/material/styles';
import { useColorMode } from '../context/ThemeContext';
import { Box, Typography, Container, Grid, Paper, alpha } from '@mui/material';
import '../styles/Home.css';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const theme = useTheme();
  const { mode } = useColorMode();
  const isDark = mode === 'dark';

  console.log("isDark",isDark);

  // Feature icon styles with theme support
  const featureIconStyle = {
    fontSize: '2.5rem',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: isDark 
      ? alpha(theme.palette.primary.main, 0.2)
      : alpha(theme.palette.primary.main, 0.1),
    boxShadow: isDark
      ? `0 8px 20px ${alpha(theme.palette.primary.main, 0.3)}`
      : `0 8px 20px ${alpha(theme.palette.primary.main, 0.15)}`,
    color: theme.palette.primary.main,
  };

  return (
    <Container maxWidth="lg">

    
    <Box
      sx={{ 
        width: "100%", 
        px: { xs: 2, md: 4 },
        overflowX: 'hidden',
        backgroundColor: isDark 
          ? alpha(theme.palette.background.default, 0.4)
          : alpha(theme.palette.background.default, 0.6)
      }}
    >
      <div className="hero-section">
        <Typography 
          variant="h2" 
          component="h1"
          sx={{ 
            color: theme.palette.text.primary,
            fontWeight: 700,
            mb: 2
          }}
        >
          Welcome to AutoExamChecker
        </Typography>
        <Typography 
          variant="h5"
          align="center"
          sx={{ 
            color: theme.palette.text.primary,
            mb: 4,
            maxWidth: "600px",
            mx: "auto"
          }}
        >
          A powerful platform for automated exam checking and grading
        </Typography>
        
        {!isAuthenticated && (
          <div className="hero-buttons">
            <Link to="/register" className="btn btn-primary">
              Get Started
            </Link>
            <Link to="/login" className="btn btn-secondary">
              Login
            </Link>
          </div>
        )}
        
        {isAuthenticated && (
          <div className="hero-buttons">
            <Link to="/dashboard" className="btn btn-primary">
              Go to Dashboard
            </Link>
          </div>
        )}
      </div>
      
      <Box className="features-section">
        <Typography 
          variant="h3" 
          component="h2"
          align="center"
          sx={{ 
            color: theme.palette.text.primary,
            fontWeight: 600,
            mb: 6
          }}
        >
          Features
        </Typography>
        
        <Grid container spacing={4} className="features-grid">
          <Grid item xs={12} sm={6} md={4}>
            <Paper 
              elevation={3} 
              className="feature-card"
              sx={{ 
                bgcolor: theme.palette.background.paper,
                boxShadow: isDark 
                  ? '0 8px 32px rgba(0, 0, 0, 0.3)' 
                  : '0 8px 20px rgba(0, 0, 0, 0.08)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-10px)',
                  boxShadow: isDark 
                    ? '0 12px 40px rgba(0, 0, 0, 0.4)' 
                    : '0 12px 30px rgba(0, 0, 0, 0.12)',
                }
              }}
            >
              <Box sx={featureIconStyle}>📝</Box>
              <Typography 
                variant="h5" 
                component="h3"
                sx={{ 
                  color: theme.palette.text.primary,
                  fontWeight: 600,
                  mb: 2
                }}
              >
                Automated Grading
              </Typography>
              <Typography 
                variant="body1"
                sx={{ 
                  color: theme.palette.text.primary,
                  lineHeight: 1.6
                }}
              >
                Save time by automating the exam grading process with our
                advanced AI technology.
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Paper 
              elevation={3} 
              className="feature-card"
              sx={{ 
                bgcolor: theme.palette.background.paper,
                boxShadow: isDark 
                  ? '0 8px 32px rgba(0, 0, 0, 0.3)' 
                  : '0 8px 20px rgba(0, 0, 0, 0.08)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-10px)',
                  boxShadow: isDark 
                    ? '0 12px 40px rgba(0, 0, 0, 0.4)' 
                    : '0 12px 30px rgba(0, 0, 0, 0.12)',
                }
              }}
            >
              <Box sx={featureIconStyle}>📊</Box>
              <Typography 
                variant="h5" 
                component="h3"
                sx={{ 
                  color: theme.palette.text.primary,
                  fontWeight: 600,
                  mb: 2
                }}
              >
                Detailed Analytics
              </Typography>
              <Typography 
                variant="body1"
                sx={{ 
                  color: theme.palette.text.secondary,
                  lineHeight: 1.6
                }}
              >
                Get comprehensive insights into student performance with detailed
                analytics and reports.
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Paper 
              elevation={3} 
              className="feature-card"
              sx={{ 
                bgcolor: theme.palette.background.paper,
                boxShadow: isDark 
                  ? '0 8px 32px rgba(0, 0, 0, 0.3)' 
                  : '0 8px 20px rgba(0, 0, 0, 0.08)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-10px)',
                  boxShadow: isDark 
                    ? '0 12px 40px rgba(0, 0, 0, 0.4)' 
                    : '0 12px 30px rgba(0, 0, 0, 0.12)',
                }
              }}
            >
              <Box sx={featureIconStyle}>🔍</Box>
              <Typography 
                variant="h5" 
                component="h3"
                sx={{ 
                  color: theme.palette.text.primary,
                  fontWeight: 600,
                  mb: 2
                }}
              >
                Custom Rubrics
              </Typography>
              <Typography 
                variant="body1"
                sx={{ 
                  color: theme.palette.text.primary,
                  lineHeight: 1.6
                }}
              >
                Create custom grading rubrics tailored to your specific exam
                requirements and criteria.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
    </Container>
  );
};

export default Home; 
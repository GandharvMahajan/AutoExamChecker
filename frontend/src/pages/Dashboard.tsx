import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Button, 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  LinearProgress, 
  CircularProgress, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Stack, 
  Alert, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  SelectChangeEvent,
  useTheme,
  alpha
} from '@mui/material';
import { Link } from 'react-router-dom';
import { useCredits } from '../hooks/useCredits';
import { API_BASE_URL } from '../config/constants';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

// Define test interface
interface Test {
  id: number;
  title: string;
  subject: string;
  userClass: string | null;
  description: string | null;
  totalMarks: number;
  passingMarks: number;
  duration: number;
  status: 'NotStarted' | 'InProgress' | 'Completed';
  score: number | null;
  startedAt: string | null;
  completedAt: string | null;
  maxScore?: number; // Add optional maxScore field
}

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

const Dashboard = () => {
  const theme = useTheme();
  const { user, logout, token, refreshToken } = useAuth();
  const navigate = useNavigate();
  const { testsPurchased, testsUsed, loading: creditsLoading, error: creditsError, refreshCredits } = useCredits();
  const [tests, setTests] = useState<Test[]>([]);
  const [filteredTests, setFilteredTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subjectFilter, setSubjectFilter] = useState<string>('');
  const [classFilter, setClassFilter] = useState<string>('');
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  
  // Calculate usage percentage
  const testsRemaining = testsPurchased - testsUsed;
  const usagePercentage = testsPurchased > 0 ? (testsUsed / testsPurchased) * 100 : 0;
  
  // Apple-inspired card style
  const cardStyle = {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
    }
  };
  
  // Fetch user tests
  useEffect(() => {
    const fetchUserTests = async () => {
      if (!token) {
        navigate('/login');
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await axios.get(`${API_BASE_URL}/api/v1/tests/userTests`, {
          headers: {
            'x-auth-token': token
          }
        });
        
        if (response.data.success) {
          // Log the entire API response to see its structure
          console.log('Full API response:', JSON.stringify(response.data));
          
          // Debug: Log the first test to examine its structure
          console.log('First test data:', JSON.stringify(response.data.tests[0]));
          
          // Map the response data to ensure userClass field is properly handled
          const mappedTests = response.data.tests.map((test: any) => {
            // Log the entire test object to see its structure
            console.log(`Full test object for ID ${test.id}:`, JSON.stringify(test));
            
            // Force conversion to a number and then to string to handle different formats
            let classValue;
            try {
              classValue = test.class !== undefined ? String(test.class) : '';
              console.log(`Class value for test ${test.id}:`, classValue);
            } catch (e) {
              console.error(`Error processing class for test ${test.id}:`, e);
              classValue = '';
            }
            
            // Return a new object with the correct mapping
            return {
              ...test,
              // Set userClass explicitly with proper conversion
              userClass: classValue
            } as Test;
          });
          
          console.log('Mapped tests with userClass:', mappedTests.map((t: Test) => ({ id: t.id, userClass: t.userClass })));
          
          setTests(mappedTests);
          setFilteredTests(mappedTests);
          
          // Extract unique subjects and classes for filters
          const uniqueSubjects = [...new Set(mappedTests.map((test: Test) => test.subject))] as string[];
          const uniqueClasses = [...new Set(mappedTests.map((test: Test) => test.userClass).filter(Boolean) as string[])];
          
          setAvailableSubjects(uniqueSubjects);
          setAvailableClasses(uniqueClasses);
        } else {
          setError('Failed to fetch tests');
        }
      } catch (err) {
        console.error('Error fetching tests:', err);
        
        // Check if it's an authentication error
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          setError('Your session has expired. Please login again.');
          refreshToken(); // Clear the token
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        } else {
          setError('An error occurred while fetching your tests');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserTests();
  }, [token, navigate, refreshToken]);
  
  // Apply filters when filter values change
  useEffect(() => {
    let result = [...tests];
    
    if (subjectFilter) {
      result = result.filter(test => test.subject === subjectFilter);
    }
    
    if (classFilter) {
      result = result.filter(test => String(test.userClass) === classFilter);
    }
    
    setFilteredTests(result);
  }, [tests, subjectFilter, classFilter]);
  
  // Handle filter changes
  const handleSubjectFilterChange = (event: SelectChangeEvent) => {
    setSubjectFilter(event.target.value);
  };
  
  const handleClassFilterChange = (event: SelectChangeEvent) => {
    setClassFilter(event.target.value);
  };
  
  const clearFilters = () => {
    setSubjectFilter('');
    setClassFilter('');
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleStartTest = async (testId: number) => {
    if (testsRemaining <= 0) {
      setError('You have no credits remaining. Please purchase more credits.');
      return;
    }
    
    // Navigate to the test page with the test ID
    navigate(`/test/${testId}`);
  };
  
  // Apple-styled button
  const StyledButton = ({ children, ...props }: any) => (
    <Button
      {...props}
      sx={{
        borderRadius: '10px',
        textTransform: 'none',
        fontWeight: 500,
        boxShadow: 'none',
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'scale(1.02)',
          boxShadow: '0 5px 15px rgba(0, 0, 0, 0.08)',
        },
        ...props.sx
      }}
    >
      {children}
    </Button>
  );
  
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <Box sx={{ 
        p: { xs: 2, md: 4 }, 
        maxWidth: "1200px", 
        mx: "auto",
        overflowX: 'hidden',
        backgroundColor: alpha(theme.palette.background.default, 0.6)
      }}>
        <motion.div variants={itemVariants}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
            <Box>
              <Typography 
                variant="h4" 
                component="h1" 
                sx={{ 
                  fontWeight: 600, 
                  letterSpacing: '-0.5px',
                  fontSize: { xs: '1.8rem', md: '2.2rem' }
                }}
              >
                Dashboard
              </Typography>
            </Box>
            <StyledButton 
              variant="outlined" 
              color="primary" 
              onClick={handleLogout}
              sx={{ px: 3 }}
            >
              Logout
            </StyledButton>
          </Box>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              mb: 4, 
              borderRadius: 4,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
            }}
          >
            <Typography 
              variant="h5" 
              gutterBottom 
              sx={{ 
                fontWeight: 500, 
                color: theme.palette.primary.main 
              }}
            >
              Welcome, {user?.name}!
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.8 }}>
              Email: {user?.email}
            </Typography>
          </Paper>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Grid container spacing={4} mb={4}>
            <Grid item xs={12}>
              <Card elevation={0} sx={cardStyle}>
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography 
                      variant="h6" 
                      gutterBottom 
                      sx={{ 
                        fontWeight: 500, 
                        letterSpacing: '-0.3px' 
                      }}
                    >
                      Test Credits
                    </Typography>
                    {creditsLoading ? (
                      <CircularProgress size={20} sx={{ color: theme.palette.primary.main }} />
                    ) : (
                      <StyledButton 
                        size="small" 
                        variant="text" 
                        onClick={() => refreshCredits()}
                        sx={{ minWidth: 'auto' }}
                      >
                        Refresh
                      </StyledButton>
                    )}
                  </Box>
                  
                  {creditsError && (
                    <Typography color="error" variant="body2" sx={{ mb: 2 }}>{creditsError}</Typography>
                  )}
                  
                  <Box sx={{ mb: 3, mt: 2 }}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 500, 
                          color: alpha(theme.palette.text.primary, 0.7) 
                        }}
                      >
                        {testsUsed} used of {testsPurchased} total
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 600, 
                          color: theme.palette.primary.main 
                        }}
                      >
                        {testsRemaining} remaining
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={usagePercentage} 
                      sx={{ 
                        mt: 1, 
                        height: 12, 
                        borderRadius: 6,
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        '.MuiLinearProgress-bar': {
                          backgroundColor: theme.palette.primary.main,
                          borderRadius: 6,
                          transition: 'transform 1s cubic-bezier(0.23, 1, 0.32, 1)'
                        }
                      }}
                    />
                  </Box>
                  {testsPurchased === 0 && (
                    <Box mt={2}>
                      <Typography variant="body2" sx={{ color: alpha(theme.palette.text.primary, 0.6), mb: 2 }}>
                        You don't have any test credits yet.
                      </Typography>
                      <StyledButton 
                        component={Link} 
                        to="/pricing" 
                        variant="contained" 
                        color="primary"
                        size="small"
                        sx={{ px: 3, py: 1 }}
                      >
                        Purchase Credits
                      </StyledButton>
                    </Box>
                  )}
                  {testsRemaining <= 2 && testsPurchased > 0 && (
                    <Box mt={2}>
                      <Typography variant="body2" color="warning.main" sx={{ mb: 2, fontWeight: 500 }}>
                        You're running low on test credits!
                      </Typography>
                      <StyledButton 
                        component={Link} 
                        to="/pricing" 
                        variant="contained" 
                        color="primary"
                        size="small"
                        sx={{ px: 3, py: 1 }}
                      >
                        Buy More Credits
                      </StyledButton>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </motion.div>
        
        {error && (
          <motion.div variants={itemVariants}>
            <Alert 
              severity="error" 
              sx={{ 
                mb: 4, 
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`
              }}
            >
              {error}
            </Alert>
          </motion.div>
        )}
        
        <motion.div variants={itemVariants}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              borderRadius: 4,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
              border: `1px solid ${alpha('#000', 0.05)}`
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 500, 
                  letterSpacing: '-0.3px' 
                }}
              >
                Available Tests
              </Typography>
              <Box>
                <StyledButton 
                  size="small" 
                  variant="text" 
                  color="primary" 
                  onClick={() => window.location.reload()}
                >
                  Refresh
                </StyledButton>
              </Box>
            </Box>
            
            {/* Filters */}
            <Box 
              display="flex" 
              gap={2} 
              mb={3} 
              sx={{ 
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'stretch', sm: 'center' }
              }}
            >
              <FormControl 
                size="small" 
                sx={{ 
                  minWidth: 200,
                  '.MuiOutlinedInput-root': {
                    borderRadius: 2,
                    transition: 'all 0.2s',
                    '&.Mui-focused': {
                      boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.2)}`
                    }
                  }
                }}
              >
                <InputLabel id="subject-filter-label">Filter by Subject</InputLabel>
                <Select
                  labelId="subject-filter-label"
                  id="subject-filter"
                  value={subjectFilter}
                  label="Filter by Subject"
                  onChange={handleSubjectFilterChange}
                >
                  <MenuItem value="">
                    <em>All Subjects</em>
                  </MenuItem>
                  {availableSubjects.map(subject => (
                    <MenuItem key={subject} value={subject}>{subject}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl 
                size="small" 
                sx={{ 
                  minWidth: 200,
                  '.MuiOutlinedInput-root': {
                    borderRadius: 2,
                    transition: 'all 0.2s',
                    '&.Mui-focused': {
                      boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.2)}`
                    }
                  }
                }}
              >
                <InputLabel id="class-filter-label">Filter by Class</InputLabel>
                <Select
                  labelId="class-filter-label"
                  id="class-filter"
                  value={classFilter}
                  label="Filter by Class"
                  onChange={handleClassFilterChange}
                >
                  <MenuItem value="">
                    <em>All Classes</em>
                  </MenuItem>
                  {availableClasses.map(cls => (
                    <MenuItem key={cls} value={cls}>{cls}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              {(subjectFilter || classFilter) && (
                <StyledButton 
                  size="small"
                  variant="text"
                  onClick={clearFilters}
                >
                  Clear Filters
                </StyledButton>
              )}
            </Box>
            
            {loading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress 
                  sx={{ 
                    color: theme.palette.primary.main
                  }} 
                />
              </Box>
            ) : filteredTests.length > 0 ? (
              <TableContainer sx={{ 
                borderRadius: 2, 
                overflow: 'hidden',
                border: `1px solid ${alpha('#000', 0.05)}`,
                '& .MuiTableCell-root': {
                  borderColor: alpha('#000', 0.05)
                }
              }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.03) }}>
                      <TableCell sx={{ fontWeight: 600 }}>Test Name</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Class</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Maximum Score</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredTests.map((test) => (
                      <TableRow 
                        key={test.id}
                        sx={{ 
                          transition: 'background-color 0.2s',
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.03)
                          }
                        }}
                      >
                        <TableCell>{test.title}</TableCell>
                        <TableCell>{test.subject}</TableCell>
                        <TableCell>
                          {/* Always display a class value, even if it's 0 */}
                          {test.userClass !== undefined && test.userClass !== null && test.userClass !== '' 
                            ? test.userClass 
                            : (test as any).class !== undefined && (test as any).class !== null 
                              ? String((test as any).class) 
                              : '0'}
                        </TableCell>
                        <TableCell>{test.maxScore || test.totalMarks}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            {test.status === 'NotStarted' && (
                              <StyledButton 
                                size="small" 
                                variant="outlined"
                                onClick={() => handleStartTest(test.id)}
                                disabled={testsRemaining <= 0}
                                sx={{ px: 2 }}
                              >
                                Start Test
                              </StyledButton>
                            )}
                            {test.status === 'InProgress' && (
                              <StyledButton 
                                size="small" 
                                variant="contained"
                                color="primary"
                                onClick={() => navigate(`/test/${test.id}`)}
                                sx={{ px: 2 }}
                              >
                                Continue
                              </StyledButton>
                            )}
                            {test.status === 'Completed' && (
                              <StyledButton 
                                size="small" 
                                variant="outlined"
                                color="success"
                                sx={{ px: 2 }}
                              >
                                View Results
                              </StyledButton>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box 
                sx={{ 
                  py: 6, 
                  px: 3, 
                  textAlign: 'center',
                  borderRadius: 2,
                  backgroundColor: alpha(theme.palette.background.paper, 0.5),
                  border: `1px solid ${alpha('#000', 0.05)}`
                }}
              >
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: alpha(theme.palette.text.primary, 0.7),
                    fontWeight: 500
                  }}
                >
                  {tests.length > 0 ? 'No tests match the selected filters.' : 'No tests available. Please check back later or contact support.'}
                </Typography>
              </Box>
            )}
          </Paper>
        </motion.div>
      </Box>
    </motion.div>
  );
};

export default Dashboard; 
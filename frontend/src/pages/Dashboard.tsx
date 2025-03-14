import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button, Typography, Box, Paper, Grid, Card, CardContent, LinearProgress, CircularProgress, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Stack, Alert, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { Link } from 'react-router-dom';
import { useCredits } from '../hooks/useCredits';
import { IS_DEVELOPMENT, API_BASE_URL } from '../config/constants';
import { useState, useEffect } from 'react';
import axios from 'axios';

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

const Dashboard = () => {
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
    
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/tests/start`,
        { testId },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token
          }
        }
      );
      
      if (response.data.success) {
        // Refresh tests and credits
        refreshCredits();
        // In a real app, navigate to the test page
        // For now, just refresh the tests list
        window.location.reload();
      }
    } catch (err) {
      console.error('Error starting test:', err);
      
      // Check if it's an authentication error
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError('Your session has expired. Please login again.');
        refreshToken(); // Clear the token
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError('Failed to start the test');
      }
    }
  };
  
  // Helper function to get status chip color
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'NotStarted': return 'default';
      case 'InProgress': return 'warning';
      case 'Completed': return 'success';
      default: return 'default';
    }
  };
  
  return (
    <Box sx={{ p: 4, maxWidth: "1200px", mx: "auto" }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" component="h1">Dashboard</Typography>
          {IS_DEVELOPMENT && (
            <Chip 
              label="Development Mode" 
              color="warning" 
              size="small" 
              sx={{ mt: 1 }}
            />
          )}
        </Box>
        <Button variant="contained" color="secondary" onClick={handleLogout}>
          Logout
        </Button>
      </Box>
      
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>Welcome, {user?.name}!</Typography>
        <Typography variant="body1">Email: {user?.email}</Typography>
      </Paper>
      
      <Grid container spacing={4} mb={4}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" gutterBottom>Test Credits</Typography>
                {creditsLoading ? (
                  <CircularProgress size={20} />
                ) : (
                  <Button size="small" onClick={() => refreshCredits()}>Refresh</Button>
                )}
              </Box>
              
              {creditsError && (
                <Typography color="error" variant="body2" sx={{ mb: 2 }}>{creditsError}</Typography>
              )}
              
              <Box sx={{ mb: 2 }}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    {testsUsed} used of {testsPurchased} total
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {testsRemaining} remaining
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={usagePercentage} 
                  sx={{ mt: 1, height: 10, borderRadius: 5 }}
                />
              </Box>
              {testsPurchased === 0 && (
                <Box mt={2}>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    You don't have any test credits yet.
                  </Typography>
                  <Button 
                    component={Link} 
                    to="/pricing" 
                    variant="contained" 
                    color="primary"
                    size="small"
                  >
                    Purchase Credits
                  </Button>
                </Box>
              )}
              {testsRemaining <= 2 && testsPurchased > 0 && (
                <Box mt={2}>
                  <Typography variant="body2" color="warning.main" paragraph>
                    You're running low on test credits!
                  </Typography>
                  <Button 
                    component={Link} 
                    to="/pricing" 
                    variant="contained" 
                    color="primary"
                    size="small"
                  >
                    Buy More Credits
                  </Button>
                </Box>
              )}
              
              {IS_DEVELOPMENT && (
                <Box mt={2} p={1} bgcolor="#f5f5f5" borderRadius={1}>
                  <Typography variant="caption" color="text.secondary">
                    Development Mode: Credit values are simulated and no real payments are processed.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Auto Exam Checker</Typography>
              <Typography variant="body2" paragraph>
                Use your test credits to automatically check and grade exam papers.
              </Typography>
              <Button 
                variant="contained" 
                color="primary"
                disabled={testsRemaining <= 0}
                component={Link}
                to="/tests"
              >
                Check New Exam
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>
      )}
      
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Available Tests</Typography>
          <Button size="small" onClick={() => window.location.reload()}>
            Refresh
          </Button>
        </Box>
        
        {/* Filters */}
        <Box display="flex" gap={2} mb={3}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
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
          
          <FormControl size="small" sx={{ minWidth: 200 }}>
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
            <Button size="small" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </Box>
        
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : filteredTests.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Test Name</TableCell>
                  <TableCell>Subject</TableCell>
                  <TableCell>Class</TableCell>
                  <TableCell>Maximum Score</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTests.map((test) => (
                  <TableRow key={test.id}>
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
                          <Button 
                            size="small" 
                            variant="outlined"
                            onClick={() => handleStartTest(test.id)}
                            disabled={testsRemaining <= 0}
                          >
                            Start Test
                          </Button>
                        )}
                        {test.status === 'InProgress' && (
                          <Button 
                            size="small" 
                            variant="contained"
                            color="primary"
                          >
                            Continue
                          </Button>
                        )}
                        {test.status === 'Completed' && (
                          <Button 
                            size="small" 
                            variant="outlined"
                            color="success"
                          >
                            View Results
                          </Button>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography variant="body2" sx={{ py: 2 }}>
            {tests.length > 0 ? 'No tests match the selected filters.' : 'No tests available. Please check back later or contact support.'}
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default Dashboard; 
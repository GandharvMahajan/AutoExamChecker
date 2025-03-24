import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNavbar } from '../context/NavbarContext';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  TextField,
  Grid,
  Stack,
  useTheme,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Checkbox,
  FormControlLabel,
  Divider
} from '@mui/material';
import TimerIcon from '@mui/icons-material/Timer';
import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

interface Test {
  id: number;
  title: string;
  subject: string;
  description: string | null;
  totalMarks: number;
  passingMarks: number;
  duration: number;
  pdfUrl: string | null;
  status: 'NotStarted' | 'InProgress' | 'Completed';
  startTime?: string | Date;
}

const TestPage = () => {
  const { testId } = useParams<{ testId: string }>();
  const { token } = useAuth();
  const { setShowNavbar } = useNavbar();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answerFile, setAnswerFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [startingTest, setStartingTest] = useState(false);
  
  // Pre-acknowledgment state
  const [showAcknowledgment, setShowAcknowledgment] = useState(true);
  const [acknowledged, setAcknowledged] = useState(false);
  
  // Timer state
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const fetchTestInfo = async () => {
      if (!token || !testId) {
        navigate('/dashboard');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log(`Fetching test information with ID ${testId}`);
        // Just fetch basic test info without starting the test
        const response = await axios.get(`${API_BASE_URL}/api/v1/tests/${testId}`, {
          headers: {
            'x-auth-token': token
          }
        });

        console.log('API Response:', response.data);

        if (response.data.success) {
          const testData = response.data.test;
          console.log('Test data:', testData);
          setTest(testData);
          
          // Check if test is already in progress
          if (testData.status === 'InProgress' && testData.startTime) {
            const startTime = new Date(testData.startTime);
            const durationInMs = testData.duration * 60 * 1000; // convert minutes to ms
            const endTime = new Date(startTime.getTime() + durationInMs);
            const now = new Date();
            
            // Calculate remaining time
            const remainingMs = Math.max(0, endTime.getTime() - now.getTime());
            setTimeRemaining(Math.floor(remainingMs / 1000)); // convert to seconds
          } else {
            // For tests not started yet, just set full duration
            setTimeRemaining(testData.duration * 60);
          }
        } else {
          setError(response.data.message || 'Failed to load test');
        }
      } catch (err) {
        console.error('Error loading test:', err);
        if (axios.isAxiosError(err)) {
          const errorResponse = err.response?.data;
          setError(errorResponse?.message || 'Failed to load test. Please try again later.');
          console.error('Error response:', errorResponse);
        } else {
          setError('Failed to load test. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTestInfo();

    // Clean up timer on unmount
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [testId, token, navigate]);

  // Start the test and use a credit when the user accepts the guidelines
  const startTest = async () => {
    if (!token || !testId || !test) {
      navigate('/dashboard');
      return;
    }

    try {
      setStartingTest(true);
      
      console.log(`Starting test with ID ${testId}`);
      // This call will use a credit and start the test
      const response = await axios.post(`${API_BASE_URL}/api/v1/tests/${testId}/start`, {}, {
        headers: {
          'x-auth-token': token
        }
      });

      console.log('Start test response:', response.data);

      if (response.data.success) {
        const testData = response.data.test;
        // Update test status and start timer
        setTest({
          ...test,
          status: 'InProgress',
          startTime: testData.startTime || new Date()
        });
        
        // Set up timer
        setTimeRemaining(test.duration * 60); // Full duration in seconds
        
        // Hide acknowledgment and show the test
        setShowAcknowledgment(false);
        setShowNavbar(true);
      } else {
        setError(response.data.message || 'Failed to start test');
      }
    } catch (err) {
      console.error('Error starting test:', err);
      if (axios.isAxiosError(err)) {
        const errorResponse = err.response?.data;
        setError(errorResponse?.message || 'Failed to start test. Please try again later.');
        console.error('Error response:', errorResponse);
      } else {
        setError('Failed to start test. Please try again later.');
      }
    } finally {
      setStartingTest(false);
    }
  };

  // Set up timer
  useEffect(() => {
    if (timeRemaining > 0 && !showAcknowledgment) {
      timerRef.current = window.setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            if (timerRef.current !== null) {
              window.clearInterval(timerRef.current);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [timeRemaining, showAcknowledgment]);

  // Hide the navbar when the component mounts if showing acknowledgment
  useEffect(() => {
    if (showAcknowledgment) {
      setShowNavbar(false);
    }
    
    // Restore navbar on component unmount
    return () => {
      setShowNavbar(true);
    };
  }, [setShowNavbar, showAcknowledgment]);

  // When acknowledgment state changes, update navbar visibility
  useEffect(() => {
    setShowNavbar(!showAcknowledgment);
  }, [showAcknowledgment, setShowNavbar]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setAnswerFile(event.target.files[0]);
      setUploadError(null);
    }
  };

  const handleSubmit = async () => {
    if (!answerFile || !test || !token) {
      setUploadError('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);
      setUploadSuccess(false);

      // First upload the answer PDF
      const formData = new FormData();
      formData.append('answerPdf', answerFile);

      console.log('Uploading answer PDF...');
      const uploadResponse = await axios.post(
        `${API_BASE_URL}/api/v1/tests/${testId}/upload-answer`,
        formData,
        {
          headers: {
            'x-auth-token': token,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      console.log('Upload response:', uploadResponse.data);

      if (!uploadResponse.data.success) {
        throw new Error(uploadResponse.data.message || 'Failed to upload answer PDF');
      }

      console.log('Answer PDF uploaded successfully. Submitting test...');
      // Then submit the test
      const submitResponse = await axios.post(
        `${API_BASE_URL}/api/v1/tests/${testId}/submit`,
        {},
        {
          headers: {
            'x-auth-token': token
          }
        }
      );

      console.log('Submit response:', submitResponse.data);

      if (submitResponse.data.success) {
        setUploadSuccess(true);
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } else {
        setUploadError(submitResponse.data.message || 'Failed to submit test');
      }
    } catch (err) {
      console.error('Error submitting test:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit test. Please try again later.';
      setUploadError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleAcknowledgment = () => {
    if (acknowledged) {
      startTest();
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress 
          size={50} 
          sx={{ 
            color: isDark ? theme.palette.primary.light : theme.palette.primary.main 
          }} 
        />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => navigate('/dashboard')}
          sx={{
            mt: 2,
            bgcolor: isDark ? theme.palette.primary.dark : theme.palette.primary.main,
            '&:hover': {
              bgcolor: isDark ? alpha(theme.palette.primary.dark, 0.9) : alpha(theme.palette.primary.main, 0.9)
            }
          }}
        >
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  if (!test) {
    return (
      <Box p={4}>
        <Alert severity="error">Test not found.</Alert>
        <Button 
          variant="contained" 
          onClick={() => navigate('/dashboard')}
          sx={{ mt: 2 }}
        >
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  // Pre-acknowledgment dialog
  if (showAcknowledgment) {
    return (
      <Box
        sx={{
          height: '100vh',
          width: '100vw',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          bgcolor: isDark ? '#121212' : '#f5f5f5',
          padding: 0,
          margin: 0,
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 9999
        }}
      >
        <Paper
          elevation={5}
          sx={{
            width: { xs: '95%', sm: '80%', md: '60%', lg: '50%' },
            maxWidth: '800px',
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: isDark
              ? '0 8px 32px rgba(0, 0, 0, 0.3)'
              : '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Box
            sx={{
              p: 3,
              bgcolor: isDark 
                ? theme.palette.primary.dark 
                : theme.palette.primary.main,
              color: 'white'
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Test Guidelines
            </Typography>
          </Box>
          
          <Box sx={{ p: { xs: 2, sm: 4 } }}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ 
                fontWeight: 600, 
                color: 'warning.main',
                mb: 2 
              }}>
                Important Information
              </Typography>
              <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem' }}>
                You are about to start <strong>{test.title}</strong>. This test has a duration of <strong>{test.duration} minutes</strong>.
              </Typography>
              <Typography variant="body1" paragraph sx={{ 
                fontSize: '1.05rem',
                color: isDark ? theme.palette.error.light : theme.palette.error.main,
                fontWeight: 500
              }}>
                <strong>Note:</strong> Starting this test will use one of your test credits. Credits are only used when you click "Begin Test" below.
              </Typography>
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 3, 
                fontWeight: 500,
                color: isDark 
                  ? theme.palette.primary.light
                  : theme.palette.primary.dark
              }}
            >
              Please read and acknowledge the following guidelines:
            </Typography>
            
            <Box sx={{ pl: { xs: 2, sm: 3 }, mb: 4 }}>
              {[
                'Once you start the test, the timer will not pause under any circumstances.',
                'You must complete and submit the test within the allocated time.',
                'All your answers must be submitted in a single PDF file.',
                'Ensure your internet connection is stable throughout the test.',
                'Academic dishonesty will result in disqualification.'
              ].map((item, index) => (
                <Box 
                  key={index} 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'flex-start',
                    mb: 2.5 
                  }}
                >
                  <Box 
                    sx={{
                      height: 24,
                      width: 24,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2,
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}
                  >
                    {index + 1}
                  </Box>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontSize: '1.05rem',
                      lineHeight: 1.5
                    }}
                  >
                    {item}
                  </Typography>
                </Box>
              ))}
            </Box>
            
            <Box 
              sx={{ 
                mt: 4,
                p: 3,
                bgcolor: isDark 
                  ? alpha(theme.palette.warning.dark, 0.1)
                  : alpha(theme.palette.warning.light, 0.2),
                borderRadius: 2,
                border: `1px solid ${isDark 
                  ? alpha(theme.palette.warning.dark, 0.3)
                  : alpha(theme.palette.warning.light, 0.4)}`
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={acknowledged}
                    onChange={(e) => setAcknowledged(e.target.checked)}
                    sx={{
                      color: theme.palette.primary.main,
                      '&.Mui-checked': {
                        color: theme.palette.primary.main,
                      },
                    }}
                  />
                }
                label={
                  <Typography sx={{ fontWeight: 500 }}>
                    I have read and agree to abide by these guidelines
                  </Typography>
                }
              />
            </Box>
            
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              mt: 4
            }}>
              <Button 
                onClick={() => navigate('/dashboard')}
                variant="outlined"
                size="large"
                sx={{ 
                  borderRadius: 2,
                  px: 4,
                  py: 1.5,
                  textTransform: 'none',
                  borderColor: isDark ? alpha(theme.palette.error.light, 0.5) : theme.palette.error.main,
                  color: isDark ? theme.palette.error.light : theme.palette.error.main,
                  '&:hover': {
                    borderColor: isDark ? theme.palette.error.light : theme.palette.error.dark,
                    backgroundColor: alpha(theme.palette.error.main, 0.04),
                  }
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAcknowledgment}
                disabled={!acknowledged || startingTest}
                variant="contained"
                size="large"
                sx={{ 
                  borderRadius: 2,
                  px: 4,
                  py: 1.5,
                  textTransform: 'none',
                  backgroundColor: isDark ? theme.palette.primary.dark : theme.palette.primary.main,
                  color: '#fff',
                  '&:hover': {
                    backgroundColor: isDark ? alpha(theme.palette.primary.dark, 0.9) : alpha(theme.palette.primary.main, 0.9),
                  },
                  '&.Mui-disabled': {
                    backgroundColor: alpha(theme.palette.action.disabled, 0.3),
                    color: theme.palette.action.disabled
                  }
                }}
              >
                {startingTest ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Begin Test'
                )}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        p: { xs: 2, sm: 4 }, 
        maxWidth: '1200px', 
        mx: 'auto',
        backgroundColor: isDark 
          ? alpha(theme.palette.background.default, 0.4)
          : alpha(theme.palette.background.default, 0.6)
      }}
    >
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3,
          mb: 4,
          borderRadius: 4,
          boxShadow: isDark
            ? '0 4px 20px rgba(0, 0, 0, 0.3)'
            : '0 4px 20px rgba(0, 0, 0, 0.06)',
          border: isDark
            ? `1px solid ${alpha(theme.palette.divider, 0.2)}`
            : `1px solid ${alpha('#000', 0.05)}`,
          backgroundColor: isDark
            ? alpha(theme.palette.background.paper, 0.6)
            : theme.palette.background.paper
        }}
      >
        {/* Header with Timer */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography 
            variant="h4" 
            gutterBottom
            sx={{ 
              fontWeight: 600, 
              letterSpacing: '-0.5px',
              color: isDark 
                ? theme.palette.primary.light
                : theme.palette.primary.dark,
              mb: 0
            }}
          >
            {test.title}
          </Typography>
          
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              p: 1.5,
              borderRadius: 2,
              backgroundColor: isDark
                ? alpha(theme.palette.warning.dark, 0.2)
                : alpha(theme.palette.warning.light, 0.2),
              border: `1px solid ${isDark ? alpha(theme.palette.warning.main, 0.3) : alpha(theme.palette.warning.main, 0.3)}`,
            }}
          >
            <TimerIcon 
              sx={{ 
                mr: 1, 
                color: isDark ? theme.palette.warning.light : theme.palette.warning.dark 
              }} 
            />
            <Typography 
              variant="h6" 
              sx={{ 
                fontFamily: 'monospace', 
                fontWeight: 600,
                color: isDark ? theme.palette.warning.light : theme.palette.warning.dark 
              }}
            >
              {formatTime(timeRemaining)}
            </Typography>
          </Box>
        </Box>
        
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={4}>
            <Typography 
              variant="body1" 
              sx={{ 
                fontWeight: 500,
                color: alpha(theme.palette.text.primary, isDark ? 0.9 : 0.7)
              }}
            >
              <strong>Subject:</strong> {test.subject}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography 
              variant="body1"
              sx={{ 
                fontWeight: 500,
                color: alpha(theme.palette.text.primary, isDark ? 0.9 : 0.7)
              }}
            >
              <strong>Total Marks:</strong> {test.totalMarks}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography 
              variant="body1"
              sx={{ 
                fontWeight: 500,
                color: alpha(theme.palette.text.primary, isDark ? 0.9 : 0.7)
              }}
            >
              <strong>Duration:</strong> {test.duration} minutes
            </Typography>
          </Grid>
        </Grid>
        
        {test.description && (
          <Typography 
            variant="body1" 
            paragraph
            sx={{ 
              color: theme.palette.text.primary,
              mb: 3
            }}
          >
            {test.description}
          </Typography>
        )}

        {/* Test PDF Viewer */}
        {test.pdfUrl && (
          <Box mb={4}>
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{ 
                fontWeight: 500,
                color: isDark 
                  ? theme.palette.primary.light
                  : theme.palette.primary.dark,
                mb: 2
              }}
            >
              Test Paper
            </Typography>
            <Box 
              sx={{ 
                width: '100%', 
                height: '600px',
                border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                borderRadius: 2,
                overflow: 'hidden'
              }}
            >
              <iframe 
                src={`${API_BASE_URL}${test.pdfUrl}`}
                width="100%" 
                height="100%" 
                style={{ border: 'none' }}
                title="Test PDF"
              />
            </Box>
          </Box>
        )}
        
        {/* Answer Upload Section */}
        <Box mt={4}>
          <Typography 
            variant="h6" 
            gutterBottom
            sx={{ 
              fontWeight: 500,
              color: isDark 
                ? theme.palette.primary.light
                : theme.palette.primary.dark
            }}
          >
            Submit Your Answers
          </Typography>
          
          <Typography 
            variant="body1" 
            paragraph
            sx={{ 
              color: theme.palette.text.secondary,
              mb: 3 
            }}
          >
            Please upload your answers as a PDF file. Make sure your answers are clear and organized according to the questions in the test paper.
          </Typography>
          
          <Stack spacing={3}>
            <TextField
              type="file"
              variant="outlined"
              fullWidth
              inputProps={{ 
                accept: "application/pdf" 
              }}
              onChange={handleFileChange}
              disabled={uploading || uploadSuccess}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  transition: 'all 0.2s',
                  '& fieldset': {
                    borderColor: alpha(theme.palette.divider, isDark ? 0.7 : 0.3)
                  },
                  '&:hover fieldset': {
                    borderColor: isDark
                      ? theme.palette.primary.light
                      : theme.palette.primary.main
                  },
                  '&.Mui-focused': {
                    boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, isDark ? 0.3 : 0.2)}`
                  }
                }
              }}
            />
            
            {uploadError && (
              <Alert severity="error">{uploadError}</Alert>
            )}
            
            {uploadSuccess && (
              <Alert severity="success">
                Your test has been submitted successfully. Redirecting to dashboard...
              </Alert>
            )}
            
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={!answerFile || uploading || uploadSuccess}
              sx={{
                py: 1.5,
                fontWeight: 500,
                borderRadius: 2,
                textTransform: 'none',
                backgroundColor: isDark ? theme.palette.primary.dark : theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: isDark 
                    ? alpha(theme.palette.primary.dark, 0.9)
                    : alpha(theme.palette.primary.main, 0.9)
                },
                '&.Mui-disabled': {
                  backgroundColor: alpha(theme.palette.action.disabled, 0.3),
                  color: theme.palette.action.disabled
                }
              }}
            >
              {uploading ? <CircularProgress size={24} color="inherit" /> : 'Submit Test'}
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
};

export default TestPage; 
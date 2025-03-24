import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Button, 
  Alert, 
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import TestTimer from '../components/TestTimer';
import TestAcknowledgment from '../components/TestAcknowledgment';
import { API_BASE_URL } from '../config/constants';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import UploadFileIcon from '@mui/icons-material/UploadFile';

interface Test {
  id: number;
  title: string;
  subject: string;
  description: string | null;
  totalMarks: number;
  passingMarks: number;
  duration: number;
  pdfUrl: string | null;
  startTime: string;
}

const TestPage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [test, setTest] = useState<Test | null>(null);
  const [acknowledged, setAcknowledged] = useState<boolean>(false);
  const [answerPdf, setAnswerPdf] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [uploadingAnswers, setUploadingAnswers] = useState<boolean>(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState<boolean>(false);
  const [timeUpDialogOpen, setTimeUpDialogOpen] = useState<boolean>(false);
  
  // Fetch test data
  useEffect(() => {
    const fetchTest = async () => {
      if (!token || !testId) {
        navigate('/dashboard');
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // Start the test
        const response = await axios.post(
          `${API_BASE_URL}/api/v1/tests/${testId}/start`,
          {},
          {
            headers: {
              'Content-Type': 'application/json',
              'x-auth-token': token
            }
          }
        );
        
        console.log("Test response:", response.data); // Log the response for debugging
        
        if (response.data.success) {
          // Verify the structure of the response
          if (!response.data.test) {
            setError('Invalid test data received from server');
            setLoading(false);
            return;
          }
          
          setTest(response.data.test);
        } else {
          setError('Failed to start the test');
        }
      } catch (err) {
        console.error('Error starting test:', err);
        
        if (axios.isAxiosError(err)) {
          if (err.response?.status === 401) {
            setError('Your session has expired. Please login again.');
            setTimeout(() => {
              navigate('/login');
            }, 2000);
          } else if (err.response?.status === 400) {
            setError(err.response.data.message || 'Error starting test');
          } else {
            setError(`Failed to start the test: ${err.response?.data?.message || 'Unknown error'}`);
          }
        } else {
          setError('An unexpected error occurred');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchTest();
  }, [token, testId, navigate]);
  
  // Handle test time expiring
  const handleTimeUp = useCallback(() => {
    setTimeUpDialogOpen(true);
    // In a real app, you would auto-submit the test here
  }, []);
  
  // Handle answer PDF change
  const handleAnswerPdfChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      
      // Validate file type
      if (file.type !== 'application/pdf') {
        setFileError('Only PDF files are allowed');
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setFileError('File size must be less than 5MB');
        return;
      }
      
      setAnswerPdf(file);
    }
  };
  
  // Remove the uploaded PDF
  const handleRemovePdf = () => {
    setAnswerPdf(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Upload PDF answer
  const uploadAnswerPdf = async () => {
    if (!testId || !token || !answerPdf) return;
    
    // Set uploading state
    setUploadingAnswers(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('answerPdf', answerPdf);
      
      // Upload the answer PDF
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/tests/${testId}/upload-answer`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'x-auth-token': token
          }
        }
      );
      
      console.log('Answer PDF uploaded successfully', response.data);
      return response.data;
    } catch (err) {
      console.error('Error uploading answer PDF:', err);
      setError('Failed to upload answer PDF');
      throw err;
    } finally {
      setUploadingAnswers(false);
    }
  };
  
  // Handle test submission
  const handleSubmitTest = async () => {
    setSubmitting(true);
    
    try {
      // First, upload the answer PDF if it exists
      if (answerPdf) {
        await uploadAnswerPdf();
      }
      
      // Then, submit the test
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/tests/${testId}/submit`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token
          }
        }
      );
      
      if (response.data.success) {
        console.log('Test submitted successfully');
        navigate('/dashboard');
      } else {
        setError('Failed to submit test');
      }
    } catch (err) {
      console.error('Error submitting test:', err);
      setError('Failed to submit test');
    } finally {
      setSubmitting(false);
      setSubmitDialogOpen(false);
    }
  };
  
  // Handle acknowledgment acceptance
  const handleAcknowledgment = () => {
    setAcknowledged(true);
  };
  
  // Handle acknowledgment cancellation
  const handleCancelAcknowledgment = () => {
    navigate('/dashboard');
  };
  
  // Show loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Show error message
  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/dashboard')}>
          Return to Dashboard
        </Button>
      </Container>
    );
  }
  
  // Show acknowledgment page if not acknowledged
  if (!acknowledged && test) {
    return (
      <TestAcknowledgment
        testTitle={test.title}
        testDuration={test.duration}
        onAccept={handleAcknowledgment}
        onCancel={handleCancelAcknowledgment}
      />
    );
  }
  
  // Show test not found message
  if (!test) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          Test not found or could not be started
        </Alert>
        <Button variant="contained" onClick={() => navigate('/dashboard')}>
          Return to Dashboard
        </Button>
      </Container>
    );
  }
  
  return (
    <Box>
      {/* Fixed timer at the top right */}
      <Box 
        sx={{ 
          position: 'fixed', 
          top: 20, 
          right: 20, 
          zIndex: 1000 
        }}
      >
        <TestTimer 
          durationMinutes={test.duration} 
          startTime={test.startTime ? new Date(test.startTime) : new Date()} 
          onTimeUp={handleTimeUp} 
        />
      </Box>
      
      <Container maxWidth="md" sx={{ mt: 10, mb: 8 }}>
        <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            {test.title}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            {test.subject}
          </Typography>
          {test.description && (
            <Typography variant="body1" paragraph>
              {test.description}
            </Typography>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Typography variant="body2">
              <strong>Total Marks:</strong> {test.totalMarks}
            </Typography>
            <Typography variant="body2">
              <strong>Passing Marks:</strong> {test.passingMarks}
            </Typography>
            <Typography variant="body2">
              <strong>Duration:</strong> {test.duration} minutes
            </Typography>
          </Box>
        </Paper>
        
        {/* Display the PDF if available */}
        {test.pdfUrl && (
          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Test Paper
            </Typography>
            <Box sx={{ width: '100%', height: '500px', overflow: 'hidden', mt: 2 }}>
              <iframe 
                src={`${API_BASE_URL}${test.pdfUrl}`}
                width="100%"
                height="100%"
                title="Test Paper"
                style={{ border: 'none' }}
              />
            </Box>
          </Paper>
        )}
        
        {/* Upload Answer PDF */}
        <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Upload Your Answers
          </Typography>
          <Typography variant="body2" sx={{ mb: 3 }}>
            Please upload a single PDF file containing all your answers. Make sure the file is organized 
            clearly with question numbers matching the questions in the test paper.
          </Typography>
          
          {fileError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {fileError}
            </Alert>
          )}
          
          <input
            type="file"
            hidden
            accept="application/pdf"
            ref={fileInputRef}
            onChange={handleAnswerPdfChange}
          />
          
          {!answerPdf ? (
            <Button
              variant="outlined"
              onClick={triggerFileInput}
              startIcon={<UploadFileIcon />}
              fullWidth
              sx={{ py: 2, borderStyle: 'dashed' }}
            >
              Upload PDF with All Answers
            </Button>
          ) : (
            <Box sx={{ 
              border: '1px solid #ddd', 
              borderRadius: 1, 
              p: 2, 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Box display="flex" alignItems="center">
                <PictureAsPdfIcon color="error" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                    {answerPdf.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {(answerPdf.size / 1024 / 1024).toFixed(2)} MB
                  </Typography>
                </Box>
              </Box>
              <Button 
                size="small" 
                color="error" 
                variant="outlined"
                onClick={handleRemovePdf}
              >
                Remove
              </Button>
            </Box>
          )}
        </Paper>
        
        {/* Submit button */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 4 }}>
          <Button 
            variant="contained" 
            color="primary" 
            size="large"
            disabled={submitting || uploadingAnswers}
            onClick={() => setSubmitDialogOpen(true)}
          >
            {submitting || uploadingAnswers ? 'Processing...' : 'Submit Test'}
          </Button>
        </Box>
      </Container>
      
      {/* Submit confirmation dialog */}
      <Dialog
        open={submitDialogOpen}
        onClose={() => !submitting && !uploadingAnswers && setSubmitDialogOpen(false)}
      >
        <DialogTitle>Submit Test?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to submit your test? {answerPdf ? 'Your PDF answer will be uploaded and ' : ''}
            you cannot make further changes after submission.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setSubmitDialogOpen(false)} 
            color="primary"
            disabled={submitting || uploadingAnswers}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitTest} 
            color="primary" 
            variant="contained" 
            disabled={submitting || uploadingAnswers}
          >
            {submitting || uploadingAnswers ? 'Processing...' : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Time's up dialog */}
      <Dialog
        open={timeUpDialogOpen}
        onClose={() => {}}
      >
        <DialogTitle>Time's Up!</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Your test time has expired. Your answers will be submitted automatically.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleSubmitTest} 
            color="primary" 
            variant="contained" 
            disabled={submitting || uploadingAnswers}
          >
            {submitting || uploadingAnswers ? 'Processing...' : 'Submit Now'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TestPage; 
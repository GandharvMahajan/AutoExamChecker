import React, { useState } from 'react';
import { Box, Typography, Paper, Button, Alert } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import UploadFileIcon from '@mui/icons-material/UploadFile';

interface TestQuestionProps {
  questionNumber: number;
  questionText: string;
  answerPdfFile: File | null;
  onAnswerPdfChange: (file: File | null) => void;
}

const TestQuestion: React.FC<TestQuestionProps> = ({
  questionNumber,
  questionText,
  answerPdfFile,
  onAnswerPdfChange,
}) => {
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      
      // Validate file type
      if (file.type !== 'application/pdf') {
        setError('Only PDF files are allowed');
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      
      setError(null);
      onAnswerPdfChange(file);
    }
  };

  const handleRemoveFile = () => {
    onAnswerPdfChange(null);
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" color="primary" fontWeight="bold">
          Question {questionNumber}
        </Typography>
        <Typography variant="body1" sx={{ mt: 1 }}>
          {questionText}
        </Typography>
      </Box>
      
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Your Answer (Upload PDF):
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {!answerPdfFile ? (
          <Button
            variant="outlined"
            component="label"
            startIcon={<UploadFileIcon />}
            fullWidth
            sx={{ py: 2, borderStyle: 'dashed' }}
          >
            Upload PDF Answer
            <input
              type="file"
              hidden
              accept="application/pdf"
              onChange={handleFileChange}
            />
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
                  {answerPdfFile.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {(answerPdfFile.size / 1024 / 1024).toFixed(2)} MB
                </Typography>
              </Box>
            </Box>
            <Button 
              size="small" 
              color="error" 
              variant="outlined"
              onClick={handleRemoveFile}
            >
              Remove
            </Button>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default TestQuestion; 
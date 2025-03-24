import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import AlarmIcon from '@mui/icons-material/Alarm';

interface TestTimerProps {
  durationMinutes: number;
  startTime: Date;
  onTimeUp: () => void;
}

const TestTimer: React.FC<TestTimerProps> = ({ durationMinutes, startTime, onTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [progress, setProgress] = useState<number>(100);
  
  // Calculate time remaining and update progress
  const calculateTimeLeft = useCallback(() => {
    const now = new Date();
    const testStartTime = new Date(startTime);
    const endTime = new Date(testStartTime.getTime() + durationMinutes * 60 * 1000);
    
    // Time passed in milliseconds
    const timePassed = now.getTime() - testStartTime.getTime();
    // Total duration in milliseconds
    const totalDuration = durationMinutes * 60 * 1000;
    // Time left in milliseconds
    const remaining = endTime.getTime() - now.getTime();
    
    // Calculate progress percentage (reversed, 100% -> 0%)
    const progressValue = Math.max(0, Math.min(100, (1 - timePassed / totalDuration) * 100));
    
    setProgress(progressValue);
    
    if (remaining <= 0) {
      setTimeLeft(0);
      onTimeUp();
      return 0;
    }
    
    return Math.max(0, Math.floor(remaining / 1000));
  }, [durationMinutes, startTime, onTimeUp]);
  
  useEffect(() => {
    // Initial calculation
    setTimeLeft(calculateTimeLeft());
    
    // Update every second
    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        clearInterval(timer);
      }
    }, 1000);
    
    // Clean up on unmount
    return () => clearInterval(timer);
  }, [calculateTimeLeft]);
  
  // Format time as HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  };
  
  // Determine color based on remaining time
  const getTimerColor = (): 'primary' | 'warning' | 'error' => {
    const percentage = progress;
    if (percentage > 50) return 'primary';
    if (percentage > 20) return 'warning';
    return 'error';
  };
  
  const timerColor = getTimerColor();
  
  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      bgcolor: 'background.paper',
      boxShadow: 2,
      borderRadius: 2,
      p: 2
    }}>
      <Box sx={{ position: 'relative', display: 'inline-flex', mr: 2 }}>
        <CircularProgress
          variant="determinate"
          value={progress}
          color={timerColor}
          size={50}
        />
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AlarmIcon fontSize="small" color={timerColor} />
        </Box>
      </Box>
      
      <Box>
        <Typography variant="caption" color="text.secondary">
          Time Remaining
        </Typography>
        <Typography variant="h6" color={timerColor} fontWeight="bold">
          {formatTime(timeLeft)}
        </Typography>
      </Box>
    </Box>
  );
};

export default TestTimer; 
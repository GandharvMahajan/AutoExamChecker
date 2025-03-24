import React, { useState } from 'react';
import { Box, Paper, Typography, Checkbox, Button, FormControlLabel, Alert, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import TimerIcon from '@mui/icons-material/Timer';
import NoPhotographyIcon from '@mui/icons-material/NoPhotography';
import DevicesIcon from '@mui/icons-material/Devices';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ErrorIcon from '@mui/icons-material/Error';

interface TestAcknowledgmentProps {
  testTitle: string;
  testDuration: number;
  onAccept: () => void;
  onCancel: () => void;
}

const TestAcknowledgment: React.FC<TestAcknowledgmentProps> = ({
  testTitle,
  testDuration,
  onAccept,
  onCancel,
}) => {
  const [accepted, setAccepted] = useState(false);
  
  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAccepted(event.target.checked);
  };
  
  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', my: 4, p: 2 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
          <WarningIcon color="warning" fontSize="large" sx={{ mr: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom>
            Test Acknowledgment
          </Typography>
        </Box>
        
        <Typography variant="h5" gutterBottom color="primary">
          {testTitle}
        </Typography>
        
        <Alert severity="warning" sx={{ my: 3 }}>
          Please read and acknowledge the following rules before starting the test.
        </Alert>
        
        <List>
          <ListItem>
            <ListItemIcon>
              <TimerIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Time Limit" 
              secondary={`This test has a time limit of ${testDuration} minutes. Once started, the timer cannot be paused or stopped.`} 
            />
          </ListItem>
          
          <ListItem>
            <ListItemIcon>
              <NoPhotographyIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="No Screenshots" 
              secondary="Taking screenshots or pictures of the test content is strictly prohibited." 
            />
          </ListItem>
          
          <ListItem>
            <ListItemIcon>
              <DevicesIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="One Device" 
              secondary="The test should be completed on one device without switching browsers or tabs." 
            />
          </ListItem>
          
          <ListItem>
            <ListItemIcon>
              <MenuBookIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="No External Help" 
              secondary="Do not use external resources, books, or assistance during the test." 
            />
          </ListItem>
          
          <ListItem>
            <ListItemIcon>
              <ErrorIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Auto-Submit" 
              secondary="The test will automatically submit when the time expires or if you close the browser window." 
            />
          </ListItem>
        </List>
        
        <FormControlLabel
          control={
            <Checkbox 
              checked={accepted} 
              onChange={handleCheckboxChange} 
              color="primary" 
            />
          }
          label="I have read and agree to follow the test rules"
          sx={{ mt: 2, display: 'block' }}
        />
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
          <Button 
            variant="outlined" 
            color="secondary" 
            onClick={onCancel}
          >
            Cancel
          </Button>
          
          <Button 
            variant="contained" 
            color="primary" 
            disabled={!accepted}
            onClick={onAccept}
          >
            Start Test
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default TestAcknowledgment; 
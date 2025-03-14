import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Card, 
  CardContent, 
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonIcon from '@mui/icons-material/Person';
import { dashboardService } from '../services/adminApi';
import { format } from 'date-fns';

interface DashboardStats {
  totalUsers: number;
  totalTests: number;
  totalTestsStarted: number;
  totalTestsCompleted: number;
  completionRate: number;
}

interface RecentUser {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

interface RecentTestAttempt {
  id: number;
  status: string;
  score: number | null;
  startedAt: string | null;
  completedAt: string | null;
  user: {
    name: string;
    email: string;
  };
  test: {
    title: string;
    subject: string;
  };
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentTestAttempts, setRecentTestAttempts] = useState<RecentTestAttempt[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await dashboardService.getStats();
        
        if (response.success) {
          setStats(response.stats);
          setRecentUsers(response.recentUsers);
          setRecentTestAttempts(response.recentTestAttempts);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'NotStarted': return 'default';
      case 'InProgress': return 'warning';
      case 'Completed': return 'success';
      default: return 'default';
    }
  };
  
  // Helper function to format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ p: 3, bgcolor: '#ffebee', borderRadius: 1 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Users
                  </Typography>
                  <Typography variant="h4">
                    {stats?.totalUsers || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#bbdefb', color: '#1976d2', width: 56, height: 56 }}>
                  <PeopleIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Tests
                  </Typography>
                  <Typography variant="h4">
                    {stats?.totalTests || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#fff9c4', color: '#fbc02d', width: 56, height: 56 }}>
                  <AssignmentIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Tests Started
                  </Typography>
                  <Typography variant="h4">
                    {stats?.totalTestsStarted || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#e1f5fe', color: '#03a9f4', width: 56, height: 56 }}>
                  <AssignmentIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Tests Completed
                  </Typography>
                  <Typography variant="h4">
                    {stats?.totalTestsCompleted || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#e8f5e9', color: '#4caf50', width: 56, height: 56 }}>
                  <CheckCircleIcon />
                </Avatar>
              </Box>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Completion Rate: {stats?.completionRate.toFixed(1) || 0}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Recent Activity */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Users
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <List>
              {recentUsers.length > 0 ? (
                recentUsers.map((user) => (
                  <ListItem key={user.id} divider>
                    <ListItemAvatar>
                      <Avatar>
                        <PersonIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={user.name}
                      secondary={
                        <>
                          <Typography component="span" variant="body2" color="textSecondary">
                            {user.email}
                          </Typography>
                          <br />
                          <Typography component="span" variant="body2" color="textSecondary">
                            Joined: {formatDate(user.createdAt)}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary="No recent users" />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Test Activity
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <List>
              {recentTestAttempts.length > 0 ? (
                recentTestAttempts.map((attempt) => (
                  <ListItem key={attempt.id} divider>
                    <ListItemText
                      primary={attempt.test.title}
                      secondary={
                        <>
                          <Typography component="span" variant="body2" color="textSecondary">
                            User: {attempt.user.name}
                          </Typography>
                          <br />
                          <Typography component="span" variant="body2" color="textSecondary">
                            Started: {formatDate(attempt.startedAt)}
                          </Typography>
                          {attempt.completedAt && (
                            <>
                              <br />
                              <Typography component="span" variant="body2" color="textSecondary">
                                Completed: {formatDate(attempt.completedAt)}
                              </Typography>
                            </>
                          )}
                          {attempt.score !== null && (
                            <>
                              <br />
                              <Typography component="span" variant="body2" color="textSecondary">
                                Score: {attempt.score}
                              </Typography>
                            </>
                          )}
                        </>
                      }
                    />
                    <Chip 
                      label={attempt.status} 
                      color={getStatusColor(attempt.status) as any}
                      size="small" 
                    />
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary="No recent test activity" />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 
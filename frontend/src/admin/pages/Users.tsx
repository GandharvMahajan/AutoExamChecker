import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  Snackbar,
  Alert,
  Chip,
  Avatar
} from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { userService } from '../services/adminApi';

interface User {
  id: number;
  email: string;
  name: string;
  credits: number;
  isAdmin: boolean;
  createdAt: string;
}

interface UserDetails extends User {
  testsStarted: number;
  testsCompleted: number;
  lastLoginAt: string | null;
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
  const [openViewDialog, setOpenViewDialog] = useState<boolean>(false);
  const [openAdminDialog, setOpenAdminDialog] = useState<boolean>(false);
  const [userLoading, setUserLoading] = useState<boolean>(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);
  
  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching users...');
      const response = await userService.getAllUsers();
      console.log('Users API response:', response);
      
      if (response && response.success) {
        console.log('Setting users data:', response.users);
        setUsers(response.users || []);
      } else {
        console.error('API response was successful but missing data');
        setError('Failed to load users: Missing data in response');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };
  
  // Handle page change
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Get user details
  const getUserDetails = async (userId: number) => {
    try {
      setUserLoading(true);
      
      const response = await userService.getUserById(userId);
      
      if (response.success) {
        setSelectedUser(response.user);
        setOpenViewDialog(true);
      }
    } catch (err) {
      console.error('Error fetching user details:', err);
      setSnackbar({
        open: true,
        message: 'Failed to load user details',
        severity: 'error'
      });
    } finally {
      setUserLoading(false);
    }
  };
  
  // Handle opening admin dialog
  const handleOpenAdminDialog = (user: User) => {
    setSelectedUser(user as UserDetails);
    setOpenAdminDialog(true);
  };
  
  // Close dialogs
  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
  };
  
  const handleCloseAdminDialog = () => {
    setOpenAdminDialog(false);
  };
  
  // Toggle admin status
  const handleToggleAdmin = async () => {
    if (!selectedUser) return;
    
    try {
      const response = await userService.toggleAdminStatus(selectedUser.id);
      
      if (response.success) {
        setSnackbar({
          open: true,
          message: `User is now ${response.user.isAdmin ? 'an admin' : 'not an admin'}`,
          severity: 'success'
        });
        handleCloseAdminDialog();
        
        // Update users list
        setUsers(users.map(user => 
          user.id === selectedUser.id 
            ? { ...user, isAdmin: response.user.isAdmin }
            : user
        ));
      }
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: `Failed to update user: ${err.response?.data?.message || 'Unknown error'}`,
        severity: 'error'
      });
    }
  };
  
  // Handle snackbar close
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };
  
  // Render loading state
  if (loading && users.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }
  
  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };
  
  return (
    <Box>
      <Typography variant="h4" mb={3}>
        Manage Users
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Credits</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.credits}</TableCell>
                    <TableCell>
                      <Chip 
                        icon={user.isAdmin ? <AdminPanelSettingsIcon /> : <PersonIcon />}
                        label={user.isAdmin ? 'Admin' : 'User'}
                        color={user.isAdmin ? 'primary' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="info"
                        onClick={() => getUserDetails(user.id)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton
                        color={user.isAdmin ? 'warning' : 'primary'}
                        onClick={() => handleOpenAdminDialog(user)}
                      >
                        <AdminPanelSettingsIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={users.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
      
      {/* View User Dialog */}
      <Dialog open={openViewDialog} onClose={handleCloseViewDialog} maxWidth="sm" fullWidth>
        <DialogTitle>User Details</DialogTitle>
        <DialogContent>
          {userLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" my={3}>
              <CircularProgress />
            </Box>
          ) : selectedUser && (
            <Box sx={{ mt: 2 }}>
              <Box display="flex" alignItems="center" mb={3}>
                <Avatar sx={{ bgcolor: selectedUser.isAdmin ? 'primary.main' : 'grey.500', mr: 2 }}>
                  {selectedUser.name.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6">{selectedUser.name}</Typography>
                  <Typography variant="body2" color="textSecondary">{selectedUser.email}</Typography>
                </Box>
              </Box>
              
              <Box mb={2}>
                <Typography variant="subtitle2" gutterBottom>Account Status</Typography>
                <Chip 
                  icon={selectedUser.isAdmin ? <AdminPanelSettingsIcon /> : <PersonIcon />}
                  label={selectedUser.isAdmin ? 'Admin' : 'User'}
                  color={selectedUser.isAdmin ? 'primary' : 'default'}
                />
              </Box>
              
              <Box mb={2}>
                <Typography variant="subtitle2" gutterBottom>Credits</Typography>
                <Typography>{selectedUser.credits}</Typography>
              </Box>
              
              <Box mb={2}>
                <Typography variant="subtitle2" gutterBottom>Account Created</Typography>
                <Typography>{formatDate(selectedUser.createdAt)}</Typography>
              </Box>
              
              <Box mb={2}>
                <Typography variant="subtitle2" gutterBottom>Last Login</Typography>
                <Typography>{formatDate(selectedUser.lastLoginAt)}</Typography>
              </Box>
              
              <Box mb={2}>
                <Typography variant="subtitle2" gutterBottom>Tests Activity</Typography>
                <Typography>Started: {selectedUser.testsStarted}</Typography>
                <Typography>Completed: {selectedUser.testsCompleted}</Typography>
                {selectedUser.testsStarted > 0 && (
                  <Typography>
                    Completion Rate: {Math.round((selectedUser.testsCompleted / selectedUser.testsStarted) * 100)}%
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>Close</Button>
        </DialogActions>
      </Dialog>
      
      {/* Toggle Admin Dialog */}
      <Dialog open={openAdminDialog} onClose={handleCloseAdminDialog}>
        <DialogTitle>Change User Status</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {selectedUser?.isAdmin 
              ? `Are you sure you want to remove admin privileges from ${selectedUser?.name}?`
              : `Are you sure you want to make ${selectedUser?.name} an admin?`
            }
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAdminDialog}>Cancel</Button>
          <Button 
            onClick={handleToggleAdmin} 
            variant="contained" 
            color={selectedUser?.isAdmin ? 'warning' : 'primary'}
          >
            {selectedUser?.isAdmin ? 'Remove Admin Status' : 'Make Admin'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Users; 
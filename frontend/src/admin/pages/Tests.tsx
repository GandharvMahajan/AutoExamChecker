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
  TextField,
  Typography,
  Snackbar,
  Alert,
  Grid
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { testService } from '../services/adminApi';

interface Test {
  id: number;
  title: string;
  subject: string;
  description: string | null;
  totalMarks: number;
  passingMarks: number;
  duration: number;
  class: number;
  createdAt: string;
  updatedAt: string;
}

interface TestFormData {
  title: string;
  subject: string;
  description: string;
  totalMarks: number;
  passingMarks: number;
  duration: number;
  class: number;
  pdfFile?: File | null;
}

const initialFormData: TestFormData = {
  title: '',
  subject: '',
  description: '',
  totalMarks: 100,
  passingMarks: 40,
  duration: 120,
  class: 10,
  pdfFile: null
};

const Tests: React.FC = () => {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [openAddDialog, setOpenAddDialog] = useState<boolean>(false);
  const [openEditDialog, setOpenEditDialog] = useState<boolean>(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
  const [currentTest, setCurrentTest] = useState<Test | null>(null);
  const [formData, setFormData] = useState<TestFormData>(initialFormData);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Fetch tests on component mount
  useEffect(() => {
    fetchTests();
  }, []);
  
  // Fetch all tests
  const fetchTests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await testService.getAllTests();
      
      if (response.success) {
        setTests(response.tests);
      }
    } catch (err) {
      console.error('Error fetching tests:', err);
      setError('Failed to load tests');
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
  
  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'totalMarks' || name === 'passingMarks' || name === 'duration' || name === 'class' 
        ? parseInt(value) || 0 
        : value
    });
    
    // Clear validation error for the field
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: ''
      });
    }
  };
  
  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFormData({
        ...formData,
        pdfFile: e.target.files[0]
      });
      
      // Clear validation error for the field
      if (validationErrors.pdfFile) {
        setValidationErrors({
          ...validationErrors,
          pdfFile: ''
        });
      }
    }
  };
  
  // Validate form
  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!formData.subject.trim()) {
      errors.subject = 'Subject is required';
    }
    
    if (formData.totalMarks <= 0) {
      errors.totalMarks = 'Total marks must be greater than 0';
    }
    
    if (formData.passingMarks < 0) {
      errors.passingMarks = 'Passing marks must be non-negative';
    }
    
    if (formData.passingMarks > formData.totalMarks) {
      errors.passingMarks = 'Passing marks cannot exceed total marks';
    }
    
    if (formData.duration <= 0) {
      errors.duration = 'Duration must be greater than 0';
    }
    
    if (formData.class < 1 || formData.class > 12) {
      errors.class = 'Class must be between 1 and 12';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle dialog open/close
  const handleOpenAddDialog = () => {
    setFormData(initialFormData);
    setValidationErrors({});
    setOpenAddDialog(true);
  };
  
  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
  };
  
  const handleOpenEditDialog = (test: Test) => {
    setCurrentTest(test);
    setFormData({
      title: test.title,
      subject: test.subject,
      description: test.description || '',
      totalMarks: test.totalMarks,
      passingMarks: test.passingMarks,
      duration: test.duration,
      class: test.class
    });
    setValidationErrors({});
    setOpenEditDialog(true);
  };
  
  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
  };
  
  const handleOpenDeleteDialog = (test: Test) => {
    setCurrentTest(test);
    setOpenDeleteDialog(true);
  };
  
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };
  
  // Handle form submission
  const handleAddTest = async () => {
    if (!validateForm()) return;
    
    try {
      // Create form data for file upload
      const formDataObj = new FormData();
      formDataObj.append('title', formData.title);
      formDataObj.append('subject', formData.subject);
      formDataObj.append('description', formData.description);
      formDataObj.append('totalMarks', formData.totalMarks.toString());
      formDataObj.append('passingMarks', formData.passingMarks.toString());
      formDataObj.append('duration', formData.duration.toString());
      formDataObj.append('class', formData.class.toString());
      
      // Add PDF file if it exists
      if (formData.pdfFile) {
        formDataObj.append('pdfFile', formData.pdfFile);
      }
      
      const response = await testService.createTestWithPDF(formDataObj);
      
      if (response.success) {
        setSnackbar({
          open: true,
          message: 'Test created successfully',
          severity: 'success'
        });
        handleCloseAddDialog();
        fetchTests();
      }
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: `Failed to create test: ${err.response?.data?.message || 'Unknown error'}`,
        severity: 'error'
      });
    }
  };
  
  const handleEditTest = async () => {
    if (!validateForm() || !currentTest) return;
    
    try {
      // Create form data for file upload
      const formDataObj = new FormData();
      formDataObj.append('title', formData.title);
      formDataObj.append('subject', formData.subject);
      formDataObj.append('description', formData.description);
      formDataObj.append('totalMarks', formData.totalMarks.toString());
      formDataObj.append('passingMarks', formData.passingMarks.toString());
      formDataObj.append('duration', formData.duration.toString());
      formDataObj.append('class', formData.class.toString());
      
      // Add PDF file if it exists
      if (formData.pdfFile) {
        formDataObj.append('pdfFile', formData.pdfFile);
      }
      
      const response = await testService.updateTestWithPDF(currentTest.id, formDataObj);
      
      if (response.success) {
        setSnackbar({
          open: true,
          message: 'Test updated successfully',
          severity: 'success'
        });
        handleCloseEditDialog();
        fetchTests();
      }
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: `Failed to update test: ${err.response?.data?.message || 'Unknown error'}`,
        severity: 'error'
      });
    }
  };
  
  const handleDeleteTest = async () => {
    if (!currentTest) return;
    
    try {
      const response = await testService.deleteTest(currentTest.id);
      
      if (response.success) {
        setSnackbar({
          open: true,
          message: 'Test deleted successfully',
          severity: 'success'
        });
        handleCloseDeleteDialog();
        fetchTests();
      }
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: `Failed to delete test: ${err.response?.data?.message || 'Unknown error'}`,
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
  if (loading && tests.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Manage Tests
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenAddDialog}
        >
          Add New Test
        </Button>
      </Box>
      
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
                <TableCell>Title</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Class</TableCell>
                <TableCell>Total Marks</TableCell>
                <TableCell>Passing Marks</TableCell>
                <TableCell>Duration (min)</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(rowsPerPage > 0
                ? tests.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                : tests
              ).map((test) => (
                <TableRow key={test.id}>
                  <TableCell>{test.id}</TableCell>
                  <TableCell>{test.title}</TableCell>
                  <TableCell>{test.subject}</TableCell>
                  <TableCell>{test.class}</TableCell>
                  <TableCell>{test.totalMarks}</TableCell>
                  <TableCell>{test.passingMarks}</TableCell>
                  <TableCell>{test.duration}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      color="primary"
                      onClick={() => handleOpenEditDialog(test)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleOpenDeleteDialog(test)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {tests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No tests found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={tests.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
      
      {/* Add Test Dialog */}
      <Dialog open={openAddDialog} onClose={handleCloseAddDialog} maxWidth="md" fullWidth>
        <DialogTitle>Add New Test</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                name="title"
                label="Test Title"
                fullWidth
                value={formData.title}
                onChange={handleInputChange}
                error={!!validationErrors.title}
                helperText={validationErrors.title}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="subject"
                label="Subject"
                fullWidth
                value={formData.subject}
                onChange={handleInputChange}
                error={!!validationErrors.subject}
                helperText={validationErrors.subject}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                name="class"
                label="Class (1-12)"
                type="number"
                fullWidth
                value={formData.class}
                onChange={handleInputChange}
                error={!!validationErrors.class}
                helperText={validationErrors.class}
                required
                inputProps={{ min: 1, max: 12 }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                name="totalMarks"
                label="Total Marks"
                type="number"
                fullWidth
                value={formData.totalMarks}
                onChange={handleInputChange}
                error={!!validationErrors.totalMarks}
                helperText={validationErrors.totalMarks}
                required
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                name="passingMarks"
                label="Passing Marks"
                type="number"
                fullWidth
                value={formData.passingMarks}
                onChange={handleInputChange}
                error={!!validationErrors.passingMarks}
                helperText={validationErrors.passingMarks}
                required
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                name="duration"
                label="Duration (minutes)"
                type="number"
                fullWidth
                value={formData.duration}
                onChange={handleInputChange}
                error={!!validationErrors.duration}
                helperText={validationErrors.duration}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{ mt: 1 }}
              >
                {formData.pdfFile ? 'Change PDF File' : 'Upload PDF File'}
                <input
                  type="file"
                  accept=".pdf"
                  hidden
                  onChange={handleFileUpload}
                />
              </Button>
              {formData.pdfFile && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Selected file: {formData.pdfFile.name}
                </Typography>
              )}
              {validationErrors.pdfFile && (
                <Typography variant="caption" color="error">
                  {validationErrors.pdfFile}
                </Typography>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog}>Cancel</Button>
          <Button onClick={handleAddTest} variant="contained" color="primary">
            Create Test
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit Test Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog} maxWidth="md" fullWidth>
        <DialogTitle>Edit Test</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                name="title"
                label="Test Title"
                fullWidth
                value={formData.title}
                onChange={handleInputChange}
                error={!!validationErrors.title}
                helperText={validationErrors.title}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="subject"
                label="Subject"
                fullWidth
                value={formData.subject}
                onChange={handleInputChange}
                error={!!validationErrors.subject}
                helperText={validationErrors.subject}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                name="class"
                label="Class (1-12)"
                type="number"
                fullWidth
                value={formData.class}
                onChange={handleInputChange}
                error={!!validationErrors.class}
                helperText={validationErrors.class}
                required
                inputProps={{ min: 1, max: 12 }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                name="totalMarks"
                label="Total Marks"
                type="number"
                fullWidth
                value={formData.totalMarks}
                onChange={handleInputChange}
                error={!!validationErrors.totalMarks}
                helperText={validationErrors.totalMarks}
                required
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                name="passingMarks"
                label="Passing Marks"
                type="number"
                fullWidth
                value={formData.passingMarks}
                onChange={handleInputChange}
                error={!!validationErrors.passingMarks}
                helperText={validationErrors.passingMarks}
                required
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                name="duration"
                label="Duration (minutes)"
                type="number"
                fullWidth
                value={formData.duration}
                onChange={handleInputChange}
                error={!!validationErrors.duration}
                helperText={validationErrors.duration}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{ mt: 1 }}
              >
                {formData.pdfFile ? 'Change PDF File' : 'Upload PDF File'}
                <input
                  type="file"
                  accept=".pdf"
                  hidden
                  onChange={handleFileUpload}
                />
              </Button>
              {formData.pdfFile && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Selected file: {formData.pdfFile.name}
                </Typography>
              )}
              {validationErrors.pdfFile && (
                <Typography variant="caption" color="error">
                  {validationErrors.pdfFile}
                </Typography>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button onClick={handleEditTest} variant="contained" color="primary">
            Update Test
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Test Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{currentTest?.title}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteTest} variant="contained" color="error">
            Delete
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

export default Tests; 
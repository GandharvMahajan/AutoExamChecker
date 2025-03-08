import { Router, Request, Response, RequestHandler } from 'express';
import db from '../utils/database';

const router = Router();

// Test route to check database connection
const getDatabaseTests: RequestHandler = async (req, res) => {
  try {
    const tests = await db.findManyTests();
    const dbStatus = db.getConnectionStatus();
    
    res.json({
      success: true,
      message: `Database is ${dbStatus.connected ? 'connected' : 'not connected'} (${dbStatus.mode} mode)`,
      data: tests
    });
  } catch (error) {
    console.error('Error accessing database:', error);
    res.status(500).json({
      success: false,
      message: 'Error accessing database',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

// Route to create a test record
const createTestRecord: RequestHandler = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || typeof name !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Name is required and must be a string'
      });
      return;
    }
    
    const newTest = await db.createTest(name);
    const dbStatus = db.getConnectionStatus();
    
    res.status(201).json({
      success: true,
      message: `Test record created in ${dbStatus.mode} mode`,
      data: newTest
    });
  } catch (error) {
    console.error('Error creating test record:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating test record',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

// Register the route handlers
router.get('/', getDatabaseTests);
router.post('/', createTestRecord);

export default router; 
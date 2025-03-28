import express, { Request, Response, RequestHandler } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import db from './utils/database';
import testRoutes from './routes/testRoutes';
import authRoutes from './routes/authRoutes';
import paymentRoutes from './routes/paymentRoutes';
import adminRoutes from './routes/adminRoutes';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(cors());

// For Stripe webhook, we need raw body for signature verification
app.use('/api/v1/payment/webhook', express.raw({ type: 'application/json' }));

// Use JSON middleware for all other routes
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Home route handler
const homeHandler: RequestHandler = (req, res) => {
  const dbStatus = db.getConnectionStatus();
  res.json({ 
    message: 'Hello World from AutoExamChecker API!',
    database: {
      connected: dbStatus.connected,
      mode: dbStatus.mode
    }
  });
};

// Routes
app.get('/', homeHandler);

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/payment', paymentRoutes);
app.use('/api/v1/tests', testRoutes);
app.use('/api/v1/admin', adminRoutes);

// Start server and test database connection
const startServer = async () => {
  try {
    // Test database connection before starting the server
    const dbConnected = await db.testConnection();
    const dbStatus = db.getConnectionStatus();
    
    // Start the Express server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Database status: ${dbStatus.connected ? 'Connected' : 'Not Connected'} (${dbStatus.mode} mode)`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

// Run the server
startServer(); 
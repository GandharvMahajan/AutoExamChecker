import express, { Request, Response, RequestHandler } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './utils/database';
import testRoutes from './routes/testRoutes';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(cors());
app.use(express.json());

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

// Use test routes
app.use('/api/test-db', testRoutes);

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
import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { PrismaClient, UserTest, Prisma } from '@prisma/client';
import auth from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Create Prisma client
const prisma = new PrismaClient();

// Create router
const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/answers');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExt = path.extname(file.originalname);
    cb(null, 'answer-' + uniqueSuffix + fileExt);
  }
});

// File filter to only allow PDFs
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'));
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB file size limit
});

// Configure multer for answer PDF uploads
const answerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/answers');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExt = path.extname(file.originalname);
    cb(null, 'answer-' + uniqueSuffix + fileExt);
  }
});

// File filter to only allow PDFs
const pdfFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'));
  }
};

// Configure multer for PDF uploads
const answerUpload = multer({
  storage: answerStorage,
  fileFilter: pdfFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB size limit
});

// Sample test data - we'll use this to seed the database if no tests exist
const sampleTests = [
  {
    title: 'Mathematics Midterm',
    subject: 'Mathematics',
    description: 'Basic algebra and calculus concepts',
    totalMarks: 100,
    passingMarks: 40,
    duration: 120, // 2 hours
    class: 10
  },
  {
    title: 'Physics Fundamentals',
    subject: 'Physics',
    description: 'Mechanics and electromagnetism',
    totalMarks: 100,
    passingMarks: 40,
    duration: 120,
    class: 11
  },
  {
    title: 'Computer Science Basics',
    subject: 'Computer Science',
    description: 'Algorithms and data structures',
    totalMarks: 100,
    passingMarks: 40,
    duration: 120,
    class: 12
  }
];

// Seed the database with sample tests if none exist
const seedTests = async () => {
  const testsCount = await prisma.examTest.count();

  if (testsCount === 0) {
    console.log('Seeding database with sample tests...');
    
    for (const test of sampleTests) {
      await prisma.examTest.create({
        data: test
      });
    }
    
    console.log('Sample tests created successfully');
  }
};

// Call seed function when the module is loaded
seedTests().catch(error => {
  console.error('Error seeding tests:', error);
});

// Add a type for test with class
interface TestWithClass {
  id: number;
  title: string;
  subject: string;
  class: number;
  description: string | null;
  totalMarks: number;
  passingMarks: number;
  duration: number;
  status: 'NotStarted' | 'InProgress' | 'Completed';
  score: number | null;
  startedAt: Date | null;
  completedAt: Date | null;
}

// Function to convert a raw test to a test with class
const createTestWithClass = (test: any, userTest: any | null): TestWithClass => {
  return {
    id: test.id,
    title: test.title,
    subject: test.subject,
    class: test.class || 0, // Default to 0 if class doesn't exist
    description: test.description,
    totalMarks: test.totalMarks,
    passingMarks: test.passingMarks,
    duration: test.duration,
    status: userTest ? userTest.status : 'NotStarted',
    score: userTest ? userTest.score : null,
    startedAt: userTest ? userTest.startedAt : null,
    completedAt: userTest ? userTest.completedAt : null
  };
};

// Register routes with @ts-ignore to bypass TypeScript errors
// @ts-ignore
router.get('/available', auth, async (req: Request, res: Response) => {
  try {
    const tests = await prisma.examTest.findMany({
      select: {
        id: true,
        title: true,
        subject: true,
        description: true,
        totalMarks: true,
        duration: true
      }
    });
    
    res.status(200).json({ success: true, tests });
  } catch (error) {
    console.error('Error fetching available tests:', error);
    res.status(500).json({ message: 'Server error fetching tests' });
  }
});

// @ts-ignore
router.get('/userTests', auth, async (req: Request, res: Response) => {
  try {
    const userId = (req as Request & { user?: { userId: number } }).user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    // Get the user with their purchased and used test counts
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        testsPurchased: true,
        testsUsed: true
      }
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Get the available tests with the user's status for each
    const availableTests = await prisma.examTest.findMany();
    
    // Get the user's test records
    const userTests = await prisma.userTest.findMany({
      where: { userId },
      include: {
        test: true
      }
    });

    // Create a map of test ID to user test record
    const userTestMap = new Map();
    userTests.forEach(userTest => {
      userTestMap.set(userTest.testId, userTest);
    });

    // Combine the data
    const testsWithStatus = availableTests.map(test => {
      const userTest = userTestMap.get(test.id);
      return createTestWithClass(test, userTest);
    });

    // Log the first test to check if class is included
    if (testsWithStatus.length > 0) {
      console.log('First test with class value:', JSON.stringify(testsWithStatus[0]));
    }

    res.status(200).json({
      success: true,
      testsPurchased: user.testsPurchased,
      testsUsed: user.testsUsed,
      availableTests: user.testsPurchased - user.testsUsed,
      tests: testsWithStatus
    });
  } catch (error) {
    console.error('Error fetching user tests:', error);
    res.status(500).json({ message: 'Server error fetching user tests' });
  }
});

// @ts-ignore
router.post('/start', auth, async (req: Request, res: Response) => {
  try {
    const { testId } = req.body;
    const userId = (req as Request & { user?: { userId: number } }).user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    // Check if user has tests available
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (user.testsUsed >= user.testsPurchased) {
      res.status(400).json({ 
        message: 'No available tests. Please purchase more tests to continue.' 
      });
      return;
    }

    // Check if the test exists
    const test = await prisma.examTest.findUnique({
      where: { id: Number(testId) }
    });

    if (!test) {
      res.status(404).json({ message: 'Test not found' });
      return;
    }

    // Check if the user already has a record for this test
    let userTest = await prisma.userTest.findUnique({
      where: {
        userId_testId: {
          userId,
          testId: Number(testId)
        }
      }
    });

    if (userTest) {
      // If test is already completed, don't allow restarting
      if (userTest.status === 'Completed') {
        res.status(400).json({ 
          message: 'This test has already been completed.' 
        });
        return;
      }
      
      // Update the existing record
      userTest = await prisma.userTest.update({
        where: { id: userTest.id },
        data: {
          status: 'InProgress',
          startedAt: new Date(),
          // Reset completedAt and score if restarting
          completedAt: null,
          score: null
        }
      });
    } else {
      // Create a new user test record
      userTest = await prisma.userTest.create({
        data: {
          userId,
          testId: Number(testId),
          status: 'InProgress',
          startedAt: new Date()
        }
      });

      // Increment the testsUsed count
      await prisma.user.update({
        where: { id: userId },
        data: {
          testsUsed: {
            increment: 1
          }
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Test started successfully',
      userTest
    });
  } catch (error) {
    console.error('Error starting test:', error);
    res.status(500).json({ message: 'Server error starting test' });
  }
});

// Start a specific test by ID
// @ts-ignore
router.post('/:testId/start', auth, async (req: Request, res: Response) => {
  try {
    const { testId } = req.params;
    console.log(`Attempting to start test with ID: ${testId}`);
    
    const userId = (req as Request & { user?: { userId: number } }).user?.userId;

    if (!userId) {
      console.log('User not authenticated');
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    // Check if user has tests available
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      console.log(`User with ID ${userId} not found`);
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Check if the test exists
    const test = await prisma.examTest.findUnique({
      where: { id: Number(testId) }
    });

    if (!test) {
      console.log(`Test with ID ${testId} not found`);
      res.status(404).json({ success: false, message: 'Test not found' });
      return;
    }
    
    console.log(`Test found: ${test.title}`);

    // Try to find the user test record, even if it might be deleted or have null status
    let userTest = await prisma.userTest.findFirst({
      where: {
        userId,
        testId: Number(testId)
      }
    });

    if (userTest) {
      // If test is already completed, don't allow restarting
      if (userTest.status === 'Completed') {
        console.log(`Test ${testId} is already completed for user ${userId}`);
        res.status(400).json({ 
          success: false,
          message: 'This test has already been completed.' 
        });
        return;
      }
      
      console.log(`Updating existing test record for user ${userId}, test ${testId}`);
      // Update the existing record
      userTest = await prisma.userTest.update({
        where: { id: userTest.id },
        data: {
          status: 'InProgress',
          startedAt: new Date(),
          // Reset completedAt and score if restarting
          completedAt: null,
          score: null
        }
      });
    } else {
      // Check if user has tests available
      if (user.testsUsed >= user.testsPurchased) {
        console.log(`User ${userId} has no available tests`);
        res.status(400).json({ 
          success: false,
          message: 'No available tests. Please purchase more tests to continue.' 
        });
        return;
      }

      console.log(`Creating new test record for user ${userId}, test ${testId}`);
      try {
        // Create a new user test record
        userTest = await prisma.userTest.create({
          data: {
            userId,
            testId: Number(testId),
            status: 'InProgress',
            startedAt: new Date()
          }
        });

        // Increment the testsUsed count
        await prisma.user.update({
          where: { id: userId },
          data: {
            testsUsed: {
              increment: 1
            }
          }
        });
      } catch (createError: any) {
        // Handle potential unique constraint errors
        console.error(`Error creating test record: ${createError}`);
        if (createError.code === 'P2002') {
          // If a duplicate error occurs, try to retrieve the record again
          userTest = await prisma.userTest.findFirst({
            where: {
              userId,
              testId: Number(testId)
            }
          });
          
          if (userTest) {
            // Update it instead of creating a new one
            userTest = await prisma.userTest.update({
              where: { id: userTest.id },
              data: {
                status: 'InProgress',
                startedAt: new Date(),
                completedAt: null,
                score: null
              }
            });
          } else {
            throw new Error('Failed to create or retrieve test record');
          }
        } else {
          throw createError;
        }
      }
    }

    // For now, return the test data the user needs to take the test
    const responseData = {
      success: true,
      message: 'Test started successfully',
      userTest,
      test: {
        id: test.id,
        title: test.title,
        subject: test.subject,
        description: test.description,
        totalMarks: test.totalMarks,
        passingMarks: test.passingMarks,
        duration: test.duration,
        pdfUrl: test.pdfUrl,
        startTime: userTest.startedAt
      }
    };
    
    console.log('Sending response data:', JSON.stringify(responseData));
    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error starting test by ID:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error starting test',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// @route   POST /api/v1/tests/:testId/upload-answer
// @desc    Upload PDF answer for a test
// @access  Private
// @ts-ignore
router.post('/:testId/upload-answer', auth, answerUpload.single('answerPdf'), async (req: Request, res: Response) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      res.status(400).json({ 
        success: false, 
        message: 'No PDF file uploaded' 
      });
      return;
    }
    
    const testId = parseInt(req.params.testId);
    if (isNaN(testId)) {
      // Delete the uploaded file
      fs.unlinkSync(req.file.path);
      res.status(400).json({ 
        success: false, 
        message: 'Invalid test ID' 
      });
      return;
    }
    
    const userId = req.user!.userId;
    
    // Check if the user has a valid test record
    const userTest = await prisma.userTest.findFirst({
      where: {
        userId,
        testId,
        status: { not: 'Completed' }
      }
    });
    
    if (!userTest) {
      // Delete the uploaded file
      fs.unlinkSync(req.file.path);
      res.status(404).json({ 
        success: false, 
        message: 'Test not found or already completed' 
      });
      return;
    }
    
    // Delete previous answer file if it exists
    // Use a type assertion with a property check to safely access answerPdfUrl
    const userTestAny = userTest as any;
    if (userTestAny.answerPdfUrl) {
      const previousFilePath = path.join(__dirname, '../../', userTestAny.answerPdfUrl);
      if (fs.existsSync(previousFilePath)) {
        fs.unlinkSync(previousFilePath);
      }
    }
    
    // Create the URL for the uploaded PDF
    const answerPdfUrl = `/uploads/answers/${path.basename(req.file.path)}`;
    
    // Update the user test record with the PDF URL using type assertion
    await prisma.userTest.update({
      where: {
        id: userTest.id
      },
      data: {
        // Type assertion to safely update the answerPdfUrl field
        answerPdfUrl
      } as any
    });
    
    res.json({ 
      success: true, 
      message: 'Answer PDF uploaded successfully',
      answerPdfUrl
    });
  } catch (error) {
    console.error('Error uploading answer PDF:', error);
    
    // Delete the uploaded file if there was an error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   POST /api/v1/tests/:testId/submit
// @desc    Submit a test
// @access  Private
// @ts-ignore
router.post('/:testId/submit', auth, async (req: Request, res: Response) => {
  try {
    const testId = parseInt(req.params.testId);
    if (isNaN(testId)) {
      res.status(400).json({ success: false, message: 'Invalid test ID' });
      return;
    }

    const userId = req.user!.userId;

    // Check if the user has a valid test record
    const userTest = await prisma.userTest.findFirst({
      where: {
        userId,
        testId,
        status: { not: 'Completed' }
      }
    });

    if (!userTest) {
      res.status(404).json({ success: false, message: 'Test not found or already completed' });
      return;
    }

    // Mark the test as completed
    await prisma.userTest.update({
      where: {
        id: userTest.id
      },
      data: {
        status: 'Completed',
        completedAt: new Date()
      }
    });

    res.json({ success: true, message: 'Test submitted successfully' });
  } catch (error) {
    console.error('Error submitting test:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Simple database connectivity test endpoint
router.get('/db-check', async (req: Request, res: Response) => {
  try {
    // Use user count instead of Test model
    const userCount = await prisma.user.count();
    
    res.status(200).json({ 
      success: true, 
      message: 'Database connection successful', 
      data: { userCount }
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Database connection failed', 
      error: (error as Error).message 
    });
  }
});

export default router; 
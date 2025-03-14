import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import auth from '../middleware/auth';

// Create Prisma client
const prisma = new PrismaClient();

// Create router
const router = Router();

// Sample test data - we'll use this to seed the database if no tests exist
const sampleTests = [
  {
    title: 'Mathematics Midterm',
    subject: 'Mathematics',
    description: 'Basic algebra and calculus concepts',
    totalMarks: 100,
    passingMarks: 40,
    duration: 120 // 2 hours
  },
  {
    title: 'Physics Fundamentals',
    subject: 'Physics',
    description: 'Mechanics and electromagnetism',
    totalMarks: 100,
    passingMarks: 40,
    duration: 120
  },
  {
    title: 'Computer Science Basics',
    subject: 'Computer Science',
    description: 'Algorithms and data structures',
    totalMarks: 100,
    passingMarks: 40,
    duration: 120
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
      
      return {
        id: test.id,
        title: test.title,
        subject: test.subject,
        description: test.description,
        totalMarks: test.totalMarks,
        passingMarks: test.passingMarks,
        duration: test.duration,
        status: userTest ? userTest.status : 'NotStarted',
        score: userTest ? userTest.score : null,
        startedAt: userTest ? userTest.startedAt : null,
        completedAt: userTest ? userTest.completedAt : null
      };
    });

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

// Simple database connectivity test endpoint
router.get('/db-check', async (req: Request, res: Response) => {
  try {
    const testEntry = await prisma.test.findFirst();
    
    if (testEntry) {
      res.status(200).json({ 
        success: true, 
        message: 'Database connection successful', 
        data: testEntry 
      });
    } else {
      // Create a test entry if none exists
      const newTest = await prisma.test.create({
        data: {
          name: 'Test Entry'
        }
      });

      res.status(200).json({ 
        success: true, 
        message: 'Database connection successful, created new test entry', 
        data: newTest
      });
    }
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
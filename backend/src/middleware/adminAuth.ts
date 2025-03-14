import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

// JWT Secret - this should match the one used in authRoutes
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-jwt-key';

// Create Prisma client
const prisma = new PrismaClient();

// Extend Request interface to include user - REMOVE THIS since it conflicts with auth.ts
// declare global {
//   namespace Express {
//     interface Request {
//       user?: {
//         userId: number;
//         email: string;
//         isAdmin?: boolean;
//       };
//     }
//   }
// }

const adminAuth = async (req: Request, res: Response, next: NextFunction) => {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if token exists
  if (!token) {
    res.status(401).json({ message: 'No token, authorization denied' });
    return;
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
    
    // Check if user exists and is an admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, isAdmin: true }
    });
    
    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }
    
    // Check if user is admin
    if (!user.isAdmin) {
      res.status(403).json({ message: 'Access denied. Admin privileges required' });
      return;
    }
    
    // Set user from token - but don't include isAdmin since it's not in the type
    req.user = {
      userId: decoded.userId,
      email: decoded.email
    };
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
    return;
  }
};

export default adminAuth; 
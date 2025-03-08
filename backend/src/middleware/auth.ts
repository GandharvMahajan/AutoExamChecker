import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// JWT Secret - this should match the one used in authRoutes
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-jwt-key';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        email: string;
      };
    }
  }
}

const auth = (req: Request, res: Response, next: NextFunction) => {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if token exists
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
    
    // Set user from token
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

export default auth; 
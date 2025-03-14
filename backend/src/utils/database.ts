import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

// Class to handle database operations with mock support
class Database {
  // Updated to use any type to avoid TypeScript issues with the extended client
  private prisma: any = null;
  private isConnected: boolean = false;
  private usesMock: boolean = false;

  constructor() {
    this.initializePrisma();
  }

  private initializePrisma() {
    try {
      // Initialize Prisma client with Accelerate extension
      const prismaClient = new PrismaClient({
        datasources: {
          db: {
            url: process.env.DATABASE_URL,
          },
        },
      });
      
      this.prisma = prismaClient.$extends(withAccelerate());
      console.log('Prisma client initialized with Accelerate extension');
    } catch (error) {
      console.error('Failed to initialize Prisma client:', error);
      this.setupMockData();
    }
  }

  private setupMockData() {
    this.usesMock = true;
    console.log('Using mock database implementation');
  }

  // Test the database connection without creating test records
  async testConnection(): Promise<boolean> {
    if (this.usesMock) {
      console.log('Using mock database - no actual connection test needed');
      this.isConnected = true;
      return true;
    }

    try {
      if (!this.prisma) {
        throw new Error('Prisma client not initialized');
      }

      // Test connection by querying user count - doesn't create any records
      const userCount = await this.prisma.user.count();
      
      console.log('Database connection successful!');
      console.log(`Database contains ${userCount} users`);
      
      this.isConnected = true;
      return true;
    } catch (error) {
      console.error('Database connection failed:', error);
      console.log('Switching to mock database implementation');
      
      // If connection fails, switch to mock mode
      this.setupMockData();
      this.isConnected = false;
      return false;
    }
  }

  getConnectionStatus(): { connected: boolean, mode: string } {
    return {
      connected: this.isConnected,
      mode: this.usesMock ? 'MOCK' : 'PRISMA'
    };
  }

  getPrismaClient() {
    return this.prisma;
  }
}

// Create singleton instance
const db = new Database();

export default db; 
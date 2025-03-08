import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

// Create interface for our test model to use in mock
interface TestModel {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// Class to handle database operations with mock support
class Database {
  // Updated to use any type to avoid TypeScript issues with the extended client
  private prisma: any = null;
  private mockData: TestModel[] = [];
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
    this.mockData = [
      { 
        id: 1, 
        name: 'Mock Test Data', 
        createdAt: new Date(), 
        updatedAt: new Date() 
      }
    ];
    console.log('Using mock database implementation');
  }

  // Test the database connection
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

      // Test connection by creating a test record
      const test = await this.prisma.test.create({
        data: {
          name: 'Test Connection',
        },
      });
      
      console.log('Database connection successful!');
      console.log('Created test record:', test);
      
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

  // Methods for the test model
  async findManyTests(): Promise<TestModel[]> {
    if (this.usesMock) {
      return [...this.mockData];
    }

    try {
      if (!this.prisma) {
        throw new Error('Prisma client not initialized');
      }
      return await this.prisma.test.findMany();
    } catch (error) {
      console.error('Error in findManyTests:', error);
      // Fallback to mock data on error
      if (!this.usesMock) {
        this.setupMockData();
      }
      return [...this.mockData];
    }
  }

  async createTest(name: string): Promise<TestModel> {
    if (this.usesMock) {
      const newTest = {
        id: this.mockData.length + 1,
        name,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.mockData.push(newTest);
      return newTest;
    }

    try {
      if (!this.prisma) {
        throw new Error('Prisma client not initialized');
      }
      return await this.prisma.test.create({
        data: { name }
      });
    } catch (error) {
      console.error('Error in createTest:', error);
      // Fallback to mock data on error
      if (!this.usesMock) {
        this.setupMockData();
      }
      const newTest = {
        id: this.mockData.length + 1,
        name,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.mockData.push(newTest);
      return newTest;
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
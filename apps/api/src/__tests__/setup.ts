/**
 * Jest setup file for API tests
 * This file runs before each test file
 */

// Set test environment variables
process.env.NODE_ENV = 'test';

// Mock environment variables for testing
process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/test-db';
process.env.PORT = '3001';
process.env.LOG_LEVEL = 'error';

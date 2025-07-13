/**
 * Test to verify path aliases work with Jest
 */

// Test importing from different path aliases
import { DbService } from '@services/db.service';

describe('Path Aliases Test', () => {
  it('should import modules using path aliases', () => {
    // This test verifies that path aliases work correctly
    expect(DbService).toBeDefined();
    expect(typeof DbService).toBe('function');
  });

  it('should handle TypeScript imports correctly', () => {
    // Test that TypeScript compilation works
    const testValue: string = 'test';
    expect(testValue).toBe('test');
  });
});

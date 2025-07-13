/**
 * Dummy test to verify Jest setup
 */
describe('Dummy Test Suite', () => {
  it('should pass a basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle string operations', () => {
    const message = 'Hello, Jest!';
    expect(message).toContain('Jest');
    expect(message.length).toBeGreaterThan(0);
  });

  it('should work with arrays', () => {
    const numbers = [1, 2, 3, 4, 5];
    expect(numbers).toHaveLength(5);
    expect(numbers).toContain(3);
    expect(numbers[0]).toBe(1);
  });

  it('should work with objects', () => {
    const user = {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
    };

    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('name');
    expect(user.name).toBe('Test User');
  });
});

// Test simple pour vérifier que les tests fonctionnent
describe('Basic Utils Tests', () => {
  it('should perform basic math operations', () => {
    expect(2 + 2).toBe(4);
    expect(10 - 5).toBe(5);
    expect(3 * 4).toBe(12);
    expect(8 / 2).toBe(4);
  });

  it('should handle string operations', () => {
    const greeting = 'Hello';
    const name = 'World';
    const message = `${greeting} ${name}`;
    
    expect(message).toBe('Hello World');
    expect(message.length).toBe(11);
    expect(message.toUpperCase()).toBe('HELLO WORLD');
  });

  it('should handle array operations', () => {
    const numbers = [1, 2, 3, 4, 5];
    
    expect(numbers.length).toBe(5);
    expect(numbers[0]).toBe(1);
    expect(numbers[4]).toBe(5);
    expect(numbers.includes(3)).toBe(true);
  });

  it('should handle object operations', () => {
    const user = {
      name: 'John',
      age: 30,
      email: 'john@example.com'
    };
    
    expect(user.name).toBe('John');
    expect(user.age).toBe(30);
    expect(Object.keys(user).length).toBe(3);
  });
});

import { describe, it, expect } from 'vitest'

describe('Basic Test', () => {
  it('should pass a simple test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should test string operations', () => {
    const greeting = 'Hello World'
    expect(greeting).toContain('Hello')
    expect(greeting.length).toBe(11)
  })

  it('should test array operations', () => {
    const numbers = [1, 2, 3, 4, 5]
    expect(numbers).toHaveLength(5)
    expect(numbers).toContain(3)
    expect(numbers[0]).toBe(1)
  })
})

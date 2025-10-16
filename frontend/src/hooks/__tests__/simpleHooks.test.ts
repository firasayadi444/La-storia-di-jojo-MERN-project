import { renderHook, act } from '@testing-library/react';

// Test simple pour vérifier que les hooks React fonctionnent
describe('Simple Hooks Tests', () => {
  it('should use useState hook', () => {
    const { result } = renderHook(() => {
      const [count, setCount] = React.useState(0);
      return { count, setCount };
    });

    expect(result.current.count).toBe(0);

    act(() => {
      result.current.setCount(5);
    });

    expect(result.current.count).toBe(5);
  });

  it('should use useEffect hook', () => {
    const { result } = renderHook(() => {
      const [value, setValue] = React.useState(0);
      
      React.useEffect(() => {
        setValue(10);
      }, []);
      
      return { value };
    });

    expect(result.current.value).toBe(10);
  });

  it('should handle custom hook logic', () => {
    const useCounter = (initialValue: number = 0) => {
      const [count, setCount] = React.useState(initialValue);
      
      const increment = () => setCount(prev => prev + 1);
      const decrement = () => setCount(prev => prev - 1);
      const reset = () => setCount(initialValue);
      
      return { count, increment, decrement, reset };
    };

    const { result } = renderHook(() => useCounter(5));

    expect(result.current.count).toBe(5);

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(6);

    act(() => {
      result.current.decrement();
    });

    expect(result.current.count).toBe(5);

    act(() => {
      result.current.reset();
    });

    expect(result.current.count).toBe(5);
  });
});

// Import React pour les hooks
import * as React from 'react';

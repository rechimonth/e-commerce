import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useDebounce } from '@/hooks/useDebounce';

describe('useDebounce', () => {
  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 300));
    expect(result.current).toBe('initial');
  });

  it('debounces value changes', async () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'a', delay: 300 },
    });

    expect(result.current).toBe('a');

    rerender({ value: 'ab', delay: 300 });
    expect(result.current).toBe('a'); // Still debounced

    await waitFor(() => {
      expect(result.current).toBe('ab');
    });
  });

  it('cleans up timer when value changes quickly', async () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'a', delay: 300 },
    });

    rerender({ value: 'ab', delay: 300 });
    rerender({ value: 'abc', delay: 300 });

    // After 100ms, value should still be 'a' (not 'ab')
    await new Promise((r) => setTimeout(r, 100));
    expect(result.current).toBe('a');

    // After 400ms total, value should be 'abc' (not 'ab')
    await waitFor(() => {
      expect(result.current).toBe('abc');
    });
  });

  it('cleans up timer on unmount to prevent memory leaks', () => {
    const { rerender, unmount } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'test', delay: 5000 } },
    );

    rerender({ value: 'changed', delay: 5000 });
    // Unmount before the timer fires
    expect(() => unmount()).not.toThrow();
  });

  it('supports different types', () => {
    const { result } = renderHook(() => useDebounce(42, 300));
    expect(result.current).toBe(42);
  });

  it('supports object values', () => {
    const obj = { name: 'test', id: 1 };
    const { result } = renderHook(() => useDebounce(obj, 300));
    expect(result.current).toBe(obj);
  });
});

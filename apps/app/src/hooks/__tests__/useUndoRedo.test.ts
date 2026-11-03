// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useUndoRedo } from '../useUndoRedo.js';

describe('useUndoRedo', () => {
  it('should initialize correctly', () => {
    const { result } = renderHook(() => useUndoRedo(1));

    expect(result.current.state).toBe(1);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('should update state and clear future on set', () => {
    const { result } = renderHook(() => useUndoRedo(1));

    act(() => {
      result.current.set(2);
    });

    expect(result.current.state).toBe(2);
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it('should not update state if new value is the same', () => {
    const { result } = renderHook(() => useUndoRedo(1));

    act(() => {
      result.current.set(1);
    });

    expect(result.current.state).toBe(1);
    expect(result.current.canUndo).toBe(false);
  });

  it('should undo and redo correctly', () => {
    const { result } = renderHook(() => useUndoRedo(1));

    act(() => {
      result.current.set(2);
    });
    act(() => {
      result.current.set(3);
    });

    expect(result.current.state).toBe(3);
    expect(result.current.canUndo).toBe(true);

    act(() => {
      result.current.undo();
    });

    expect(result.current.state).toBe(2);
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(true);

    act(() => {
      result.current.undo();
    });

    expect(result.current.state).toBe(1);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);

    act(() => {
      result.current.redo();
    });

    expect(result.current.state).toBe(2);
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(true);

    act(() => {
      result.current.redo();
    });

    expect(result.current.state).toBe(3);
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it('should clear future when setting state after undo', () => {
    const { result } = renderHook(() => useUndoRedo(1));

    act(() => {
      result.current.set(2);
    });
    act(() => {
      result.current.undo();
    });

    expect(result.current.state).toBe(1);
    expect(result.current.canRedo).toBe(true);

    act(() => {
      result.current.set(3);
    });

    expect(result.current.state).toBe(3);
    expect(result.current.canRedo).toBe(false);
  });
});

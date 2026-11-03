import { useState, useCallback } from 'react';

/**
 * Hook for managing undo/redo history.
 */
export function useUndoRedo<T>(initialPresent: T): {
  state: T;
  set: (newPresent: T) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
} {
  const [past, setPast] = useState<T[]>([]);
  const [present, setPresent] = useState<T>(initialPresent);
  const [future, setFuture] = useState<T[]>([]);

  const set = useCallback(
    (newPresent: T): void => {
      if (newPresent === present) {
        return;
      }
      setPast((prev: T[]) => [...prev, present]);
      setPresent(newPresent);
      setFuture([]);
    },
    [present]
  );

  const undo = useCallback(
    (): void => {
      if (past.length === 0) {
        return;
      }
      const previous: T = past[past.length - 1];
      const newPast: T[] = past.slice(0, past.length - 1);
      setPast(newPast);
      setFuture((prev: T[]) => [present, ...prev]);
      setPresent(previous);
    },
    [past, present]
  );

  const redo = useCallback(
    (): void => {
      if (future.length === 0) {
        return;
      }
      const next: T = future[0];
      const newFuture: T[] = future.slice(1);
      setPast((prev: T[]) => [...prev, present]);
      setFuture(newFuture);
      setPresent(next);
    },
    [future, present]
  );

  return {
    state: present,
    set,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
}

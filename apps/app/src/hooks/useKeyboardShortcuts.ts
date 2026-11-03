import { useEffect, useRef } from 'react';

export interface KeyboardShortcutHandlers {
  onSpace?: () => void;
  onLeft?: () => void;
  onRight?: () => void;
  onNumber?: (num: number) => void;
  onEnter?: () => void;
  onEscape?: () => void;
}

export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers): void {
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      const target = e.target as HTMLElement;
      const isInput = ['INPUT', 'TEXTAREA', 'MATH-FIELD'].includes(target.tagName) || target.isContentEditable;

      // Allow escape to close modals even if focused on an input.
      if (isInput && e.key !== 'Escape') {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          handlersRef.current.onSpace?.();
          break;
        case 'ArrowLeft':
          handlersRef.current.onLeft?.();
          break;
        case 'ArrowRight':
          handlersRef.current.onRight?.();
          break;
        case 'Enter':
          handlersRef.current.onEnter?.();
          break;
        case 'Escape':
          handlersRef.current.onEscape?.();
          break;
        case '1':
        case '2':
        case '3':
        case '4':
          handlersRef.current.onNumber?.(parseInt(e.key, 10));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}

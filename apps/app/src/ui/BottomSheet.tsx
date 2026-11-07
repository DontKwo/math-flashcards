import React, { useEffect, useRef } from 'react';
import { IconButton } from './IconButton.tsx';
import { Icon } from './Icon.tsx';
import './ui.css';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = '',
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      sheetRef.current?.focus();
      const handleKeyDown = (e: KeyboardEvent): void => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="ui-bottomsheet-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Bottom Sheet'}
        tabIndex={-1}
        className={`ui-bottomsheet-container ${className}`}
      >
        <div className="ui-bottomsheet-handle" />
        <div className="ui-bottomsheet-header">
          {title && <h2 className="ui-bottomsheet-title">{title}</h2>}
          <IconButton
            variant="ghost"
            size="sm"
            aria-label="Close bottom sheet"
            onClick={onClose}
          >
            <Icon name="close" size={18} />
          </IconButton>
        </div>
        <div className="ui-bottomsheet-body">{children}</div>
      </div>
    </div>
  );
};

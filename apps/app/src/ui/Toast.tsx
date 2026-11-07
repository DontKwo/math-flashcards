import React from 'react';
import { Button } from './Button.tsx';
import { IconButton } from './IconButton.tsx';
import { Icon } from './Icon.tsx';
import './ui.css';

export interface ToastProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onClose: () => void;
  type?: 'info' | 'success' | 'error';
  'data-testid'?: string;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  actionLabel,
  onAction,
  onClose,
  type = 'info',
  'data-testid': testId = 'toast-container',
}) => {
  return (
    <div
      className={`ui-toast ui-toast-${type}`}
      role="status"
      aria-live="polite"
      data-testid={testId}
    >
      <span className="ui-toast-message">{message}</span>
      <div className="ui-toast-actions">
        {actionLabel && onAction && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onAction}
            data-testid="toast-undo-btn"
          >
            {actionLabel}
          </Button>
        )}
        <IconButton
          variant="ghost"
          size="sm"
          aria-label="Dismiss toast"
          onClick={onClose}
        >
          <Icon name="close" size={16} />
        </IconButton>
      </div>
    </div>
  );
};

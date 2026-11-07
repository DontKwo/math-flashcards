import React from 'react';
import './ui.css';

export interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'card' | 'subtle' | 'elevated';
  interactive?: boolean;
}

export const Surface: React.FC<SurfaceProps> = ({
  children,
  variant = 'card',
  interactive = false,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`ui-surface ui-surface-${variant} ${interactive ? 'is-interactive' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const Card = Surface;

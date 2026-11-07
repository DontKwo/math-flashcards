import React from 'react';
import './ui.css';

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
  width?: string;
  height?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
}) => {
  return (
    <div
      className={`ui-skeleton ui-skeleton-${variant} ${className}`}
      aria-hidden="true"
    />
  );
};

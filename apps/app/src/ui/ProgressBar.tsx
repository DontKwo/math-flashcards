import React from 'react';
import './ui.css';

export interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  className?: string;
  'aria-label'?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  className = '',
  'aria-label': ariaLabel = 'Progress',
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div
      className={`ui-progress-track ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(percentage)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
    >
      <div
        className="ui-progress-fill"
        data-percent={Math.round(percentage)}
      />
    </div>
  );
};

import React from 'react';
import './ui.css';

export interface MasteryRingProps {
  percent: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export const MasteryRing: React.FC<MasteryRingProps> = ({
  percent,
  size = 48,
  strokeWidth = 4,
  className = '',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPercent = Math.min(Math.max(percent, 0), 100);
  const strokeDashoffset = circumference - (clampedPercent / 100) * circumference;

  return (
    <div
      className={`ui-mastery-ring-container ${className}`}
      aria-label={`Mastery: ${Math.round(clampedPercent)}%`}
      role="progressbar"
      aria-valuenow={Math.round(clampedPercent)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg width={size} height={size} className="ui-mastery-ring-svg">
        <circle
          className="ui-mastery-ring-track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          className="ui-mastery-ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      <span className="ui-mastery-ring-label">{Math.round(clampedPercent)}%</span>
    </div>
  );
};

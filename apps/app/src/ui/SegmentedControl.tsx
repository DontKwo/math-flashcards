import React from 'react';
import './ui.css';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  'aria-label'?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = '',
  'aria-label': ariaLabel = 'Options',
}: SegmentedControlProps<T>): React.ReactElement {
  return (
    <div
      className={`ui-segmented-control ${className}`}
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            className={`ui-segment-btn ${isSelected ? 'is-selected' : ''}`}
            aria-pressed={isSelected}
            onClick={() => onChange(option.value)}
          >
            {option.icon && <span className="ui-segment-icon">{option.icon}</span>}
            <span className="ui-segment-label">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

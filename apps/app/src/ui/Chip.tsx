import React from 'react';
import './ui.css';

export interface ChipProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'accent' | 'outline' | 'success';
  onRemove?: () => void;
}

export const Chip: React.FC<ChipProps> = ({
  children,
  variant = 'default',
  onRemove,
  className = '',
  ...props
}) => {
  return (
    <div className={`ui-chip ui-chip-${variant} ${className}`} {...props}>
      <span className="ui-chip-text">{children}</span>
      {onRemove && (
        <button
          type="button"
          className="ui-chip-remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label="Remove tag"
        >
          ×
        </button>
      )}
    </div>
  );
};

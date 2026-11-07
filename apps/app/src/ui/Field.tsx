import React from 'react';
import './ui.css';

export interface FieldProps {
  label?: string;
  htmlFor?: string;
  helperText?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export const Field: React.FC<FieldProps> = ({
  label,
  htmlFor,
  helperText,
  error,
  children,
  className = '',
}) => {
  return (
    <div className={`ui-field ${className}`}>
      {label && (
        <label htmlFor={htmlFor} className="ui-field-label">
          {label}
        </label>
      )}
      <div className="ui-field-control">{children}</div>
      {error ? (
        <p className="ui-field-error" role="alert">
          {error}
        </p>
      ) : helperText ? (
        <p className="ui-field-helper">{helperText}</p>
      ) : null}
    </div>
  );
};

import React from 'react';
import './ui.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  prefixNode?: React.ReactNode;
  suffixNode?: React.ReactNode;
  isError?: boolean;
}

export const Input: React.FC<InputProps> = ({
  prefixNode,
  suffixNode,
  isError = false,
  className = '',
  disabled,
  ...props
}) => {
  return (
    <div
      className={`ui-input-container ${isError ? 'is-error' : ''} ${disabled ? 'is-disabled' : ''}`}
    >
      {prefixNode && <span className="ui-input-prefix">{prefixNode}</span>}
      <input
        className={`ui-input-element ${className}`}
        disabled={disabled}
        {...props}
      />
      {suffixNode && <span className="ui-input-suffix">{suffixNode}</span>}
    </div>
  );
};

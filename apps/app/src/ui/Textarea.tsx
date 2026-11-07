import React from 'react';
import './ui.css';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  isError?: boolean;
}

export const Textarea: React.FC<TextareaProps> = ({
  isError = false,
  className = '',
  disabled,
  ...props
}) => {
  return (
    <textarea
      className={`ui-textarea-element ${isError ? 'is-error' : ''} ${className}`}
      disabled={disabled}
      {...props}
    />
  );
};

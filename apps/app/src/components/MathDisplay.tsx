import React, { useMemo } from 'react';
import katex from 'katex';

export interface MathDisplayProps {
  latex: string;
  display?: boolean;
  className?: string;
}

export const MathDisplay: React.FC<MathDisplayProps> = ({
  latex,
  display = true,
  className = '',
}) => {
  const html = useMemo(() => {
    try {
      return katex.renderToString(latex, {
        displayMode: display,
        throwOnError: false,
      });
    } catch {
      return `<code class="fallback-math">${latex}</code>`;
    }
  }, [latex, display]);

  return (
    <span
      className={`math-display ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};


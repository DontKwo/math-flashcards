import React, { useMemo } from 'react';
import katex from 'katex';

export interface KaTeXViewProps {
  math: string;
  inline?: boolean;
  className?: string;
}

export function KaTeXView({
  math,
  inline = false,
  className = '',
}: KaTeXViewProps): React.ReactElement {
  const renderResult = useMemo((): { html: string; error: boolean } => {
    try {
      const html: string = katex.renderToString(math, {
        displayMode: !inline,
        throwOnError: true,
      });
      return { html, error: false };
    } catch {
      return { html: '', error: true };
    }
  }, [math, inline]);

  if (renderResult.error) {
    return <span className={className}>{math}</span>;
  }

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: renderResult.html }}
    />
  );
}

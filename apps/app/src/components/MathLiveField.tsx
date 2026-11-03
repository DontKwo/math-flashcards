import React, { useEffect, useRef } from 'react';
import type { MathfieldElement } from 'mathlive';
import 'mathlive';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace React {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace JSX {
      interface IntrinsicElements {
        'math-field': React.DetailedHTMLProps<React.HTMLAttributes<MathfieldElement>, MathfieldElement> & {
          class?: string;
          readonly?: boolean;
          ref?: React.RefObject<MathfieldElement | null>;
        };
      }
    }
  }
}

export interface MathLiveFieldProps {
  value: string;
  onChange: (latex: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLElement>) => void;
}

export const MathLiveField = ({
  value,
  onChange,
  placeholder,
  className,
  readOnly,
  onKeyDown,
}: MathLiveFieldProps): React.ReactElement => {
  const mfRef = useRef<MathfieldElement>(null);

  useEffect((): (() => void) => {
    const mf = mfRef.current;
    if (!mf) return () => {};

    mf.smartSuperscript = true;
    mf.smartFence = true;
    mf.defaultMode = 'math';

    const handleInput = (e: Event): void => {
      onChange((e.target as MathfieldElement).value);
    };

    mf.addEventListener('input', handleInput);

    return (): void => {
      mf.removeEventListener('input', handleInput);
    };
  }, [onChange]);

  useEffect((): void => {
    const mf = mfRef.current;
    if (mf && mf.value !== value) {
      mf.value = value;
    }
  }, [value]);

  return (
    <math-field
      ref={mfRef}
      class={className}
      readonly={readOnly ? true : undefined}
      onKeyDown={onKeyDown}
    >
      {placeholder && !value ? placeholder : null}
    </math-field>
  );
};

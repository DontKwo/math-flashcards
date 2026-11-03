// @vitest-environment jsdom
import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { KaTeXView } from './KaTeXView';

describe('KaTeXView', () => {
  it('renders basic fractions correctly', () => {
    const { container } = render(<KaTeXView math="\frac{1}{2}" />);
    expect(container.querySelector('.katex')).not.toBeNull();
    expect(container.innerHTML).toContain('katex');
  });

  it('renders symbols correctly', () => {
    const { container } = render(<KaTeXView math="\sum_{i=1}^n i" />);
    expect(container.querySelector('.katex')).not.toBeNull();
  });

  it('renders raw latex on invalid latex syntax', () => {
    // Malformed latex that throws in katex
    const { container } = render(<KaTeXView math="\frac{1" />);
    expect(container.querySelector('.katex')).toBeNull();
    expect(container.textContent).toBe('\\frac{1');
  });
});

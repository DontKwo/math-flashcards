import React from 'react';

export interface VirtualMathToolbarProps {
  onInsert: (snippet: string) => void;
}

interface MathSymbolButton {
  label: string;
  snippet: string;
  title: string;
}

const SYMBOLS: MathSymbolButton[] = [
  { label: 'a/b', snippet: '\\frac{a}{b}', title: 'Fraction' },
  { label: 'x²', snippet: '^{2}', title: 'Power / Square' },
  { label: 'xₙ', snippet: '_{n}', title: 'Subscript' },
  { label: '√x', snippet: '\\sqrt{x}', title: 'Square Root' },
  { label: '·', snippet: ' \\cdot ', title: 'Multiply' },
  { label: '±', snippet: '\\pm ', title: 'Plus-Minus' },
  { label: 'Δ', snippet: '\\Delta ', title: 'Delta' },
  { label: 'x̂', snippet: '\\hat{x}', title: 'Hat / Unit' },
  { label: 'x̄', snippet: '\\bar{x}', title: 'Bar' },
  { label: 'π', snippet: '\\pi ', title: 'Pi' },
  { label: 'ρ', snippet: '\\rho ', title: 'Rho' },
  { label: 'θ', snippet: '\\theta ', title: 'Theta' },
  { label: '( )', snippet: '()', title: 'Parentheses' },
  { label: '≤', snippet: '\\leq ', title: 'Less or Equal' },
  { label: '≥', snippet: '\\geq ', title: 'Greater or Equal' },
];

export const VirtualMathToolbar: React.FC<VirtualMathToolbarProps> = ({ onInsert }) => {
  return (
    <div className="math-toolbar" role="toolbar" aria-label="Math Symbols">
      {SYMBOLS.map((s) => (
        <button
          key={s.label}
          type="button"
          className="toolbar-btn"
          title={s.title}
          onClick={() => onInsert(s.snippet)}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
};


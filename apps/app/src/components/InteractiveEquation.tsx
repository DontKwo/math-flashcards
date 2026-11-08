import React, { useState, useMemo } from 'react';
import type { TermDefinition } from '@formulaflash/core';
import {
  detectFormulaTerms,
  resolveCardTerm,
  normalizeSymbolKey,
} from '@formulaflash/core';
import { MathDisplay } from './MathDisplay.tsx';

export interface InteractiveEquationProps {
  latex: string;
  cardTerms?: TermDefinition[];
  setGlossary?: Record<string, TermDefinition>;
  hideSymbolsInitially?: boolean; // For Hint Before Answering mode
  autoShowTerms?: boolean; // For After Answering mode
  onEditCardTerms?: () => void;
}

export const InteractiveEquation: React.FC<InteractiveEquationProps> = ({
  latex,
  cardTerms,
  setGlossary,
  hideSymbolsInitially = false,
  autoShowTerms = false,
  onEditCardTerms,
}) => {
  const [activeSymbol, setActiveSymbol] = useState<string | null>(null);
  const [showTermsPanel, setShowTermsPanel] = useState(autoShowTerms || hideSymbolsInitially);
  const [symbolsRevealed, setSymbolsRevealed] = useState(!hideSymbolsInitially);

  // Memoize detected terms and resolved definitions
  const detectedSymbols = useMemo(() => {
    return detectFormulaTerms(latex);
  }, [latex]);

  const resolvedTerms = useMemo(() => {
    return detectedSymbols.map((sym) => {
      const resolved = resolveCardTerm(sym, cardTerms, setGlossary);
      return {
        symbol: sym,
        term: resolved || { symbol: sym },
        isDefined: !!resolved?.definition?.trim(),
      };
    });
  }, [detectedSymbols, cardTerms, setGlossary]);

  const activeResolved = useMemo(() => {
    if (!activeSymbol) return null;
    return (
      resolvedTerms.find((r) => normalizeSymbolKey(r.symbol) === normalizeSymbolKey(activeSymbol)) ||
      null
    );
  }, [activeSymbol, resolvedTerms]);

  if (!latex.trim()) return null;

  // If no terms exist, render standard MathDisplay without extra chrome
  if (resolvedTerms.length === 0) {
    return <MathDisplay latex={latex} display={true} />;
  }

  return (
    <div className="interactive-equation-container" style={{ width: '100%', position: 'relative' }}>
      {/* Formula Display Area with clickable overlay / chips */}
      {symbolsRevealed ? (
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="card-math-hero" style={{ margin: '8px 0', width: '100%' }}>
            <MathDisplay latex={latex} display={true} />
          </div>

          {/* Interactive Symbol Chips Bar right below formula */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              justifyContent: 'center',
              margin: '6px 0 12px 0',
            }}
            role="toolbar"
            aria-label="Equation symbols"
          >
            {resolvedTerms.map(({ symbol, term, isDefined }, idx) => {
              const isSelected = activeSymbol === symbol;
              return (
                <button
                  key={idx}
                  type="button"
                  data-testid={`term-symbol-chip-${idx}`}
                  className={`toolbar-btn ${isSelected ? 'active' : ''}`}
                  style={{
                    fontSize: '14px',
                    padding: '4px 10px',
                    height: 'auto',
                    minHeight: '34px',
                    borderRadius: 'var(--radius-sm)',
                    border: isSelected
                      ? '2px solid var(--accent)'
                      : isDefined
                      ? '1px solid var(--border)'
                      : '1px dashed var(--error)',
                    backgroundColor: isSelected ? 'var(--bg-secondary)' : 'transparent',
                  }}
                  onClick={() => {
                    setActiveSymbol(activeSymbol === symbol ? null : symbol);
                    setShowTermsPanel(true);
                  }}
                  aria-label={`${symbol}: ${term.name || (isDefined ? 'defined' : 'undefined')}`}
                >
                  <MathDisplay latex={symbol} display={false} />
                  {term.name && (
                    <span style={{ marginLeft: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {term.name}
                    </span>
                  )}
                  {!isDefined && (
                    <span style={{ marginLeft: '4px', fontSize: '10px', color: 'var(--error)' }}>
                      ?
                    </span>
                  )}
                </button>
              );
            })}

            <button
              type="button"
              data-testid="interactive-terms-toggle-btn"
              className="toolbar-btn"
              style={{ fontSize: '12px', padding: '4px 10px', minHeight: '34px' }}
              onClick={() => setShowTermsPanel(!showTermsPanel)}
              aria-expanded={showTermsPanel}
            >
              {showTermsPanel ? 'Hide Terms' : `Terms (${resolvedTerms.length})`}
            </button>
          </div>
        </div>
      ) : (
        /* Hidden symbols mode (for Hint before answering) */
        <div style={{ padding: '12px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="deck-tag">Terms & Definitions (Symbols Hidden)</span>
            <button
              type="button"
              data-testid="interactive-reveal-symbols-btn"
              className="toolbar-btn"
              style={{ fontSize: '12px', padding: '4px 8px' }}
              onClick={() => setSymbolsRevealed(true)}
            >
              Reveal Symbols
            </button>
          </div>
        </div>
      )}

      {/* Selected Term Popover / Details View */}
      {activeResolved && (
        <aside
          className="term-popover"
          data-testid="term-popover-card"
          role="region"
          aria-label={`Definition for ${activeResolved.symbol}`}
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            margin: '8px 0 16px 0',
            textAlign: 'left',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {symbolsRevealed && (
                <span style={{ fontSize: '20px', fontWeight: 700 }}>
                  <MathDisplay latex={activeResolved.symbol} display={false} />
                </span>
              )}
              <div>
                <strong style={{ fontSize: '15px' }}>
                  {activeResolved.term.name || (activeResolved.isDefined ? 'Named Term' : 'Undefined Symbol')}
                </strong>
                {activeResolved.term.units && (
                  <span className="deck-tag" style={{ marginLeft: '8px', fontSize: '11px' }}>
                    [{activeResolved.term.units}]
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              data-testid="term-popover-close-btn"
              className="toolbar-btn"
              style={{ minHeight: '28px', height: '28px', width: '28px', padding: 0 }}
              onClick={() => setActiveSymbol(null)}
              aria-label="Close definition"
            >
              ×
            </button>
          </div>

          <p style={{ margin: '8px 0 0 0', fontSize: '14px', lineHeight: 1.5, color: 'var(--text-primary)' }}>
            {activeResolved.term.definition || (
              <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                No definition set for this symbol yet.{' '}
                {onEditCardTerms && (
                  <button
                    type="button"
                    data-testid="term-popover-define-btn"
                    className="btn-secondary"
                    style={{ fontSize: '11px', padding: '2px 8px', minHeight: '26px', height: '26px' }}
                    onClick={onEditCardTerms}
                  >
                    Define Now
                  </button>
                )}
              </span>
            )}
          </p>

          {activeResolved.term.note && (
            <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              Note: {activeResolved.term.note}
            </div>
          )}
        </aside>
      )}

      {/* Full Terms Panel */}
      {showTermsPanel && (
        <section
          className="terms-list-panel"
          data-testid="terms-list-panel"
          aria-label="Term definitions list"
          style={{
            borderTop: '1px solid var(--border)',
            paddingTop: '12px',
            marginTop: '8px',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Variables & Parameters
            </span>
            {onEditCardTerms && (
              <button
                type="button"
                data-testid="terms-panel-edit-btn"
                className="toolbar-btn"
                style={{ fontSize: '11px', padding: '2px 8px' }}
                onClick={onEditCardTerms}
              >
                Edit Terms
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {resolvedTerms.map(({ symbol, term, isDefined }, idx) => {
              const isSelected = activeSymbol === symbol;
              return (
                <div
                  key={idx}
                  data-testid={`term-panel-row-${idx}`}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: isSelected ? 'var(--bg-secondary)' : 'transparent',
                    border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border)',
                    cursor: 'pointer',
                  }}
                  onClick={() => setActiveSymbol(isSelected ? null : symbol)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setActiveSymbol(isSelected ? null : symbol);
                    }
                  }}
                >
                  {symbolsRevealed && (
                    <div style={{ minWidth: '36px', fontSize: '16px', fontWeight: 700 }}>
                      <MathDisplay latex={symbol} display={false} />
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong style={{ fontSize: '13px' }}>
                        {term.name || (isDefined ? 'Named Term' : 'Undefined')}
                      </strong>
                      {term.units && (
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          [{term.units}]
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {term.definition || 'No definition set'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import type { TermDefinition } from '@formulaflash/core';
import { normalizeSymbolKey, getSuggestionsForSymbol } from '@formulaflash/core';
import { MathDisplay } from './MathDisplay.tsx';
import type { FlashcardSet } from '../data/storage.ts';

export interface SetGlossaryModalProps {
  activeSet: FlashcardSet;
  onSaveGlossary: (glossary: Record<string, TermDefinition>) => void;
  onApplyDefinitionToCards: (symbol: string, term: TermDefinition) => void;
  onClose: () => void;
}

export const SetGlossaryModal: React.FC<SetGlossaryModalProps> = ({
  activeSet,
  onSaveGlossary,
  onApplyDefinitionToCards,
  onClose,
}) => {
  const [glossary, setGlossary] = useState<Record<string, TermDefinition>>(() => activeSet.glossary || {});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUndefinedOnly, setFilterUndefinedOnly] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  // Collect all distinct symbols used across cards in the set and their usage count
  const setSymbolStats = useMemo(() => {
    const counts = new Map<string, { symbol: string; count: number; cards: string[] }>();

    for (const card of activeSet.cards) {
      if (card.terms) {
        for (const t of card.terms) {
          const k = normalizeSymbolKey(t.symbol);
          const existing = counts.get(k) || { symbol: t.symbol, count: 0, cards: [] };
          existing.count += 1;
          existing.cards.push(card.title);
          counts.set(k, existing);
        }
      }
    }

    // Also include any glossary symbols that might not be on current cards
    for (const [key, term] of Object.entries(glossary)) {
      const k = normalizeSymbolKey(key);
      if (!counts.has(k)) {
        counts.set(k, { symbol: term.symbol, count: 0, cards: [] });
      }
    }

    return Array.from(counts.values());
  }, [activeSet.cards, glossary]);

  const filteredSymbols = useMemo(() => {
    return setSymbolStats.filter((item) => {
      const term = glossary[normalizeSymbolKey(item.symbol)];
      const hasDef = !!term?.definition?.trim();
      if (filterUndefinedOnly && hasDef) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.symbol.toLowerCase().includes(q) ||
        (term?.name && term.name.toLowerCase().includes(q)) ||
        (term?.definition && term.definition.toLowerCase().includes(q))
      );
    });
  }, [setSymbolStats, glossary, searchQuery, filterUndefinedOnly]);

  const activeTerm = selectedSymbol ? glossary[normalizeSymbolKey(selectedSymbol)] || { symbol: selectedSymbol } : null;

  const handleUpdateTerm = (updated: TermDefinition): void => {
    const key = normalizeSymbolKey(updated.symbol);
    const next = { ...glossary, [key]: updated };
    setGlossary(next);
    onSaveGlossary(next);
  };

  const handleDeleteTerm = (sym: string): void => {
    const key = normalizeSymbolKey(sym);
    const next = { ...glossary };
    delete next[key];
    setGlossary(next);
    onSaveGlossary(next);
    if (selectedSymbol === sym) setSelectedSymbol(null);
  };

  const suggestions = activeTerm ? getSuggestionsForSymbol(activeTerm.symbol) : [];

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="set-glossary-dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content" style={{ maxWidth: '820px', width: '95vw', maxHeight: '90vh' }}>
        <div className="modal-header">
          <div>
            <h2 id="set-glossary-dialog-title" className="modal-title">
              Deck Glossary: {activeSet.name}
            </h2>
            <span className="settings-desc">
              Define recurring symbols once for the entire deck. Cards can override glossary definitions.
            </span>
          </div>
          <button
            type="button"
            data-testid="glossary-close-btn"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close glossary modal"
          >
            ×
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', margin: '12px 0' }}>
          <input
            type="text"
            data-testid="glossary-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search symbols or definitions..."
            style={{ flex: 1 }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              data-testid="glossary-undefined-filter"
              checked={filterUndefinedOnly}
              onChange={(e) => setFilterUndefinedOnly(e.target.checked)}
            />
            Undefined only
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selectedSymbol ? '1fr 1fr' : '1fr', gap: '16px', overflowY: 'auto', maxHeight: '55vh' }}>
          <div className="set-list" role="listbox" aria-label="Deck Symbols">
            {filteredSymbols.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No symbols found.
              </div>
            ) : (
              filteredSymbols.map((item, idx) => {
                const term = glossary[normalizeSymbolKey(item.symbol)];
                const isSelected = selectedSymbol === item.symbol;
                return (
                  <div
                    key={item.symbol}
                    data-testid={`glossary-item-${idx}`}
                    className={`set-item ${isSelected ? 'active' : ''}`}
                    onClick={() => setSelectedSymbol(item.symbol)}
                    style={{ cursor: 'pointer', padding: '10px 14px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ minWidth: '40px', fontSize: '18px', fontWeight: 600 }}>
                        <MathDisplay latex={item.symbol} display={false} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>
                          {term?.name || <span style={{ color: 'var(--error)' }}>Undefined symbol</span>}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {term?.definition || 'Click to add definition'}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="deck-tag" style={{ fontSize: '11px' }}>
                        {item.count} cards
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {selectedSymbol && activeTerm && (
            <div className="modal-form" style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>Edit Symbol:</span>
                  <MathDisplay latex={activeTerm.symbol} display={false} />
                </h3>
                <button
                  type="button"
                  data-testid="glossary-delete-term-btn"
                  className="btn-danger"
                  style={{ minHeight: '30px', height: '30px', padding: '0 8px', fontSize: '12px' }}
                  onClick={() => handleDeleteTerm(activeTerm.symbol)}
                >
                  Delete
                </button>
              </div>

              {suggestions.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Suggestions:</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                    {suggestions.map((sugg, i) => (
                      <button
                        key={i}
                        type="button"
                        data-testid={`glossary-suggestion-${i}`}
                        className="toolbar-btn"
                        style={{ fontSize: '12px', padding: '4px 8px', height: 'auto' }}
                        onClick={() =>
                          handleUpdateTerm({
                            symbol: activeTerm.symbol,
                            name: sugg.name,
                            definition: sugg.definition,
                            units: sugg.units,
                          })
                        }
                      >
                        {sugg.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="input-group" style={{ marginTop: '10px' }}>
                <label>Name / Label</label>
                <input
                  type="text"
                  data-testid="glossary-name-input"
                  value={activeTerm.name || ''}
                  onChange={(e) => handleUpdateTerm({ ...activeTerm, name: e.target.value })}
                  placeholder="e.g. Kinematic Viscosity"
                />
              </div>

              <div className="input-group" style={{ marginTop: '8px' }}>
                <label>Definition</label>
                <textarea
                  data-testid="glossary-definition-input"
                  value={activeTerm.definition || ''}
                  onChange={(e) => handleUpdateTerm({ ...activeTerm, definition: e.target.value })}
                  placeholder="Comprehensive definition..."
                  rows={3}
                />
              </div>

              <div className="input-group" style={{ marginTop: '8px' }}>
                <label>Units</label>
                <input
                  type="text"
                  data-testid="glossary-units-input"
                  value={activeTerm.units || ''}
                  onChange={(e) => handleUpdateTerm({ ...activeTerm, units: e.target.value })}
                  placeholder="e.g. m^2/s"
                />
              </div>

              <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  data-testid="glossary-copy-to-cards-btn"
                  className="btn-secondary"
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                  onClick={() => onApplyDefinitionToCards(activeTerm.symbol, activeTerm)}
                >
                  Copy Definition to Cards Lacking One
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="modal-actions" style={{ marginTop: '16px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            data-testid="glossary-done-btn"
            className="btn-primary"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

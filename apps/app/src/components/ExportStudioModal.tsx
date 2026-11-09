import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  type DocumentModel,
  type ExportOptions,
  type ExportPreset,
  DEFAULT_EXPORT_OPTIONS,
  BUILTIN_PRESETS,
  ExportPresetSchema,
  layoutWithAutoFit,
} from '@formulaflash/core';
import type { FlashcardSet } from '../data/storage.ts';
import { generatePdfAsync, sharePdfNative, type ExportProgress } from '../export/export-platform.ts';
import { MathDisplay } from './MathDisplay.tsx';

export interface ExportStudioModalProps {
  activeSet: FlashcardSet;
  onClose: () => void;
  onEditCard?: (cardId: string) => void;
}

type StudioTab = 'cards' | 'layout' | 'content' | 'style' | 'presets';

const STORAGE_KEY_PRESETS = 'formulaflash_export_presets';
const STORAGE_KEY_LAST_USED = 'formulaflash_export_last_used';

export const ExportStudioModal: React.FC<ExportStudioModalProps> = ({
  activeSet,
  onClose,
  onEditCard,
}) => {
  const [activeTab, setActiveTab] = useState<StudioTab>('cards');

  // Load custom presets
  const [customPresets, setCustomPresets] = useState<ExportPreset[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PRESETS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter((p) => ExportPresetSchema.safeParse(p).success);
        }
      }
    } catch {
      // Ignore
    }
    return [];
  });

  // Options state
  const [options, setOptions] = useState<ExportOptions>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_LAST_USED}_${activeSet.id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_EXPORT_OPTIONS, ...parsed };
      }
    } catch {
      // Ignore
    }
    return { ...DEFAULT_EXPORT_OPTIONS };
  });

  // Export progress & execution state
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [exportSuccess, setExportSuccess] = useState<{ bytes: Uint8Array; filename: string } | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const cancelRef = useRef<(() => void) | null>(null);

  // Selected cards & search filter
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [editingOverrideCardId, setEditingOverrideCardId] = useState<string | null>(null);

  // New preset form state
  const [newPresetName, setNewPresetName] = useState('');

  // Persist options on change
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_LAST_USED}_${activeSet.id}`, JSON.stringify(options));
  }, [options, activeSet.id]);

  // All cards
  const allCards = activeSet.cards || [];

  // Filtered card list
  const filteredCards = useMemo(() => {
    return allCards.filter((card) => {
      const matchesSearch =
        !searchQuery ||
        card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.prompt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.latexAnswer.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = categoryFilter === 'all' || card.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [allCards, searchQuery, categoryFilter]);

  // Unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const c of allCards) {
      if (c.category) set.add(c.category);
    }
    return Array.from(set);
  }, [allCards]);

  // Selection state
  const selectedCount = options.selectedCardIds.length === 0 ? allCards.length : options.selectedCardIds.length;

  const handleToggleCardSelection = (cardId: string): void => {
    setOptions((prev) => {
      const currentlySelected = prev.selectedCardIds.length === 0
        ? allCards.map((c) => c.id)
        : [...prev.selectedCardIds];

      const next = currentlySelected.includes(cardId)
        ? currentlySelected.filter((id) => id !== cardId)
        : [...currentlySelected, cardId];

      return { ...prev, selectedCardIds: next };
    });
  };

  const handleSelectAll = (): void => {
    setOptions((prev) => ({ ...prev, selectedCardIds: [] }));
  };

  const handleSelectNone = (): void => {
    setOptions((prev) => ({ ...prev, selectedCardIds: ['__none__'] }));
  };

  const handleInvertSelection = (): void => {
    setOptions((prev) => {
      const current = new Set(prev.selectedCardIds.length === 0 ? allCards.map((c) => c.id) : prev.selectedCardIds);
      const inverted = allCards.filter((c) => !current.has(c.id)).map((c) => c.id);
      return { ...prev, selectedCardIds: inverted.length === 0 ? ['__none__'] : inverted };
    });
  };

  // Debounced document layout model
  const [debouncedDocModel, setDebouncedDocModel] = useState<DocumentModel>(() =>
    layoutWithAutoFit(activeSet, options)
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      const model = layoutWithAutoFit(activeSet, options);
      setDebouncedDocModel(model);
    }, 200);
    return () => clearTimeout(timer);
  }, [activeSet, options]);

  // Export Trigger
  const handleStartExport = (): void => {
    setIsExporting(true);
    setExportProgress({ current: 0, total: debouncedDocModel.pages.length, phase: 'Initializing export' });
    setExportError(null);
    setExportSuccess(null);

    const { cancel } = generatePdfAsync(debouncedDocModel, {
      onProgress: (p) => setExportProgress(p),
      onSuccess: (bytes, filename) => {
        setIsExporting(false);
        setExportSuccess({ bytes, filename });
        sharePdfNative(bytes, filename);
      },
      onError: (err) => {
        setIsExporting(false);
        if (!err.message.includes('cancelled')) {
          setExportError(err.message);
        }
      },
    });

    cancelRef.current = cancel;
  };

  const handleCancelExport = (): void => {
    cancelRef.current?.();
    setIsExporting(false);
  };

  // Preset operations
  const handleSavePreset = (): void => {
    if (!newPresetName.trim()) return;
    const newPreset: ExportPreset = {
      id: `preset-${Date.now()}`,
      name: newPresetName.trim(),
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      options: { ...options },
    };
    const updated = [...customPresets, newPreset];
    setCustomPresets(updated);
    localStorage.setItem(STORAGE_KEY_PRESETS, JSON.stringify(updated));
    setNewPresetName('');
  };

  const handleApplyPreset = (preset: ExportPreset): void => {
    setOptions({ ...DEFAULT_EXPORT_OPTIONS, ...preset.options });
  };

  const handleDeletePreset = (id: string): void => {
    const updated = customPresets.filter((p) => p.id !== id);
    setCustomPresets(updated);
    localStorage.setItem(STORAGE_KEY_PRESETS, JSON.stringify(updated));
  };

  // Keyboard navigation & Esc listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && !isExporting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isExporting]);

  return (
    <div
      className="export-studio-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-studio-title"
      data-testid="export-studio-modal"
    >
      <div className="export-studio-container">
        {/* Header */}
        <header className="export-studio-header">
          <div className="export-studio-title-group">
            <h2 id="export-studio-title" className="modal-title">Export PDF Cheat Sheet</h2>
            <span className="deck-tag" data-testid="export-studio-deck-name">{activeSet.name}</span>
          </div>
          <button
            type="button"
            data-testid="export-studio-close-btn"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close Export Studio"
          >
            ×
          </button>
        </header>

        {/* Main Body */}
        <div className="export-studio-main">
          {/* Left: Virtualized Preview Pane */}
          <section className="export-studio-preview-pane" aria-label="PDF Live Paged Preview">
            <div className="preview-toolbar">
              <span data-testid="export-studio-counter">
                {selectedCount} of {allCards.length} cards • {debouncedDocModel.pages.length} page
                {debouncedDocModel.pages.length === 1 ? '' : 's'}
              </span>
              {debouncedDocModel.warnings.length > 0 && (
                <span
                  style={{ color: 'var(--warning)', fontWeight: 600, fontSize: '12px' }}
                  data-testid="export-studio-warning-badge"
                  title={debouncedDocModel.warnings.join(' | ')}
                >
                  ⚠️ Warning
                </span>
              )}
            </div>

            <div className="preview-viewport" data-testid="export-studio-preview-viewport">
              {allCards.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                  <p>This deck has no cards yet to export.</p>
                </div>
              ) : debouncedDocModel.pages.slice(0, 10).map((page) => {
                // Responsive preview display scale
                const previewScale = 0.65;
                const pWidth = page.width * previewScale;
                const pHeight = page.height * previewScale;

                return (
                  <div
                    key={`preview-page-${page.pageNumber}`}
                    className="pdf-preview-page"
                    data-testid={`export-preview-page-${page.pageNumber}`}
                    style={{
                      width: `${pWidth}px`,
                      height: `${pHeight}px`,
                      minHeight: `${pHeight}px`,
                    }}
                  >
                    {/* Header line */}
                    {page.headerFooter.headerLeft && (
                      <div
                        style={{
                          position: 'absolute',
                          top: `${(page.margins.top - 18) * previewScale}px`,
                          left: `${page.margins.left * previewScale}px`,
                          fontSize: `${8 * previewScale}pt`,
                          color: '#64748b',
                        }}
                      >
                        {page.headerFooter.headerLeft}
                      </div>
                    )}

                    {page.headerFooter.headerRight && (
                      <div
                        style={{
                          position: 'absolute',
                          top: `${(page.margins.top - 18) * previewScale}px`,
                          right: `${page.margins.right * previewScale}px`,
                          fontSize: `${8 * previewScale}pt`,
                          color: '#64748b',
                        }}
                      >
                        {page.headerFooter.headerRight}
                      </div>
                    )}

                    {/* Boxes */}
                    {page.boxes.map((box) => (
                      <div
                        key={box.id}
                        data-testid={`preview-box-${box.id}`}
                        style={{
                          position: 'absolute',
                          left: `${box.rect.x * previewScale}px`,
                          top: `${box.rect.y * previewScale}px`,
                          width: `${box.rect.width * previewScale}px`,
                          height: `${box.rect.height * previewScale}px`,
                          backgroundColor: box.backgroundColor || 'transparent',
                          border: box.borderWidth
                            ? `${box.borderWidth * previewScale}px solid ${box.borderColor || '#cbd5e1'}`
                            : 'none',
                          borderRadius: `${(box.borderRadius || 0) * previewScale}px`,
                          overflow: 'hidden',
                          padding: `${4 * previewScale}px`,
                        }}
                      >
                        {box.runs.map((run, rIdx) => (
                          <div
                            key={`run-${rIdx}`}
                            style={{
                              fontSize: `${run.fontSize * previewScale}pt`,
                              fontWeight: run.style === 'bold' ? 700 : 400,
                              fontStyle: run.style === 'italic' ? 'italic' : 'normal',
                              color: run.color,
                              lineHeight: 1.2,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {run.text}
                          </div>
                        ))}

                        {box.formulas.map((form, fIdx) => (
                          <div
                            key={`form-${fIdx}`}
                            style={{
                              margin: `${2 * previewScale}px 0`,
                              fontSize: `${form.fontSize * previewScale}pt`,
                              color: '#0f172a',
                            }}
                          >
                            <MathDisplay latex={form.latex} display={false} />
                          </div>
                        ))}
                      </div>
                    ))}

                    {/* Footer line */}
                    {page.headerFooter.footerRight && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: `${(page.margins.bottom - 18) * previewScale}px`,
                          right: `${page.margins.right * previewScale}px`,
                          fontSize: `${8 * previewScale}pt`,
                          color: '#64748b',
                        }}
                      >
                        {page.headerFooter.footerRight}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Right: Controls Pane */}
          <section className="export-studio-controls-pane" aria-label="Customization Controls">
            {/* Tabs */}
            <div className="studio-tabs" role="tablist" aria-label="Studio Options Tabs">
              <button
                type="button"
                role="tab"
                data-testid="studio-tab-cards"
                aria-selected={activeTab === 'cards'}
                className={`studio-tab-btn ${activeTab === 'cards' ? 'active' : ''}`}
                onClick={() => setActiveTab('cards')}
              >
                Cards
              </button>
              <button
                type="button"
                role="tab"
                data-testid="studio-tab-layout"
                aria-selected={activeTab === 'layout'}
                className={`studio-tab-btn ${activeTab === 'layout' ? 'active' : ''}`}
                onClick={() => setActiveTab('layout')}
              >
                Layout
              </button>
              <button
                type="button"
                role="tab"
                data-testid="studio-tab-content"
                aria-selected={activeTab === 'content'}
                className={`studio-tab-btn ${activeTab === 'content' ? 'active' : ''}`}
                onClick={() => setActiveTab('content')}
              >
                Content
              </button>
              <button
                type="button"
                role="tab"
                data-testid="studio-tab-style"
                aria-selected={activeTab === 'style'}
                className={`studio-tab-btn ${activeTab === 'style' ? 'active' : ''}`}
                onClick={() => setActiveTab('style')}
              >
                Style
              </button>
              <button
                type="button"
                role="tab"
                data-testid="studio-tab-presets"
                aria-selected={activeTab === 'presets'}
                className={`studio-tab-btn ${activeTab === 'presets' ? 'active' : ''}`}
                onClick={() => setActiveTab('presets')}
              >
                Presets
              </button>
            </div>

            {/* Tab Contents */}
            <div className="studio-tab-content">
              {/* Tab 1: Cards */}
              {activeTab === 'cards' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Selection and Filter Header */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <input
                      type="search"
                      data-testid="cards-filter-search"
                      placeholder="Search cards..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ flex: 1, minWidth: '150px' }}
                    />
                    {categories.length > 0 && (
                      <select
                        data-testid="cards-filter-category"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        style={{ flex: 1, minWidth: '130px' }}
                      >
                        <option value="all">All Categories</option>
                        {categories.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      data-testid="cards-select-all-btn"
                      className="btn-secondary"
                      style={{ flex: 1, minHeight: '36px', height: '36px', fontSize: '13px' }}
                      onClick={handleSelectAll}
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      data-testid="cards-select-none-btn"
                      className="btn-secondary"
                      style={{ flex: 1, minHeight: '36px', height: '36px', fontSize: '13px' }}
                      onClick={handleSelectNone}
                    >
                      None
                    </button>
                    <button
                      type="button"
                      data-testid="cards-select-invert-btn"
                      className="btn-secondary"
                      style={{ flex: 1, minHeight: '36px', height: '36px', fontSize: '13px' }}
                      onClick={handleInvertSelection}
                    >
                      Invert
                    </button>
                  </div>

                  {/* Sort preset */}
                  <div className="input-group">
                    <label htmlFor="cards-sort-order">Sort Order</label>
                    <select
                      id="cards-sort-order"
                      data-testid="cards-sort-select"
                      value={options.sortOrder}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          sortOrder: e.target.value as ExportOptions['sortOrder'],
                        }))
                      }
                    >
                      <option value="original">Original Deck Order</option>
                      <option value="alphabetical">Alphabetical (by Title)</option>
                      <option value="category">Group by Category</option>
                      <option value="difficulty">By Difficulty</option>
                      <option value="shuffled">Shuffled</option>
                    </select>
                  </div>

                  {/* Card List with Overrides */}
                  <div
                    style={{
                      maxHeight: '360px',
                      overflowY: 'auto',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      background: 'var(--bg-card-secondary)',
                    }}
                    role="list"
                    aria-label="Cards List"
                  >
                    {filteredCards.slice(0, 50).map((card, idx) => {
                      const isSelected =
                        options.selectedCardIds.length === 0 ||
                        options.selectedCardIds.includes(card.id);

                      const override = options.cardOverrides[card.id];
                      const isEditing = editingOverrideCardId === card.id;

                      return (
                        <div
                          key={card.id}
                          style={{
                            borderBottom: '1px solid var(--border)',
                            padding: '10px 12px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input
                              type="checkbox"
                              data-testid={`card-select-checkbox-${idx}`}
                              checked={isSelected}
                              onChange={() => handleToggleCardSelection(card.id)}
                              aria-label={`Select card ${card.title}`}
                              style={{ width: '20px', height: '20px' }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 600, fontSize: '14px' }}>{card.title}</div>
                              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                {card.category}
                              </div>
                            </div>
                            <button
                              type="button"
                              data-testid={`card-override-btn-${idx}`}
                              className="btn-secondary"
                              style={{ minHeight: '32px', height: '32px', padding: '0 8px', fontSize: '12px' }}
                              onClick={() =>
                                setEditingOverrideCardId(isEditing ? null : card.id)
                              }
                            >
                              {isEditing ? 'Close' : 'Overrides'}
                            </button>
                            {onEditCard && (
                              <button
                                type="button"
                                data-testid={`card-jump-edit-btn-${idx}`}
                                className="toolbar-btn"
                                style={{ width: '32px', height: '32px', minWidth: '32px', fontSize: '12px' }}
                                title="Edit in Card Creator"
                                onClick={() => {
                                  onClose();
                                  onEditCard(card.id);
                                }}
                              >
                                ✎
                              </button>
                            )}
                          </div>

                          {/* Override Editor Drawer */}
                          {isEditing && (
                            <div
                              data-testid={`card-override-drawer-${idx}`}
                              style={{
                                marginTop: '10px',
                                padding: '10px',
                                background: 'var(--bg-card)',
                                borderRadius: '6px',
                                border: '1px solid var(--border)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                              }}
                            >
                              <div className="input-group">
                                <label>Custom Title</label>
                                <input
                                  type="text"
                                  data-testid={`card-override-title-input-${idx}`}
                                  value={override?.customTitle ?? ''}
                                  placeholder={card.title}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setOptions((prev) => ({
                                      ...prev,
                                      cardOverrides: {
                                        ...prev.cardOverrides,
                                        [card.id]: {
                                          ...prev.cardOverrides[card.id],
                                          cardId: card.id,
                                          customTitle: val || undefined,
                                        },
                                      },
                                    }));
                                  }}
                                />
                              </div>

                              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                                  <input
                                    type="checkbox"
                                    data-testid={`card-override-span-toggle-${idx}`}
                                    checked={override?.spanAllColumns ?? false}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      setOptions((prev) => ({
                                        ...prev,
                                        cardOverrides: {
                                          ...prev.cardOverrides,
                                          [card.id]: {
                                            ...prev.cardOverrides[card.id],
                                            cardId: card.id,
                                            spanAllColumns: checked,
                                          },
                                        },
                                      }));
                                    }}
                                  />
                                  Span all columns
                                </label>

                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                                  <input
                                    type="checkbox"
                                    data-testid={`card-override-break-toggle-${idx}`}
                                    checked={override?.pageBreakBefore ?? false}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      setOptions((prev) => ({
                                        ...prev,
                                        cardOverrides: {
                                          ...prev.cardOverrides,
                                          [card.id]: {
                                            ...prev.cardOverrides[card.id],
                                            cardId: card.id,
                                            pageBreakBefore: checked,
                                          },
                                        },
                                      }));
                                    }}
                                  />
                                  Page break before
                                </label>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab 2: Layout */}
              {activeTab === 'layout' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="input-group">
                    <label htmlFor="layout-page-size">Page Size</label>
                    <select
                      id="layout-page-size"
                      data-testid="layout-pagesize-select"
                      value={options.pageSize}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          pageSize: e.target.value as ExportOptions['pageSize'],
                        }))
                      }
                    >
                      <option value="A4">A4 (210 x 297 mm)</option>
                      <option value="Letter">Letter (8.5 x 11 in)</option>
                      <option value="A5">A5 (148 x 210 mm)</option>
                      <option value="Legal">Legal (8.5 x 14 in)</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label>Orientation</label>
                    <div className="segmented-control">
                      <button
                        type="button"
                        data-testid="layout-orient-portrait-btn"
                        className={`segmented-btn ${options.orientation === 'portrait' ? 'active' : ''}`}
                        onClick={() => setOptions((prev) => ({ ...prev, orientation: 'portrait' }))}
                      >
                        Portrait
                      </button>
                      <button
                        type="button"
                        data-testid="layout-orient-landscape-btn"
                        className={`segmented-btn ${options.orientation === 'landscape' ? 'active' : ''}`}
                        onClick={() => setOptions((prev) => ({ ...prev, orientation: 'landscape' }))}
                      >
                        Landscape
                      </button>
                    </div>
                  </div>

                  <div className="input-group">
                    <label htmlFor="layout-margins-select">Margins</label>
                    <select
                      id="layout-margins-select"
                      data-testid="layout-margins-select"
                      value={options.marginPreset}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          marginPreset: e.target.value as ExportOptions['marginPreset'],
                        }))
                      }
                    >
                      <option value="narrow">Narrow (20 pt)</option>
                      <option value="normal">Normal (36 pt)</option>
                      <option value="wide">Wide (54 pt)</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label htmlFor="layout-columns-select">Number of Columns (1 to 6)</label>
                    <select
                      id="layout-columns-select"
                      data-testid="layout-columns-select"
                      value={options.columns}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          columns: parseInt(e.target.value, 10),
                        }))
                      }
                    >
                      <option value="1">1 Column</option>
                      <option value="2">2 Columns</option>
                      <option value="3">3 Columns</option>
                      <option value="4">4 Columns</option>
                      <option value="5">5 Columns</option>
                      <option value="6">6 Columns</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label>Fill Order</label>
                    <div className="segmented-control">
                      <button
                        type="button"
                        data-testid="layout-fill-down-btn"
                        className={`segmented-btn ${options.fillOrder === 'down-columns' ? 'active' : ''}`}
                        onClick={() => setOptions((prev) => ({ ...prev, fillOrder: 'down-columns' }))}
                      >
                        Down Columns
                      </button>
                      <button
                        type="button"
                        data-testid="layout-fill-across-btn"
                        className={`segmented-btn ${options.fillOrder === 'across-rows' ? 'active' : ''}`}
                        onClick={() => setOptions((prev) => ({ ...prev, fillOrder: 'across-rows' }))}
                      >
                        Across Rows
                      </button>
                    </div>
                  </div>

                  <div className="input-group">
                    <label htmlFor="layout-container-style">Card Container Style</label>
                    <select
                      id="layout-container-style"
                      data-testid="layout-container-style-select"
                      value={options.containerStyle}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          containerStyle: e.target.value as ExportOptions['containerStyle'],
                        }))
                      }
                    >
                      <option value="boxed">Boxed (Border + Radius)</option>
                      <option value="ruled">Ruled (Bottom Divider)</option>
                      <option value="shaded">Shaded (Subtle Background)</option>
                      <option value="plain">Plain (No Container)</option>
                    </select>
                  </div>

                  <div className="settings-group">
                    <div className="settings-row">
                      <div className="settings-label-group">
                        <span id="label-group-cat" className="settings-label">Group Under Category Headings</span>
                        <span className="settings-desc">Insert category title banners above grouped cards</span>
                      </div>
                      <label className="switch">
                        <input
                          type="checkbox"
                          data-testid="layout-group-categories-toggle"
                          aria-labelledby="label-group-cat"
                          checked={options.groupByCategory}
                          onChange={(e) =>
                            setOptions((prev) => ({ ...prev, groupByCategory: e.target.checked }))
                          }
                        />
                        <span className="switch-slider" />
                      </label>
                    </div>

                    <div className="settings-row">
                      <div className="settings-label-group">
                        <label htmlFor="layout-fit-pages-input" className="settings-label">Fit to N Pages Mode</label>
                        <span className="settings-desc">Auto-adjust font size to fit exact page target</span>
                      </div>
                      <input
                        id="layout-fit-pages-input"
                        type="number"
                        data-testid="layout-fit-pages-input"
                        min="1"
                        max="20"
                        placeholder="Off"
                        value={options.fitToPageCount || ''}
                        onChange={(e) => {
                          const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                          setOptions((prev) => ({ ...prev, fitToPageCount: val }));
                        }}
                        style={{ width: '80px', minHeight: '36px', height: '36px' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Content */}
              {activeTab === 'content' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="input-group">
                    <label htmlFor="content-layout-mode">Card Layout Content</label>
                    <select
                      id="content-layout-mode"
                      data-testid="content-layout-mode-select"
                      value={options.cardLayoutMode}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          cardLayoutMode: e.target.value as ExportOptions['cardLayoutMode'],
                        }))
                      }
                    >
                      <option value="prompt-and-formula">Prompt + Formula (Standard)</option>
                      <option value="formula-only">Formula-Only (Classic Cheat Sheet)</option>
                      <option value="answer-key">Answer Key (Compact Reference)</option>
                    </select>
                  </div>

                  <div className="settings-group">
                    <div className="settings-row">
                      <span id="label-show-title" className="settings-label">Show Card Title</span>
                      <label className="switch">
                        <input
                          type="checkbox"
                          data-testid="content-show-title-toggle"
                          aria-labelledby="label-show-title"
                          checked={options.showCardTitle}
                          onChange={(e) => setOptions((prev) => ({ ...prev, showCardTitle: e.target.checked }))}
                        />
                        <span className="switch-slider" />
                      </label>
                    </div>

                    <div className="settings-row">
                      <span id="label-show-number" className="settings-label">Show Card Numbers (#1, #2...)</span>
                      <label className="switch">
                        <input
                          type="checkbox"
                          data-testid="content-show-number-toggle"
                          aria-labelledby="label-show-number"
                          checked={options.showCardNumber}
                          onChange={(e) => setOptions((prev) => ({ ...prev, showCardNumber: e.target.checked }))}
                        />
                        <span className="switch-slider" />
                      </label>
                    </div>

                    <div className="settings-row">
                      <span id="label-show-hints" className="settings-label">Show Hints</span>
                      <label className="switch">
                        <input
                          type="checkbox"
                          data-testid="content-show-hints-toggle"
                          aria-labelledby="label-show-hints"
                          checked={options.showHint}
                          onChange={(e) => setOptions((prev) => ({ ...prev, showHint: e.target.checked }))}
                        />
                        <span className="switch-slider" />
                      </label>
                    </div>

                    <div className="settings-row">
                      <span id="label-inc-appendix" className="settings-label">Include Glossary Appendix</span>
                      <label className="switch">
                        <input
                          type="checkbox"
                          data-testid="content-include-appendix-toggle"
                          aria-labelledby="label-inc-appendix"
                          checked={options.includeGlossaryAppendix}
                          onChange={(e) => setOptions((prev) => ({ ...prev, includeGlossaryAppendix: e.target.checked }))}
                        />
                        <span className="switch-slider" />
                      </label>
                    </div>
                  </div>

                  <div className="input-group">
                    <label htmlFor="content-terms-mode">Term Definitions Layout</label>
                    <select
                      id="content-terms-mode"
                      data-testid="content-terms-mode-select"
                      value={options.termsMode}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          termsMode: e.target.value as ExportOptions['termsMode'],
                        }))
                      }
                    >
                      <option value="compact-inline">Compact Inline List</option>
                      <option value="table">Small Table / Rows</option>
                      <option value="footnote">Footnote-Style</option>
                      <option value="none">Hide Terms</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label htmlFor="content-header-text">Custom Header Text</label>
                    <input
                      id="content-header-text"
                      type="text"
                      data-testid="content-header-text-input"
                      value={options.headerText}
                      onChange={(e) => setOptions((prev) => ({ ...prev, headerText: e.target.value }))}
                      placeholder="{setName}"
                    />
                  </div>
                </div>
              )}

              {/* Tab 4: Style */}
              {activeTab === 'style' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="input-group">
                    <label htmlFor="style-font-family">Font Family</label>
                    <select
                      id="style-font-family"
                      data-testid="style-font-family-select"
                      value={options.fontFamily}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          fontFamily: e.target.value as ExportOptions['fontFamily'],
                        }))
                      }
                    >
                      <option value="Helvetica">Helvetica (Clean Sans-Serif)</option>
                      <option value="Times">Times (Classic Serif)</option>
                      <option value="Courier">Courier (Monospace)</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label htmlFor="style-color-theme">Color Theme</label>
                    <select
                      id="style-color-theme"
                      data-testid="style-color-theme-select"
                      value={options.colorTheme}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          colorTheme: e.target.value as ExportOptions['colorTheme'],
                        }))
                      }
                    >
                      <option value="color">Full Color (Deck & Category Badges)</option>
                      <option value="grayscale">Grayscale</option>
                      <option value="black-and-white">Black & White (Printer-Friendly)</option>
                      <option value="high-contrast">High Contrast</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label htmlFor="style-global-scale">
                      Global Text Scale: {options.globalScale.toFixed(2)}x
                    </label>
                    <input
                      id="style-global-scale"
                      type="range"
                      data-testid="style-global-scale-slider"
                      min="0.5"
                      max="1.5"
                      step="0.05"
                      value={options.globalScale}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          globalScale: parseFloat(e.target.value),
                        }))
                      }
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="style-formula-scale">
                      Formula Scale: {options.formulaScale.toFixed(2)}x
                    </label>
                    <input
                      id="style-formula-scale"
                      type="range"
                      data-testid="style-formula-scale-slider"
                      min="0.6"
                      max="1.6"
                      step="0.05"
                      value={options.formulaScale}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          formulaScale: parseFloat(e.target.value),
                        }))
                      }
                    />
                  </div>
                </div>
              )}

              {/* Tab 5: Presets */}
              {activeTab === 'presets' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="settings-section-title">Built-In Presets</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {BUILTIN_PRESETS.map((preset, idx) => (
                      <div
                        key={preset.id}
                        data-testid={`builtin-preset-item-${idx}`}
                        className="set-item"
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleApplyPreset(preset)}
                      >
                        <div>
                          <div className="set-name">{preset.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {preset.description}
                          </div>
                        </div>
                        <button
                          type="button"
                          data-testid={`builtin-preset-apply-btn-${idx}`}
                          className="btn-primary"
                          style={{ minHeight: '34px', height: '34px', padding: '0 12px', fontSize: '13px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApplyPreset(preset);
                          }}
                        >
                          Apply
                        </button>
                      </div>
                    ))}
                  </div>

                  {customPresets.length > 0 && (
                    <>
                      <div className="settings-section-title" style={{ marginTop: '12px' }}>
                        Custom Saved Presets
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {customPresets.map((preset, idx) => (
                          <div
                            key={preset.id}
                            data-testid={`custom-preset-item-${idx}`}
                            className="set-item"
                          >
                            <div className="set-name">{preset.name}</div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                type="button"
                                data-testid={`custom-preset-apply-btn-${idx}`}
                                className="btn-primary"
                                style={{ minHeight: '34px', height: '34px', padding: '0 10px', fontSize: '12px' }}
                                onClick={() => handleApplyPreset(preset)}
                              >
                                Apply
                              </button>
                              <button
                                type="button"
                                data-testid={`custom-preset-delete-btn-${idx}`}
                                className="btn-danger"
                                style={{ minHeight: '34px', height: '34px', padding: '0 10px', fontSize: '12px' }}
                                onClick={() => handleDeletePreset(preset.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  <div className="input-group" style={{ marginTop: '14px' }}>
                    <label htmlFor="new-preset-name">Save Current Configuration as Preset</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        id="new-preset-name"
                        type="text"
                        data-testid="new-preset-name-input"
                        placeholder="e.g. My Exam Layout"
                        value={newPresetName}
                        onChange={(e) => setNewPresetName(e.target.value)}
                      />
                      <button
                        type="button"
                        data-testid="save-preset-submit-btn"
                        className="btn-primary"
                        disabled={!newPresetName.trim()}
                        onClick={handleSavePreset}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        Save Preset
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <footer className="export-studio-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isExporting && exportProgress && (
              <span data-testid="export-progress-text" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {exportProgress.phase} ({exportProgress.current} / {exportProgress.total})
              </span>
            )}
            {exportError && (
              <span data-testid="export-error-text" style={{ fontSize: '13px', color: 'var(--error)' }}>
                {exportError}
              </span>
            )}
            {exportSuccess && (
              <span data-testid="export-success-text" style={{ fontSize: '13px', color: 'var(--success)', fontWeight: 600 }}>
                ✓ Export Complete ({exportSuccess.filename})
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            {isExporting ? (
              <button
                type="button"
                data-testid="export-cancel-btn"
                className="btn-danger"
                onClick={handleCancelExport}
              >
                Cancel
              </button>
            ) : (
              <>
                <button
                  type="button"
                  data-testid="export-studio-cancel-btn"
                  className="btn-secondary"
                  onClick={onClose}
                >
                  Close
                </button>
                <button
                  type="button"
                  data-testid="export-pdf-action-btn"
                  className="btn-primary"
                  disabled={allCards.length === 0}
                  onClick={handleStartExport}
                >
                  Export PDF
                </button>
              </>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
};

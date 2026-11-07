import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Card, StudySession } from '@formulaflash/core';
import { useLibrary, type SetWithStats } from '../data/useLibrary.ts';
import { useRoute } from '../router/index.ts';
import {
  Card as SurfaceCard,
  Button,
  Input,
  Chip,
  EmptyState,
  Icon,
  MasteryRing,
  ProgressBar,
  Skeleton,
  Menu,
  ConfirmDialog,
  Modal,
} from '../ui/index.ts';
import { fuzzyMatch, splitMatches, cardToSearchableText } from './search-utils.ts';
import { downloadFlashset, parseFlashsetFile, commitFlashsetImport } from './flashset-utils.ts';
import './screens.css';

type SortOption = 'recent' | 'az' | 'cards' | 'least-mastered';
type ViewMode = 'grid' | 'list';

interface SearchResultInfo {
  set: SetWithStats;
  matchedCardsCount: number;
}

export const HomeScreen: React.FC = () => {
  const { sets, loading, error, deleteSet, duplicateSet, repository, init } = useLibrary();
  const { navigate } = useRoute();

  // Search state
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [cardsBySetId, setCardsBySetId] = useState<Record<string, Card[]>>({});

  // View, Sort & Filter state with localStorage persistence
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem('formulaflash_home_view') as ViewMode) || 'grid';
  });
  const [sortOption, setSortOption] = useState<SortOption>(() => {
    return (localStorage.getItem('formulaflash_home_sort') as SortOption) || 'recent';
  });
  const [selectedTag, setSelectedTag] = useState<string>(() => {
    return localStorage.getItem('formulaflash_home_filter') || 'all';
  });

  // Last studied session
  const [lastSession, setLastSession] = useState<{
    set: SetWithStats;
    session: StudySession;
  } | null>(null);

  // High-consequence delete confirmation
  const [deleteConfirmSet, setDeleteConfirmSet] = useState<SetWithStats | null>(null);

  // Import flow state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importPendingFile, setImportPendingFile] = useState<{
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    bundle: any;
    filename: string;
  } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchInput.trim());
    }, 200);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Save view, sort, filter to localStorage
  useEffect(() => {
    localStorage.setItem('formulaflash_home_view', viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem('formulaflash_home_sort', sortOption);
  }, [sortOption]);

  useEffect(() => {
    localStorage.setItem('formulaflash_home_filter', selectedTag);
  }, [selectedTag]);

  // Load cards for in-depth card/LaTeX search indexing
  useEffect(() => {
    let mounted = true;
    async function loadAllCards(): Promise<void> {
      const map: Record<string, Card[]> = {};
      for (const s of sets) {
        try {
          const cards = await repository.getCards(s.id);
          map[s.id] = cards;
        } catch {
          // ignore
        }
      }
      if (mounted) {
        setCardsBySetId(map);
      }
    }

    if (sets.length > 0) {
      void loadAllCards();
    }
    return () => {
      mounted = false;
    };
  }, [sets, repository]);

  // Find last studied set
  useEffect(() => {
    let mounted = true;
    async function findLastSession(): Promise<void> {
      try {
        const sessions = await repository.listSessions();
        if (sessions.length === 0) {
          if (mounted) setLastSession(null);
          return;
        }
        // sort sessions by start/end descending
        sessions.sort((a, b) => (b.endedAt || b.startedAt) - (a.endedAt || a.startedAt));
        const latest = sessions[0];
        const targetSetId = latest.setIds[0];
        const targetSet = sets.find((s) => s.id === targetSetId);

        if (targetSet && mounted) {
          setLastSession({ set: targetSet, session: latest });
        } else if (mounted) {
          setLastSession(null);
        }
      } catch {
        if (mounted) setLastSession(null);
      }
    }

    if (sets.length > 0) {
      void findLastSession();
    } else {
      setLastSession(null);
    }

    return () => {
      mounted = false;
    };
  }, [sets, repository]);

  // All unique tags across sets
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const s of sets) {
      for (const t of s.tags) {
        if (t.trim()) tagSet.add(t.trim());
      }
    }
    return Array.from(tagSet).sort();
  }, [sets]);

  // Filter and Sort sets
  const filteredSets = useMemo(() => {
    const result: SearchResultInfo[] = [];

    for (const s of sets) {
      // 1. Tag filter
      if (selectedTag !== 'all' && !s.tags.includes(selectedTag)) {
        continue;
      }

      // 2. Search query filter
      if (!debouncedQuery) {
        result.push({ set: s, matchedCardsCount: 0 });
        continue;
      }

      const titleMatches = fuzzyMatch(debouncedQuery, s.title);
      const tagMatches = s.tags.some((t) => fuzzyMatch(debouncedQuery, t));

      const cards = cardsBySetId[s.id] || [];
      let matchedCards = 0;
      for (const c of cards) {
        const cardSearchText = cardToSearchableText(c);
        if (fuzzyMatch(debouncedQuery, cardSearchText)) {
          matchedCards++;
        }
      }

      if (titleMatches || tagMatches || matchedCards > 0) {
        result.push({ set: s, matchedCardsCount: matchedCards });
      }
    }

    // Sort result
    result.sort((a, b) => {
      switch (sortOption) {
        case 'az':
          return a.set.title.localeCompare(b.set.title);
        case 'cards':
          return b.set.cardCount - a.set.cardCount;
        case 'least-mastered': {
          const aRatio = a.set.cardCount > 0 ? a.set.mastery.mastered / a.set.cardCount : 0;
          const bRatio = b.set.cardCount > 0 ? b.set.mastery.mastered / b.set.cardCount : 0;
          return aRatio - bRatio;
        }
        case 'recent':
        default: {
          const aTime = a.set.lastStudiedAt || a.set.updatedAt || a.set.createdAt;
          const bTime = b.set.lastStudiedAt || b.set.updatedAt || b.set.createdAt;
          return bTime - aTime;
        }
      }
    });

    return result;
  }, [sets, selectedTag, debouncedQuery, cardsBySetId, sortOption]);

  // Actions
  const handleExport = async (set: SetWithStats): Promise<void> => {
    const cards = await repository.getCards(set.id);
    const progress = await repository.listProgress(set.id);
    downloadFlashset(set, cards, progress);
  };

  const handleDeleteTrigger = (set: SetWithStats): void => {
    if (set.cardCount >= 10) {
      setDeleteConfirmSet(set);
    } else {
      void deleteSet(set.id);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    const reader = new FileReader();
    reader.onload = (event): void => {
      const content = event.target?.result as string;
      const res = parseFlashsetFile(content);
      if (res.success && res.bundle) {
        setImportPendingFile({ bundle: res.bundle, filename: file.name });
        setImportModalOpen(true);
      } else {
        setImportError(res.error || 'Failed to parse file.');
        setImportModalOpen(true);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmImport = async (): Promise<void> => {
    if (!importPendingFile) return;
    try {
      await commitFlashsetImport(importPendingFile.bundle, repository);
      await init();
      setImportModalOpen(false);
      setImportPendingFile(null);
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : 'Import failed');
    }
  };

  const formatLastStudied = (timestamp?: number): string => {
    if (!timestamp) return 'Not studied yet';
    const diffMs = Date.now() - timestamp;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return 'Studied just now';
    if (diffHours < 24) return `Studied ${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `Studied ${diffDays}d ago`;
  };

  // Render Highlighted text
  const renderHighlighted = (text: string): React.ReactNode => {
    if (!debouncedQuery) return text;
    const parts = splitMatches(text, debouncedQuery);
    return parts.map((part, i) =>
      part.isMatch ? (
        <mark key={i} className="search-highlight">
          {part.text}
        </mark>
      ) : (
        part.text
      )
    );
  };

  if (loading) {
    return (
      <div className="screen-container" data-testid="home-loading">
        <Skeleton variant="rect" />
        <Skeleton variant="rect" />
        <Skeleton variant="rect" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Failed to load sets"
        description={error}
        action={
          <Button variant="primary" onClick={() => window.location.reload()}>
            Retry
          </Button>
        }
        data-testid="home-error"
      />
    );
  }

  return (
    <div className="screen-container">
      {/* Top Greeting */}
      <div className="home-greeting-section">
        <h1 className="home-greeting-title">Welcome back</h1>
        <p className="home-greeting-desc">
          Master formulas, constants, and equations with adaptive recall.
        </p>
      </div>

      {/* Prominent Search and Top Actions Bar */}
      <div className="home-search-bar">
        <div className="home-search-input-wrap">
          <Input
            prefixNode={<Icon name="search" size={18} />}
            placeholder="Search sets, tags, formulas, LaTeX..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            data-testid="home-search-input"
          />
        </div>

        <div className="home-top-actions">
          <input
            type="file"
            ref={fileInputRef}
            accept=".flashset,application/json"
            aria-label="Upload flashset file"
            className="home-hidden-file-input"
            onChange={handleFileSelect}
            data-testid="home-file-input"
          />

          <Button
            variant="secondary"
            leftIcon={<Icon name="book" size={18} />}
            onClick={() => fileInputRef.current?.click()}
            data-testid="home-import-btn"
          >
            Import
          </Button>

          <Button
            variant="primary"
            leftIcon={<Icon name="plus" size={18} />}
            onClick={() => navigate('/create')}
            data-testid="home-create-set"
          >
            Create Set
          </Button>
        </div>
      </div>

      {/* Continue Studying Card (if history exists) */}
      {lastSession && !debouncedQuery && (
        <div
          className="home-continue-card"
          onClick={() => navigate(`/study/${lastSession.set.id}/${lastSession.session.mode || 'learn'}`)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              navigate(`/study/${lastSession.set.id}/${lastSession.session.mode || 'learn'}`);
            }
          }}
          data-testid="home-continue-card"
          aria-label={`Continue studying ${lastSession.set.title}`}
        >
          <div className="home-continue-info">
            <span className="home-continue-badge">Continue Studying</span>
            <h2 className="home-continue-title">{lastSession.set.title}</h2>
            <div className="home-continue-meta">
              <span>Mode: {lastSession.session.mode === 'cards' ? 'Flashcards' : 'Learn'}</span>
              <span>·</span>
              <span>
                {lastSession.set.mastery.mastered} of {lastSession.set.cardCount} mastered
              </span>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/study/${lastSession.set.id}/${lastSession.session.mode || 'learn'}`);
            }}
            data-testid="home-continue-resume-btn"
          >
            Resume
          </Button>
        </div>
      )}

      {/* Toolbar: Tag Filters, Sort & View Mode Toggle */}
      {sets.length > 0 && (
        <div className="home-toolbar">
          <div className="home-filter-row">
            <Chip
              variant={selectedTag === 'all' ? 'accent' : 'default'}
              className="home-filter-chip"
              onClick={() => setSelectedTag('all')}
              data-testid="home-filter-all"
            >
              All Sets ({sets.length})
            </Chip>
            {allTags.map((tag) => (
              <Chip
                key={tag}
                variant={selectedTag === tag ? 'accent' : 'default'}
                className="home-filter-chip"
                onClick={() => setSelectedTag(tag === selectedTag ? 'all' : tag)}
                data-testid={`home-filter-${tag}`}
              >
                {tag}
              </Chip>
            ))}
          </div>

          <div className="home-toolbar-right">
            <select
              className="home-sort-select"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              aria-label="Sort sets"
              data-testid="home-sort-select"
            >
              <option value="recent">Recently Studied</option>
              <option value="az">Title (A-Z)</option>
              <option value="cards">Most Cards</option>
              <option value="least-mastered">Least Mastered</option>
            </select>

            <div className="set-actions">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
                data-testid="home-view-grid-btn"
              >
                Grid
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                aria-label="List view"
                data-testid="home-view-list-btn"
              >
                List
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State vs Sets Grid/List */}
      {sets.length === 0 ? (
        <EmptyState
          icon={<Icon name="book" size={48} />}
          title="Your library is empty"
          description="Create your first flashcard set or import a .flashset bundle to start studying."
          action={
            <Button
              variant="primary"
              onClick={() => navigate('/create')}
              data-testid="home-empty-create-btn"
            >
              Create New Set
            </Button>
          }
          data-testid="home-empty-state"
        />
      ) : filteredSets.length === 0 ? (
        <EmptyState
          icon={<Icon name="search" size={48} />}
          title="No matching sets found"
          description="Try adjusting your search terms or clearing your tag filters."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setSearchInput('');
                setSelectedTag('all');
              }}
              data-testid="home-clear-filters-btn"
            >
              Clear Filters
            </Button>
          }
          data-testid="home-empty-search-state"
        />
      ) : (
        <div className={viewMode === 'grid' ? 'home-set-grid' : 'home-set-list'}>
          {filteredSets.map(({ set: s, matchedCardsCount }) => {
            const total = s.cardCount;
            const masteredPercent = total > 0 ? Math.round((s.mastery.mastered / total) * 100) : 0;

            return (
              <SurfaceCard
                key={s.id}
                interactive
                onClick={() => navigate(`/set/${s.id}`)}
                data-testid={`home-set-card-${s.id}`}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    navigate(`/set/${s.id}`);
                  }
                }}
                role="article"
                aria-label={`${s.title}, ${s.cardCount} cards, ${masteredPercent}% mastered`}
              >
                <div className="home-card-header">
                  <div className="home-card-header-left">
                    <h3 className="home-card-title">{renderHighlighted(s.title)}</h3>
                    <div className="home-card-tags">
                      {s.tags.map((tag) => (
                        <Chip key={tag} variant="accent">
                          {renderHighlighted(tag)}
                        </Chip>
                      ))}
                      {matchedCardsCount > 0 && debouncedQuery && (
                        <Chip variant="default">
                          {matchedCardsCount} matching card{matchedCardsCount > 1 ? 's' : ''}
                        </Chip>
                      )}
                    </div>
                  </div>

                  <div
                    className="home-card-header-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MasteryRing percent={masteredPercent} size={42} strokeWidth={4} />
                    <Menu
                      triggerLabel="Set options"
                      items={[
                        {
                          label: 'Study (Learn)',
                          icon: <Icon name="sparkles" size={16} />,
                          onClick: () => navigate(`/study/${s.id}/learn`),
                          'data-testid': `home-menu-learn-${s.id}`,
                        },
                        {
                          label: 'Study (Cards)',
                          icon: <Icon name="book" size={16} />,
                          onClick: () => navigate(`/study/${s.id}/cards`),
                          'data-testid': `home-menu-cards-${s.id}`,
                        },
                        {
                          label: 'Edit Set',
                          icon: <Icon name="edit" size={16} />,
                          onClick: () => navigate(`/set/${s.id}/edit`),
                          'data-testid': `home-menu-edit-${s.id}`,
                        },
                        {
                          label: 'Duplicate',
                          icon: <Icon name="copy" size={16} />,
                          onClick: () => {
                            void duplicateSet(s.id);
                          },
                          'data-testid': `home-menu-duplicate-${s.id}`,
                        },
                        {
                          label: 'Export (.flashset)',
                          icon: <Icon name="book" size={16} />,
                          onClick: () => {
                            void handleExport(s);
                          },
                          'data-testid': `home-menu-export-${s.id}`,
                        },
                        {
                          label: 'Delete Set',
                          icon: <Icon name="trash" size={16} />,
                          isDestructive: true,
                          onClick: () => handleDeleteTrigger(s),
                          'data-testid': `home-menu-delete-${s.id}`,
                        },
                      ]}
                    />
                  </div>
                </div>

                <div className="home-card-progress-wrap">
                  <ProgressBar value={masteredPercent} aria-label={`${s.title} mastery progress`} />
                </div>

                <div className="home-card-meta">
                  <span>{s.cardCount} cards</span>
                  <span>{formatLastStudied(s.lastStudiedAt)}</span>
                </div>
              </SurfaceCard>
            );
          })}
        </div>
      )}

      {/* Delete High-Consequence Confirmation Dialog */}
      {deleteConfirmSet && (
        <ConfirmDialog
          isOpen={!!deleteConfirmSet}
          title="Delete Set"
          message={`Are you sure you want to delete "${deleteConfirmSet.title}"? This set has ${deleteConfirmSet.cardCount} cards.`}
          confirmLabel="Delete Set"
          isDestructive
          onConfirm={async () => {
            const setToDelete = deleteConfirmSet;
            setDeleteConfirmSet(null);
            await deleteSet(setToDelete.id);
          }}
          onCancel={() => setDeleteConfirmSet(null)}
          data-testid="home-delete-confirm-dialog"
        />
      )}

      {/* Import Preview / Validation Modal */}
      <Modal
        isOpen={importModalOpen}
        title="Import Flashset"
        onClose={() => {
          setImportModalOpen(false);
          setImportPendingFile(null);
          setImportError(null);
        }}
        data-testid="home-import-modal"
      >
        {importError ? (
          <div className="import-preview-box">
            <div className="import-error-banner" data-testid="home-import-error">
              {importError}
            </div>
            <div className="set-actions">
              <Button
                variant="secondary"
                onClick={() => {
                  setImportModalOpen(false);
                  setImportError(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        ) : importPendingFile ? (
          <div className="import-preview-box">
            <p className="set-desc-text">
              Ready to import flashcard set from <strong>{importPendingFile.filename}</strong>:
            </p>
            <div className="import-preview-meta">
              <h3 className="home-card-title">{importPendingFile.bundle.set.title}</h3>
              <p className="set-stat-lbl">
                Contains {importPendingFile.bundle.cards?.length || 0} card
                {importPendingFile.bundle.cards?.length === 1 ? '' : 's'}
              </p>
              {importPendingFile.bundle.set.tags?.length > 0 && (
                <div className="home-card-tags">
                  {importPendingFile.bundle.set.tags.map((tag: string) => (
                    <Chip key={tag} variant="accent">
                      {tag}
                    </Chip>
                  ))}
                </div>
              )}
            </div>

            <div className="set-actions">
              <Button
                variant="ghost"
                onClick={() => {
                  setImportModalOpen(false);
                  setImportPendingFile(null);
                }}
                data-testid="home-import-cancel-btn"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  void handleConfirmImport();
                }}
                data-testid="home-import-confirm-btn"
              >
                Confirm Import
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import type { CardSet, Card as CoreCard, CardProgress, Segment } from '@formulaflash/core';
import { registry } from '@formulaflash/core';
import { useLibrary } from '../data/useLibrary.ts';
import { useRoute } from '../router/index.ts';
import {
  Card,
  Button,
  Chip,
  EmptyState,
  Icon,
  Menu,
  ConfirmDialog,
  Input,
  MasteryRing,
  Skeleton,
} from '../ui/index.ts';
import { MathDisplay } from '../components/MathDisplay.tsx';
import { downloadFlashset } from './flashset-utils.ts';
import { richContentToText, fuzzyMatch } from './search-utils.ts';
import './screens.css';

// Initial and incremental render chunk size for massive (5,000+) card lists
const CHUNK_SIZE = 100;

export const SetScreen: React.FC = () => {
  const { route, navigate } = useRoute();
  const { getSet, deleteSet, duplicateSet, repository, updateCard } = useLibrary();
  const setId = route.params.id;

  const [setData, setSetData] = useState<{ set: CardSet; cards: CoreCard[] } | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, CardProgress>>({});
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // In-set search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [starredOnly, setStarredOnly] = useState(false);

  // Windowed chunk rendering for fast performance with 5000 cards
  const [visibleCount, setVisibleCount] = useState(CHUNK_SIZE);

  // Load set data and card progress
  const loadData = useCallback(async (): Promise<void> => {
    if (!setId) return;
    setLoading(true);
    try {
      const res = await getSet(setId);
      if (res) {
        setSetData(res);
        const progressList = await repository.listProgress(setId);
        const pMap: Record<string, CardProgress> = {};
        for (const p of progressList) {
          pMap[p.cardId] = p;
        }
        setProgressMap(pMap);
      } else {
        setSetData(null);
      }
    } catch {
      setSetData(null);
    } finally {
      setLoading(false);
    }
  }, [setId, getSet, repository]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Dynamic study modes from core registry or fallbacks
  const studyModes = useMemo(() => {
    const registered = registry.list('studyModes');
    if (registered.length > 0) {
      return registered.map((m) => ({
        id: m.id,
        name: m.name || m.id,
        description: m.description || 'Study formulas and equations',
        icon: m.id === 'cards' ? 'book' : 'sparkles',
      }));
    }
    return [
      {
        id: 'learn',
        name: 'Learn Mode',
        description: 'Adaptive spaced rounds with math equivalence verification',
        icon: 'sparkles',
      },
      {
        id: 'cards',
        name: 'Flashcards',
        description: 'Flip through terms and target formulas at your own pace',
        icon: 'book',
      },
    ];
  }, []);

  // Filtered cards
  const filteredCards = useMemo(() => {
    if (!setData) return [];
    return setData.cards.filter((c) => {
      if (starredOnly && !c.starred) return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.trim();
      const front = richContentToText(c.front);
      const back = richContentToText(c.back);
      const tags = c.tags.join(' ');
      return fuzzyMatch(q, `${front} ${back} ${tags}`);
    });
  }, [setData, starredOnly, searchQuery]);

  // Overall mastery calculation
  const masteryStats = useMemo(() => {
    if (!setData || setData.cards.length === 0) {
      return { percent: 0, mastered: 0, familiar: 0, proficient: 0, unseen: 0 };
    }
    let mastered = 0;
    let familiar = 0;
    let proficient = 0;
    let unseen = 0;

    for (const card of setData.cards) {
      const prog = progressMap[card.id];
      const lvl = prog?.learn.level ?? 0;
      if (lvl === 0) unseen++;
      else if (lvl === 1) familiar++;
      else if (lvl === 2) proficient++;
      else if (lvl === 3) mastered++;
    }

    const percent = Math.round((mastered / setData.cards.length) * 100);
    return { percent, mastered, familiar, proficient, unseen };
  }, [setData, progressMap]);

  if (loading) {
    return (
      <div className="screen-container" data-testid="set-loading">
        <Skeleton variant="rect" />
        <Skeleton variant="rect" />
      </div>
    );
  }

  if (!setData) {
    return (
      <EmptyState
        title="Set not found"
        description="The requested flashcard set does not exist or may have been deleted."
        action={
          <Button variant="primary" onClick={() => navigate('/')} data-testid="set-not-found-back-btn">
            Back to Home
          </Button>
        }
        data-testid="set-not-found"
      />
    );
  }

  const { set, cards } = setData;

  const handleDelete = async (): Promise<void> => {
    await deleteSet(set.id);
    navigate('/');
  };

  const handleDuplicate = async (): Promise<void> => {
    const dup = await duplicateSet(set.id);
    navigate(`/set/${dup.id}`);
  };

  const handleExport = async (): Promise<void> => {
    const progressList = await repository.listProgress(set.id);
    downloadFlashset(set, cards, progressList);
  };

  const toggleStar = async (card: CoreCard): Promise<void> => {
    const updatedStarred = !card.starred;
    await updateCard(card.id, { starred: updatedStarred });
    setSetData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        cards: prev.cards.map((c) => (c.id === card.id ? { ...c, starred: updatedStarred } : c)),
      };
    });
  };

  // Helper to render title (detect if LaTeX math expression like `$E = mc^2$`)
  const renderTitle = (titleText: string): React.ReactNode => {
    if (titleText.startsWith('$') && titleText.endsWith('$')) {
      const rawLatex = titleText.slice(1, -1);
      return <MathDisplay latex={rawLatex} display={false} />;
    }
    return titleText;
  };

  // Helper to render description segments
  const renderDescription = (descSegments?: Segment[]): React.ReactNode => {
    if (!descSegments || descSegments.length === 0) return null;
    return (
      <div className="set-desc-text">
        {descSegments.map((seg, i) => {
          if (seg.t === 'text') return <span key={i}>{seg.v}</span>;
          if (seg.t === 'math') return <MathDisplay key={i} latex={seg.latex} display={false} />;
          return null;
        })}
      </div>
    );
  };

  const visibleCards = filteredCards.slice(0, visibleCount);

  return (
    <div className="screen-container">
      {/* Set Header Section */}
      <div className="set-header-box">
        <div className="set-header-top">
          <div className="set-header-info">
            <div className="set-actions">
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Icon name="arrow-left" size={16} />}
                onClick={() => navigate('/')}
                data-testid="set-back-btn"
              >
                Back
              </Button>
              {set.tags.map((t) => (
                <Chip key={t} variant="accent">
                  {t}
                </Chip>
              ))}
            </div>

            <h1 className="screen-title" data-testid="set-title">
              {renderTitle(set.title)}
            </h1>

            {renderDescription(set.description)}
          </div>

          <div className="set-actions">
            <Button
              variant="secondary"
              leftIcon={<Icon name="edit" size={16} />}
              onClick={() => navigate(`/set/${set.id}/edit`)}
              data-testid="set-edit-btn"
            >
              Edit Set
            </Button>

            <Menu
              triggerLabel="Set options"
              items={[
                {
                  label: 'Duplicate Set',
                  icon: <Icon name="copy" size={16} />,
                  onClick: () => {
                    void handleDuplicate();
                  },
                  'data-testid': 'set-menu-duplicate',
                },
                {
                  label: 'Export (.flashset)',
                  icon: <Icon name="book" size={16} />,
                  onClick: () => {
                    void handleExport();
                  },
                  'data-testid': 'set-menu-export',
                },
                {
                  label: 'Delete Set',
                  icon: <Icon name="trash" size={16} />,
                  isDestructive: true,
                  onClick: () => setShowDeleteConfirm(true),
                  'data-testid': 'set-menu-delete',
                },
              ]}
            />
          </div>
        </div>

        {/* Quick Stats Overview */}
        <div className="set-stats-bar">
          <MasteryRing percent={masteryStats.percent} size={54} strokeWidth={5} />
          <div className="set-stat-item">
            <span className="set-stat-val">{cards.length}</span>
            <span className="set-stat-lbl">Total Cards</span>
          </div>
          <div className="set-stat-item">
            <span className="set-stat-val">{masteryStats.mastered}</span>
            <span className="set-stat-lbl">Mastered</span>
          </div>
          <div className="set-stat-item">
            <span className="set-stat-val">{masteryStats.familiar + masteryStats.proficient}</span>
            <span className="set-stat-lbl">Practicing</span>
          </div>
          <div className="set-stat-item">
            <span className="set-stat-val">{masteryStats.unseen}</span>
            <span className="set-stat-lbl">Unseen</span>
          </div>
        </div>
      </div>

      {/* Study Mode Big Action Cards */}
      <div className="set-modes-grid">
        {studyModes.map((mode) => (
          <Card
            key={mode.id}
            interactive
            onClick={() => navigate(`/study/${set.id}/${mode.id}`)}
            data-testid={`set-study-${mode.id}-btn`}
          >
            <div className="set-actions">
              <div className={`set-mode-icon-box ${mode.id === 'cards' ? 'is-secondary' : ''}`}>
                <Icon name={mode.id === 'cards' ? 'book' : 'sparkles'} size={24} />
              </div>
              <div>
                <h2 className="set-mode-title">{mode.name}</h2>
                <p className="set-mode-desc">{mode.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* In-Set Card List Header & Controls */}
      <div>
        <div className="screen-header">
          <h2 className="set-mode-title">
            Cards in this set ({filteredCards.length}
            {filteredCards.length !== cards.length ? ` of ${cards.length}` : ''})
          </h2>

          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Icon name="plus" size={16} />}
            onClick={() => navigate(`/set/${set.id}/edit`)}
            data-testid="set-add-cards-btn"
          >
            Add / Edit Cards
          </Button>
        </div>

        {cards.length > 0 && (
          <div className="set-cards-toolbar">
            <div className="set-cards-filter-wrap">
              <Input
                prefixNode={<Icon name="search" size={16} />}
                placeholder="Search cards in this set..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setVisibleCount(CHUNK_SIZE);
                }}
                data-testid="set-card-search-input"
              />
            </div>

            <Button
              variant={starredOnly ? 'secondary' : 'ghost'}
              size="sm"
              leftIcon={<Icon name="sparkles" size={16} />}
              onClick={() => {
                setStarredOnly(!starredOnly);
                setVisibleCount(CHUNK_SIZE);
              }}
              data-testid="set-starred-toggle-btn"
            >
              {starredOnly ? 'Starred Cards' : 'All Cards'}
            </Button>
          </div>
        )}

        {cards.length === 0 ? (
          <EmptyState
            title="This set has no cards"
            description="Add cards to start studying."
            action={
              <Button
                variant="primary"
                onClick={() => navigate(`/set/${set.id}/edit`)}
                data-testid="set-empty-add-btn"
              >
                Add Cards
              </Button>
            }
          />
        ) : filteredCards.length === 0 ? (
          <EmptyState
            icon={<Icon name="search" size={40} />}
            title="No cards match your filter"
            description="Try searching for another formula or clearing your starred filter."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setSearchQuery('');
                  setStarredOnly(false);
                }}
                data-testid="set-clear-card-filters-btn"
              >
                Reset Filter
              </Button>
            }
          />
        ) : (
          <div className="screen-container">
            {visibleCards.map((c, index) => {
              const prog = progressMap[c.id];
              const lvl = prog?.learn.level ?? 0;
              const masteryLabel =
                lvl === 3 ? 'Mastered' : lvl === 2 ? 'Proficient' : lvl === 1 ? 'Familiar' : 'Unseen';
              const dotClass =
                lvl === 3
                  ? 'is-mastered'
                  : lvl === 2
                  ? 'is-proficient'
                  : lvl === 1
                  ? 'is-familiar'
                  : 'is-unseen';

              const frontText = c.front
                .map((s) => (s.t === 'text' ? s.v : s.t === 'math' ? `$${s.latex}$` : ''))
                .join(' ');
              const backMath = c.back.find((s) => s.t === 'math');
              const backText = c.back
                .filter((s) => s.t === 'text')
                .map((s) => (s.t === 'text' ? s.v : ''))
                .join(' ');

              return (
                <Card key={c.id} data-testid={`set-card-row-${c.id}`}>
                  <div className="set-card-row">
                    <div className="set-card-main">
                      <div className="set-card-header-line">
                        <span
                          className={`set-mastery-dot ${dotClass}`}
                          title={`Mastery: ${masteryLabel}`}
                          aria-label={`Mastery: ${masteryLabel}`}
                          data-testid={`set-card-dot-${c.id}`}
                        />
                        <span className="set-mode-desc">Card {index + 1}</span>
                        <span className="set-mode-desc">·</span>
                        <span className="set-mode-desc">{masteryLabel}</span>
                      </div>

                      <p className="home-card-title">{frontText}</p>

                      {backMath && backMath.t === 'math' && (
                        <div className="set-card-math-box">
                          <MathDisplay latex={backMath.latex} display={false} />
                        </div>
                      )}

                      {backText && <p className="set-desc-text">{backText}</p>}
                    </div>

                    <Button
                      variant={c.starred ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => void toggleStar(c)}
                      aria-label={c.starred ? 'Unstar card' : 'Star card'}
                      data-testid={`set-card-star-${c.id}`}
                    >
                      ★
                    </Button>
                  </div>
                </Card>
              );
            })}

            {/* Load more button for large sets (e.g. 5,000 cards) */}
            {visibleCount < filteredCards.length && (
              <Button
                variant="secondary"
                onClick={() => setVisibleCount((prev) => prev + CHUNK_SIZE)}
                data-testid="set-load-more-cards-btn"
              >
                Load More Cards ({filteredCards.length - visibleCount} remaining)
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Set"
        message={`Are you sure you want to delete "${set.title}"? This set and its ${cards.length} cards will be deleted.`}
        confirmLabel="Delete"
        isDestructive
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        data-testid="set-delete-confirm-dialog"
      />
    </div>
  );
};

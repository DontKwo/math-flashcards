import React, { useEffect, useState } from 'react';
import { useLibrary } from '../data/useLibrary.ts';
import { useRoute } from '../router/index.ts';
import type { CardSet, Card as CoreCard } from '@formulaflash/core';
import { Card, Button, Chip, EmptyState, Icon, Menu, ConfirmDialog } from '../ui/index.ts';
import { MathDisplay } from '../components/MathDisplay.tsx';
import './screens.css';

export const SetScreen: React.FC = () => {
  const { route, navigate } = useRoute();
  const { getSet, deleteSet, duplicateSet } = useLibrary();
  const setId = route.params.id;

  const [setData, setSetData] = useState<{ set: CardSet; cards: CoreCard[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (setId) {
      setLoading(true);
      void getSet(setId).then((res) => {
        if (mounted) {
          setSetData(res || null);
          setLoading(false);
        }
      });
    }
    return () => {
      mounted = false;
    };
  }, [setId, getSet]);

  if (loading) {
    return <div data-testid="set-loading">Loading set...</div>;
  }

  if (!setData) {
    return (
      <EmptyState
        title="Set not found"
        description="The requested flashcard set does not exist or may have been deleted."
        action={<Button onClick={() => navigate('/')}>Back to Home</Button>}
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

  return (
    <div className="screen-container">
      {/* Set Header */}
      <div className="screen-header">
        <div>
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
          <h1 className="screen-title">{set.title}</h1>
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

      {/* Study Mode Selector Cards */}
      <div className="set-modes-grid">
        <Card interactive onClick={() => navigate(`/study/${set.id}/learn`)} data-testid="set-study-learn-btn">
          <div className="set-actions">
            <div className="set-mode-icon-box">
              <Icon name="sparkles" size={24} />
            </div>
            <div>
              <h3 className="set-mode-title">Learn Mode</h3>
              <p className="set-mode-desc">Adaptive equation mastery</p>
            </div>
          </div>
          <p className="set-mode-desc">
            Practice equations with intelligent equivalence checking and spaced rounds.
          </p>
        </Card>

        <Card interactive onClick={() => navigate(`/study/${set.id}/cards`)} data-testid="set-study-cards-btn">
          <div className="set-actions">
            <div className="set-mode-icon-box is-secondary">
              <Icon name="book" size={24} />
            </div>
            <div>
              <h3 className="set-mode-title">Flashcards</h3>
              <p className="set-mode-desc">Flip & review</p>
            </div>
          </div>
          <p className="set-mode-desc">
            Quickly flip through terms and target formulas at your own pace.
          </p>
        </Card>
      </div>

      {/* Card List in Set */}
      <div>
        <div className="screen-header">
          <h2 className="set-mode-title">Cards in this set ({cards.length})</h2>
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

        {cards.length === 0 ? (
          <EmptyState
            title="This set has no cards"
            description="Add cards to start studying."
            action={<Button onClick={() => navigate(`/set/${set.id}/edit`)}>Add Cards</Button>}
          />
        ) : (
          <div className="screen-container">
            {cards.map((c, index) => {
              const frontText = c.front.map((s) => (s.t === 'text' ? s.v : s.t === 'math' ? `$${s.latex}$` : '')).join(' ');
              const backLatex = c.back.find((s) => s.t === 'math');

              return (
                <Card key={c.id} data-testid={`set-card-row-${c.id}`}>
                  <div className="set-card-row">
                    <div>
                      <span className="set-mode-desc">
                        Card {index + 1}
                      </span>
                      <p className="home-card-title">
                        {frontText}
                      </p>
                      {backLatex && backLatex.t === 'math' && (
                        <div className="set-card-math-box">
                          <MathDisplay latex={backLatex.latex} display={false} />
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

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

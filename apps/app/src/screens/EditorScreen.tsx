import React, { useState, useEffect } from 'react';
import { useLibrary } from '../data/useLibrary.ts';
import { useRoute } from '../router/index.ts';
import type { Card as CoreCard } from '@formulaflash/core';
import { Card, Button, Input, Textarea, Field, Icon, IconButton } from '../ui/index.ts';
import { MathLiveField } from '../components/MathLiveField.tsx';
import './screens.css';

export const EditorScreen: React.FC = () => {
  const { route, navigate } = useRoute();
  const { getSet, createSet, updateSet, createCard, deleteCard } = useLibrary();

  const isCreatingNewSet = route.pattern === 'create';
  const setId = route.params.id;

  const [title, setTitle] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [cards, setCards] = useState<CoreCard[]>([]);
  const [loading, setLoading] = useState(!isCreatingNewSet);

  // New card draft
  const [newFront, setNewFront] = useState('');
  const [newLatexAnswer, setNewLatexAnswer] = useState('');
  const [newHint, setNewHint] = useState('');

  useEffect(() => {
    let mounted = true;
    if (!isCreatingNewSet && setId) {
      setLoading(true);
      void getSet(setId).then((res) => {
        if (mounted && res) {
          setTitle(res.set.title);
          setTagsInput(res.set.tags.join(', '));
          setCards(res.cards);
          setLoading(false);
        }
      });
    }
    return () => {
      mounted = false;
    };
  }, [isCreatingNewSet, setId, getSet]);

  const handleSaveSet = async (): Promise<void> => {
    if (!title.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (isCreatingNewSet) {
      const created = await createSet(title.trim(), tags);
      if (newFront.trim() && newLatexAnswer.trim()) {
        await createCard(created.id, {
          type: 'equation',
          front: [{ t: 'text', v: newFront.trim() }],
          back: [{ t: 'math', latex: newLatexAnswer.trim(), display: true }],
          answer: {
            checker: 'math',
            accepted: [{ content: [{ t: 'math', latex: newLatexAnswer.trim(), display: true }] }],
            options: {},
          },
          hints: newHint.trim() ? [[{ t: 'text', v: newHint.trim() }]] : [],
          tags,
          starred: false,
          media: [],
          extra: {},
        });
      }
      navigate(`/set/${created.id}`);
    } else if (setId) {
      await updateSet(setId, { title: title.trim(), tags });
      navigate(`/set/${setId}`);
    }
  };

  const handleAddCard = async (): Promise<void> => {
    if (!setId || !newFront.trim() || !newLatexAnswer.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    await createCard(setId, {
      type: 'equation',
      front: [{ t: 'text', v: newFront.trim() }],
      back: [{ t: 'math', latex: newLatexAnswer.trim(), display: true }],
      answer: {
        checker: 'math',
        accepted: [{ content: [{ t: 'math', latex: newLatexAnswer.trim(), display: true }] }],
        options: {},
      },
      hints: newHint.trim() ? [[{ t: 'text', v: newHint.trim() }]] : [],
      tags,
      starred: false,
      media: [],
      extra: {},
    });

    setNewFront('');
    setNewLatexAnswer('');
    setNewHint('');

    const res = await getSet(setId);
    if (res) setCards(res.cards);
  };

  const handleDeleteCard = async (cardId: string): Promise<void> => {
    await deleteCard(cardId);
    if (setId) {
      const res = await getSet(setId);
      if (res) setCards(res.cards);
    }
  };

  if (loading) {
    return <div data-testid="editor-loading">Loading editor...</div>;
  }

  return (
    <div className="screen-container">
      <div className="screen-header">
        <div className="set-actions">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Icon name="arrow-left" size={16} />}
            onClick={() => navigate(setId ? `/set/${setId}` : '/')}
            data-testid="editor-back-btn"
          >
            Cancel
          </Button>
          <h1 className="screen-title">
            {isCreatingNewSet ? 'Create New Set' : 'Edit Set'}
          </h1>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            void handleSaveSet();
          }}
          disabled={!title.trim()}
          data-testid="editor-save-btn"
        >
          {isCreatingNewSet ? 'Create Set' : 'Save Changes'}
        </Button>
      </div>

      <Card>
        <div className="editor-form">
          <Field label="Set Title" htmlFor="editor-set-title">
            <Input
              id="editor-set-title"
              placeholder="e.g. Organic Chemistry Reactions"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-testid="editor-title-input"
            />
          </Field>

          <Field label="Tags (comma-separated)" htmlFor="editor-set-tags">
            <Input
              id="editor-set-tags"
              placeholder="e.g. Chemistry, Reactions, STEM"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              data-testid="editor-tags-input"
            />
          </Field>
        </div>
      </Card>

      {/* Add / Edit Cards */}
      {!isCreatingNewSet && setId && (
        <div className="editor-form">
          <h2 className="set-mode-title">Cards ({cards.length})</h2>

          {/* New Card Form */}
          <Card>
            <h3 className="home-card-title">Add a New Card</h3>
            <div className="editor-form">
              <Field label="Front / Prompt">
                <Textarea
                  placeholder="e.g. State Coulomb's Law relating force, charge, and distance:"
                  value={newFront}
                  onChange={(e) => setNewFront(e.target.value)}
                  rows={2}
                  data-testid="editor-card-front-input"
                />
              </Field>

              <Field label="Target Equation (LaTeX / ASCII)">
                <MathLiveField
                  value={newLatexAnswer}
                  onChange={setNewLatexAnswer}
                  placeholder="e.g. F = k_e \frac{q_1 q_2}{r^2}"
                  className="math-input"
                />
              </Field>

              <Field label="Hint (Optional)">
                <Input
                  placeholder="e.g. Inverse square law with electrostatic constant"
                  value={newHint}
                  onChange={(e) => setNewHint(e.target.value)}
                  data-testid="editor-card-hint-input"
                />
              </Field>

              <Button
                variant="primary"
                onClick={() => {
                  void handleAddCard();
                }}
                disabled={!newFront.trim() || !newLatexAnswer.trim()}
                data-testid="editor-add-card-btn"
              >
                Add Card
              </Button>
            </div>
          </Card>

          {/* Existing Cards List */}
          <div className="editor-form">
            {cards.map((c, idx) => {
              const frontText = c.front.map((s) => (s.t === 'text' ? s.v : '')).join(' ');
              const backLatex = c.back.find((s) => s.t === 'math')?.t === 'math' ? (c.back.find((s) => s.t === 'math') as { latex: string }).latex : '';

              return (
                <Card key={c.id} data-testid={`editor-card-row-${c.id}`}>
                  <div className="set-card-row">
                    <div>
                      <span className="set-mode-desc">#{idx + 1}</span>
                      <p className="home-card-title">{frontText}</p>
                      <code className="set-mode-desc">{backLatex}</code>
                    </div>

                    <IconButton
                      variant="ghost"
                      aria-label="Delete card"
                      onClick={() => {
                        void handleDeleteCard(c.id);
                      }}
                      data-testid={`editor-delete-card-${c.id}`}
                    >
                      <Icon name="trash" size={16} />
                    </IconButton>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

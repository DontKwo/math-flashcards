import { useState, useEffect, useCallback, useRef } from 'react';
import type { Card } from '@formulaflash/core';
import { useLibrary } from '../data/useLibrary.ts';

export interface EditorCardRowData {
  id: string;
  frontText: string;
  frontMode: 'text' | 'math' | 'mixed';
  answerText: string;
  answerMode: 'text' | 'math' | 'mixed';
  acceptedAnswers: string[];
  hint: string;
  explanation: string;
  starred: boolean;
}

export interface EditorStateSnapshot {
  title: string;
  description: string;
  category: string;
  tags: string[];
  cards: EditorCardRowData[];
}

const MAX_HISTORY = 30;

function createEmptyRow(): EditorCardRowData {
  return {
    id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    frontText: '',
    frontMode: 'text',
    answerText: '',
    answerMode: 'text',
    acceptedAnswers: [],
    hint: '',
    explanation: '',
    starred: false,
  };
}

export function useEditorState(setId: string | null) {
  const { currentSet, getSet, saveSet, allSets } = useLibrary();

  const [title, setTitleState] = useState('');
  const [description, setDescriptionState] = useState('');
  const [category, setCategoryState] = useState('');
  const [tags, setTagsState] = useState<string[]>([]);
  const [cards, setCardsState] = useState<EditorCardRowData[]>([createEmptyRow()]);
  const [autosaveStatus, setAutosaveStatus] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved');
  const [undoToast, setUndoToast] = useState<{ message: string; restoreAction: () => void } | null>(null);

  const pastRef = useRef<EditorStateSnapshot[]>([]);
  const futureRef = useRef<EditorStateSnapshot[]>([]);
  const isLoadedRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getSnapshot = useCallback((): EditorStateSnapshot => {
    return {
      title,
      description,
      category,
      tags: [...tags],
      cards: cards.map((c) => ({
        ...c,
        acceptedAnswers: [...c.acceptedAnswers],
      })),
    };
  }, [title, description, category, tags, cards]);

  const pushSnapshot = useCallback(() => {
    const snap = getSnapshot();
    pastRef.current.push(snap);
    if (pastRef.current.length > MAX_HISTORY) {
      pastRef.current.shift();
    }
    futureRef.current = [];
  }, [getSnapshot]);

  const undo = useCallback(() => {
    if (pastRef.current.length === 0) return;
    const currentSnap = getSnapshot();
    futureRef.current.push(currentSnap);
    const prevSnap = pastRef.current.pop()!;
    setTitleState(prevSnap.title);
    setDescriptionState(prevSnap.description);
    setCategoryState(prevSnap.category);
    setTagsState(prevSnap.tags);
    setCardsState(prevSnap.cards);
    setAutosaveStatus('unsaved');
  }, [getSnapshot]);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    const currentSnap = getSnapshot();
    pastRef.current.push(currentSnap);
    const nextSnap = futureRef.current.pop()!;
    setTitleState(nextSnap.title);
    setDescriptionState(nextSnap.description);
    setCategoryState(nextSnap.category);
    setTagsState(nextSnap.tags);
    setCardsState(nextSnap.cards);
    setAutosaveStatus('unsaved');
  }, [getSnapshot]);

  useEffect(() => {
    if (!setId) {
      const draft = sessionStorage.getItem('formulaflash_editor_draft');
      if (draft) {
        try {
          const parsed = JSON.parse(draft) as EditorStateSnapshot;
          setTitleState(parsed.title || '');
          setDescriptionState(parsed.description || '');
          setCategoryState(parsed.category || '');
          setTagsState(parsed.tags || []);
          if (parsed.cards && parsed.cards.length > 0) {
            setCardsState(parsed.cards);
          }
        } catch {
          // ignore corrupted draft
        }
      }
      isLoadedRef.current = true;
      return;
    }

    void getSet(setId).then((set) => {
      if (set) {
        setTitleState(set.title);
        setDescriptionState(set.description || '');
        setCategoryState(set.category || '');
        setTagsState(set.tags || []);
        if (set.cards && set.cards.length > 0) {
          setCardsState(
            set.cards.map((c) => ({
              id: c.id,
              frontText: c.front.map((s) => s.v).join(''),
              frontMode: c.front[0]?.mode === 'math' ? 'math' : 'text',
              answerText: c.back.map((s) => s.v).join(''),
              answerMode: c.back[0]?.mode === 'math' ? 'math' : 'text',
              acceptedAnswers: c.acceptedAnswers || [],
              hint: c.hint || '',
              explanation: c.explanation || '',
              starred: c.starred || false,
            }))
          );
        }
      }
      isLoadedRef.current = true;
    });
  }, [setId, getSet]);

  const saveToRepository = useCallback(async () => {
    if (!title.trim()) return;
    setAutosaveStatus('saving');
    try {
      const cardsToSave: Card[] = cards
        .filter((c) => c.frontText.trim() || c.answerText.trim())
        .map((c, index) => ({
          id: c.id.startsWith('row-') ? `c-${Date.now()}-${index}` : c.id,
          setId: setId || currentSet?.id || `set-${Date.now()}`,
          front: [{ mode: c.frontMode, v: c.frontText }],
          back: [{ mode: c.answerMode, v: c.answerText }],
          acceptedAnswers: c.acceptedAnswers.filter(Boolean),
          hint: c.hint.trim() || undefined,
          explanation: c.explanation.trim() || undefined,
          starred: c.starred,
          type: 'text',
          status: 'new',
          reps: 0,
          lapses: 0,
          history: [],
          created: Date.now(),
          modified: Date.now(),
        }));

      await saveSet({
        id: setId || currentSet?.id || `set-${Date.now()}`,
        title: title.trim(),
        description: description.trim() || undefined,
        category: category.trim() || undefined,
        tags: tags.filter(Boolean),
        cards: cardsToSave,
      });

      setAutosaveStatus('saved');
    } catch {
      setAutosaveStatus('error');
    }
  }, [title, description, category, tags, cards, setId, currentSet, saveSet]);

  useEffect(() => {
    if (!isLoadedRef.current) return;
    setAutosaveStatus('unsaved');

    const draft = JSON.stringify(getSnapshot());
    sessionStorage.setItem('formulaflash_editor_draft', draft);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      void saveToRepository();
    }, 1200);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [title, description, category, tags, cards, getSnapshot, saveToRepository]);

  const setTitle = (val: string) => {
    pushSnapshot();
    setTitleState(val);
  };

  const setDescription = (val: string) => {
    pushSnapshot();
    setDescriptionState(val);
  };

  const setCategory = (val: string) => {
    pushSnapshot();
    setCategoryState(val);
  };

  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase();
    if (!trimmed || tags.includes(trimmed)) return;
    pushSnapshot();
    setTagsState([...tags, trimmed]);
  };

  const removeTag = (tag: string) => {
    pushSnapshot();
    setTagsState(tags.filter((t) => t !== tag));
  };

  const updateCard = (id: string, updater: (card: EditorCardRowData) => EditorCardRowData) => {
    pushSnapshot();
    setCardsState((prev) => prev.map((c) => (c.id === id ? updater(c) : c)));
  };

  const addCard = (index?: number) => {
    pushSnapshot();
    const newRow = createEmptyRow();
    setCardsState((prev) => {
      if (typeof index === 'number' && index >= 0 && index < prev.length) {
        const next = [...prev];
        next.splice(index + 1, 0, newRow);
        return next;
      }
      return [...prev, newRow];
    });
    return newRow.id;
  };

  const duplicateCard = (id: string) => {
    pushSnapshot();
    setCardsState((prev) => {
      const idx = prev.findIndex((c) => c.id === id);
      if (idx === -1) return prev;
      const target = prev[idx];
      const dup: EditorCardRowData = {
        ...target,
        id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        acceptedAnswers: [...target.acceptedAnswers],
      };
      const next = [...prev];
      next.splice(idx + 1, 0, dup);
      return next;
    });
  };

  const deleteCard = (id: string) => {
    pushSnapshot();
    const target = cards.find((c) => c.id === id);
    const idx = cards.findIndex((c) => c.id === id);
    if (!target) return;

    setCardsState((prev) => {
      const remaining = prev.filter((c) => c.id !== id);
      return remaining.length === 0 ? [createEmptyRow()] : remaining;
    });

    setUndoToast({
      message: `Card #${idx + 1} deleted`,
      restoreAction: () => {
        setCardsState((prev) => {
          const next = [...prev];
          next.splice(idx, 0, target);
          return next;
        });
      },
    });
  };

  const moveCard = (id: string, direction: 'up' | 'down') => {
    pushSnapshot();
    setCardsState((prev) => {
      const idx = prev.findIndex((c) => c.id === id);
      if (idx === -1) return prev;
      if (direction === 'up' && idx === 0) return prev;
      if (direction === 'down' && idx === prev.length - 1) return prev;

      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[targetIdx];
      next[targetIdx] = temp;
      return next;
    });
  };

  const bulkAddCards = (newCards: Array<{ frontText: string; answerText: string }>) => {
    pushSnapshot();
    const rowsToAdd: EditorCardRowData[] = newCards.map((c) => ({
      id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      frontText: c.frontText,
      frontMode: 'text',
      answerText: c.answerText,
      answerMode: 'text',
      acceptedAnswers: [],
      hint: '',
      explanation: '',
      starred: false,
    }));

    setCardsState((prev) => {
      const active = prev.filter((c) => c.frontText.trim() || c.answerText.trim());
      return [...active, ...rowsToAdd];
    });
  };

  const existingTags = Array.from(new Set((allSets || []).flatMap((s) => s.tags || [])));
  const existingCategories = Array.from(new Set((allSets || []).map((s) => s.category).filter(Boolean))) as string[];

  return {
    title,
    setTitle,
    description,
    setDescription,
    category,
    setCategory,
    tags,
    addTag,
    removeTag,
    cards,
    updateCard,
    addCard,
    duplicateCard,
    deleteCard,
    moveCard,
    bulkAddCards,
    autosaveStatus,
    undoToast,
    dismissUndoToast: () => setUndoToast(null),
    undo,
    redo,
    canUndo: pastRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
    existingTags,
    existingCategories,
    saveToRepository,
  };
}

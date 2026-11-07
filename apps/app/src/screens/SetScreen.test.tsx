// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SetScreen } from './SetScreen.tsx';
import { useLibrary, setCustomRepository } from '../data/useLibrary.ts';
import { InMemoryRepository } from '@formulaflash/core';
import type { CardSet, Card, CardProgress } from '@formulaflash/core';

const mockNavigate = vi.fn();
let currentRouteId = 'set-1';

vi.mock('../router/index.ts', () => ({
  useRoute: () => ({
    route: { pattern: 'set-detail', params: { id: currentRouteId }, rawHash: `#/set/${currentRouteId}` },
    navigate: mockNavigate,
  }),
}));

describe('SetScreen Component', () => {
  let inMemoryRepo: InMemoryRepository;

  const sampleSet: CardSet = {
    id: 'set-1',
    title: 'Kinematics & Dynamics',
    description: [{ t: 'text', v: 'Core classical mechanics relationships' }],
    tags: ['Physics', 'Mechanics'],
    createdAt: 1000,
    updatedAt: 2000,
    settings: {},
    defaultCardType: 'equation',
    extra: {},
  };

  const sampleCards: Card[] = [
    {
      id: 'c1',
      setId: 'set-1',
      order: 0,
      type: 'equation',
      front: [{ t: 'text', v: 'Velocity with constant acceleration:' }],
      back: [{ t: 'math', latex: 'v = v_0 + at' }],
      answer: { checker: 'math', accepted: [], options: {} },
      hints: [],
      tags: ['Mechanics'],
      starred: true,
      media: [],
      extra: {},
      createdAt: 1000,
      updatedAt: 1000,
    },
    {
      id: 'c2',
      setId: 'set-1',
      order: 1,
      type: 'equation',
      front: [{ t: 'text', v: 'Displacement with constant acceleration:' }],
      back: [{ t: 'math', latex: 'x = x_0 + v_0t + \\frac{1}{2}at^2' }],
      answer: { checker: 'math', accepted: [], options: {} },
      hints: [],
      tags: ['Mechanics'],
      starred: false,
      media: [],
      extra: {},
      createdAt: 1000,
      updatedAt: 1000,
    },
  ];

  const sampleProgress: CardProgress[] = [
    {
      cardId: 'c1',
      direction: 'front->back',
      learn: { level: 3, streak: 3 },
      stats: { seen: 5, right: 5, wrong: 0, avgMs: 1000 },
    },
  ];

  beforeEach(async () => {
    vi.clearAllMocks();
    cleanup();
    localStorage.clear();
    localStorage.setItem('formulaflash_sample_deck_seeded', 'true');
    currentRouteId = 'set-1';
    inMemoryRepo = new InMemoryRepository();
    setCustomRepository(inMemoryRepo);
    useLibrary.setState({ repository: inMemoryRepo, sets: [], loading: false, error: null });
    await inMemoryRepo.saveSet(sampleSet);
    for (const c of sampleCards) {
      await inMemoryRepo.saveCard(c);
    }
    for (const p of sampleProgress) {
      await inMemoryRepo.saveProgress(p);
    }
    await useLibrary.getState().init();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders set header, mastery stats, and card rows', async () => {
    render(<SetScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('set-title')).toHaveTextContent('Kinematics & Dynamics');
      expect(screen.getByText('Core classical mechanics relationships')).toBeInTheDocument();
      expect(screen.getByTestId('set-study-learn-btn')).toBeInTheDocument();
      expect(screen.getByTestId('set-study-cards-btn')).toBeInTheDocument();
      expect(screen.getByTestId('set-card-row-c1')).toBeInTheDocument();
      expect(screen.getByTestId('set-card-row-c2')).toBeInTheDocument();
    });
  });

  it('renders per-card mastery indicator dot with correct status', async () => {
    render(<SetScreen />);

    await waitFor(() => {
      const dot1 = screen.getByTestId('set-card-dot-c1');
      expect(dot1).toHaveClass('is-mastered');

      const dot2 = screen.getByTestId('set-card-dot-c2');
      expect(dot2).toHaveClass('is-unseen');
    });
  });

  it('filters cards by starred status', async () => {
    render(<SetScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('set-card-row-c1')).toBeInTheDocument();
      expect(screen.getByTestId('set-card-row-c2')).toBeInTheDocument();
    });

    const starredToggle = screen.getByTestId('set-starred-toggle-btn');
    fireEvent.click(starredToggle);

    await waitFor(() => {
      expect(screen.getByTestId('set-card-row-c1')).toBeInTheDocument();
      expect(screen.queryByTestId('set-card-row-c2')).not.toBeInTheDocument();
    });
  });

  it('filters cards by in-set search', async () => {
    render(<SetScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('set-card-row-c1')).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId('set-card-search-input');
    fireEvent.change(searchInput, { target: { value: 'Displacement' } });

    await waitFor(() => {
      expect(screen.queryByTestId('set-card-row-c1')).not.toBeInTheDocument();
      expect(screen.getByTestId('set-card-row-c2')).toBeInTheDocument();
    });
  });

  it('renders not found state when set does not exist', async () => {
    currentRouteId = 'nonexistent-id';
    render(<SetScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('set-not-found')).toBeInTheDocument();
      expect(screen.getByText('Set not found')).toBeInTheDocument();
    });
  });

  it('handles massive sets with progressive load more rendering', async () => {
    const massiveSet: CardSet = {
      id: 'massive-set',
      title: '500 Math Formulas',
      tags: ['Math'],
      createdAt: 1000,
      updatedAt: 1000,
      settings: {},
      defaultCardType: 'equation',
      extra: {},
    };
    await inMemoryRepo.saveSet(massiveSet);

    for (let i = 0; i < 250; i++) {
      await inMemoryRepo.saveCard({
        id: `m-card-${i}`,
        setId: 'massive-set',
        order: i,
        type: 'equation',
        front: [{ t: 'text', v: `Formula index ${i}` }],
        back: [{ t: 'math', latex: `x_${i} = ${i}` }],
        answer: { checker: 'math', accepted: [], options: {} },
        hints: [],
        tags: ['Math'],
        starred: false,
        media: [],
        extra: {},
        createdAt: 1000,
        updatedAt: 1000,
      });
    }

    currentRouteId = 'massive-set';
    render(<SetScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('set-load-more-cards-btn')).toBeInTheDocument();
    });

    const loadMoreBtn = screen.getByTestId('set-load-more-cards-btn');
    fireEvent.click(loadMoreBtn);

    await waitFor(() => {
      expect(screen.getByTestId('set-load-more-cards-btn')).toHaveTextContent('50 remaining');
    });
  });
});

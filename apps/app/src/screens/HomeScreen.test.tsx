// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { HomeScreen } from './HomeScreen.tsx';
import { useLibrary, setCustomRepository } from '../data/useLibrary.ts';
import { InMemoryRepository } from '@formulaflash/core';
import type { CardSet, Card, CardProgress } from '@formulaflash/core';

const mockNavigate = vi.fn();
vi.mock('../router/index.ts', () => ({
  useRoute: () => ({
    route: { pattern: 'home', params: {}, rawHash: '#/' },
    navigate: mockNavigate,
  }),
}));

describe('HomeScreen Component', () => {
  let inMemoryRepo: InMemoryRepository;

  const sampleSet: CardSet = {
    id: 'deck-1',
    title: 'Ideal Gas Law & friends',
    tags: ['Physics', 'Thermodynamics'],
    createdAt: 1000,
    updatedAt: 2000,
    settings: {},
    defaultCardType: 'equation',
    extra: {},
  };

  const sampleCards: Card[] = [
    {
      id: 'c1',
      setId: 'deck-1',
      order: 0,
      type: 'equation',
      front: [{ t: 'text', v: 'Ideal Gas Law relating P, V, n, R, T:' }],
      back: [{ t: 'math', latex: 'PV = nRT' }],
      answer: { checker: 'math', accepted: [], options: {} },
      hints: [],
      tags: ['Physics'],
      starred: false,
      media: [],
      extra: {},
      createdAt: 1000,
      updatedAt: 1000,
    },
    {
      id: 'c2',
      setId: 'deck-1',
      order: 1,
      type: 'equation',
      front: [{ t: 'text', v: "Boyle's Law at constant T:" }],
      back: [{ t: 'math', latex: 'P_1V_1 = P_2V_2' }],
      answer: { checker: 'math', accepted: [], options: {} },
      hints: [],
      tags: ['Physics'],
      starred: true,
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
      stats: { seen: 3, right: 3, wrong: 0, avgMs: 1200 },
    },
  ];

  beforeEach(async () => {
    vi.clearAllMocks();
    cleanup();
    localStorage.clear();
    localStorage.setItem('formulaflash_sample_deck_seeded', 'true');
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

  it('renders greeting, search input, and set cards', async () => {
    render(<HomeScreen />);

    await waitFor(() => {
      expect(screen.getByText('Welcome back')).toBeInTheDocument();
      expect(screen.getByTestId('home-search-input')).toBeInTheDocument();
      expect(screen.getByTestId('home-set-card-deck-1')).toBeInTheDocument();
      expect(screen.getByText('Ideal Gas Law & friends')).toBeInTheDocument();
      expect(screen.getByText('2 cards')).toBeInTheDocument();
    });
  });

  it('supports fuzzy search filtering matching titles and cards', async () => {
    render(<HomeScreen />);

    const searchInput = screen.getByTestId('home-search-input');
    fireEvent.change(searchInput, { target: { value: 'Boyle' } });

    await waitFor(() => {
      expect(screen.getByTestId('home-set-card-deck-1')).toBeInTheDocument();
      expect(screen.getByText('1 matching card')).toBeInTheDocument();
    });

    fireEvent.change(searchInput, { target: { value: 'NonexistentQuery' } });
    await waitFor(() => {
      expect(screen.getByTestId('home-empty-search-state')).toBeInTheDocument();
      expect(screen.getByText('No matching sets found')).toBeInTheDocument();
    });
  });

  it('toggles grid and list views and remembers choice in localStorage', async () => {
    render(<HomeScreen />);

    const listBtn = screen.getByTestId('home-view-list-btn');
    fireEvent.click(listBtn);
    expect(localStorage.getItem('formulaflash_home_view')).toBe('list');

    const gridBtn = screen.getByTestId('home-view-grid-btn');
    fireEvent.click(gridBtn);
    expect(localStorage.getItem('formulaflash_home_view')).toBe('grid');
  });

  it('supports tag filter chips', async () => {
    render(<HomeScreen />);

    const physicsChip = screen.getByTestId('home-filter-Physics');
    fireEvent.click(physicsChip);
    expect(localStorage.getItem('formulaflash_home_filter')).toBe('Physics');

    const allChip = screen.getByTestId('home-filter-all');
    fireEvent.click(allChip);
    expect(localStorage.getItem('formulaflash_home_filter')).toBe('all');
  });

  it('navigates to create set on button click', () => {
    render(<HomeScreen />);
    const createBtn = screen.getByTestId('home-create-set');
    fireEvent.click(createBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/create');
  });
});

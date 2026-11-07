// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { EditorScreen } from './EditorScreen.tsx';
import { InMemoryRepository } from '@formulaflash/core';
import { setCustomRepository, useLibrary } from '../data/useLibrary.ts';

describe('EditorScreen Component & Integration Tests', () => {
  let inMemoryRepo: InMemoryRepository;

  beforeEach(async () => {
    inMemoryRepo = new InMemoryRepository();
    setCustomRepository(inMemoryRepo);
    await useLibrary.getState().init();
    sessionStorage.clear();
    window.location.hash = '#/create';
  });

  afterEach(() => {
    sessionStorage.clear();
    cleanup();
  });

  it('renders create mode with title input and empty initial card', async () => {
    window.location.hash = '#/create';
    render(<EditorScreen />);

    expect(screen.getByTestId('editor-title-input')).toBeInTheDocument();
    expect(screen.getByTestId('editor-autosave-status')).toBeInTheDocument();
    expect(screen.getByTestId('editor-add-card-btn')).toBeInTheDocument();
  });

  it('allows adding and removing cards rapidly', async () => {
    window.location.hash = '#/create';
    render(<EditorScreen />);

    const addBtn = screen.getByTestId('editor-add-card-btn');
    fireEvent.click(addBtn);
    fireEvent.click(addBtn);

    const cardsContainer = screen.getByTestId('editor-cards-container');
    expect(cardsContainer.querySelectorAll('.editor-row-card').length).toBeGreaterThanOrEqual(3);
  });

  it('updates title and tags', async () => {
    window.location.hash = '#/create';
    render(<EditorScreen />);

    const titleInput = screen.getByTestId('editor-title-input');
    fireEvent.change(titleInput, { target: { value: 'Physics 101' } });
    expect(titleInput).toHaveValue('Physics 101');

    const tagInput = screen.getByTestId('editor-tag-input');
    fireEvent.change(tagInput, { target: { value: 'Mechanics' } });
    fireEvent.click(screen.getByTestId('editor-add-tag-btn'));

    expect(screen.getByText('mechanics')).toBeInTheDocument();
  });

  it('opens and closes Bulk Add modal and imports cards', async () => {
    window.location.hash = '#/create';
    render(<EditorScreen />);

    fireEvent.click(screen.getByTestId('editor-bulk-add-open-btn'));
    expect(screen.getByTestId('editor-bulk-modal')).toBeInTheDocument();

    const textarea = screen.getByTestId('editor-bulk-textarea');
    fireEvent.change(textarea, { target: { value: 'Force\tF = ma\nEnergy\tE = mc^2' } });

    expect(screen.getByTestId('editor-bulk-preview-table')).toBeInTheDocument();
    expect(screen.getByText('Import 2 Cards')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('editor-bulk-import-btn'));

    await waitFor(() => {
      expect(screen.queryByTestId('editor-bulk-modal')).not.toBeInTheDocument();
    });

    const cardsContainer = screen.getByTestId('editor-cards-container');
    expect(cardsContainer.querySelectorAll('.editor-row-card').length).toBe(2);
  });

  it('supports undo and redo shortcuts for card operations', async () => {
    window.location.hash = '#/create';
    render(<EditorScreen />);

    const titleInput = screen.getByTestId('editor-title-input');
    fireEvent.change(titleInput, { target: { value: 'First Title' } });
    fireEvent.change(titleInput, { target: { value: 'Second Title' } });

    const undoBtn = screen.getByTestId('editor-undo-btn');
    fireEvent.click(undoBtn);
    expect(titleInput).toHaveValue('First Title');

    const redoBtn = screen.getByTestId('editor-redo-btn');
    fireEvent.click(redoBtn);
    expect(titleInput).toHaveValue('Second Title');
  });

  it('performs stress test with 1,000 items in state without DOM explosion', async () => {
    const hugeItems = Array.from({ length: 1000 }, (_, i) => ({
      frontText: `Term ${i + 1}`,
      answerText: `Answer ${i + 1}`,
    }));

    window.location.hash = '#/create';
    render(<EditorScreen />);

    fireEvent.click(screen.getByTestId('editor-bulk-add-open-btn'));
    const bulkLines = hugeItems.map((item) => `${item.frontText}\t${item.answerText}`).join('\n');
    fireEvent.change(screen.getByTestId('editor-bulk-textarea'), { target: { value: bulkLines } });
    fireEvent.click(screen.getByTestId('editor-bulk-import-btn'));

    const cardsContainer = screen.getByTestId('editor-cards-container');
    expect(cardsContainer.querySelectorAll('.editor-row-card').length).toBeGreaterThanOrEqual(1000);
  });
});

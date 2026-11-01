import { describe, it, expect, beforeEach } from 'vitest';
import { Registry, registry } from './index.js';

describe('Registry', () => {
  let reg: Registry;

  beforeEach(() => {
    reg = new Registry();
  });

  describe('Registration and retrieval across categories', () => {
    it('registers and retrieves a cardType', () => {
      const cardType = {
        id: 'basic',
        name: 'Basic Card',
        description: 'Standard flashcard with front and back',
      };
      reg.register('cardTypes', 'basic', cardType);
      expect(reg.get('cardTypes', 'basic')).toEqual(cardType);
    });

    it('registers and retrieves a checker', () => {
      const checker = {
        id: 'math',
        name: 'Math Equivalence Checker',
        check: (given: unknown, spec: unknown) => ({ correct: given === spec }),
      };
      reg.register('checkers', 'math', checker);
      expect(reg.get('checkers', 'math')).toBe(checker);
    });

    it('registers and retrieves an importer', () => {
      const importer = {
        id: 'csv',
        name: 'CSV Importer',
        detect: (input: string) => input.includes(','),
      };
      reg.register('importers', 'csv', importer);
      expect(reg.get('importers', 'csv')).toBe(importer);
    });

    it('registers and retrieves an exporter', () => {
      const exporter = {
        id: 'json',
        name: 'JSON Exporter',
        export: (data: unknown) => JSON.stringify(data),
      };
      reg.register('exporters', 'json', exporter);
      expect(reg.get('exporters', 'json')).toBe(exporter);
    });

    it('registers and retrieves a studyMode', () => {
      const studyMode = {
        id: 'learn',
        name: 'Learn Mode',
        description: 'Adaptive study mode',
      };
      reg.register('studyModes', 'learn', studyMode);
      expect(reg.get('studyModes', 'learn')).toBe(studyMode);
    });
  });

  describe('Duplicate checks and overwrite behavior', () => {
    it('throws a descriptive error when registering a duplicate id without overwrite flag', () => {
      const cardType1 = { id: 'equation', name: 'Equation V1' };
      const cardType2 = { id: 'equation', name: 'Equation V2' };

      reg.register('cardTypes', 'equation', cardType1);

      expect(() => {
        reg.register('cardTypes', 'equation', cardType2);
      }).toThrowError(/Item with id "equation" is already registered in category "cardTypes"/);
    });

    it('allows overwriting an existing item when overwrite flag is true', () => {
      const cardType1 = { id: 'equation', name: 'Equation V1' };
      const cardType2 = { id: 'equation', name: 'Equation V2' };

      reg.register('cardTypes', 'equation', cardType1);
      reg.register('cardTypes', 'equation', cardType2, { overwrite: true });

      expect(reg.get('cardTypes', 'equation')).toEqual(cardType2);
    });
  });

  describe('Unregistered item checks', () => {
    it('throws a descriptive error when getting an unregistered id', () => {
      expect(() => {
        reg.get('checkers', 'nonexistent');
      }).toThrowError(/Item with id "nonexistent" not found in category "checkers"/);
    });
  });

  describe('has', () => {
    it('returns true when item is registered, false otherwise', () => {
      expect(reg.has('importers', 'anki')).toBe(false);

      reg.register('importers', 'anki', { id: 'anki', name: 'Anki Importer' });

      expect(reg.has('importers', 'anki')).toBe(true);
    });
  });

  describe('list', () => {
    it('lists all registered items in a category', () => {
      expect(reg.list('studyModes')).toEqual([]);

      const mode1 = { id: 'flashcards', name: 'Flashcards' };
      const mode2 = { id: 'learn', name: 'Learn' };

      reg.register('studyModes', 'flashcards', mode1);
      reg.register('studyModes', 'learn', mode2);

      const items = reg.list('studyModes');
      expect(items).toHaveLength(2);
      expect(items).toContain(mode1);
      expect(items).toContain(mode2);
    });
  });

  describe('unregister', () => {
    it('removes the registered item and updates has and list', () => {
      const exporter = { id: 'txt', name: 'TXT Exporter' };
      reg.register('exporters', 'txt', exporter);

      expect(reg.has('exporters', 'txt')).toBe(true);
      expect(reg.list('exporters')).toContain(exporter);

      const removed = reg.unregister('exporters', 'txt');
      expect(removed).toBe(true);

      expect(reg.has('exporters', 'txt')).toBe(false);
      expect(reg.list('exporters')).toHaveLength(0);
      expect(() => reg.get('exporters', 'txt')).toThrowError(/not found/);
    });

    it('returns false when unregistering a non-existent item', () => {
      const removed = reg.unregister('exporters', 'nonexistent');
      expect(removed).toBe(false);
    });
  });

  describe('Singleton registry instance', () => {
    it('is an instance of Registry', () => {
      expect(registry).toBeInstanceOf(Registry);
    });

    it('can register and unregister items on the singleton', () => {
      const customChecker = { id: 'custom-text', name: 'Custom Checker' };
      registry.register('checkers', 'custom-text', customChecker, { overwrite: true });

      expect(registry.get('checkers', 'custom-text')).toBe(customChecker);
      expect(registry.has('checkers', 'custom-text')).toBe(true);

      registry.unregister('checkers', 'custom-text');
      expect(registry.has('checkers', 'custom-text')).toBe(false);
    });
  });
});

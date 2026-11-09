import type { TermDefinition } from '../../model/index.js';

export interface CfdFlashcardItem {
  id: string;
  category: string;
  title: string;
  prompt: string;
  latexAnswer: string;
  hint?: string;
  explanation: string;
  terms?: TermDefinition[];
}

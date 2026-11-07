import { type Card, type CardProgress, type Verdict } from '../model/index.js';
import { type SeededRng } from './prng.js';
import { type MasteryLevel, type QuestionPrompt, type QuestionType } from './types.js';

export class LearnEngine {
  private rng: SeededRng;
  private queue: QuestionPrompt[] = [];
  private progressMap: Map<string, CardProgress> = new Map();
  private allCards: Card[] = [];

  constructor(cards: Card[], progresses: CardProgress[], rng: SeededRng) {
    this.allCards = cards;
    this.rng = rng;
    for (const p of progresses) {
      this.progressMap.set(p.cardId, structuredClone(p));
    }
    this.refillQueue();
  }

  private getQuestionTypeForLevel(level: MasteryLevel): QuestionType {
    if (level === 0) return 'mc';
    return 'write';
  }

  private refillQueue(): void {
    const unmastered = this.allCards.filter((c) => {
      const p = this.progressMap.get(c.id);
      return !p || p.learn.level < 3;
    });

    const shuffled = this.rng.shuffle(unmastered);

    // Pick up to 5 cards for the current round
    const roundCards = shuffled.slice(0, 5);

    this.queue = roundCards.map((card) => {
      let p = this.progressMap.get(card.id);
      if (!p) {
        p = {
          cardId: card.id,
          direction: 'front->back',
          learn: { level: 0, streak: 0 },
          stats: { seen: 0, right: 0, wrong: 0, avgMs: 0 },
        };
        this.progressMap.set(card.id, p);
      }
      return this.buildPrompt(card, p);
    });
  }

  private buildPrompt(card: Card, progress: CardProgress): QuestionPrompt {
    const type = this.getQuestionTypeForLevel(progress.learn.level);
    const prompt: QuestionPrompt = { card, progress, type };
    if (type === 'mc') {
      prompt.options = this.generateDistractors(card);
    }
    return prompt;
  }

  private generateDistractors(card: Card): string[] {
    // Basic distractors: pick up to 3 other cards' answers if possible.
    const others = this.allCards.filter((c) => c.id !== card.id);
    const shuffled = this.rng.shuffle(others).slice(0, 3);
    // Use card id as a proxy for distractors in this simple implementation
    // A real implementation would parse the RichContent to plain text/latex
    const options = [card.id, ...shuffled.map((c) => c.id)];
    return this.rng.shuffle(options);
  }

  getNext(): QuestionPrompt | null {
    if (this.queue.length === 0) {
      this.refillQueue();
    }
    if (this.queue.length === 0) {
      return null; // All mastered
    }
    return this.queue.shift() || null;
  }

  submitAnswer(cardId: string, verdict: Verdict): void {
    const p = this.progressMap.get(cardId);
    if (!p) return;

    if (verdict.correct) {
      p.learn.level = Math.min(3, p.learn.level + 1) as MasteryLevel;
      p.learn.streak += 1;
      p.learn.lastResult = 'right';
    } else {
      p.learn.level = Math.max(0, p.learn.level - 1) as MasteryLevel;
      p.learn.streak = 0;
      p.learn.lastResult = 'wrong';
      // Re-queue the missed card
      const card = this.allCards.find(c => c.id === cardId);
      if (card) {
          this.queue.push(this.buildPrompt(card, p));
      }
    }
    p.stats.seen += 1;
    if (verdict.correct) p.stats.right += 1;
    else p.stats.wrong += 1;
  }

  getProgress(cardId: string): CardProgress | undefined {
      return this.progressMap.get(cardId);
  }
}

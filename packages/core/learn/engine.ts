import type { Card, CardProgress, Verdict } from '../model/index.js';
import type { SeededRng } from './prng.js';
import type {
  MasteryLevel,
  QuestionPrompt,
  QuestionType,
  StudyDirection,
  RoundSummary,
  LearnEngineConfig,
} from './types.js';

function richContentToString(rc: Card['front']): string {
  return rc
    .map((s) => {
      if (s.t === 'text') return s.v;
      if (s.t === 'math') return s.latex;
      return '';
    })
    .join(' ')
    .trim();
}

export class LearnEngine {
  private rng: SeededRng;
  private queue: QuestionPrompt[] = [];
  private progressMap: Map<string, CardProgress> = new Map();
  private allCards: Card[] = [];
  private config: LearnEngineConfig;
  private currentRoundIndex = 0;
  private roundAnswered = 0;
  private roundCorrect = 0;
  private roundMissed = 0;
  private roundPromoted = 0;
  private retypePendingCardId: string | null = null;

  constructor(
    cards: Card[],
    progresses: CardProgress[],
    rng: SeededRng,
    config?: LearnEngineConfig
  ) {
    this.allCards = cards;
    this.rng = rng;
    this.config = {
      direction: config?.direction ?? 'front->back',
      roundSize: config?.roundSize ?? 5,
      retypeAfterMiss: config?.retypeAfterMiss ?? true,
    };
    for (const p of progresses) {
      this.progressMap.set(p.cardId, structuredClone(p));
    }
    this.refillQueue();
  }

  private getQuestionTypeForLevel(level: MasteryLevel): QuestionType {
    if (level === 0) return 'mc';
    return 'write';
  }

  private resolveCardDirection(preference: StudyDirection): 'front->back' | 'back->front' {
    if (preference === 'back->front') return 'back->front';
    if (preference === 'both') {
      return this.rng.nextFloat() > 0.5 ? 'back->front' : 'front->back';
    }
    return 'front->back';
  }

  private refillQueue(): void {
    const unmastered = this.allCards.filter((c) => {
      const p = this.progressMap.get(c.id);
      return !p || p.learn.level < 3;
    });

    if (unmastered.length === 0) {
      this.queue = [];
      return;
    }

    const shuffled = this.rng.shuffle(unmastered);
    const roundCards = shuffled.slice(0, this.config.roundSize ?? 5);

    this.queue = roundCards.map((card) => {
      const dir = this.resolveCardDirection(this.config.direction ?? 'front->back');
      let p = this.progressMap.get(card.id);
      if (!p) {
        p = {
          cardId: card.id,
          direction: dir,
          learn: { level: 0, streak: 0 },
          stats: { seen: 0, right: 0, wrong: 0, avgMs: 0 },
        };
        this.progressMap.set(card.id, p);
      }
      return this.buildPrompt(card, p, dir);
    });
  }

  private buildPrompt(
    card: Card,
    progress: CardProgress,
    direction: 'front->back' | 'back->front'
  ): QuestionPrompt {
    const type = this.getQuestionTypeForLevel(progress.learn.level);
    const promptContent = direction === 'front->back' ? card.front : card.back;
    const answerContent = direction === 'front->back' ? card.back : card.front;
    const expectedLatexOrText = richContentToString(answerContent);

    const prompt: QuestionPrompt = {
      card,
      progress,
      type,
      direction,
      promptContent,
      expectedLatexOrText,
    };

    if (type === 'mc') {
      prompt.options = this.generateDistractors(card, expectedLatexOrText, direction);
    }
    return prompt;
  }

  private generateDistractors(
    card: Card,
    correctAnswer: string,
    direction: 'front->back' | 'back->front'
  ): string[] {
    const others = this.allCards.filter((c) => c.id !== card.id);
    const otherAnswers = others
      .map((c) => richContentToString(direction === 'front->back' ? c.back : c.front))
      .filter((a) => a.length > 0 && a !== correctAnswer);

    const uniqueAnswers = Array.from(new Set(otherAnswers));
    const sampled = this.rng.shuffle(uniqueAnswers).slice(0, 3);

    // Fallback options if deck has fewer than 4 cards
    const fallbacks = ['x + y = z', 'E = mc^2', 'F = ma', 'a^2 + b^2 = c^2', 'e^{i\\pi} + 1 = 0'];
    let fallbackIdx = 0;
    while (sampled.length < 3 && fallbackIdx < fallbacks.length) {
      const candidate = fallbacks[fallbackIdx++];
      if (candidate !== correctAnswer && !sampled.includes(candidate)) {
        sampled.push(candidate);
      }
    }

    const options = [correctAnswer, ...sampled];
    return this.rng.shuffle(options);
  }

  getNext(): QuestionPrompt | null {
    if (this.queue.length === 0) {
      this.refillQueue();
    }
    if (this.queue.length === 0) {
      return null;
    }
    return this.queue.shift() || null;
  }

  submitAnswer(cardId: string, verdict: Verdict): void {
    const p = this.progressMap.get(cardId);
    if (!p) return;

    this.roundAnswered += 1;
    const prevLevel = p.learn.level;

    if (verdict.correct) {
      this.roundCorrect += 1;
      p.learn.level = Math.min(3, p.learn.level + 1) as MasteryLevel;
      if (p.learn.level > prevLevel) {
        this.roundPromoted += 1;
      }
      p.learn.streak += 1;
      p.learn.lastResult = 'right';
      this.retypePendingCardId = null;
    } else {
      this.roundMissed += 1;
      p.learn.level = Math.max(0, p.learn.level - 1) as MasteryLevel;
      p.learn.streak = 0;
      p.learn.lastResult = 'wrong';

      if (this.config.retypeAfterMiss) {
        this.retypePendingCardId = cardId;
      }

      const card = this.allCards.find((c) => c.id === cardId);
      if (card) {
        const dir = this.resolveCardDirection(this.config.direction ?? 'front->back');
        this.queue.push(this.buildPrompt(card, p, dir));
      }
    }

    p.stats.seen += 1;
    if (verdict.correct) p.stats.right += 1;
    else p.stats.wrong += 1;
  }

  overrideCorrect(cardId: string): void {
    const p = this.progressMap.get(cardId);
    if (!p) return;

    // Adjust counters if this was counted as missed
    if (p.learn.lastResult === 'wrong') {
      this.roundMissed = Math.max(0, this.roundMissed - 1);
      this.roundCorrect += 1;
      p.stats.wrong = Math.max(0, p.stats.wrong - 1);
      p.stats.right += 1;
      p.learn.level = Math.min(3, p.learn.level + 2) as MasteryLevel;
      p.learn.streak = 1;
      p.learn.lastResult = 'right';
      this.retypePendingCardId = null;

      // Remove any duplicate prompt for this card queued from previous wrong answer
      const idx = this.queue.findIndex((q) => q.card.id === cardId);
      if (idx !== -1) {
        this.queue.splice(idx, 1);
      }
    }
  }

  getRetypePendingCardId(): string | null {
    return this.retypePendingCardId;
  }

  clearRetypePending(): void {
    this.retypePendingCardId = null;
  }

  getProgress(cardId: string): CardProgress | undefined {
    return this.progressMap.get(cardId);
  }

  getRoundSummary(): RoundSummary {
    return {
      roundIndex: this.currentRoundIndex,
      totalAnswered: this.roundAnswered,
      correctCount: this.roundCorrect,
      missedCount: this.roundMissed,
      promotedCount: this.roundPromoted,
    };
  }

  resetRoundSummary(): void {
    this.currentRoundIndex += 1;
    this.roundAnswered = 0;
    this.roundCorrect = 0;
    this.roundMissed = 0;
    this.roundPromoted = 0;
  }

  isRoundComplete(): boolean {
    return this.queue.length === 0;
  }

  isSessionComplete(): boolean {
    if (this.allCards.length === 0) return true;
    for (const card of this.allCards) {
      const p = this.progressMap.get(card.id);
      if (!p || p.learn.level < 3) return false;
    }
    return true;
  }

  getMasteryCounts(): { unseen: number; familiar: number; proficient: number; mastered: number } {
    let unseen = 0;
    let familiar = 0;
    let proficient = 0;
    let mastered = 0;

    for (const card of this.allCards) {
      const p = this.progressMap.get(card.id);
      const lvl = p?.learn.level ?? 0;
      if (lvl === 0) unseen++;
      else if (lvl === 1) familiar++;
      else if (lvl === 2) proficient++;
      else if (lvl === 3) mastered++;
    }

    return { unseen, familiar, proficient, mastered };
  }
}

import type { Card } from '../model/index.js';
import type { SeededRng } from './prng.js';
import { registry } from '../registry/index.js';

function extractText(card: Card): string[] {
  const candidates: string[] = [];
  for (const accepted of card.answer.accepted) {
    let s = '';
    for (const seg of accepted.content) {
      if (seg.t === 'text') {
        s += seg.v;
      } else if (seg.t === 'math') {
        s += seg.latex;
      }
    }
    if (s.trim().length > 0) {
      candidates.push(s.trim());
    }
  }
  return candidates;
}

function applyMutations(candidates: string[]): string[] {
  const mutations: string[] = [];
  for (const c of candidates) {
    // Basic syntatic mutations
    mutations.push(`-${c}`);
    mutations.push(`\\frac{1}{${c}}`);
    mutations.push(`${c}^2`);
    if (c.startsWith('-')) mutations.push(c.substring(1));
    if (c.includes('+')) mutations.push(c.replace('+', '-'));
    if (c.includes('-')) mutations.push(c.replace('-', '+'));
  }
  // Just shuffle and return the mutated list, we will filter later
  return mutations;
}

export function generateDistractors(targetCard: Card, allCards: Card[], count: number, rng: SeededRng): string[] {
  const checker = registry.getChecker(targetCard.answer.checker);

  // Extract target answers as a basis for checking
  const targetAnswers = extractText(targetCard);

  // Pool candidate answers
  const candidates: string[] = [];
  for (const card of allCards) {
    if (card.id !== targetCard.id) {
      candidates.push(...extractText(card));
    }
  }

  // Remove duplicates and self-equivalents from the initial pool
  let uniqueCandidates = Array.from(new Set(candidates));

  // Helper to check if a candidate is equivalent to the target answer
  const isEquivalent = (candidate: string) => {
    if (!checker) return targetAnswers.includes(candidate);
    for (const ta of targetAnswers) {
      const v = checker.check(candidate, ta, targetCard.answer.options as Record<string, unknown>);
      if (v.correct) return true;
    }
    return false;
  };

  uniqueCandidates = uniqueCandidates.filter(c => !isEquivalent(c));

  // If we don't have enough candidates, add mutations
  if (uniqueCandidates.length < count) {
    const mutated = applyMutations(uniqueCandidates.length > 0 ? uniqueCandidates : targetAnswers);
    for (const m of mutated) {
      if (!isEquivalent(m) && !uniqueCandidates.includes(m)) {
        uniqueCandidates.push(m);
      }
    }
  }

  // Fallback to purely random generated numeric/math distractors if still not enough
  let safetyCounter = 0;
  while (uniqueCandidates.length < count && safetyCounter < 100) {
    const num = rng.nextInt(1, 100);
    let synthetic = String(num);
    if (targetCard.answer.checker === 'math') {
      const ops = ['x', 'y', '\\pi', '\\sqrt{2}'];
      synthetic = `${num}${ops[rng.nextInt(0, ops.length)]}`;
    }

    if (!isEquivalent(synthetic) && !uniqueCandidates.includes(synthetic)) {
      uniqueCandidates.push(synthetic);
    }
    safetyCounter++;
  }

  // Sample unique distractors
  return rng.shuffle(uniqueCandidates).slice(0, count);
}

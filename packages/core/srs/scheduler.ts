import { fsrs, Card, Rating as FSRSRating, State } from 'ts-fsrs';
import { SRSItem, Rating } from './types.js';

const f = fsrs();

export function scheduleCard(
  item: SRSItem,
  rating: Rating,
  now: Date,
): SRSItem {
  let state: State = State.Review;
  if (item.state !== undefined) {
    state = item.state as State;
  } else if (item.reps === 0) {
    state = State.New;
  } else if (item.lapses > 0) {
    state = State.Relearning;
  } else {
    // If reps > 0 but we don't know the exact state, let's assume it's Review if it has been reviewed
    // more than once, otherwise Learning. This is just a guess if state isn't provided.
    state = item.reps > 1 ? State.Review : State.Learning;
  }

  const card: Card = {
    due: item.due,
    stability: item.stability,
    difficulty: item.difficulty,
    elapsed_days: 0,
    scheduled_days: 0,
    learning_steps: 0, // Should this be derived? We'll just leave it 0
    reps: item.reps,
    lapses: item.lapses,
    state,
    last_review: item.lastReview,
  };

  let fsrsRating: FSRSRating;
  switch (rating) {
    case Rating.Again:
      fsrsRating = FSRSRating.Again;
      break;
    case Rating.Hard:
      fsrsRating = FSRSRating.Hard;
      break;
    case Rating.Good:
      fsrsRating = FSRSRating.Good;
      break;
    case Rating.Easy:
      fsrsRating = FSRSRating.Easy;
      break;
    default:
      throw new Error(`Invalid rating: ${rating}`);
  }

  const result = f.next(card, now, fsrsRating);
  const nextCard = result.card;

  return {
    stability: nextCard.stability,
    difficulty: nextCard.difficulty,
    due: nextCard.due,
    reps: nextCard.reps,
    lapses: nextCard.lapses,
    lastReview: nextCard.last_review,
    state: nextCard.state,
  };
}

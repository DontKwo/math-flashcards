import { exportFlashset, importFlashset } from '@formulaflash/core';
import type { CardSet, Card, CardProgress, Repository, FlashsetBundle } from '@formulaflash/core';

// Downloads a set as a .flashset JSON file
export function downloadFlashset(set: CardSet, cards: Card[], progress?: CardProgress[]): void {
  const jsonString = exportFlashset(set, cards, progress);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  const safeFilename = set.title
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'flashcards';
  anchor.download = `${safeFilename}.flashset`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

// Parses and validates a .flashset file string
export function parseFlashsetFile(fileContent: string): {
  success: boolean;
  bundle?: FlashsetBundle;
  error?: string;
} {
  try {
    const bundle = importFlashset(fileContent);
    return { success: true, bundle };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid or corrupted .flashset file';
    return { success: false, error: message };
  }
}

// Saves a validated FlashsetBundle into the repository
export async function commitFlashsetImport(bundle: FlashsetBundle, repo: Repository): Promise<CardSet> {
  // Ensure fresh IDs if existing set id already taken or if importing as duplicate
  const existingSet = await repo.getSet(bundle.set.id);
  const newSetId = existingSet ? crypto.randomUUID() : bundle.set.id;
  const now = Date.now();

  const importedSet: CardSet = {
    ...bundle.set,
    id: newSetId,
    title: existingSet ? `${bundle.set.title} (Imported)` : bundle.set.title,
    createdAt: now,
    updatedAt: now,
  };

  await repo.saveSet(importedSet);

  for (const card of bundle.cards) {
    const cardId = existingSet ? crypto.randomUUID() : card.id;
    await repo.saveCard({
      ...card,
      id: cardId,
      setId: newSetId,
      createdAt: now,
      updatedAt: now,
    });
  }

  if (bundle.progress) {
    for (const prog of bundle.progress) {
      if (!existingSet) {
        await repo.saveProgress(prog);
      }
    }
  }

  return importedSet;
}

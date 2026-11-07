# UI Contract & Architecture Specification

Branch: `ai/foundation`

This document establishes the binding API and architectural contracts for Formula Flash. All other feature branches build on these contracts.

---

## 1. ROUTES (Hash Router)

Formula Flash uses a lightweight, zero-dependency hash router supporting deep linking, browser back/forward buttons, and path parameters.

| Route Pattern | Screen / Purpose | Lazy-Loaded Module |
|---|---|---|
| `#/` | **Home / Library**: View all sets, search, recent activity, primary Create button | `apps/app/src/screens/HomeScreen.tsx` |
| `#/set/:id` | **Set Details**: Card list, mastery breakdown, study mode selector (Learn, Cards) | `apps/app/src/screens/SetScreen.tsx` |
| `#/set/:id/edit` | **Set / Card Editor**: Edit set title/description, edit cards, reorder, delete | `apps/app/src/screens/EditorScreen.tsx` |
| `#/create` | **Create Set**: Create a new flashcard set | `apps/app/src/screens/EditorScreen.tsx` |
| `#/study/:id/learn` | **Learn Mode**: Adaptive staged learning with math verification | `apps/app/src/screens/StudyScreen.tsx` |
| `#/study/:id/cards` | **Cards Mode**: Flip-card study view | `apps/app/src/screens/StudyScreen.tsx` |
| `#/stats` | **Analytics / Stats**: Overall mastery, streak, session history | `apps/app/src/screens/StatsScreen.tsx` |
| `#/settings` | **Settings**: App preferences, math checker options, themes, backup/restore | `apps/app/src/screens/SettingsScreen.tsx` |

### Route Behavior:
- Unmatched routes redirect to `#/`.
- Deep links (e.g. `window.location.hash = '#/set/ideal-gas'`) load immediately on cold start.
- Navigating back via browser back or `window.history.back()` smoothly transitions to the previous route.
- Study screens run in an isolated full-screen view (no navigation bars), providing an exit/close button back to `#/set/:id`.

---

## 2. STORE API (`useLibrary`)

State management uses Zustand (`apps/app/src/data/useLibrary.ts`) backed by an asynchronous `Repository` adapter (`IndexedDBRepository`) implementing `packages/core/storage/types.ts`.

### State Structure:
```ts
export interface SetWithStats extends CardSet {
  cardCount: number;
  mastery: {
    unseen: number;
    familiar: number;
    proficient: number;
    mastered: number;
  };
  lastStudiedAt?: number;
}

export interface LibraryState {
  sets: SetWithStats[];
  loading: boolean;
  error: string | null;
  activeToast: ToastMessage | null;

  // Actions
  init: () => Promise<void>;
  getSet: (id: string) => Promise<{ set: CardSet; cards: Card[] } | undefined>;
  createSet: (title: string, tags?: string[]) => Promise<CardSet>;
  updateSet: (id: string, updates: Partial<CardSet>) => Promise<void>;
  deleteSet: (id: string) => Promise<void>; // soft delete with undo toast
  duplicateSet: (id: string) => Promise<CardSet>;

  // Card Actions
  createCard: (setId: string, card: Omit<Card, 'id' | 'setId' | 'createdAt' | 'updatedAt'>) => Promise<Card>;
  updateCard: (id: string, updates: Partial<Card>) => Promise<void>;
  deleteCard: (id: string) => Promise<void>; // soft delete with undo toast
  reorderCards: (setId: string, orderedCardIds: string[]) => Promise<void>;
  bulkAddCards: (setId: string, cards: Array<Omit<Card, 'id' | 'setId' | 'createdAt' | 'updatedAt'>>) => Promise<void>;

  // Undo Mechanism
  undoLastAction: () => Promise<void>;
  clearToast: () => void;
}
```

### Soft-Delete & Undo Contract:
- `deleteSet` and `deleteCard` perform a soft-delete (moving items to an undo buffer in memory) and trigger an `activeToast` with message and "Undo" action for 6 seconds.
- If "Undo" is clicked within 6 seconds, `undoLastAction()` restores the deleted item and reloads state.
- If the timer expires or another destructive action occurs, deletion commits permanently to IndexedDB.

---

## 3. TESTID RULE

Every interactive or identifiable UI element MUST specify a `data-testid` attribute adhering strictly to the naming scheme:
`data-testid="<screen>-<element>"`

### Examples:
- Home screen create button: `data-testid="home-create-set"`
- Home screen search input: `data-testid="home-search-input"`
- Set item in list: `data-testid="home-set-card-${setId}"`
- Set page study learn button: `data-testid="set-study-learn-btn"`
- Editor add card button: `data-testid="editor-add-card-btn"`
- Shell desktop nav home button: `data-testid="nav-sidebar-home"`
- Shell mobile nav home button: `data-testid="nav-bottom-home"`
- Toast undo button: `data-testid="toast-undo-btn"`

---

## 4. UI KIT COMPONENT SPECIFICATION (`apps/app/src/ui`)

All components reside in `apps/app/src/ui` and enforce:
- Zero inline styles (`style={{ ... }}` forbidden).
- Semantic CSS classes styled exclusively with CSS tokens from `tokens.css`.
- Touch target minimum size of 44px (`min-h-[44px]` / `min-w-[44px]`).
- Visible focus rings (`focus-visible:ring-2 focus-visible:ring-indigo-500`).
- WCAG AA contrast ratio compliance in all states.
- Respect for `prefers-reduced-motion`.

### Component Manifest:
1. `Button`: Variants `primary`, `secondary`, `ghost`, `danger`. Sizes `sm`, `md`, `lg`. Supports `isLoading`, `disabled`, `leftIcon`, `rightIcon`.
2. `IconButton`: Square 44px minimum target button. Requires `aria-label` string prop.
3. `Input`: Accessible text/search input with label, helper text, error state, and prefix/suffix slots.
4. `Textarea`: Auto-expanding or multi-row textarea with label and error state.
5. `Field`: Form field layout container rendering label, description, and error message.
6. `Chip`: Compact metadata tag or interactive filter chip. Variants `default`, `accent`, `outline`.
7. `Surface` / `Card`: Theme-aware elevated container (`bg-card`, border, hover effects).
8. `Modal`: Focus-trapped accessible dialog, handles `Escape` key, clicks outside, restores focus on close.
9. `BottomSheet`: Mobile slide-up sheet supporting gesture drag handle and safe-area insets.
10. `ConfirmDialog`: Modal for high-consequence operations (e.g. deleting large set).
11. `Menu`: Kebab menu / dropdown with full keyboard arrow navigation and Esc dismiss.
12. `Toast`: Timed alert notification at viewport bottom with optional action button (e.g., Undo).
13. `EmptyState`: Friendly graphic/icon, title, description, and primary call-to-action button.
14. `Skeleton`: Pulsing placeholder matching typography and card dimensions during loading.
15. `ProgressBar`: Accessible determinate progress bar (`role="progressbar"`).
16. `MasteryRing`: SVG circular gauge indicating percentage of cards mastered.
17. `SegmentedControl`: Accessible pill-style switcher between modes/options.
18. `Tabs`: Tab list and tab panel controls with ARIA tab roles and keyboard navigation.
19. `Icon`: Curated set of lightweight SVG icons (home, book, plus, chart, settings, search, close, back, trash, edit, check, copy, menu).

---

## 5. DESIGN TOKENS (`apps/app/src/ui/tokens.css`)

Tokens define Formula Flash's dark slate + indigo visual identity:
- **Colors**: Slate palette (`#0f172a` bg, `#1e293b` card, `#334155` border, `#f8fafc` text primary, `#94a3b8` secondary, `#64748b` muted) + Indigo accent (`#6366f1`, hover `#4f46e5`, light `rgba(99, 102, 241, 0.15)`) + Emerald success + Rose danger.
- **Spacing Scale**: 4px base (`--space-1: 0.25rem` up to `--space-16: 4rem`).
- **Radii**: `--radius-sm: 0.375rem`, `--radius-md: 0.5rem`, `--radius-lg: 0.75rem`, `--radius-xl: 1rem`, `--radius-full: 9999px`.
- **Typography**: Responsive type scale in rem.
- **Z-Index**: Modals (1000), Toasts (1100), Dropdowns (500), Navigation (100).
- **Motion**: Standard 150ms/200ms ease transitions; 0ms when `@media (prefers-reduced-motion: reduce)`.

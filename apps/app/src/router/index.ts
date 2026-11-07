import { useState, useEffect, useCallback } from 'react';

export type RoutePattern =
  | 'home'
  | 'set-detail'
  | 'set-edit'
  | 'create'
  | 'study-learn'
  | 'study-cards'
  | 'stats'
  | 'settings'
  | 'not-found';

export interface RouteMatch {
  pattern: RoutePattern;
  params: Record<string, string>;
  rawHash: string;
}

export function parseHash(hash: string): RouteMatch {
  const cleanHash = hash.replace(/^#\/?/, '').trim();
  const segments = cleanHash.split('/').filter(Boolean);

  if (segments.length === 0) {
    return { pattern: 'home', params: {}, rawHash: hash };
  }

  // #/create
  if (segments[0] === 'create') {
    return { pattern: 'create', params: {}, rawHash: hash };
  }

  // #/stats
  if (segments[0] === 'stats') {
    return { pattern: 'stats', params: {}, rawHash: hash };
  }

  // #/settings
  if (segments[0] === 'settings') {
    return { pattern: 'settings', params: {}, rawHash: hash };
  }

  // #/set/:id or #/set/:id/edit
  if (segments[0] === 'set' && segments[1]) {
    const id = decodeURIComponent(segments[1]);
    if (segments[2] === 'edit') {
      return { pattern: 'set-edit', params: { id }, rawHash: hash };
    }
    return { pattern: 'set-detail', params: { id }, rawHash: hash };
  }

  // #/study/:id/learn or #/study/:id/cards
  if (segments[0] === 'study' && segments[1]) {
    const id = decodeURIComponent(segments[1]);
    const mode = segments[2] || 'learn';
    if (mode === 'cards') {
      return { pattern: 'study-cards', params: { id }, rawHash: hash };
    }
    return { pattern: 'study-learn', params: { id }, rawHash: hash };
  }

  return { pattern: 'home', params: {}, rawHash: hash };
}

export function navigate(path: string): void {
  const targetHash = path.startsWith('#') ? path : `#${path.startsWith('/') ? '' : '/'}${path}`;
  if (window.location.hash !== targetHash) {
    window.location.hash = targetHash;
  }
}

export function useRoute(): { route: RouteMatch; navigate: (path: string) => void } {
  const [route, setRoute] = useState<RouteMatch>(() =>
    parseHash(typeof window !== 'undefined' ? window.location.hash : '')
  );

  useEffect(() => {
    const handleHashChange = (): void => {
      setRoute(parseHash(window.location.hash));
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  const navigateCallback = useCallback((path: string): void => {
    navigate(path);
  }, []);

  return { route, navigate: navigateCallback };
}

import { useSyncExternalStore } from 'react';

/**
 * Abonnement à une media query CSS. S'appuie sur useSyncExternalStore pour
 * rester synchrone avec le rendu concurrent de React 19 (pas de flash SSR/CSR).
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = (callback: () => void) => {
    const mql = window.matchMedia(query);
    mql.addEventListener('change', callback);
    return () => mql.removeEventListener('change', callback);
  };

  const getSnapshot = () => window.matchMedia(query).matches;
  // Côté serveur (pas de window) : on suppose desktop par défaut.
  const getServerSnapshot = () => false;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Vrai en dessous du breakpoint `md` de Tailwind (768px), c.-à-d. sur mobile
 * et petites tablettes en portrait.
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}

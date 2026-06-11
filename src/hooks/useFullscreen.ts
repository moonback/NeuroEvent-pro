import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Hook pour passer un élément en plein écran via l'API Fullscreen native.
 * Retourne :
 *  - `ref`         : à attacher sur le conteneur à mettre en plein écran
 *  - `isFullscreen`: booléen indiquant l'état courant
 *  - `toggle`      : fonction pour basculer le plein écran
 */
export function useFullscreen<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggle = useCallback(() => {
    if (!document.fullscreenElement) {
      ref.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  return { ref, isFullscreen, toggle };
}

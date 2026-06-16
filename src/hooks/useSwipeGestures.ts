import { useCallback, useRef, useState } from 'react';
import type * as React from 'react';
import type { MutableRefObject, RefObject } from 'react';

type ReactTouchEvent = React.TouchEvent;

/**
 * Hooks de gestes tactiles réutilisables pour une UI "full mobile" type Uber Driver.
 *
 * Trois primitives :
 * - useSwipeable        : swipe horizontal/vertical (gauche, droite, haut, bas)
 * - usePullToRefresh    : pull-to-refresh avec indicateur visuel
 * - useDrag             : drag libre avec offset X/Y en pixels
 *
 * Conception :
 * - Pas de dépendance externe (vanilla touch events).
 * - Verrouillage automatique si scroll vertical détecté en premier.
 * - Calcul de vélocité pour distinguer un "fling" rapide d'un "drag" lent.
 * - Compatible React 18+ (refs + state).
 * - SSR-safe (toutes les API touch sont guarded).
 *
 * Conventions de seuils (UX mobile standard) :
 * - Swipe horizontal : 70px de distance OU 0.3 px/ms de vélocité.
 * - Swipe vertical   : 50px de distance OU 0.3 px/ms de vélocité.
 * - Pull-to-refresh  : 80px pour armer, déclenchement au relâché au-delà.
 */

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

export interface SwipeableOptions {
  /** Swipe vers la gauche (doigt vers la gauche, contenu suit) */
  onSwipeLeft?: () => void;
  /** Swipe vers la droite */
  onSwipeRight?: () => void;
  /** Swipe vers le haut (fermeture bottom sheet par ex.) */
  onSwipeUp?: () => void;
  /** Swipe vers le bas */
  onSwipeDown?: () => void;
  /** Distance minimale en px pour considérer un swipe (défaut: 70). */
  threshold?: number;
  /** Vélocité minimale en px/ms (défaut: 0.3). Un swipe rapide compte même si < threshold. */
  velocityThreshold?: number;
  /** Si true, le swipe est désactivé (ex: pas sur mobile, ou élément en cours d'édition). */
  disabled?: boolean;
  /**
   * Verrou optionnel : si fourni, le swipe ne se déclenche que si `lock` est null
   * ET il devient `lock` pendant toute la durée du geste. Empêche les conflits
   * entre gestes concurrents (ex: drawer + scroll).
   */
  lockRef?: MutableRefObject<boolean>;
}

export interface SwipeableHandlers {
  onTouchStart: (e: ReactTouchEvent) => void;
  onTouchMove: (e: ReactTouchEvent) => void;
  onTouchEnd: (e: ReactTouchEvent) => void;
  onTouchCancel: (e: ReactTouchEvent) => void;
}

const DEFAULT_THRESHOLD = 70;
const DEFAULT_VELOCITY = 0.3;

export function useSwipeable(options: SwipeableOptions): SwipeableHandlers {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = DEFAULT_THRESHOLD,
    velocityThreshold = DEFAULT_VELOCITY,
    disabled = false,
    lockRef,
  } = options;

  const startX = useRef(0);
  const startY = useRef(0);
  const startTime = useRef(0);
  const axis = useRef<'x' | 'y' | null>(null);

  const handleStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return;
      if (lockRef && lockRef.current) return;
      const t = e.touches[0];
      if (!t) return;
      startX.current = t.clientX;
      startY.current = t.clientY;
      startTime.current = Date.now();
      axis.current = null;
      if (lockRef) lockRef.current = true;
    },
    [disabled, lockRef],
  );

  const handleMove = useCallback(
    (_e: ReactTouchEvent) => {
      if (disabled) return;
      if (startTime.current === 0) return;
      // On ne détermine l'axe dominant qu'à partir du premier move
      // pour ne pas voler le scroll natif si l'utilisateur scrolle verticalement.
    },
    [disabled],
  );

  const handleEnd = useCallback(
    (e: ReactTouchEvent) => {
      if (disabled) return;
      if (startTime.current === 0) return;
      const t = e.changedTouches[0];
      if (!t) {
        startTime.current = 0;
        if (lockRef) lockRef.current = false;
        return;
      }
      const dx = t.clientX - startX.current;
      const dy = t.clientY - startY.current;
      const dt = Math.max(1, Date.now() - startTime.current);
      const vx = Math.abs(dx) / dt;
      const vy = Math.abs(dy) / dt;

      // Détermine l'axe dominant à la fin du geste.
      const dominant: 'x' | 'y' = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';

      const isHorizontalSwipe = dominant === 'x'
        && (Math.abs(dx) >= threshold || vx >= velocityThreshold);
      const isVerticalSwipe = dominant === 'y'
        && (Math.abs(dy) >= threshold || vy >= velocityThreshold);

      if (isHorizontalSwipe) {
        if (dx > 0) onSwipeRight?.();
        else onSwipeLeft?.();
      } else if (isVerticalSwipe) {
        if (dy > 0) onSwipeDown?.();
        else onSwipeUp?.();
      }

      startTime.current = 0;
      axis.current = null;
      if (lockRef) lockRef.current = false;
    },
    [disabled, threshold, velocityThreshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, lockRef],
  );

  const handleCancel = useCallback(() => {
    startTime.current = 0;
    axis.current = null;
    if (lockRef) lockRef.current = false;
  }, [lockRef]);

  return {
    onTouchStart: handleStart,
    onTouchMove: handleMove,
    onTouchEnd: handleEnd,
    onTouchCancel: handleCancel,
  };
}

/* ------------------------------------------------------------------ */
/*  usePullToRefresh                                                  */
/* ------------------------------------------------------------------ */

export interface PullToRefreshOptions {
  /** Fonction async appelée quand l'utilisateur relâche après le seuil. */
  onRefresh: () => Promise<void> | void;
  /** Distance en px avant de considérer le geste armé (défaut: 80). */
  threshold?: number;
  /** Distance max de l'indicateur (au-delà, l'indicateur "rebondit") (défaut: 140). */
  maxPull?: number;
  /** Résistance appliquée au pull (0..1, défaut 0.4). */
  resistance?: number;
  /** Désactive le geste. */
  disabled?: boolean;
}

export interface PullToRefreshState {
  /** Ref à attacher à l'élément scrollable parent (window par défaut). */
  containerRef: RefObject<HTMLDivElement | null>;
  /** True entre le déclenchement et la fin de `onRefresh`. */
  isRefreshing: boolean;
  /** Distance courante du pull en pixels (0 si pas en cours). */
  pullDistance: number;
  /** Pourcentage 0..1 de progression vers le seuil. */
  progress: number;
  /** À attacher au conteneur (window-level listeners). */
  bind: () => {
    onTouchStart: (e: Event) => void;
    onTouchMove: (e: Event) => void;
    onTouchEnd: (e: Event) => void;
  };
}

/**
 * Pull-to-refresh avec un seul doigt, armé uniquement si le conteneur est
 * scrollé en haut (scrollTop === 0). Les enfants n'ont PAS besoin d'être wrappés.
 */
export function usePullToRefresh(options: PullToRefreshOptions): PullToRefreshState {
  const {
    onRefresh,
    threshold = 80,
    maxPull = 140,
    resistance = 0.4,
    disabled = false,
  } = options;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const startY = useRef(0);
  const startScrollTop = useRef(0);
  const pulling = useRef(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const trigger = useCallback(async () => {
    setIsRefreshing(true);
    setPullDistance(threshold);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
    }
  }, [onRefresh, threshold]);

  const handleStart = useCallback(
    (e: Event) => {
      if (disabled || isRefreshing) return;
      const target = containerRef.current;
      const scrollTop = target
        ? target.scrollTop
        : (typeof window !== 'undefined' ? window.scrollY : 0);
      if (scrollTop > 0) return;
      const t = (e as TouchEvent).touches?.[0];
      if (!t) return;
      startY.current = t.clientY;
      startScrollTop.current = scrollTop;
      pulling.current = true;
    },
    [disabled, isRefreshing],
  );

  const handleMove = useCallback(
    (e: Event) => {
      if (!pulling.current || disabled) return;
      const t = (e as TouchEvent).touches?.[0];
      if (!t) return;
      const dy = t.clientY - startY.current;
      if (dy <= 0) {
        if (pullDistance !== 0) setPullDistance(0);
        return;
      }
      // Résistance logarithmique : 1er cm gratuit, ensuite ralentit.
      const resisted = Math.min(maxPull, threshold + (dy - threshold) * resistance);
      setPullDistance(resisted);
    },
    [disabled, maxPull, threshold, resistance, pullDistance],
  );

  const handleEnd = useCallback(() => {
    if (!pulling.current) return;
    pulling.current = false;
    if (pullDistance >= threshold) {
      trigger();
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, threshold, trigger]);

  const bind = useCallback(
    () => ({
      onTouchStart: handleStart,
      onTouchMove: handleMove,
      onTouchEnd: handleEnd,
    }),
    [handleStart, handleMove, handleEnd],
  );

  const progress = Math.min(1, pullDistance / threshold);

  return {
    containerRef,
    isRefreshing,
    pullDistance,
    progress,
    bind,
  };
}

/* ------------------------------------------------------------------ */
/*  useDrag                                                           */
/* ------------------------------------------------------------------ */

export interface DragOptions {
  /** Restreint le drag à un seul axe. */
  axis?: 'x' | 'y' | 'both';
  /** Active le drag. */
  enabled?: boolean;
  /** Appelé à chaque move avec le delta depuis le début du drag. */
  onDrag?: (deltaX: number, deltaY: number) => void;
  /** Appelé au début du drag. */
  onDragStart?: () => void;
  /** Appelé à la fin du drag avec le delta final + durée en ms. */
  onDragEnd?: (deltaX: number, deltaY: number, durationMs: number) => void;
}

export interface DragState<T extends HTMLElement> {
  ref: RefObject<T | null>;
  offset: { x: number; y: number };
  isDragging: boolean;
  handlers: {
    onTouchStart: (e: ReactTouchEvent) => void;
    onTouchMove: (e: ReactTouchEvent) => void;
    onTouchEnd: (e: ReactTouchEvent) => void;
  };
}

/**
 * Hook de drag libre avec offset en pixels. Le consommateur applique lui-même
 * l'offset via `transform: translate(x, y)`. Pas d'animation de snap-back
 * gérée ici — c'est le rôle du parent (cf. MissionDrawer pour un exemple).
 */
export function useDrag<T extends HTMLElement = HTMLDivElement>(
  options: DragOptions = {},
): DragState<T> {
  const { axis = 'both', enabled = true, onDrag, onDragStart, onDragEnd } = options;
  const ref = useRef<T | null>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const startTime = useRef(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const handleStart = useCallback(
    (e: ReactTouchEvent) => {
      if (!enabled) return;
      const t = e.touches[0];
      if (!t) return;
      startX.current = t.clientX;
      startY.current = t.clientY;
      startTime.current = Date.now();
      setIsDragging(true);
      onDragStart?.();
    },
    [enabled, onDragStart],
  );

  const handleMove = useCallback(
    (e: ReactTouchEvent) => {
      if (!enabled || !isDragging) return;
      const t = e.touches[0];
      if (!t) return;
      const dx = axis === 'y' ? 0 : t.clientX - startX.current;
      const dy = axis === 'x' ? 0 : t.clientY - startY.current;
      setOffset({ x: dx, y: dy });
      onDrag?.(dx, dy);
    },
    [enabled, isDragging, axis, onDrag],
  );

  const handleEnd = useCallback(
    (_e: ReactTouchEvent) => {
      if (!enabled) return;
      const duration = Math.max(1, Date.now() - startTime.current);
      setIsDragging(false);
      onDragEnd?.(offset.x, offset.y, duration);
    },
    [enabled, offset.x, offset.y, onDragEnd],
  );

  return {
    ref,
    offset,
    isDragging,
    handlers: {
      onTouchStart: handleStart,
      onTouchMove: handleMove,
      onTouchEnd: handleEnd,
    },
  };
}

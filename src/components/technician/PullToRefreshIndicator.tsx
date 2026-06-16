import React from 'react';
import { Sparkles } from 'lucide-react';

interface PullToRefreshIndicatorProps {
  /** Distance courante du pull en px (0 quand inactif). */
  pullDistance: number;
  /** Distance à partir de laquelle l'action se déclenche au relâché. */
  threshold: number;
  /** True pendant le chargement des données. */
  isRefreshing: boolean;
  /** Texte quand le pull n'est pas armé. */
  idleText?: string;
  /** Texte quand le pull a dépassé le seuil (relâchez !). */
  armedText?: string;
  /** Texte pendant le chargement. */
  refreshingText?: string;
}

/**
 * Indicateur visuel de pull-to-refresh, inspiré des apps mobiles natives.
 * Suit le doigt avec une icône qui pivote, change de texte au seuil,
 * et passe en spinner pendant le refresh.
 */
export default function PullToRefreshIndicator({
  pullDistance,
  threshold,
  isRefreshing,
  idleText = 'Tirer pour actualiser',
  armedText = 'Relâchez pour actualiser',
  refreshingText = 'Synchronisation...',
}: PullToRefreshIndicatorProps) {
  const isArmed = pullDistance >= threshold;

  // Pendant le refresh, on garde la hauteur au seuil pour que l'indicateur
  // reste visible. L'icône passe en rotation.
  const displayHeight = isRefreshing ? Math.max(threshold, pullDistance) : pullDistance;
  const isVisible = displayHeight > 0;

  return (
    <div
      className="w-full flex items-center justify-center overflow-hidden rounded-2xl relative"
      style={{
        height: `${displayHeight}px`,
        opacity: isVisible ? 1 : 0,
        transition: isRefreshing ? 'height 0.2s, opacity 0.2s' : 'none',
        background: 'rgba(0,0,0,0.2)',
        borderBottom: '1px solid rgba(0,229,160,0.05)',
      }}
      aria-hidden={!isVisible}
    >
      <div
        className="flex items-center gap-2 text-xs font-black uppercase tracking-wider"
        style={{ color: 'var(--tech-accent)' }}
      >
        <Sparkles
          className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
          style={{
            transform: isRefreshing ? 'none' : `rotate(${pullDistance * 4.5}deg)`,
            transition: isRefreshing ? 'none' : 'transform 0.05s',
          }}
        />
        <span>
          {isRefreshing
            ? refreshingText
            : isArmed
              ? armedText
              : idleText}
        </span>
      </div>
    </div>
  );
}

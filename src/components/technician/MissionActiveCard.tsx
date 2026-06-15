import React from 'react';
import { format } from 'date-fns';

interface Props {
  mission: any;
  truckName: string;
  colleagues: string[];
  progress: { total: number; pointed: number; percent: number };
  onOpen: () => void;
  onPrimary: () => void;
}

export default function MissionActiveCard({ mission, truckName, colleagues, progress, onOpen, onPrimary }: Props) {
  const badgeClass = mission.status === 'En cours' ? 'tech-badge-active' : mission.status === 'Terminée' ? 'tech-badge-done' : 'tech-badge-planned';
  const primaryLabel = mission.status === 'Planifiée' ? 'Commencer' : mission.status === 'En cours' ? 'Continuer' : 'Terminer';

  return (
    <>
      <div className="max-w-md mx-auto px-4 pt-3">
        <div className={`tech-card p-4 mb-3 rounded-3xl overflow-hidden ${mission.status === 'En cours' ? 'tech-glow' : ''}`} style={{ border: '1px solid rgba(0,229,160,0.06)' }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] font-black" style={{ color: 'var(--tech-text-muted)' }}>Mission active</p>
                  <h2 className="text-lg font-black leading-tight" style={{ color: 'var(--tech-text)' }}>{mission.title}</h2>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`tech-badge ${badgeClass}`}>{mission.status}</span>
                  <span className="text-[11px] text-[var(--tech-text-secondary)]">{format(new Date(mission.start), 'HH:mm')}</span>
                </div>
              </div>

              <div className="text-sm text-[var(--tech-text-secondary)] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Client</span>
                  <span className="truncate max-w-[160px]">{mission.client}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Adresse</span>
                  <span className="truncate max-w-[160px]">{mission.address}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Camion</span>
                  <span className="truncate max-w-[160px]">{truckName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Collègues</span>
                  <span className="truncate max-w-[160px]">{colleagues.length}</span>
                </div>
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold" style={{ color: 'var(--tech-text-secondary)' }}>{progress.percent}%</span>
                  <span className="text-xs text-[var(--tech-text-muted)]">{progress.pointed} équipements validés sur {progress.total}</span>
                </div>
                <div className="tech-progress-track bg-[rgba(255,255,255,0.04)] h-3 rounded-full overflow-hidden">
                  <div className="tech-progress-fill bg-gradient-to-r from-[var(--tech-accent)] to-[var(--tech-accent-dim)] h-full" style={{ width: `${progress.percent}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Primary button sticky above bottom nav */}
      <div className="fixed left-0 right-0 flex justify-center z-50" style={{ bottom: '76px' }}>
        <div className="max-w-md w-full px-4">
          <button
            onClick={onPrimary}
            className="w-full py-4 rounded-2xl tech-btn-accent text-black font-black text-base"
            style={{ boxShadow: '0 8px 26px rgba(0,229,160,0.18)' }}
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </>
  );
}

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
      <div className="max-w-md mx-auto px-4 pt-2">
        <div className={`tech-card p-3 mb-2 rounded-2xl overflow-hidden ${mission.status === 'En cours' ? 'tech-glow' : ''}`} style={{ border: '1px solid rgba(0,229,160,0.06)' }}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[9px] uppercase tracking-widest font-extrabold mb-0.5" style={{ color: 'var(--tech-text-muted)' }}>Mission active</p>
                  <h2 className="text-base font-black truncate" style={{ color: 'var(--tech-text)' }}>{mission.title}</h2>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`tech-badge ${badgeClass} text-[11px]`}>{mission.status}</span>
                  <span className="text-[11px] text-[var(--tech-text-secondary)]">{format(new Date(mission.start), 'HH:mm')}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <div className="px-2 py-1 rounded-full text-[11px] bg-white/[0.02] border border-white/[0.03] truncate max-w-[160px]">
                  <strong className="font-semibold">Client:</strong>&nbsp;<span className="ml-1">{mission.client}</span>
                </div>
                <div className="px-2 py-1 rounded-full text-[11px] bg-white/[0.02] border border-white/[0.03] truncate max-w-[160px]">
                  <strong className="font-semibold">Adresse:</strong>&nbsp;<span className="ml-1">{mission.address}</span>
                </div>
                <div className="px-2 py-1 rounded-full text-[11px] bg-white/[0.02] border border-white/[0.03]">
                  {truckName}
                </div>
                <div className="px-2 py-1 rounded-full text-[11px] bg-white/[0.02] border border-white/[0.03]">
                  {colleagues.length} personnes
                </div>
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold" style={{ color: 'var(--tech-text-secondary)' }}>{progress.percent}%</span>
                  <span className="text-xs text-[var(--tech-text-muted)]">{progress.pointed}/{progress.total}</span>
                </div>
                <div className="tech-progress-track bg-[rgba(255,255,255,0.04)] h-2 rounded-full overflow-hidden">
                  <div className="tech-progress-fill bg-gradient-to-r from-[var(--tech-accent)] to-[var(--tech-accent-dim)] h-full" style={{ width: `${progress.percent}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Primary button sticky above bottom nav, compact */}
      <div className="fixed left-0 right-0 flex justify-center z-50" style={{ bottom: 'calc(56px + env(safe-area-inset-bottom, 0px))' }}>
        <div className="max-w-md w-full px-4">
          <button
            onClick={onPrimary}
            className="w-full py-3 rounded-xl tech-btn-accent text-black font-black text-sm"
            style={{ boxShadow: '0 6px 18px rgba(0,229,160,0.16)', minHeight: 48 }}
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </>
  );
}

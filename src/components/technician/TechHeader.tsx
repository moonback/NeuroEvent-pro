import React from 'react';
import { Settings as SettingsIcon, Zap, CalendarDays } from 'lucide-react';
import { triggerVibrate } from './useTechDashboard';

interface TechHeaderProps {
  userName: string;
  isOnline: boolean;
  syncCount: number;
  todayCount: number;
  activeCount: number;
  onSettingsClick: () => void;
}

export default function TechHeader({
  userName,
  isOnline,
  syncCount,
  todayCount,
  activeCount,
  onSettingsClick,
}: TechHeaderProps) {
  return (
    <header className="tech-glass sticky top-0 z-30 px-4 pt-3 pb-2.5">
      {/* Top Row */}
      <div className="flex justify-between items-center mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: isOnline ? '#06c167' : '#ef4444',
                boxShadow: isOnline ? '0 0 6px rgba(6,193,103,0.5)' : '0 0 6px rgba(239,68,68,0.5)',
              }}
            />
            <span
              className="text-[9px] font-black uppercase tracking-widest"
              style={{ color: 'var(--tech-text-muted)' }}
            >
              {isOnline ? 'En ligne' : 'Hors ligne'}
            </span>
            {syncCount > 0 && (
              <span className="text-[9px] font-extrabold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-md border border-amber-400/20 animate-pulse ml-1.5">
                {syncCount} sync
              </span>
            )}
          </div>
          <h1
            className="text-lg font-black tracking-tight truncate"
            style={{ color: 'var(--tech-text)' }}
          >
            Bonjour{userName ? `, ${userName}` : ''} 👋
          </h1>
        </div>

        <button
          onClick={() => {
            triggerVibrate('click');
            onSettingsClick();
          }}
          className="p-2.5 rounded-xl transition-all active:scale-90 cursor-pointer"
          style={{ background: 'var(--tech-card)', border: '1px solid var(--tech-border)' }}
        >
          <SettingsIcon className="w-4.5 h-4.5" style={{ color: 'var(--tech-text-secondary)' }} />
        </button>
      </div>

      {/* Stats row - Inline pill chips */}
      <div className="flex items-center gap-2">
        <div
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold"
          style={{ background: 'var(--tech-accent-soft)', border: '1px solid rgba(6,193,103,0.15)' }}
        >
          <Zap className="w-3 h-3" style={{ color: 'var(--tech-accent)' }} />
          <span style={{ color: 'var(--tech-accent)' }}>{activeCount} en cours</span>
        </div>

        <div
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold"
          style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.12)' }}
        >
          <CalendarDays className="w-3 h-3 text-blue-400" />
          <span className="text-blue-400">{todayCount} aujourd'hui</span>
        </div>
      </div>
    </header>
  );
}

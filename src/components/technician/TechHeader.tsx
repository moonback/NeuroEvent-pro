import React from 'react';
import { Settings as SettingsIcon, Wifi, WifiOff, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { triggerVibrate } from './useTechDashboard';

interface TechHeaderProps {
  userName: string;
  isOnline: boolean;
  syncCount: number;
  todayCount: number;
  activeCount: number;
}

export default function TechHeader({ userName, isOnline, syncCount, todayCount, activeCount }: TechHeaderProps) {
  return (
    <header className="tech-glass sticky top-0 z-30 px-5 pt-5 pb-4">
      {/* Top row */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ background: isOnline ? '#06c167' : '#ef4444', boxShadow: isOnline ? '0 0 8px rgba(6,193,103,0.5)' : '0 0 8px rgba(239,68,68,0.5)' }} />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--tech-text-muted)' }}>
              {isOnline ? 'En ligne' : 'Hors ligne'}
            </span>
            {syncCount > 0 && (
              <span className="text-[10px] font-extrabold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20 animate-pulse">
                {syncCount} sync
              </span>
            )}
          </div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--tech-text)' }}>
            Bonjour{userName ? `, ${userName}` : ''} 👋
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--tech-text-muted)' }}>
            Votre tableau de bord missions
          </p>
        </div>

        <Link
          to="/settings"
          onClick={() => triggerVibrate('click')}
          className="p-3 rounded-2xl transition-all active:scale-90"
          style={{ background: 'var(--tech-card)', border: '1px solid var(--tech-border)' }}
        >
          <SettingsIcon className="w-5 h-5" style={{ color: 'var(--tech-text-secondary)' }} />
        </Link>
      </div>

      {/* Stats row */}
      <div className="flex gap-3">
        <div className="flex-1 p-3 rounded-2xl" style={{ background: 'var(--tech-accent-soft)', border: '1px solid rgba(6,193,103,0.15)' }}>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-3.5 h-3.5" style={{ color: 'var(--tech-accent)' }} />
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--tech-accent)' }}>En cours</span>
          </div>
          <span className="text-2xl font-black" style={{ color: 'var(--tech-accent)' }}>{activeCount}</span>
        </div>
        <div className="flex-1 p-3 rounded-2xl" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.12)' }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Aujourd'hui</span>
          </div>
          <span className="text-2xl font-black text-blue-400">{todayCount}</span>
        </div>
      </div>
    </header>
  );
}

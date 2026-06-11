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
  const initials = userName
    ? userName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <header className="tech-glass sticky top-0 z-30 px-4 pt-4 pb-3">
      {/* Top Row */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black"
              style={{
                background: 'linear-gradient(135deg, rgba(0,229,160,0.15) 0%, rgba(77,159,255,0.15) 100%)',
                border: '1px solid rgba(0,229,160,0.20)',
                color: 'var(--tech-accent)',
              }}
            >
              {initials}
            </div>
            {/* Online dot with ping */}
            <span
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
              style={{
                background: isOnline ? 'var(--tech-accent)' : 'var(--tech-danger)',
                borderColor: 'var(--tech-bg)',
                boxShadow: isOnline
                  ? '0 0 8px rgba(0,229,160,0.6)'
                  : '0 0 8px rgba(255,77,109,0.6)',
              }}
            />
            {isOnline && (
              <span
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full"
                style={{
                  background: 'var(--tech-accent)',
                  animation: 'tech-dot-ping 2s cubic-bezier(0,0,0.2,1) infinite',
                }}
              />
            )}
          </div>

          {/* Greeting */}
          <div className="min-w-0">
            <p
              className="text-[9px] font-black uppercase tracking-widest mb-0.5"
              style={{ color: 'var(--tech-text-muted)' }}
            >
              {isOnline ? 'En ligne' : 'Hors ligne'}
              {syncCount > 0 && (
                <span
                  className="ml-2 px-1.5 py-0.5 rounded-md text-[8px] animate-pulse"
                  style={{
                    background: 'rgba(255,183,0,0.12)',
                    color: '#ffb700',
                    border: '1px solid rgba(255,183,0,0.20)',
                  }}
                >
                  {syncCount} sync
                </span>
              )}
            </p>
            <h1
              className="text-base font-black tracking-tight truncate"
              style={{ color: 'var(--tech-text)' }}
            >
              Bonjour{userName ? `, ${userName}` : ''}&nbsp;
              <span style={{ display: 'inline-block', animation: 'tech-float 2.5s ease-in-out infinite' }}>
                👋
              </span>
            </h1>
          </div>
        </div>

        {/* Settings button */}
        <button
          onClick={() => {
            triggerVibrate('click');
            onSettingsClick();
          }}
          className="p-2.5 rounded-2xl transition-all active:scale-90 cursor-pointer"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--tech-border)',
          }}
        >
          <SettingsIcon
            className="w-4.5 h-4.5"
            style={{ color: 'var(--tech-text-secondary)' }}
          />
        </button>
      </div>

      {/* Stats chips */}
      <div className="flex items-center gap-2">
        {/* Active missions */}
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-extrabold"
          style={{
            background: 'linear-gradient(135deg, rgba(0,229,160,0.10) 0%, rgba(0,229,160,0.05) 100%)',
            border: '1px solid rgba(0,229,160,0.15)',
          }}
        >
          <Zap
            className="w-3 h-3"
            style={{ color: 'var(--tech-accent)' }}
          />
          <span style={{ color: 'var(--tech-accent)' }}>{activeCount} en cours</span>
        </div>

        {/* Today missions */}
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-extrabold"
          style={{
            background: 'linear-gradient(135deg, rgba(77,159,255,0.10) 0%, rgba(77,159,255,0.05) 100%)',
            border: '1px solid rgba(77,159,255,0.15)',
          }}
        >
          <CalendarDays
            className="w-3 h-3"
            style={{ color: 'var(--tech-blue)' }}
          />
          <span style={{ color: 'var(--tech-blue)' }}>{todayCount} aujourd'hui</span>
        </div>
      </div>
    </header>
  );
}

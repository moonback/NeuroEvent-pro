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
    <header className="tech-glass sticky top-0 z-30 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-bold truncate" style={{ color: 'var(--tech-text)' }}>
            Bonjour{userName ? `, ${userName}` : ''}
          </p>
          <p className="text-[11px] font-medium text-[var(--tech-text-muted)] truncate mt-0.5">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} · {todayCount} missions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { triggerVibrate('click'); onSettingsClick(); }}
            className="p-2 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--tech-border)' }}
            aria-label="Paramètres"
          >
            <SettingsIcon className="w-4 h-4" style={{ color: 'var(--tech-text-secondary)' }} />
          </button>
        </div>
      </div>
    </header>
  );
}

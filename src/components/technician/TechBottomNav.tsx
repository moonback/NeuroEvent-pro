import React from 'react';
import { Calendar, Clock, Settings as SettingsIcon, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { triggerVibrate, type MainTab } from './useTechDashboard';

interface TechBottomNavProps {
  activeTab: MainTab;
  setActiveTab: (tab: MainTab) => void;
  hasSelectedMission: boolean;
  clearSelection: () => void;
  onSignOut: () => void;
}

export default function TechBottomNav({ activeTab, setActiveTab, hasSelectedMission, clearSelection, onSignOut }: TechBottomNavProps) {
  const items: { id: MainTab; label: string; icon: React.ElementType }[] = [
    { id: 'active', label: 'Missions', icon: Calendar },
    { id: 'mes_heures', label: 'Heures', icon: Clock },
    { id: 'disponibilites', label: 'Absences', icon: Calendar },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 pb-safe"
      style={{
        background: 'rgba(10,10,10,0.92)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderTop: '1px solid var(--tech-border)',
      }}
    >
      <div className="flex items-center h-16 max-w-md mx-auto px-2">
        {items.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id && !hasSelectedMission;
          return (
            <button
              key={item.id}
              onClick={() => {
                triggerVibrate('click');
                clearSelection();
                setActiveTab(item.id);
              }}
              className="flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-90"
            >
              <Icon
                className="w-5 h-5 mb-1 transition-colors"
                style={{ color: isActive ? 'var(--tech-accent)' : 'var(--tech-text-muted)' }}
              />
              <span
                className="text-[10px] font-extrabold transition-colors"
                style={{ color: isActive ? 'var(--tech-accent)' : 'var(--tech-text-muted)' }}
              >
                {item.label}
              </span>
              {isActive && <div className="tech-nav-dot mt-1" />}
            </button>
          );
        })}

        {/* Separator */}
        <div className="w-px h-8 mx-1" style={{ background: 'var(--tech-border)' }} />

        <Link
          to="/settings"
          onClick={() => triggerVibrate('click')}
          className="flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-90"
        >
          <SettingsIcon className="w-5 h-5 mb-1" style={{ color: 'var(--tech-text-muted)' }} />
          <span className="text-[10px] font-extrabold" style={{ color: 'var(--tech-text-muted)' }}>Profil</span>
        </Link>

        <button
          onClick={() => { triggerVibrate('click'); onSignOut(); }}
          className="flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-90"
        >
          <LogOut className="w-5 h-5 mb-1 text-red-400/60" />
          <span className="text-[10px] font-extrabold text-red-400/60">Quitter</span>
        </button>
      </div>
    </nav>
  );
}

import React from 'react';
import { Calendar, Clock, CalendarX2, Settings as SettingsIcon, LogOut } from 'lucide-react';
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
    { id: 'disponibilites', label: 'Absences', icon: CalendarX2 },
    { id: 'profil', label: 'Profil', icon: SettingsIcon },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 pb-safe"
      style={{
        background: 'rgba(8,11,18,0.94)',
        backdropFilter: 'blur(24px) saturate(200%)',
        WebkitBackdropFilter: 'blur(24px) saturate(200%)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-stretch h-[60px] max-w-md mx-auto px-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            (activeTab === item.id || (item.id === 'active' && activeTab === 'history')) &&
            !hasSelectedMission;

          return (
            <button
              key={item.id}
              onClick={() => {
                triggerVibrate('click');
                clearSelection();
                setActiveTab(item.id);
              }}
              className="relative flex flex-col items-center justify-center flex-1 gap-1 transition-all active:scale-90"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {/* Active pill indicator at top */}
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2 rounded-b-full transition-all duration-300"
                style={{
                  height: '2px',
                  width: isActive ? '24px' : '0px',
                  background: 'var(--tech-accent)',
                  boxShadow: isActive ? '0 0 8px var(--tech-accent-glow)' : 'none',
                  opacity: isActive ? 1 : 0,
                  transition: 'width 0.3s cubic-bezier(0.16,1,0.3,1), opacity 0.2s',
                }}
              />

              {/* Icon container */}
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200"
                style={{
                  background: isActive ? 'rgba(0,229,160,0.10)' : 'transparent',
                  border: isActive ? '1px solid rgba(0,229,160,0.15)' : '1px solid transparent',
                }}
              >
                <Icon
                  className="w-4.5 h-4.5 transition-all"
                  style={{
                    color: isActive ? 'var(--tech-accent)' : 'var(--tech-text-muted)',
                    filter: isActive ? 'drop-shadow(0 0 6px rgba(0,229,160,0.4))' : 'none',
                  }}
                />
              </div>

              <span
                className="text-[9px] font-black tracking-wide transition-colors"
                style={{
                  color: isActive ? 'var(--tech-accent)' : 'var(--tech-text-muted)',
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Sign out */}
        <button
          onClick={() => { triggerVibrate('click'); onSignOut(); }}
          className="relative flex flex-col items-center justify-center flex-1 gap-1 transition-all active:scale-90"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{
              background: 'rgba(255,77,109,0.06)',
              border: '1px solid rgba(255,77,109,0.10)',
            }}
          >
            <LogOut className="w-4 h-4" style={{ color: 'rgba(255,77,109,0.5)' }} />
          </div>
          <span className="text-[9px] font-black tracking-wide" style={{ color: 'rgba(255,77,109,0.5)' }}>
            Quitter
          </span>
        </button>
      </div>
    </nav>
  );
}

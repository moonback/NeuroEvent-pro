import React from 'react';
import { format } from 'date-fns';
import { MapPin, Users, Truck, Clock, CheckCircle2 } from 'lucide-react';

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
  
  const statusColors = {
    'Planifiée': { bg: 'rgba(77,159,255,0.1)', border: '1px solid rgba(77,159,255,0.2)', text: 'var(--tech-blue)', dot: 'var(--tech-blue)' },
    'En cours': { bg: 'rgba(255,183,0,0.1)', border: '1px solid rgba(255,183,0,0.2)', text: '#ffb700', dot: '#ffb700' },
    'Terminée': { bg: 'rgba(0,229,160,0.1)', border: '1px solid rgba(0,229,160,0.2)', text: 'var(--tech-accent)', dot: 'var(--tech-accent)' },
  };
  
  const statusConfig = statusColors[mission.status as keyof typeof statusColors] || statusColors['Planifiée'];

  return (
    <>
      <div className="max-w-md mx-auto px-4 pt-2">
        <div 
          className={`tech-card p-4 mb-2 rounded-2xl overflow-hidden border transition-all ${mission.status === 'En cours' ? 'tech-glow' : ''}`} 
          style={{ 
            border: statusConfig.border,
            boxShadow: mission.status === 'En cours' ? `0 0 20px ${mission.status === 'En cours' ? 'rgba(255,183,0,0.2)' : 'transparent'}` : '0 4px 20px rgba(0,0,0,0.3)',
          }}
        >
          {/* Left color bar */}
          <div 
            className="absolute left-0 top-0 bottom-0 w-1 z-10"
            style={{ background: `linear-gradient(180deg, ${statusConfig.text} 0%, ${statusConfig.text}44 100%)` }}
          />
          
          {/* Content */}
          <div className="relative z-5 pl-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0 flex-1">
                <p className="text-[9px] uppercase tracking-widest font-black mb-0.5" style={{ color: 'var(--tech-text-muted)' }}>Mission Active</p>
                <h2 className="text-lg font-black truncate" style={{ color: 'var(--tech-text)' }}>{mission.title}</h2>
                <p className="text-xs font-semibold truncate mt-1" style={{ color: 'var(--tech-text-secondary)' }}>{mission.client}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span 
                  className={`${badgeClass} text-xs font-black px-3 py-1.5 rounded-full flex items-center gap-1.5`}
                  style={{ background: statusConfig.bg, border: statusConfig.border, color: statusConfig.text }}
                >
                  <span 
                    className="w-2 h-2 rounded-full" 
                    style={{ background: statusConfig.dot }}
                  />
                  {mission.status}
                </span>
                <span className="text-xs font-black" style={{ color: 'var(--tech-text-secondary)' }}>
                  {format(new Date(mission.start), 'HH:mm')}
                </span>
              </div>
            </div>

            {/* Info badges */}
            <div className="flex flex-wrap gap-2 mb-3">
              <div 
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold"
                style={{ 
                  background: `${mission.color}0f`,
                  border: `1px solid ${mission.color}1a`,
                  color: mission.color,
                }}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span className="line-clamp-1">{mission.address}</span>
              </div>
            </div>

            {/* Location & Details */}
            <div className="flex flex-wrap gap-2 mb-3">
              {truckName && (
                <div 
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold"
                  style={{ 
                    background: `${mission.color}0f`,
                    border: `1px solid ${mission.color}1a`,
                    color: mission.color,
                  }}
                >
                  <Truck className="w-3 h-3" />
                  {truckName}
                </div>
              )}
              {colleagues.length > 0 && (
                <div 
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold"
                  style={{ 
                    background: `${mission.color}0f`,
                    border: `1px solid ${mission.color}1a`,
                    color: mission.color,
                  }}
                >
                  <Users className="w-3 h-3" />
                  {colleagues.length} pers.
                </div>
              )}
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold" style={{ color: 'var(--tech-text-secondary)' }}>Matériel scanné</span>
                <span 
                  className="text-xs font-black" 
                  style={{ color: progress.percent === 100 ? 'var(--tech-accent)' : mission.color }}
                >
                  {progress.percent}% ({progress.pointed}/{progress.total})
                </span>
              </div>
              <div className="tech-progress-track bg-[rgba(255,255,255,0.06)] h-2 rounded-full overflow-hidden">
                <div 
                  className="tech-progress-fill rounded-full transition-all duration-300" 
                  style={{ 
                    width: `${progress.percent}%`,
                    background: progress.percent === 100 ? 'var(--tech-accent)' : mission.color,
                    boxShadow: `0 0 8px ${progress.percent === 100 ? 'rgba(0,229,160,0.4)' : mission.color}40`,
                  }} 
                />
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
            className="w-full py-3 rounded-xl tech-btn-accent text-black font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
            style={{ boxShadow: '0 6px 24px rgba(0,229,160,0.2)', minHeight: 48 }}
          >
            <CheckCircle2 className="w-5 h-5" />
            {primaryLabel}
          </button>
        </div>
      </div>
    </>
  );
}

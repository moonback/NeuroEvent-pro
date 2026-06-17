import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Truck as TruckIcon, Clock, CheckCircle2, FileText, ChevronRight, Navigation } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { triggerVibrate } from '../useTechDashboard';
import { useAuthStore } from '../../../store/auth';
import { useStore } from '../../../store';
import { InfoCard, CardHeader } from './InfoCard';

interface GeneralTabProps {
  mission: any;
  getTruckName: (id?: string) => string;
  getEquipmentProgress: (eqs: any[]) => { total: number; pointed: number; percent: number };
  setDrawerTab: (t: any) => void;
  handleTimeChange: (field: 'start' | 'end', time: string) => void;
  onStatusChange: (mission: any, s: 'Planifiée' | 'En cours' | 'Terminée') => void;
  isLocked: boolean;
}

export default function GeneralTab({
  mission,
  getTruckName,
  getEquipmentProgress,
  setDrawerTab,
  handleTimeChange,
  onStatusChange,
  isLocked,
}: GeneralTabProps) {
  const prog = getEquipmentProgress(mission.equipments);
  const user = useAuthStore(state => state.user);
  const role = useAuthStore(state => state.role);
  const technicians = useStore(state => state.technicians);
  const currentTech = technicians.find(t => t.id === user?.id);
  const isChecklistEnabled = currentTech?.checklistEnabled ?? false;
  const isTechnician = role === 'Technicien';
  const locked = isLocked || mission.status === 'Terminée';

  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (user?.id && mission.id) {
      const saved = localStorage.getItem(`eventflow_checklist_${user.id}_${mission.id}`);
      if (saved) {
        try {
          setCheckedItems(JSON.parse(saved));
        } catch {}
      }
    }
  }, [user?.id, mission.id]);

  const totalChecklist = 15;
  const checkedChecklist = Object.values(checkedItems).filter(Boolean).length;
  const checklistPercent = totalChecklist > 0 ? Math.round((checkedChecklist / totalChecklist) * 100) : 0;

  return (
    <div className="space-y-3 tech-stagger">
      {/* ── Schedule ── */}
      <InfoCard>
        <CardHeader
          icon={<Calendar className="w-3.5 h-3.5" style={{ color: mission.color }} />}
          label="Planification"
        />
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Start */}
            <div
              className="p-3 rounded-xl space-y-1"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--tech-border)' }}
            >
              <div className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--tech-text-muted)' }}>Début Event</div>
              <div className="font-bold text-xs capitalize" style={{ color: 'var(--tech-text)' }}>
                {format(mission.start, 'EEE d MMM', { locale: fr })}
              </div>
              <input
                type="time"
                value={format(mission.start, 'HH:mm')}
                onChange={(e) => handleTimeChange('start', e.target.value)}
                className="text-sm font-black bg-transparent outline-none cursor-pointer w-full focus:ring-1 focus:ring-white/10 rounded-sm"
                style={{ color: mission.color }}
                disabled={isTechnician || locked}
                aria-disabled={isTechnician || locked}
                aria-label="Heure de début"
              />
            </div>
            {/* End */}
            <div
              className="p-3 rounded-xl space-y-1"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--tech-border)' }}
            >
              <div className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--tech-text-muted)' }}>Fin Event</div>
              <div className="font-bold text-xs capitalize" style={{ color: 'var(--tech-text)' }}>
                {format(mission.end, 'EEE d MMM', { locale: fr })}
              </div>
              <input
                type="time"
                value={format(mission.end, 'HH:mm')}
                onChange={(e) => handleTimeChange('end', e.target.value)}
                className="text-sm font-black bg-transparent outline-none cursor-pointer w-full focus:ring-1 focus:ring-white/10 rounded-sm"
                style={{ color: mission.color }}
                disabled={isTechnician || locked}
                aria-disabled={isTechnician || locked}
                aria-label="Heure de fin"
              />
            </div>
          </div>
        </div>
      </InfoCard>

      {/* ── Logistique (Livraison, Installation, Reprise) ── */}
      {(mission.deliveryDate || mission.pickupDate || (mission.setupDuration !== undefined && mission.setupDuration !== null)) && (
        <InfoCard>
          <CardHeader
            icon={<Clock className="w-3.5 h-3.5" style={{ color: mission.color }} />}
            label="Logistique & Horaires"
          />
          <div className="p-4 space-y-3.5">
            <div className="grid grid-cols-1 gap-3">
              {/* Delivery */}
              {mission.deliveryDate && (
                <div className="flex justify-between items-center p-2.5 rounded-xl border border-white/[0.03] bg-white/[0.01]">
                  <div>
                    <div className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--tech-text-muted)' }}>Livraison</div>
                    <div className="text-xs font-semibold mt-0.5" style={{ color: 'var(--tech-text-secondary)' }}>
                      {format(new Date(mission.deliveryDate), 'EEEE d MMMM', { locale: fr })}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-white bg-white/[0.05] px-2.5 py-1 rounded-lg">
                      {format(new Date(mission.deliveryDate), 'HH:mm')}
                    </span>
                  </div>
                </div>
              )}

              {/* Setup Duration */}
              {mission.setupDuration !== undefined && mission.setupDuration !== null && (
                <div className="flex justify-between items-center p-2.5 rounded-xl border border-white/[0.03] bg-white/[0.01]">
                  <div>
                    <div className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--tech-text-muted)' }}>Installation</div>
                    <div className="text-xs font-semibold mt-0.5" style={{ color: 'var(--tech-text-secondary)' }}>
                      Temps estimé de montage
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black" style={{ color: mission.color }}>
                      {mission.setupDuration >= 60
                        ? `${Math.floor(mission.setupDuration / 60)}h${String(mission.setupDuration % 60).padStart(2, '0')}`
                        : `${mission.setupDuration} min`}
                    </span>
                  </div>
                </div>
              )}

              {/* Pickup */}
              {mission.pickupDate && (
                <div className="flex justify-between items-center p-2.5 rounded-xl border border-white/[0.03] bg-white/[0.01]">
                  <div>
                    <div className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--tech-text-muted)' }}>Reprise</div>
                    <div className="text-xs font-semibold mt-0.5" style={{ color: 'var(--tech-text-secondary)' }}>
                      {format(new Date(mission.pickupDate), 'EEEE d MMMM', { locale: fr })}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-white bg-white/[0.05] px-2.5 py-1 rounded-lg">
                      {format(new Date(mission.pickupDate), 'HH:mm')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </InfoCard>
      )}

      {/* ── Location ── */}
      <InfoCard>
        <CardHeader
          icon={<MapPin className="w-3.5 h-3.5" style={{ color: mission.color }} />}
          label="Lieu de rendez-vous"
        />
        <div className="p-4 space-y-3">
          <p className="font-bold text-sm leading-snug" style={{ color: 'var(--tech-text)' }}>{mission.address}</p>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mission.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => triggerVibrate('click')}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-extrabold text-white transition-all active:scale-[0.97]"
            style={{
              background: `linear-gradient(135deg, ${mission.color} 0%, ${mission.color}aa 100%)`,
              boxShadow: `0 4px 16px ${mission.color}30`,
            }}
          >
            <Navigation className="w-3.5 h-3.5" />
            Itinéraire Google Maps
          </a>
        </div>
      </InfoCard>

      {/* ── Actions rapides ── */}
      <InfoCard>
        <CardHeader
          icon={<Clock className="w-3.5 h-3.5" style={{ color: mission.color }} />}
          label="Actions rapides"
        />
        <div className="p-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              triggerVibrate('click');
              if (mission.status === 'Planifiée') {
                onStatusChange(mission, 'En cours');
              } else if (mission.status === 'En cours') {
                onStatusChange(mission, 'Terminée');
              }
            }}
            disabled={mission.status === 'Terminée'}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl py-3 text-xs font-black uppercase tracking-wider transition-all active:scale-[0.97]"
            style={{
              background: mission.status === 'Terminée' ? 'rgba(255,255,255,0.06)' : mission.color,
              color: '#fff',
              opacity: mission.status === 'Terminée' ? 0.6 : 1,
            }}
          >
            <CheckCircle2 className="w-4 h-4" />
            {mission.status === 'Planifiée' ? 'Démarrer' : mission.status === 'En cours' ? 'Terminer' : 'Terminée'}
          </button>

          <button
            type="button"
            onClick={() => {
              triggerVibrate('click');
              setDrawerTab('report');
            }}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl py-3 text-xs font-black uppercase tracking-wider transition-all active:scale-[0.97]"
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: 'var(--tech-text)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <FileText className="w-4 h-4" />
            Rapport
          </button>
        </div>
      </InfoCard>

      {/* ── Truck ── */}
      {mission.truckId && (
        <InfoCard>
          <CardHeader
            icon={<TruckIcon className="w-3.5 h-3.5" style={{ color: mission.color }} />}
            label="Véhicule assigné"
          />
          <div className="p-4 flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: `${mission.color}18`, border: `1px solid ${mission.color}25` }}
            >
              <TruckIcon className="w-5 h-5" style={{ color: mission.color }} />
            </div>
            <div>
              <div className="font-extrabold text-sm" style={{ color: 'var(--tech-text)' }}>{getTruckName(mission.truckId)}</div>
              <div className="text-xs font-medium mt-0.5" style={{ color: 'var(--tech-text-muted)' }}>Véhicule de la mission</div>
            </div>
          </div>
        </InfoCard>
      )}

      {/* ── Equipment shortcut ── */}
      {mission.equipments?.length > 0 && (
        <button
          type="button"
          onClick={() => {
            triggerVibrate('click');
            setDrawerTab('equipment');
          }}
          className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all active:scale-[0.97] text-left focus:outline-none focus:ring-2 focus:ring-offset-2"
          style={{
            border: `1px solid ${mission.color}28`,
            background: `${mission.color}0a`,
          }}
          aria-label={`Pointage matériel : ${prog.pointed} sur ${prog.total} chargés`}
        >
          {/* Circular progress */}
          <div className="relative w-12 h-12 shrink-0">
            <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
              <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15" fill="none"
                stroke={prog.percent === 100 ? 'var(--tech-accent)' : mission.color}
                strokeWidth="3"
                strokeDasharray={`${prog.percent * 0.942} 100`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.6s cubic-bezier(0.16,1,0.3,1)' }}
              />
            </svg>
            <span
              className="absolute inset-0 flex items-center justify-center text-[10px] font-black"
              style={{ color: prog.percent === 100 ? 'var(--tech-accent)' : mission.color }}
            >
              {prog.percent}%
            </span>
          </div>
          <div className="flex-1">
            <div className="font-extrabold text-sm" style={{ color: 'var(--tech-text)' }}>Pointage matériel</div>
            <div className="text-xs font-semibold mt-0.5" style={{ color: 'var(--tech-text-muted)' }}>
              {prog.pointed} / {prog.total} éléments chargés
            </div>
            {prog.percent === 100 && (
              <div className="flex items-center gap-1 mt-1 text-[9px] font-black" style={{ color: 'var(--tech-accent)' }}>
                <CheckCircle2 className="w-3 h-3" /> Complet
              </div>
            )}
          </div>
          <ChevronRight className="w-4 h-4 shrink-0" style={{ color: 'var(--tech-text-muted)' }} />
        </button>
      )}

      {/* ── Checklist shortcut ── */}
      {isChecklistEnabled && (
        <button
          type="button"
          onClick={() => {
            triggerVibrate('click');
            setDrawerTab('checklist');
          }}
          className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all active:scale-[0.97] text-left focus:outline-none focus:ring-2 focus:ring-offset-2"
          style={{
            border: `1px solid ${mission.color}28`,
            background: `${mission.color}0a`,
          }}
          aria-label={`Checklist : ${checkedChecklist} sur ${totalChecklist} validés`}
        >
          {/* Circular progress */}
          <div className="relative w-12 h-12 shrink-0">
            <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
              <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15" fill="none"
                stroke={checklistPercent === 100 ? 'var(--tech-accent)' : mission.color}
                strokeWidth="3"
                strokeDasharray={`${checklistPercent * 0.942} 100`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.6s cubic-bezier(0.16,1,0.3,1)' }}
              />
            </svg>
            <span
              className="absolute inset-0 flex items-center justify-center text-[10px] font-black"
              style={{ color: checklistPercent === 100 ? 'var(--tech-accent)' : mission.color }}
            >
              {checklistPercent}%
            </span>
          </div>
          <div className="flex-1">
            <div className="font-extrabold text-sm" style={{ color: 'var(--tech-text)' }}>Checklist de mission</div>
            <div className="text-xs font-semibold mt-0.5" style={{ color: 'var(--tech-text-muted)' }}>
              {checkedChecklist} / {totalChecklist} étapes validées
            </div>
            {checklistPercent === 100 && (
              <div className="flex items-center gap-1 mt-1 text-[9px] font-black" style={{ color: 'var(--tech-accent)' }}>
                <CheckCircle2 className="w-3 h-3" /> Complet
              </div>
            )}
          </div>
          <ChevronRight className="w-4 h-4 shrink-0" style={{ color: 'var(--tech-text-muted)' }} />
        </button>
      )}
    </div>
  );
}

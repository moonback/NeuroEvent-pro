import React from 'react';
import {
  X, Check, Clock, MapPin, Info, Phone, Users, QrCode, FileText, Timer,
  Sparkles, ClipboardCheck, Truck, Wrench, Camera, Lock
} from 'lucide-react';
import { format, isSameDay, differenceInMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import { triggerVibrate, type DrawerTab } from './useTechDashboard';
import DrawerTabs from './DrawerTabs';
import TechFAB from './TechFAB';
import { useStore } from '../../store';
import { useAuthStore } from '../../store/auth';
import type { Client } from '../../types';

interface MissionDrawerProps {
  mission: any;
  drawerTab: DrawerTab;
  setDrawerTab: (t: DrawerTab) => void;
  onClose: () => void;
  onStatusChange: (mission: any, s: 'Planifiée' | 'En cours' | 'Terminée') => void;
  onOpenSignature: () => void;
  dragOffsetY: number;
  isDragging: boolean;
  handleDragStart: (e: React.TouchEvent) => void;
  handleDragMove: (e: React.TouchEvent) => void;
  handleDragEnd: () => void;
  handleContentTouchStart: (e: React.TouchEvent) => void;
  handleContentTouchEnd: (e: React.TouchEvent) => void;
  getTruckName: (id?: string) => string;
  getColleaguesDetailed: (ids: string[]) => any[];
  getClientInfo: (id?: string) => any;
  getEquipmentProgress: (eqs: any[]) => any;
  equipmentDefs: any[];
  handleTimeChange: (field: 'start' | 'end', time: string) => void;
  handleToggle: (missionId: string, equipmentId: string) => void;
  openScanner: () => void;
  scannedItemId: string | null;
  localReports: Record<string, string>;
  savingStatus: 'idle' | 'saving' | 'saved';
  handleReportChange: (missionId: string, value: string) => void;
  photoUploading: { missionId: string; type: 'before' | 'after' } | null;
  handlePhotoUpload: (missionId: string, type: 'before' | 'after', file: File) => Promise<void>;
  handlePhotoDelete: (missionId: string, photoId: string) => Promise<void> | void;
}

const TAB_CONFIG: { id: DrawerTab; label: string; icon: React.ElementType }[] = [
  { id: 'general', label: 'Infos', icon: Info },
  { id: 'client', label: 'Client', icon: Phone },
  { id: 'team', label: 'Équipe', icon: Users },
  { id: 'equipment', label: 'Matériel', icon: QrCode },
  { id: 'photos', label: 'Photos', icon: Camera },
  { id: 'hours', label: 'Heures', icon: Timer },
  { id: 'checklist', label: 'Checklist', icon: ClipboardCheck },
  { id: 'report', label: 'Rapport', icon: FileText },
];

const STATUS_STEPS = [
  { key: 'Planifiée', label: 'Planifiée', short: 'Prévu' },
  { key: 'En cours', label: 'En cours', short: 'Actif' },
  { key: 'Terminée', label: 'Terminée', short: 'Fini' },
] as const;

export default function MissionDrawer(props: MissionDrawerProps) {
  const { mission, drawerTab, setDrawerTab, onClose, onStatusChange, onOpenSignature } = props;
  const isToday = isSameDay(mission.start, new Date());
  const durationMins = differenceInMinutes(mission.end, mission.start);
  const durationLabel = durationMins >= 60
    ? `${Math.floor(durationMins / 60)}h${String(durationMins % 60).padStart(2, '0')}`
    : `${durationMins}min`;

  const user = useAuthStore(state => state.user);
  const technicians = useStore(state => state.technicians);
  const currentTech = technicians.find(t => t.id === user?.id);
  const isChecklistEnabled = currentTech?.checklistEnabled ?? false;

  const stepIndex = STATUS_STEPS.findIndex(s => s.key === mission.status);
  const activeTabs = TAB_CONFIG.filter(
    t => (t.id !== 'checklist' || isChecklistEnabled) && (t.id !== 'hours' || mission.status === 'En cours')
  );

  const selectedClient: Client | null = props.getClientInfo(mission.clientId) ?? null;
  const isLocked = mission.status === 'En cours';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0"
        style={{
          background: 'rgba(0,0,0,0.75)',
          WebkitBackdropFilter: 'blur(6px)',
          backdropFilter: 'blur(6px)',
          cursor: isLocked ? 'default' : 'pointer',
        }}
        onClick={() => {
          if (isLocked) {
            triggerVibrate('error');
            return;
          }
          triggerVibrate('click');
          onClose();
        }}
      />

      <div
        className="w-full max-w-md flex flex-col z-10 overflow-hidden"
        style={{
          height: '92dvh',
          maxHeight: '92dvh',
          background: '#000000',
          borderRadius: '1.75rem 1.75rem 0 0',
          boxShadow: '0 -12px 60px rgba(0,0,0,0.7), 0 -1px 0 rgba(255,255,255,0.06)',
          transform: `translateY(${props.dragOffsetY}px)`,
          transition: props.isDragging ? 'none' : 'transform 0.32s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.32s ease',
        }}
      >
        <div
          onTouchStart={isLocked ? undefined : props.handleDragStart}
          onTouchMove={isLocked ? undefined : props.handleDragMove}
          onTouchEnd={isLocked ? undefined : props.handleDragEnd}
          className="w-full pt-3 pb-2 flex justify-center select-none shrink-0"
          style={{ cursor: isLocked ? 'default' : 'grab' }}
        >
          <div
            className="w-10 h-1 rounded-full"
            style={{ background: isLocked ? 'rgba(255,183,0,0.55)' : 'rgba(255,255,255,0.18)' }}
          />
        </div>

        <div className="relative shrink-0 mx-3 rounded-2xl overflow-hidden">
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(140deg, ${mission.color}dd 0%, ${mission.color}88 100%)` }}
          />
          <div
            className="absolute -top-10 -right-10 w-44 h-44 rounded-full opacity-30 pointer-events-none"
            style={{ background: 'rgba(255,255,255,0.35)', filter: 'blur(34px)' }}
          />
          <div
            className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full opacity-20 pointer-events-none"
            style={{ background: 'rgba(0,0,0,0.55)', filter: 'blur(22px)' }}
          />

          {!isLocked && (
            <button
              onClick={() => {
                triggerVibrate('click');
                onClose();
              }}
              className="absolute top-3 right-3 h-9 px-2.5 rounded-full transition-all active:scale-90 z-30 cursor-pointer"
              style={{ background: 'rgba(0,0,0,0.28)' }}
              aria-label="Fermer le detail de mission"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          )}

          {isLocked && (
            <div
              className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-2 rounded-full z-30"
              style={{ background: 'rgba(0,0,0,0.28)', border: '1px solid rgba(255,183,0,0.4)' }}
              title="Mission en cours — terminez-la pour continuer"
            >
              <span className="w-2 h-2 rounded-full" style={{ background: '#ffb700', boxShadow: '0 0 8px #ffb700' }} />
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#ffb700' }}>
                Verrouillé
              </span>
            </div>
          )}

          <div className="relative z-10 text-white p-4">
            <h2 className="text-[17px] font-black leading-tight truncate">{mission.title}</h2>
            <p className="text-[11px] font-semibold opacity-90 truncate mt-0.5">{mission.client}</p>

            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1 text-[11px] font-semibold opacity-90 truncate">{mission.type} · {durationLabel}</div>
              {isToday && (
                <span className="shrink-0 text-[9px] font-black px-2 py-1 rounded-md bg-white text-black uppercase tracking-wider">
                  Aujourd'hui
                </span>
              )}
            </div>
          </div>

          <div className="relative z-10 px-3 pb-3">
            <div className="flex items-center gap-1.5 rounded-xl p-1 bg-black/15">
              {STATUS_STEPS.map((step, i) => {
                const isDone = i < stepIndex;
                const isActive = i === stepIndex;
                const locked = mission.status === 'Terminée';

                return (
                  <React.Fragment key={step.key}>
                    <button
                      type="button"
                      onClick={() => {
                        if (locked) {
                          triggerVibrate('error');
                          return;
                        }
                        onStatusChange(mission, step.key);
                      }}
                      className={`flex-1 min-w-0 flex items-center justify-center gap-1.5 py-2.5 rounded-lg transition-all ${locked ? 'opacity-55 cursor-not-allowed' : 'cursor-pointer active:scale-[0.97]'}`}
                      style={{ background: isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.06)' }}
                    >
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black transition-all"
                        style={{
                          background: isActive ? mission.color : isDone ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.15)',
                          color: isActive ? '#fff' : 'rgba(255,255,255,0.92)',
                        }}
                      >
                        {isDone ? <Check className="w-3 h-3" /> : i + 1}
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-wider truncate" style={{ color: isActive ? 'rgba(0,0,0,0.82)' : 'rgba(255,255,255,0.92)' }}>
                        {step.short}
                      </span>
                    </button>

                    {i < STATUS_STEPS.length - 1 && (
                      <div className="w-1.5 h-px shrink-0" style={{ background: 'rgba(255,255,255,0.18)' }} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>

        {isLocked && (
          <div
            className="mx-3 mt-2 px-3 py-2 rounded-xl flex items-center gap-2.5 shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(255,183,0,0.14) 0%, rgba(255,183,0,0.05) 100%)',
              border: '1px solid rgba(255,183,0,0.35)',
            }}
            role="alert"
            aria-live="polite"
          >
            <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(255,183,0,0.18)', border: '1px solid rgba(255,183,0,0.35)' }}>
              <Lock className="w-3.5 h-3.5" style={{ color: '#ffb700' }} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#ffb700' }}>Mission en cours</p>
              <p className="text-[11px] font-semibold leading-snug mt-0.5" style={{ color: 'var(--tech-text-secondary)' }}>
                Terminez cette mission pour retrouver la navigation.
              </p>
            </div>
          </div>
        )}

        <div
          className="px-2 py-2 flex justify-between items-center shrink-0 select-none no-scrollbar w-full"
          style={{ background: '#000000', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          {activeTabs.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = drawerTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  triggerVibrate('click');
                  setDrawerTab(tab.id);
                }}
                className="flex flex-col items-center justify-center gap-1 flex-1 min-w-0 cursor-pointer transition-all active:scale-[0.97]"
                style={{ color: isActive ? 'var(--tech-text)' : 'var(--tech-text-muted)' }}
              >
                <span
                  className="flex items-center justify-center rounded-full transition-all"
                  style={{
                    width: '2.5rem',
                    height: '1.75rem',
                    background: isActive ? `${mission.color}18` : 'transparent',
                    border: isActive ? `1px solid ${mission.color}30` : '1px solid transparent',
                    color: isActive ? mission.color : 'inherit',
                  }}
                >
                  <TabIcon className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-center truncate w-full">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar" style={{ background: 'var(--tech-bg)' }}>
          <div key={String(drawerTab)} className="p-4">
            <DrawerTabs
              mission={mission}
              drawerTab={drawerTab}
              setDrawerTab={setDrawerTab}
              getTruckName={props.getTruckName}
              getColleaguesDetailed={props.getColleaguesDetailed}
              getClientInfo={props.getClientInfo}
              getEquipmentProgress={props.getEquipmentProgress}
              equipmentDefs={props.equipmentDefs}
              handleTimeChange={props.handleTimeChange}
              handleToggle={props.handleToggle}
              onStatusChange={props.onStatusChange}
              openScanner={props.openScanner}
              onOpenSignature={props.onOpenSignature}
              scannedItemId={props.scannedItemId}
              localReports={props.localReports}
              savingStatus={props.savingStatus}
              handleReportChange={props.handleReportChange}
              photoUploading={props.photoUploading}
              handlePhotoUpload={props.handlePhotoUpload}
              handlePhotoDelete={props.handlePhotoDelete}
              isLocked={isLocked}
            />
          </div>
        </div>

        <div className="h-2 shrink-0" style={{ background: 'var(--tech-bg)' }} />

        {mission.status === 'En cours' && (
          <TechFAB
            selectedMission={mission}
            selectedClient={selectedClient}
            onOpenScanner={props.openScanner}
            onOpenSignature={onOpenSignature}
            onTerminateMission={() => onStatusChange(mission, 'Terminée')}
          />
        )}
      </div>
    </div>
  );
}

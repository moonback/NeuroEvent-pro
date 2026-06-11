import React from 'react';
import {
  X, Check, Clock, MapPin, Info, Phone, Users, QrCode, FileText, Timer, PenTool,
  Sparkles, ClipboardCheck
} from 'lucide-react';
import { format, isSameDay, differenceInMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import { triggerVibrate, DRAWER_TABS, type DrawerTab } from './useTechDashboard';
import DrawerTabs from './DrawerTabs';
import { useStore } from '../../store';
import { useAuthStore } from '../../store/auth';

interface MissionDrawerProps {
  mission: any;
  drawerTab: DrawerTab;
  setDrawerTab: (t: DrawerTab) => void;
  onClose: () => void;
  onStatusChange: (s: 'Planifiée' | 'En cours' | 'Terminée') => void;
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
  const activeTabs = TAB_CONFIG.filter(t => t.id !== 'checklist' || isChecklistEnabled);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
        onClick={() => { triggerVibrate('click'); onClose(); }}
      />

      {/* Bottom sheet */}
      <div
        className="w-full max-w-md flex flex-col z-10 overflow-hidden tech-animate-slide-up"
        style={{
          height: '92dvh',
          background: '#000000',
          borderRadius: '1.75rem 1.75rem 0 0',
          boxShadow: '0 -12px 60px rgba(0,0,0,0.7), 0 -1px 0 rgba(255,255,255,0.06)',
          transform: `translateY(${props.dragOffsetY}px)`,
          transition: props.isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* ── Drag handle ── */}
        <div
          onTouchStart={props.handleDragStart}
          onTouchMove={props.handleDragMove}
          onTouchEnd={props.handleDragEnd}
          className="w-full pt-3 pb-2 flex justify-center cursor-grab select-none shrink-0"
        >
          <div className="w-10 h-[3px] rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
        </div>

        {/* ── Hero Header ── */}
        <div
          className="relative shrink-0 mx-3 mb-0 rounded-2xl overflow-hidden"
          style={{
            background: `linear-gradient(140deg, ${mission.color}dd 0%, ${mission.color}88 100%)`,
          }}
        >
          {/* Mesh glow orbs */}
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-30 pointer-events-none"
            style={{ background: 'rgba(255,255,255,0.3)', filter: 'blur(32px)' }} />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full opacity-20 pointer-events-none"
            style={{ background: 'rgba(0,0,0,0.5)', filter: 'blur(20px)' }} />

          {/* Close button */}
          <button
            onClick={() => { triggerVibrate('click'); onClose(); }}
            className="absolute top-3 right-3 p-1.5 rounded-full transition-all active:scale-90 z-30 cursor-pointer"
            style={{ background: 'rgba(0,0,0,0.25)' }}
          >
            <X className="w-3.5 h-3.5 text-white" />
          </button>

          <div className="px-4 pt-3.5 pb-4 relative z-10">
            {/* Tags */}
            <div className="flex items-center gap-1.5 mb-2">
              <span
                className="text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider"
                style={{ background: 'rgba(0,0,0,0.22)', color: '#fff' }}
              >
                {mission.type}
              </span>
              {isToday && (
                <span
                  className="text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider"
                  style={{ background: 'rgba(255,255,255,0.9)', color: mission.color }}
                >
                  Aujourd'hui
                </span>

              )}
              <span
                className="text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider"
                style={{ background: 'rgba(0,0,0,0.22)', color: '#fff' }}
              >
                {durationLabel}
              </span>

            </div>

            {/* Title + signature */}
            <div className="flex justify-between items-start gap-3 mb-2.5">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-black text-white leading-tight truncate">{mission.title}</h2>
                <p className="text-[11px] font-semibold mt-0.5" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  {mission.client}
                </p>
              </div>
              {/* Signature pill */}
              <button
                onClick={mission.signatureUrl ? undefined : onOpenSignature}
                disabled={!!mission.signatureUrl}
                className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all ${mission.signatureUrl ? 'cursor-not-allowed' : 'active:scale-95 cursor-pointer'
                  }`}
                style={{
                  background: mission.signatureUrl ? 'rgba(0,229,160,0.25)' : 'rgba(0,0,0,0.22)',
                  border: mission.signatureUrl ? '1px solid rgba(0,229,160,0.35)' : '1px solid rgba(255,255,255,0.15)',
                }}
                title={mission.signatureUrl ? 'Signature enregistrée' : 'Gérer la signature'}
              >
                <PenTool className="w-3.5 h-3.5" style={{ color: mission.signatureUrl ? '#86efac' : '#fff' }} />
                <span className="text-[9px] font-black" style={{ color: mission.signatureUrl ? '#86efac' : '#fff' }}>
                  {mission.signatureUrl ? 'Signé ✓' : 'Signature'}
                </span>
              </button>
            </div>

            {/* Date & location row */}
            <div className="space-y-1 mb-3">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>
                <Clock className="w-3 h-3 shrink-0" />
                <span>{format(mission.start, 'EEEE d MMM · HH:mm', { locale: fr })} → {format(mission.end, 'HH:mm')}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="line-clamp-1">{mission.address}</span>
              </div>
            </div>

            {/* ── Status stepper ── */}
            <div
              className="flex items-center p-2.5 rounded-xl gap-2"
              style={{ background: 'rgba(0,0,0,0.22)' }}
            >
              {STATUS_STEPS.map((step, i) => {
                const isDone = i < stepIndex;
                const isActive = i === stepIndex;
                const isFuture = i > stepIndex;
                const locked = mission.status === 'Terminée';

                return (
                  <React.Fragment key={step.key}>
                    <button
                      onClick={() => {
                        if (locked) { triggerVibrate('error'); return; }
                        onStatusChange(step.key as any);
                      }}
                      className={`flex flex-col items-center gap-1 flex-1 transition-all ${locked ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-105 active:scale-95'
                        }`}
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black transition-all"
                        style={{
                          background: isActive
                            ? '#fff'
                            : isDone
                              ? 'rgba(255,255,255,0.35)'
                              : 'rgba(255,255,255,0.12)',
                          color: isActive ? mission.color : isDone ? '#fff' : 'rgba(255,255,255,0.45)',
                          boxShadow: isActive ? `0 0 16px rgba(255,255,255,0.4)` : 'none',
                          transform: isActive ? 'scale(1.1)' : 'scale(1)',
                        }}
                      >
                        {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : i + 1}
                      </div>
                      <span
                        className="text-[9px] font-bold whitespace-nowrap"
                        style={{ color: isActive || isDone ? '#fff' : 'rgba(255,255,255,0.45)' }}
                      >
                        {step.short}
                      </span>
                    </button>

                    {i < STATUS_STEPS.length - 1 && (
                      <div
                        className="h-px flex-1 rounded"
                        style={{ background: isDone ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.18)' }}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Tab Bar ── */}
        <div
          className="px-2 py-2 flex justify-between items-center shrink-0 select-none no-scrollbar w-full"
          style={{ background: '#000000', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          {activeTabs.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = drawerTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { triggerVibrate('click'); setDrawerTab(tab.id); }}
                className="flex flex-col items-center justify-center gap-1 flex-1 min-w-0 cursor-pointer transition-all active:scale-95"
              >
                {/* Active/Inactive Capsule container for icon */}
                <div
                  className="w-10 h-7 rounded-full flex items-center justify-center transition-all"
                  style={
                    isActive
                      ? {
                        background: `${mission.color}18`,
                        border: `1px solid ${mission.color}30`,
                        color: mission.color,
                        boxShadow: `0 0 10px ${mission.color}15`,
                      }
                      : {
                        background: 'transparent',
                        border: '1px solid transparent',
                        color: 'var(--tech-text-muted)',
                      }
                  }
                >
                  <TabIcon className="w-4 h-4" />
                </div>
                {/* Clear label text */}
                <span
                  className="text-[8px] font-black uppercase tracking-wider text-center truncate w-full"
                  style={{
                    color: isActive ? 'var(--tech-text)' : 'var(--tech-text-muted)',
                    transition: 'color 0.2s',
                  }}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Scrollable Content ── */}
        <div
          onTouchStart={props.handleContentTouchStart}
          onTouchEnd={props.handleContentTouchEnd}
          className="flex-1 overflow-y-auto no-scrollbar"
          style={{ background: 'var(--tech-bg)' }}
        >
          <div key={drawerTab} className="p-4 tech-animate-in">
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
              openScanner={props.openScanner}
              scannedItemId={props.scannedItemId}
              localReports={props.localReports}
              savingStatus={props.savingStatus}
              handleReportChange={props.handleReportChange}
              photoUploading={props.photoUploading}
              handlePhotoUpload={props.handlePhotoUpload}
              handlePhotoDelete={props.handlePhotoDelete}
            />
          </div>
        </div>

        {/* Bottom safe area */}
        <div className="h-3 shrink-0" style={{ background: 'var(--tech-bg)' }} />
      </div>
    </div>
  );
}

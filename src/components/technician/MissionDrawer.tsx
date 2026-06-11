import React from 'react';
import {
  X, Check, Clock, MapPin, Info, Phone, Users, QrCode, FileText, Timer, PenTool
} from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { triggerVibrate, DRAWER_TABS, type DrawerTab } from './useTechDashboard';
import DrawerTabs from './DrawerTabs';

interface MissionDrawerProps {
  mission: any;
  drawerTab: DrawerTab;
  setDrawerTab: (t: DrawerTab) => void;
  onClose: () => void;
  onStatusChange: (s: 'Planifiée' | 'En cours' | 'Terminée') => void;
  onOpenSignature: () => void;
  // Drag
  dragOffsetY: number;
  isDragging: boolean;
  handleDragStart: (e: React.TouchEvent) => void;
  handleDragMove: (e: React.TouchEvent) => void;
  handleDragEnd: () => void;
  handleContentTouchStart: (e: React.TouchEvent) => void;
  handleContentTouchEnd: (e: React.TouchEvent) => void;
  // Tab helpers (forwarded to DrawerTabs)
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
}

const TAB_CONFIG: { id: DrawerTab; label: string; icon: React.ElementType }[] = [
  { id: 'general',   label: 'Général',  icon: Info },
  { id: 'client',    label: 'Client',   icon: Phone },
  { id: 'team',      label: 'Équipe',   icon: Users },
  { id: 'equipment', label: 'Matériel', icon: QrCode },
  { id: 'hours',     label: 'Heures',   icon: Timer },
  { id: 'report',    label: 'Rapport',  icon: FileText },
];

export default function MissionDrawer(props: MissionDrawerProps) {
  const { mission, drawerTab, setDrawerTab, onClose, onStatusChange, onOpenSignature } = props;

  const steps = [
    { key: 'Planifiée', label: 'Planifiée', done: ['En cours', 'Terminée'].includes(mission.status), active: mission.status === 'Planifiée' },
    { key: 'En cours',  label: 'En cours',  done: mission.status === 'Terminée',                     active: mission.status === 'En cours' },
    { key: 'Terminée',  label: 'Terminée',  done: false,                                             active: mission.status === 'Terminée' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
        onClick={() => { triggerVibrate('click'); onClose(); }}
      />

      {/* Bottom sheet */}
      <div
        className="w-full max-w-md h-[92vh] flex flex-col z-10 overflow-hidden tech-animate-slide-up"
        style={{
          background: 'var(--tech-surface)',
          borderRadius: '1.5rem 1.5rem 0 0',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
          transform: `translateY(${props.dragOffsetY}px)`,
          transition: props.isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Drag notch */}
        <div
          onTouchStart={props.handleDragStart}
          onTouchMove={props.handleDragMove}
          onTouchEnd={props.handleDragEnd}
          className="w-full pt-3 pb-1 flex flex-col items-center cursor-grab shrink-0 select-none absolute top-0 left-0 right-0 z-20"
        >
          <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }} />
        </div>

        {/* ── Hero Header ── */}
        <div className="relative shrink-0 px-4 pt-6 pb-3" style={{ background: `linear-gradient(135deg, ${mission.color}, ${mission.color}cc)` }}>
          {/* Decorative glow */}
          <div className="absolute right-0 top-0 w-32 h-32 rounded-full opacity-30 -translate-y-1/2 translate-x-1/2" style={{ background: 'rgba(255,255,255,0.25)', filter: 'blur(40px)' }} />

          <button
            onClick={() => { triggerVibrate('click'); onClose(); }}
            className="absolute top-3 right-3 p-1.5 rounded-full transition-colors cursor-pointer active:scale-90"
            style={{ background: 'rgba(0,0,0,0.2)' }}
          >
            <X className="w-3.5 h-3.5 text-white" />
          </button>

          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider"
              style={{ background: 'rgba(0,0,0,0.2)', color: '#fff' }}>
              {mission.type}
            </span>
            {isSameDay(mission.start, new Date()) && (
              <span className="text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse"
                style={{ background: '#fff', color: '#ef4444' }}>
                Aujourd'hui
              </span>
            )}
          </div>

          <div className="flex justify-between items-start gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-black text-white leading-tight pr-2 truncate">{mission.title}</h2>
              <p className="text-[11px] font-semibold text-white/80 mt-0.5">{mission.client}</p>
            </div>
            <button
              onClick={mission.signatureUrl ? undefined : onOpenSignature}
              disabled={!!mission.signatureUrl}
              className={`shrink-0 p-2 rounded-xl flex flex-col items-center justify-center gap-1 shadow-sm transition-all ${
                mission.signatureUrl ? 'cursor-not-allowed opacity-75' : 'active:scale-95 cursor-pointer'
              }`}
              style={{ background: 'rgba(0,0,0,0.2)' }}
              title={mission.signatureUrl ? "Signature enregistrée" : "Gérer la signature"}
            >
              {mission.signatureUrl ? (
                <>
                  <PenTool className="w-4.5 h-4.5 text-white/50" />
                  <span className="text-[8px] font-black" style={{ color: '#86efac' }}>Signé</span>
                </>
              ) : (
                <>
                  <PenTool className="w-4.5 h-4.5 text-white" />
                  <span className="text-[8px] font-black text-white">Signer</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-2 flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-white/90 text-[10px] font-semibold">
              <Clock className="w-3 h-3 shrink-0" />
              <span>{format(mission.start, 'EEEE d MMM · HH:mm', { locale: fr })} → {format(mission.end, 'HH:mm')}</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/90 text-[10px] font-semibold">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="line-clamp-1">{mission.address}</span>
            </div>
          </div>

          {/* Status stepper */}
          <div className="mt-3 flex items-center gap-2">
            {steps.map((step, i) => {
              const isTerminated = mission.status === 'Terminée';
              return (
                <React.Fragment key={step.key}>
                  <div
                    className={`flex flex-col items-center gap-1 transition-all ${
                      isTerminated ? 'cursor-not-allowed opacity-75' : 'cursor-pointer hover:scale-105 active:scale-95'
                    }`}
                    onClick={() => {
                      if (isTerminated) {
                        triggerVibrate('error');
                        return;
                      }
                      onStatusChange(step.key as any);
                    }}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black transition-all ${
                      step.active ? 'bg-white text-slate-800 shadow-md ring-2 ring-white/40' :
                      step.done   ? 'bg-white/30 text-white' : 'bg-white/15 text-white/50'
                    }`}>
                      {step.done ? <Check className="w-3 h-3 stroke-[3]" /> : i + 1}
                    </div>
                    <span className={`text-[9px] font-bold whitespace-nowrap ${step.active || step.done ? 'text-white' : 'text-white/50'}`}>{step.label}</span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`flex-1 h-px rounded mb-4 ${step.done || step.active ? 'bg-white/50' : 'bg-white/20'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* ── Pill Tab Bar ── */}
        <div className="px-3 py-2 flex gap-1 overflow-x-auto shrink-0 select-none no-scrollbar"
          style={{ background: 'var(--tech-card)', borderBottom: '1px solid var(--tech-border)' }}>
          {TAB_CONFIG.map(tab => {
            const TabIcon = tab.icon;
            const isActive = drawerTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { triggerVibrate('click'); setDrawerTab(tab.id); }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-extrabold rounded-full whitespace-nowrap cursor-pointer transition-all active:scale-95"
                style={isActive
                  ? { background: mission.color, color: '#fff' }
                  : { color: 'var(--tech-text-muted)' }
                }
              >
                <TabIcon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Scrollable Content ── */}
        <div
          onTouchStart={props.handleContentTouchStart}
          onTouchEnd={props.handleContentTouchEnd}
          className="flex-1 overflow-y-auto select-none"
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
            />
          </div>
        </div>

        {/* Bottom safe area */}
        <div className="h-4 shrink-0" style={{ background: 'var(--tech-card)' }} />
      </div>
    </div>
  );
}

import React from 'react';
import {
  Calendar, MapPin, Truck as TruckIcon, Users, Phone, Mail,
  MessageSquare, Navigation, QrCode, Check, FileText, Info,
  ChevronRight, AlertCircle, AlertTriangle, Clock, CheckCircle2,
  Package, Wrench, ClipboardCheck, Camera, Loader2, Trash2, Image as ImageIcon, Plus, PenTool
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { triggerVibrate, type DrawerTab } from './useTechDashboard';
import TimeLogPanel from '../TimeLogPanel';
import { useAuthStore } from '../../store/auth';
import { useStore } from '../../store';

interface DrawerTabsProps {
  mission: any;
  drawerTab: DrawerTab;
  setDrawerTab: (t: DrawerTab) => void;
  getTruckName: (id?: string) => string;
  getColleaguesDetailed: (ids: string[]) => { id: string; name: string; specialty: string; color: string; isSelf: boolean }[];
  getClientInfo: (id?: string) => any;
  getEquipmentProgress: (eqs: any[]) => { total: number; pointed: number; percent: number };
  equipmentDefs: { id: string; name: string }[];
  handleTimeChange: (field: 'start' | 'end', time: string) => void;
  handleToggle: (missionId: string, equipmentId: string) => void;
  onStatusChange: (mission: any, s: 'Planifiée' | 'En cours' | 'Terminée') => void;
  openScanner: () => void;
  onOpenSignature: () => void;
  scannedItemId: string | null;
  localReports: Record<string, string>;
  savingStatus: 'idle' | 'saving' | 'saved';
  handleReportChange: (missionId: string, value: string) => void;
  photoUploading: { missionId: string; type: 'before' | 'after' } | null;
  handlePhotoUpload: (missionId: string, type: 'before' | 'after', file: File) => Promise<void>;
  handlePhotoDelete: (missionId: string, photoId: string) => void;
}

/* ── Shared card wrapper ──────────────────────────────────────────────────── */
function InfoCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl overflow-hidden ${className}`}
      style={{ background: 'var(--tech-card)', border: '1px solid var(--tech-border)' }}
    >
      {children}
    </div>
  );
}

function CardHeader({ icon, label, right }: { icon: React.ReactNode; label: string; right?: React.ReactNode }) {
  return (
    <div
      className="px-4 py-2.5 flex items-center justify-between"
      style={{ borderBottom: '1px solid var(--tech-border)', background: 'rgba(255,255,255,0.02)' }}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--tech-text-muted)' }}>
          {label}
        </span>
      </div>
      {right}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   GENERAL TAB
   ══════════════════════════════════════════════════════════════════════════ */
function GeneralTab({ mission, getTruckName, getEquipmentProgress, setDrawerTab, handleTimeChange, onStatusChange, openScanner, onOpenSignature }: any) {
  const prog = getEquipmentProgress(mission.equipments);
  const user = useAuthStore(state => state.user);
  const role = useAuthStore(state => state.role);
  const technicians = useStore(state => state.technicians);
  const currentTech = technicians.find(t => t.id === user?.id);
  const isChecklistEnabled = currentTech?.checklistEnabled ?? false;
  const isTechnician = role === 'Technicien';

  const [checkedItems, setCheckedItems] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    if (user?.id && mission.id) {
      const saved = localStorage.getItem(`eventflow_checklist_${user.id}_${mission.id}`);
      if (saved) {
        try { setCheckedItems(JSON.parse(saved)); } catch { }
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
                className="text-sm font-black bg-transparent outline-none cursor-pointer w-full"
                style={{ color: mission.color }}
                disabled={isTechnician}
                aria-disabled={isTechnician}
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
                className="text-sm font-black bg-transparent outline-none cursor-pointer w-full"
                style={{ color: mission.color }}
                disabled={isTechnician}
                aria-disabled={isTechnician}
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
                      {format(mission.deliveryDate, 'EEEE d MMMM', { locale: fr })}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-white bg-white/[0.05] px-2.5 py-1 rounded-lg">
                      {format(mission.deliveryDate, 'HH:mm')}
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
                      {format(mission.pickupDate, 'EEEE d MMMM', { locale: fr })}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-white bg-white/[0.05] px-2.5 py-1 rounded-lg">
                      {format(mission.pickupDate, 'HH:mm')}
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
          icon={<Wrench className="w-3.5 h-3.5" style={{ color: mission.color }} />}
          label="Actions rapides"
        />
        <div className="p-4 grid grid-cols-2 gap-3">
          <button
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
            onClick={() => { triggerVibrate('click'); openScanner(); }}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl py-3 text-xs font-black uppercase tracking-wider transition-all active:scale-[0.97]"
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: mission.color,
              border: `1px solid ${mission.color}33`,
            }}
          >
            <QrCode className="w-4 h-4" />
            Scanner matériel
          </button>

          <button
            onClick={() => { triggerVibrate('click'); onOpenSignature(); }}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl py-3 text-xs font-black uppercase tracking-wider transition-all active:scale-[0.97]"
            style={{
              background: mission.signatureUrl ? 'rgba(0,229,160,0.12)' : 'rgba(255,255,255,0.05)',
              color: mission.signatureUrl ? 'var(--tech-accent)' : 'var(--tech-text)',
              border: `1px solid ${mission.signatureUrl ? 'rgba(0,229,160,0.25)' : 'rgba(255,255,255,0.08)'}`,
            }}
          >
            <PenTool className="w-4 h-4" />
            {mission.signatureUrl ? 'Signé' : 'Signature'}
          </button>

          <button
            onClick={() => { triggerVibrate('click'); setDrawerTab('report'); }}
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
          onClick={() => { triggerVibrate('click'); setDrawerTab('equipment'); }}
          className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all active:scale-[0.97] text-left"
          style={{
            border: `1px solid ${mission.color}28`,
            background: `${mission.color}0a`,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = `${mission.color}14`; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = `${mission.color}0a`; }}
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
          onClick={() => { triggerVibrate('click'); setDrawerTab('checklist'); }}
          className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all active:scale-[0.97] text-left"
          style={{
            border: `1px solid ${mission.color}28`,
            background: `${mission.color}0a`,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = `${mission.color}14`; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = `${mission.color}0a`; }}
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

/* ══════════════════════════════════════════════════════════════════════════
   CLIENT TAB
   ══════════════════════════════════════════════════════════════════════════ */
function ClientTab({ mission, getClientInfo }: any) {
  const client = getClientInfo(mission.clientId);

  if (!client) {
    return (
      <InfoCard>
        <div className="p-8 text-center">
          <div
            className="w-14 h-14 rounded-3xl flex items-center justify-center mx-auto mb-3 tech-animate-float"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--tech-border)' }}
          >
            <Info className="w-6 h-6" style={{ color: 'var(--tech-text-muted)' }} />
          </div>
          <h4 className="font-bold text-sm" style={{ color: 'var(--tech-text)' }}>Pas de fiche client</h4>
          <p className="text-xs mt-1" style={{ color: 'var(--tech-text-muted)' }}>Client saisi manuellement.</p>
          <div className="mt-4 p-3.5 rounded-2xl text-left" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--tech-border)' }}>
            <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--tech-text-muted)' }}>Nom saisi</span>
            <div className="font-bold mt-1 text-sm" style={{ color: 'var(--tech-text)' }}>{mission.client}</div>
          </div>
        </div>
      </InfoCard>
    );
  }

  return (
    <div className="space-y-3 tech-stagger">
      {/* Client card */}
      <InfoCard>
        {/* Avatar header */}
        <div className="px-4 pt-4 pb-3 flex items-center gap-3" style={{ borderBottom: '1px solid var(--tech-border)' }}>
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-base shrink-0"
            style={{
              background: `linear-gradient(135deg, ${mission.color} 0%, ${mission.color}88 100%)`,
              boxShadow: `0 4px 16px ${mission.color}30`,
            }}
          >
            {client.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div
              className="text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider inline-block mb-1"
              style={{ background: 'var(--tech-accent-soft)', color: 'var(--tech-accent)' }}
            >
              Fiche Client
            </div>
            <div className="font-black text-sm leading-tight" style={{ color: 'var(--tech-text)' }}>{client.name}</div>
            {client.contactName && (
              <p className="text-[10px] font-medium mt-0.5" style={{ color: 'var(--tech-text-muted)' }}>
                Contact : <span style={{ color: 'var(--tech-text-secondary)' }}>{client.contactName}</span>
              </p>
            )}
          </div>
        </div>

        {/* Contact rows */}
        {client.phone && (
          <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: '1px solid var(--tech-border)' }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(77,159,255,0.12)' }}>
              <Phone className="w-3.5 h-3.5" style={{ color: 'var(--tech-blue)' }} />
            </div>
            <div>
              <div className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--tech-text-muted)' }}>Téléphone</div>
              <a href={`tel:${client.phone}`} onClick={() => triggerVibrate('click')} className="font-bold text-sm hover:underline" style={{ color: 'var(--tech-blue)' }}>
                {client.phone}
              </a>
            </div>
          </div>
        )}
        {client.email && (
          <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: '1px solid var(--tech-border)' }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(167,139,250,0.12)' }}>
              <Mail className="w-3.5 h-3.5" style={{ color: 'var(--tech-purple)' }} />
            </div>
            <div className="min-w-0">
              <div className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--tech-text-muted)' }}>Email</div>
              <a href={`mailto:${client.email}`} onClick={() => triggerVibrate('click')} className="font-bold text-sm hover:underline truncate block" style={{ color: 'var(--tech-purple)' }}>
                {client.email}
              </a>
            </div>
          </div>
        )}
        {client.address && (
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <MapPin className="w-3.5 h-3.5" style={{ color: 'var(--tech-text-muted)' }} />
            </div>
            <div>
              <div className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--tech-text-muted)' }}>Adresse</div>
              <span className="font-semibold text-sm" style={{ color: 'var(--tech-text-secondary)' }}>{client.address}</span>
            </div>
          </div>
        )}
      </InfoCard>

      {/* Quick action buttons */}
      <div className="grid grid-cols-3 gap-2">
        {client.phone && (
          <>
            <a
              href={`tel:${client.phone}`}
              onClick={() => triggerVibrate('click')}
              className="flex flex-col items-center justify-center py-4 rounded-2xl gap-1.5 active:scale-95 transition-all"
              style={{ background: 'rgba(77,159,255,0.08)', border: '1px solid rgba(77,159,255,0.15)' }}
            >
              <Phone className="w-5 h-5" style={{ color: 'var(--tech-blue)' }} />
              <span className="text-[9px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--tech-blue)' }}>Appeler</span>
            </a>
            <a
              href={`sms:${client.phone}`}
              onClick={() => triggerVibrate('click')}
              className="flex flex-col items-center justify-center py-4 rounded-2xl gap-1.5 active:scale-95 transition-all"
              style={{ background: 'rgba(0,229,160,0.08)', border: '1px solid rgba(0,229,160,0.15)' }}
            >
              <MessageSquare className="w-5 h-5" style={{ color: 'var(--tech-accent)' }} />
              <span className="text-[9px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--tech-accent)' }}>SMS</span>
            </a>
          </>
        )}
        {client.email && (
          <a
            href={`mailto:${client.email}?subject=Mission%20${encodeURIComponent(mission.title)}`}
            onClick={() => triggerVibrate('click')}
            className="flex flex-col items-center justify-center py-4 rounded-2xl gap-1.5 active:scale-95 transition-all"
            style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.15)' }}
          >
            <Mail className="w-5 h-5" style={{ color: 'var(--tech-purple)' }} />
            <span className="text-[9px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--tech-purple)' }}>E-mail</span>
          </a>
        )}
      </div>

      {/* Notes */}
      {client.notes && (
        <div
          className="p-4 rounded-2xl space-y-2"
          style={{ background: 'rgba(255,183,0,0.07)', border: '1px solid rgba(255,183,0,0.15)' }}
        >
          <h4 className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5" style={{ color: '#ffb700' }}>
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            Consignes &amp; Notes
          </h4>
          <p className="text-xs font-semibold leading-relaxed whitespace-pre-line" style={{ color: 'rgba(255,183,0,0.8)' }}>
            {client.notes}
          </p>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   TEAM TAB
   ══════════════════════════════════════════════════════════════════════════ */
function TeamTab({ mission, getColleaguesDetailed }: any) {
  const team = getColleaguesDetailed(mission.technicianIds);

  return (
    <div className="space-y-3 tech-stagger">
      <InfoCard>
        <CardHeader
          icon={<Users className="w-3.5 h-3.5" style={{ color: mission.color }} />}
          label="Membres de l'équipe"
          right={
            <span
              className="text-[9px] font-black px-2.5 py-1 rounded-full text-white"
              style={{ background: mission.color, boxShadow: `0 0 10px ${mission.color}40` }}
            >
              {mission.technicianIds.length}
            </span>
          }
        />
        <ul>
          {team.map((tech: any, idx: number) => (
            <li
              key={tech.id}
              className="px-4 py-3.5 flex items-center gap-3 transition-all"
              style={{
                borderBottom: idx < team.length - 1 ? '1px solid var(--tech-border)' : 'none',
              }}
            >
              {/* Avatar */}
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black text-white shrink-0 relative"
                style={{ background: `linear-gradient(135deg, ${tech.color} 0%, ${tech.color}aa 100%)` }}
              >
                {tech.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                {tech.isSelf && (
                  <span
                    className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center"
                    style={{
                      background: 'var(--tech-accent)',
                      borderColor: 'var(--tech-card)',
                    }}
                  >
                    <Check className="w-2 h-2 text-black stroke-[3]" />
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm flex items-center gap-2 flex-wrap" style={{ color: 'var(--tech-text)' }}>
                  <span>{tech.name}</span>
                  {tech.isSelf && (
                    <span
                      className="text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider"
                      style={{ background: 'var(--tech-accent-soft)', color: 'var(--tech-accent)' }}
                    >
                      Vous
                    </span>
                  )}
                </div>
                <p className="text-[10px] font-semibold truncate mt-0.5" style={{ color: 'var(--tech-text-muted)' }}>{tech.specialty}</p>
              </div>
              {/* Online indicator */}
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: 'var(--tech-accent)', boxShadow: '0 0 6px rgba(0,229,160,0.5)' }}
              />
            </li>
          ))}
        </ul>
      </InfoCard>

      {/* Tip */}
      <div
        className="p-3.5 rounded-2xl flex items-start gap-2.5"
        style={{
          border: `1px solid ${mission.color}22`,
          background: `${mission.color}08`,
        }}
      >
        <Users className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: mission.color, opacity: 0.8 }} />
        <p className="text-[10px] leading-relaxed font-semibold" style={{ color: mission.color, opacity: 0.8 }}>
          Coordonnez vos actions avec vos collègues. Pensez à pointer le matériel au chargement et au déchargement.
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   EQUIPMENT TAB
   ══════════════════════════════════════════════════════════════════════════ */
function EquipmentTab({ mission, getEquipmentProgress, equipmentDefs, handleToggle, openScanner, scannedItemId }: any) {
  const prog = getEquipmentProgress(mission.equipments);
  const allDone = prog.percent === 100;

  return (
    <div className="space-y-3">
      {/* Progress header */}
      <InfoCard>
        <div className="p-4 space-y-3" style={{ borderBottom: '1px solid var(--tech-border)' }}>
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-sm" style={{ color: 'var(--tech-text)' }}>Chargement matériel</h3>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--tech-text-muted)' }}>
                Scannez ou cochez les éléments requis
              </p>
            </div>
            <div className="text-right">
              <span
                className="text-2xl font-black"
                style={{ color: allDone ? 'var(--tech-accent)' : mission.color }}
              >
                {prog.percent}%
              </span>
              <div className="text-[10px] font-bold" style={{ color: 'var(--tech-text-muted)' }}>
                {prog.pointed}/{prog.total}
              </div>
            </div>
          </div>
          {/* Progress bar */}
          <div className="tech-progress-track">
            <div
              className="tech-progress-fill"
              style={{
                width: `${prog.percent}%`,
                background: allDone
                  ? 'linear-gradient(90deg, var(--tech-accent), var(--tech-accent-dim))'
                  : `linear-gradient(90deg, ${mission.color}, ${mission.color}aa)`,
                boxShadow: allDone ? '0 0 10px rgba(0,229,160,0.4)' : 'none',
              }}
            />
          </div>
          {allDone && (
            <div
              className="flex items-center gap-1.5 text-[10px] font-black tech-animate-in"
              style={{ color: 'var(--tech-accent)' }}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Tout le matériel est chargé !
            </div>
          )}
          {mission.status !== 'Terminée' && (
            <button
              onClick={openScanner}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-extrabold text-white transition-all active:scale-[0.97]"
              style={{
                background: `linear-gradient(135deg, ${mission.color} 0%, ${mission.color}aa 100%)`,
                boxShadow: `0 4px 14px ${mission.color}28`,
              }}
            >
              <QrCode className="w-4 h-4" /> Scanner un QR Code
            </button>
          )}
        </div>

        {/* Equipment list */}
        {mission.equipments?.length > 0 ? (
          <ul>
            {mission.equipments.map((me: any, idx: number) => {
              const def = equipmentDefs.find((e: any) => e.id === me.equipmentId);
              const isChecked = !!me.checked;
              const isFlashing = scannedItemId === me.equipmentId;
              return (
                <li
                  key={me.equipmentId}
                  onClick={() => { if (mission.status !== 'Terminée') handleToggle(mission.id, me.equipmentId); }}
                  className={`px-4 py-3.5 flex items-center justify-between cursor-pointer transition-all ${isFlashing ? 'animate-pulse' : ''}`}
                  style={{
                    borderBottom: idx < mission.equipments.length - 1 ? '1px solid var(--tech-border)' : 'none',
                    background: isChecked
                      ? 'rgba(0,229,160,0.05)'
                      : isFlashing
                        ? 'rgba(255,183,0,0.08)'
                        : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isChecked) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.025)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = isChecked
                      ? 'rgba(0,229,160,0.05)'
                      : 'transparent';
                  }}
                >
                  <div className="flex items-center gap-3">
                    {/* Checkbox */}
                    <div
                      className="w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0"
                      style={
                        isChecked
                          ? {
                            background: 'var(--tech-accent)',
                            borderColor: 'var(--tech-accent)',
                            boxShadow: '0 0 8px rgba(0,229,160,0.4)',
                          }
                          : { borderColor: 'var(--tech-border-strong)', background: 'transparent' }
                      }
                    >
                      {isChecked && <Check className="w-3.5 h-3.5 text-black stroke-[3]" />}
                    </div>
                    <span
                      className={`text-sm font-bold ${isChecked ? 'line-through' : ''}`}
                      style={{ color: isChecked ? 'var(--tech-text-muted)' : 'var(--tech-text)' }}
                    >
                      {def?.name || 'Matériel inconnu'}
                    </span>
                  </div>
                  <span
                    className="text-[10px] font-extrabold px-2 py-0.5 rounded-lg shrink-0"
                    style={{
                      background: isChecked ? 'rgba(0,229,160,0.10)' : 'rgba(255,255,255,0.05)',
                      color: isChecked ? 'var(--tech-accent)' : 'var(--tech-text-secondary)',
                    }}
                  >
                    ×{me.quantity}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="py-10 text-center">
            <Package className="w-7 h-7 mx-auto mb-2 tech-animate-float" style={{ color: 'var(--tech-text-muted)' }} />
            <p className="text-xs italic" style={{ color: 'var(--tech-text-muted)' }}>
              Aucun matériel requis pour cette mission.
            </p>
          </div>
        )}
      </InfoCard>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   REPORT TAB
   ══════════════════════════════════════════════════════════════════════════ */
function ReportTab({
  mission,
  localReports,
  savingStatus,
  handleReportChange,
  photoUploading,
  handlePhotoUpload,
  handlePhotoDelete
}: any) {
  const [confirmClear, setConfirmClear] = React.useState(false);
  const [lightbox, setLightbox] = React.useState<string | null>(null);

  const photoBefore: any[] = (mission.photos || []).filter((p: any) => p.type === 'before');
  const photoAfter: any[] = (mission.photos || []).filter((p: any) => p.type === 'after');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    for (const file of files) {
      await handlePhotoUpload(mission.id, type, file);
    }
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const renderPhotoSection = (type: 'before' | 'after', photos: any[]) => {
    const label = type === 'before' ? 'Avant Montage' : 'Après Montage';
    const accentColor = type === 'before' ? '#4d9fff' : '#00e5a0';
    const isUploading = photoUploading?.missionId === mission.id && photoUploading?.type === type;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span
            className="text-[9px] font-black uppercase tracking-widest"
            style={{ color: accentColor }}
          >
            {label}
          </span>
          <span
            className="text-[9px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: `${accentColor}18`, color: accentColor }}
          >
            {photos.length} photo{photos.length > 1 ? 's' : ''}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* Existing photos */}
          {photos.map((photo: any) => (
            <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden group">
              <img
                src={photo.url}
                alt={label}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => setLightbox(photo.url)}
              />
              {/* Delete overlay */}
              <div
                className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100"
              >
                <button
                  onClick={() => handlePhotoDelete(mission.id, photo.id)}
                  className="p-1.5 rounded-full transition-all cursor-pointer"
                  style={{ background: 'rgba(255,60,80,0.25)', color: '#ff8fa0' }}
                  title="Supprimer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setLightbox(photo.url)}
                  className="p-1.5 rounded-full transition-all cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
                  title="Agrandir"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {/* Add camera button */}
          <label
            className="aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all group"
            style={{
              borderColor: isUploading ? accentColor : 'var(--tech-border-strong)',
              background: isUploading ? `${accentColor}08` : 'rgba(255,255,255,0.01)',
            }}
          >
            {isUploading ? (
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: accentColor }} />
            ) : (
              <>
                <Camera
                  className="w-4 h-4 mb-0.5 transition-colors group-hover:scale-110"
                  style={{ color: 'var(--tech-text-muted)' }}
                />
                <span className="text-[7px] font-black uppercase tracking-wider text-center" style={{ color: 'var(--tech-text-muted)' }}>Appareil</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => handleFileChange(e, type)}
              className="hidden"
              disabled={isUploading}
            />
          </label>

          {/* Add gallery button */}
          <label
            className="aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all group"
            style={{
              borderColor: isUploading ? accentColor : 'var(--tech-border-strong)',
              background: isUploading ? `${accentColor}08` : 'rgba(255,255,255,0.01)',
            }}
          >
            {isUploading ? (
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: accentColor }} />
            ) : (
              <>
                <ImageIcon
                  className="w-4 h-4 mb-0.5 transition-colors group-hover:scale-110"
                  style={{ color: 'var(--tech-text-muted)' }}
                />
                <span className="text-[7px] font-black uppercase tracking-wider text-center" style={{ color: 'var(--tech-text-muted)' }}>Galerie</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFileChange(e, type)}
              className="hidden"
              disabled={isUploading}
            />
          </label>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3 tech-stagger">

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-[95vw] max-h-[90vh]">
            <img src={lightbox} alt="Photo" className="max-w-full max-h-[85vh] object-contain rounded-2xl" />
            <button
              onClick={() => setLightbox(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center text-lg font-bold cursor-pointer"
            >
              ×
            </button>
            <a
              href={lightbox}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-2 right-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.15)' }}
            >
              Ouvrir l'original ↗
            </a>
          </div>
        </div>
      )}

      {/* ── Rapport de fin de mission ── */}
      <InfoCard>
        <CardHeader
          icon={<FileText className="w-3.5 h-3.5" style={{ color: mission.color }} />}
          label="Rapport de fin de mission"
          right={
            <span className="text-[9px] font-bold font-mono">
              {savingStatus === 'saving' && <span style={{ color: '#ffb700' }}>Enregistrement…</span>}
              {savingStatus === 'saved' && <span style={{ color: 'var(--tech-accent)' }}>Sauvegardé ✓</span>}
              {savingStatus === 'idle' && <span style={{ color: 'var(--tech-text-muted)' }}>Brouillon</span>}
            </span>
          }
        />
        <div className="p-4 space-y-3">
          <textarea
            placeholder="Ex: Le projecteur LED #4 ne s'allume pas..."
            value={localReports[mission.id] || ''}
            onChange={(e) => handleReportChange(mission.id, e.target.value)}
            rows={6}
            className="w-full text-sm rounded-2xl p-4 outline-none transition-all resize-none font-medium no-scrollbar"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--tech-border)',
              color: 'var(--tech-text)',
              caretColor: 'var(--tech-accent)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0,229,160,0.30)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,229,160,0.06)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--tech-border)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-bold flex items-center gap-1" style={{ color: 'var(--tech-text-muted)' }}>
              <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
              Auto-sauvegardé localement
            </span>
            {localReports[mission.id] && (
              confirmClear ? (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="text-[9px] font-black px-2 py-1 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--tech-text-muted)' }}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => { triggerVibrate('click'); handleReportChange(mission.id, ''); setConfirmClear(false); }}
                    className="text-[9px] font-black px-2 py-1 rounded-lg"
                    style={{ background: 'rgba(255,77,109,0.14)', color: '#ff8fa0', border: '1px solid rgba(255,77,109,0.25)' }}
                  >
                    Supprimer
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmClear(true)}
                  className="text-[10px] font-bold cursor-pointer"
                  style={{ color: 'rgba(255,77,109,0.6)' }}
                >
                  Effacer
                </button>
              )
            )}
          </div>
        </div>
      </InfoCard>

    </div>
  );
}


/* ══════════════════════════════════════════════════════════════════════════
   HOURS TAB
   ══════════════════════════════════════════════════════════════════════════ */
function HoursTab({ mission }: any) {
  return <TimeLogPanel missionId={mission.id} missionColor={mission.color} missionStatus={mission.status} />;
}

/* ══════════════════════════════════════════════════════════════════════════
   PHOTOS TAB
   ══════════════════════════════════════════════════════════════════════════ */
function PhotosTab({
  mission,
  photoUploading,
  handlePhotoUpload,
  handlePhotoDelete
}: any) {
  const [lightbox, setLightbox] = React.useState<string | null>(null);

  const photoBefore: any[] = (mission.photos || []).filter((p: any) => p.type === 'before');
  const photoAfter: any[] = (mission.photos || []).filter((p: any) => p.type === 'after');
  const totalPhotos = (mission.photos || []).length;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    for (const file of files) {
      await handlePhotoUpload(mission.id, type, file);
    }
    e.target.value = '';
  };

  const renderPhotoSection = (type: 'before' | 'after', photos: any[]) => {
    const label = type === 'before' ? 'Avant Montage' : 'Après Montage';
    const accentColor = type === 'before' ? '#4d9fff' : '#00e5a0';
    const isUploading = photoUploading?.missionId === mission.id && photoUploading?.type === type;

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span
            className="text-[9px] font-black uppercase tracking-widest"
            style={{ color: accentColor }}
          >
            {label}
          </span>
          <span
            className="text-[9px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: `${accentColor}18`, color: accentColor }}
          >
            {photos.length} photo{photos.length > 1 ? 's' : ''}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* Existing photos */}
          {photos.map((photo: any) => (
            <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden group">
              <img
                src={photo.url}
                alt={label}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => setLightbox(photo.url)}
              />
              {/* Delete overlay */}
              <div
                className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100"
              >
                <button
                  onClick={() => handlePhotoDelete(mission.id, photo.id)}
                  className="p-1.5 rounded-full transition-all cursor-pointer"
                  style={{ background: 'rgba(255,60,80,0.25)', color: '#ff8fa0' }}
                  title="Supprimer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setLightbox(photo.url)}
                  className="p-1.5 rounded-full transition-all cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
                  title="Agrandir"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {/* Add camera button */}
          <label
            className="aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all group"
            style={{
              borderColor: isUploading ? accentColor : 'var(--tech-border-strong)',
              background: isUploading ? `${accentColor}08` : 'rgba(255,255,255,0.01)',
            }}
          >
            {isUploading ? (
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: accentColor }} />
            ) : (
              <>
                <Camera
                  className="w-4 h-4 mb-0.5 transition-colors group-hover:scale-110"
                  style={{ color: 'var(--tech-text-muted)' }}
                />
                <span className="text-[7px] font-black uppercase tracking-wider text-center" style={{ color: 'var(--tech-text-muted)' }}>Appareil</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => handleFileChange(e, type)}
              className="hidden"
              disabled={isUploading}
            />
          </label>

          {/* Add gallery button */}
          <label
            className="aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all group"
            style={{
              borderColor: isUploading ? accentColor : 'var(--tech-border-strong)',
              background: isUploading ? `${accentColor}08` : 'rgba(255,255,255,0.01)',
            }}
          >
            {isUploading ? (
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: accentColor }} />
            ) : (
              <>
                <ImageIcon
                  className="w-4 h-4 mb-0.5 transition-colors group-hover:scale-110"
                  style={{ color: 'var(--tech-text-muted)' }}
                />
                <span className="text-[7px] font-black uppercase tracking-wider text-center" style={{ color: 'var(--tech-text-muted)' }}>Galerie</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFileChange(e, type)}
              className="hidden"
              disabled={isUploading}
            />
          </label>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3 tech-stagger">

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-[95vw] max-h-[90vh]">
            <img src={lightbox} alt="Photo" className="max-w-full max-h-[85vh] object-contain rounded-2xl" />
            <button
              onClick={() => setLightbox(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center text-lg font-bold cursor-pointer"
            >
              ×
            </button>
            <a
              href={lightbox}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-2 right-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.15)' }}
            >
              Ouvrir l'original ↗
            </a>
          </div>
        </div>
      )}

      {/* ── Photos Header Card ── */}
      <InfoCard>
        <CardHeader
          icon={<Camera className="w-3.5 h-3.5" style={{ color: mission.color }} />}
          label="Galerie Photos Terrain"
          right={
            <span
              className="text-[9px] font-black px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(0,229,160,0.1)', color: 'var(--tech-accent)' }}
            >
              {totalPhotos} photo{totalPhotos > 1 ? 's' : ''}
            </span>
          }
        />
        <div className="p-4 space-y-2">
          <p className="text-[10px] leading-relaxed" style={{ color: 'var(--tech-text-muted)' }}>
            Documentez chaque étape de la mission. Les photos sont conservées sécurisément et consultables par l'administrateur.
          </p>
          {totalPhotos > 0 && (
            <div className="flex items-center gap-2 mt-2 p-2 rounded-lg" style={{ background: 'rgba(0,229,160,0.08)', border: '1px solid rgba(0,229,160,0.15)' }}>
              <Check className="w-3.5 h-3.5" style={{ color: 'var(--tech-accent)' }} />
              <span className="text-[9px] font-semibold" style={{ color: 'var(--tech-accent)' }}>
                {totalPhotos} photo{totalPhotos > 1 ? 's' : ''} documentée{totalPhotos > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </InfoCard>

      {/* ── Photos Avant Montage ── */}
      <InfoCard>
        <div className="p-4">
          {renderPhotoSection('before', photoBefore)}
        </div>
      </InfoCard>

      {/* ── Photos Après Montage ── */}
      <InfoCard>
        <div className="p-4">
          {renderPhotoSection('after', photoAfter)}
        </div>
      </InfoCard>

      {/* ── Empty state ── */}
      {totalPhotos === 0 && (
        <InfoCard>
          <div className="p-8 text-center">
            <Camera className="w-12 h-12 mx-auto mb-3 tech-animate-float" style={{ color: 'var(--tech-text-muted)' }} />
            <h4 className="font-bold text-sm" style={{ color: 'var(--tech-text)' }}>Aucune photo</h4>
            <p className="text-[10px] mt-2" style={{ color: 'var(--tech-text-muted)' }}>
              Commencez par photographier l'état des lieux avant et après montage pour justifier la mission.
            </p>
          </div>
        </InfoCard>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN EXPORT
   ══════════════════════════════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════════════════════════════
   CHECKLIST TAB
   ══════════════════════════════════════════════════════════════════════════ */
function ChecklistTab({ mission }: { mission: any }) {
  const user = useAuthStore(state => state.user);
  const [checkedItems, setCheckedItems] = React.useState<Record<string, boolean>>({});
  const [activeSection, setActiveSection] = React.useState<string | null>('prep');

  const sections = [
    {
      id: 'prep',
      title: 'Avant la mission',
      subtitle: 'Préparation & Départ',
      icon: <TruckIcon className="w-4 h-4" />,
      color: '#4d9fff', // blue
      items: [
        { id: 'prep_route', label: "Consulter l'itinéraire, l'adresse et les consignes" },
        { id: 'prep_equip', label: 'Contrôler le matériel chargé par rapport à la liste' },
        { id: 'prep_epi', label: "S'équiper des EPI (chaussures de sécurité, gants...)" },
        { id: 'prep_vehicle', label: 'Vérifier le véhicule (niveaux, carburant, pneus)' },
        { id: 'prep_docs', label: 'Récupérer les documents de livraison' }
      ]
    },
    {
      id: 'setup',
      title: 'Pendant la mission',
      subtitle: 'Sur place & Installation',
      icon: <Wrench className="w-4 h-4" />,
      color: '#ffb700', // orange
      items: [
        { id: 'site_contact', label: 'Prendre contact avec le responsable sur place' },
        { id: 'site_safety', label: 'Sécuriser la zone de montage' },
        { id: 'site_setup', label: 'Réaliser l\'installation technique (montage/câblage)' },
        { id: 'site_tests', label: 'Tester les équipements de sonorisation / d\'éclairage' },
        { id: 'site_clean', label: 'Nettoyer et ranger la zone après installation' }
      ]
    },
    {
      id: 'cleanup',
      title: 'Après la mission',
      subtitle: 'Clôture & Restitutions',
      icon: <CheckCircle2 className="w-4 h-4" />,
      color: '#00e5a0', // green
      items: [
        { id: 'end_reception', label: 'Valider le bon fonctionnement final avec le client' },
        { id: 'end_signature', label: 'Faire signer le bon technique dans l\'application' },
        { id: 'end_photos', label: 'Prendre des photos du rendu de la prestation' },
        { id: 'end_report', label: 'Saisir le rapport technique (onglet Rapport)' },
        { id: 'end_return', label: 'Restituer les clés et signaler toute anomalie véhicule' }
      ]
    }
  ];

  React.useEffect(() => {
    if (user?.id && mission.id) {
      const saved = localStorage.getItem(`eventflow_checklist_${user.id}_${mission.id}`);
      if (saved) {
        try { setCheckedItems(JSON.parse(saved)); } catch { }
      }
    }
  }, [user?.id, mission.id]);

  const toggleItem = (itemId: string) => {
    triggerVibrate('click');
    const updated = { ...checkedItems, [itemId]: !checkedItems[itemId] };
    setCheckedItems(updated);
    if (user?.id && mission.id) {
      localStorage.setItem(`eventflow_checklist_${user.id}_${mission.id}`, JSON.stringify(updated));
    }
  };

  const checkAllSection = (sectionId: string, items: { id: string }[]) => {
    const allChecked = items.every(item => checkedItems[item.id]);
    const updated = { ...checkedItems };
    items.forEach(item => {
      updated[item.id] = !allChecked;
    });
    setCheckedItems(updated);
    triggerVibrate(allChecked ? 'click' : 'success');
    if (user?.id && mission.id) {
      localStorage.setItem(`eventflow_checklist_${user.id}_${mission.id}`, JSON.stringify(updated));
    }
  };

  const totalItems = sections.reduce((acc, s) => acc + s.items.length, 0);
  const checkedCount = sections.reduce((acc, s) => acc + s.items.filter(i => checkedItems[i.id]).length, 0);
  const percent = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;
  const isFinished = percent === 100;

  return (
    <div className="space-y-3 tech-stagger">
      <InfoCard>
        <div className="p-4 space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-sm" style={{ color: 'var(--tech-text)' }}>Checklist Mission</h3>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--tech-text-muted)' }}>
                Toutes les étapes indispensables à valider
              </p>
            </div>
            <div className="text-right">
              <span
                className="text-2xl font-black transition-all"
                style={{ color: isFinished ? 'var(--tech-accent)' : mission.color }}
              >
                {percent}%
              </span>
              <div className="text-[10px] font-bold" style={{ color: 'var(--tech-text-muted)' }}>
                {checkedCount}/{totalItems}
              </div>
            </div>
          </div>

          <div className="tech-progress-track">
            <div
              className="tech-progress-fill"
              style={{
                width: `${percent}%`,
                background: isFinished
                  ? 'linear-gradient(90deg, var(--tech-accent), var(--tech-accent-dim))'
                  : `linear-gradient(90deg, ${mission.color}, ${mission.color}aa)`,
                boxShadow: isFinished ? '0 0 10px rgba(0,229,160,0.4)' : 'none',
              }}
            />
          </div>

          {isFinished && (
            <div
              className="flex items-center gap-1.5 text-[10px] font-black tech-animate-in"
              style={{ color: 'var(--tech-accent)' }}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Checklist validée avec succès !
            </div>
          )}
        </div>
      </InfoCard>

      {sections.map((sec) => {
        const secCheckedCount = sec.items.filter(i => checkedItems[i.id]).length;
        const isSecDone = secCheckedCount === sec.items.length;
        const isOpen = activeSection === sec.id;

        return (
          <InfoCard key={sec.id}>
            <div
              onClick={() => { triggerVibrate('click'); setActiveSection(isOpen ? null : sec.id); }}
              className="px-4 py-3.5 flex items-center justify-between cursor-pointer transition-all hover:bg-white/[0.01]"
              style={{ borderBottom: isOpen ? '1px solid var(--tech-border)' : 'none' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: isSecDone ? 'rgba(0,229,160,0.1)' : `${sec.color}15`,
                    color: isSecDone ? 'var(--tech-accent)' : sec.color,
                    border: isSecDone ? '1px solid rgba(0,229,160,0.2)' : `1px solid ${sec.color}25`
                  }}
                >
                  {sec.icon}
                </div>
                <div>
                  <h4 className="font-extrabold text-xs" style={{ color: 'var(--tech-text)' }}>{sec.title}</h4>
                  <p className="text-[9px] font-bold" style={{ color: 'var(--tech-text-muted)' }}>{sec.subtitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] font-black px-2 py-0.5 rounded-lg"
                  style={{
                    background: isSecDone ? 'rgba(0,229,160,0.1)' : 'rgba(255,255,255,0.04)',
                    color: isSecDone ? 'var(--tech-accent)' : 'var(--tech-text-secondary)'
                  }}
                >
                  {secCheckedCount}/{sec.items.length}
                </span>
                <ChevronRight
                  className="w-3.5 h-3.5 transition-transform duration-200"
                  style={{
                    color: 'var(--tech-text-muted)',
                    transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)'
                  }}
                />
              </div>
            </div>

            {isOpen && (
              <div className="p-1 space-y-1">
                <div className="px-3 py-1 flex justify-end">
                  <button
                    onClick={(e) => { e.stopPropagation(); checkAllSection(sec.id, sec.items); }}
                    className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded transition-all hover:bg-white/5 cursor-pointer"
                    style={{ color: isSecDone ? sec.color : 'var(--tech-accent)' }}
                  >
                    {isSecDone ? 'Décocher tout' : 'Tout cocher'}
                  </button>
                </div>

                <ul>
                  {sec.items.map((item) => {
                    const isChecked = !!checkedItems[item.id];
                    return (
                      <li
                        key={item.id}
                        onClick={() => toggleItem(item.id)}
                        className="px-3 py-2.5 flex items-center gap-3 cursor-pointer rounded-xl transition-all"
                        style={{
                          background: isChecked ? 'rgba(0,229,160,0.03)' : 'transparent',
                        }}
                      >
                        <div
                          className="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0"
                          style={
                            isChecked
                              ? {
                                background: 'var(--tech-accent)',
                                borderColor: 'var(--tech-accent)',
                                boxShadow: '0 0 6px rgba(0,229,160,0.3)',
                              }
                              : { borderColor: 'var(--tech-border-strong)', background: 'transparent' }
                          }
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 text-black stroke-[3]" />}
                        </div>

                        <span
                          className={`text-xs font-semibold leading-snug flex-1 ${isChecked ? 'line-through text-opacity-40' : ''}`}
                          style={{ color: isChecked ? 'var(--tech-text-muted)' : 'var(--tech-text)' }}
                        >
                          {item.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </InfoCard>
        );
      })}
    </div>
  );
}

export default function DrawerTabs(props: DrawerTabsProps) {
  const { mission, drawerTab } = props;

  switch (drawerTab) {
    case 'general':
      return <GeneralTab
        mission={mission}
        getTruckName={props.getTruckName}
        getEquipmentProgress={props.getEquipmentProgress}
        setDrawerTab={props.setDrawerTab}
        handleTimeChange={props.handleTimeChange}
        onStatusChange={props.onStatusChange}
        openScanner={props.openScanner}
        onOpenSignature={props.onOpenSignature}
      />;
    case 'client':
      return <ClientTab mission={mission} getClientInfo={props.getClientInfo} />;
    case 'team':
      return <TeamTab mission={mission} getColleaguesDetailed={props.getColleaguesDetailed} />;
    case 'equipment':
      return <EquipmentTab mission={mission} getEquipmentProgress={props.getEquipmentProgress} equipmentDefs={props.equipmentDefs} handleToggle={props.handleToggle} openScanner={props.openScanner} scannedItemId={props.scannedItemId} />;
    case 'photos':
      return (
        <PhotosTab
          mission={mission}
          photoUploading={props.photoUploading}
          handlePhotoUpload={props.handlePhotoUpload}
          handlePhotoDelete={props.handlePhotoDelete}
        />
      );
    case 'hours':
      return <HoursTab mission={mission} />;
    case 'checklist':
      return <ChecklistTab mission={mission} />;
    case 'report':
      return (
        <ReportTab
          mission={mission}
          localReports={props.localReports}
          savingStatus={props.savingStatus}
          handleReportChange={props.handleReportChange}
          photoUploading={props.photoUploading}
          handlePhotoUpload={props.handlePhotoUpload}
          handlePhotoDelete={props.handlePhotoDelete}
        />
      );
    default:
      return null;
  }
}

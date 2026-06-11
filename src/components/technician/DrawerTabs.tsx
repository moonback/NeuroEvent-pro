import React from 'react';
import {
  Calendar, MapPin, Truck as TruckIcon, Users, Phone, Mail,
  MessageSquare, Navigation, QrCode, Check, FileText, Info,
  ChevronRight, AlertCircle, AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { triggerVibrate, type DrawerTab } from './useTechDashboard';
import TimeLogPanel from '../TimeLogPanel';

interface DrawerTabsProps {
  mission: any;
  drawerTab: DrawerTab;
  setDrawerTab: (t: DrawerTab) => void;
  // Helpers
  getTruckName: (id?: string) => string;
  getColleaguesDetailed: (ids: string[]) => { id: string; name: string; specialty: string; color: string; isSelf: boolean }[];
  getClientInfo: (id?: string) => any;
  getEquipmentProgress: (eqs: any[]) => { total: number; pointed: number; percent: number };
  equipmentDefs: { id: string; name: string }[];
  // Handlers
  handleTimeChange: (field: 'start' | 'end', time: string) => void;
  handleToggle: (missionId: string, equipmentId: string) => void;
  openScanner: () => void;
  scannedItemId: string | null;
  // Report
  localReports: Record<string, string>;
  savingStatus: 'idle' | 'saving' | 'saved';
  handleReportChange: (missionId: string, value: string) => void;
}

/* ══════════════════════════════════════════════════════════════════════════
   GENERAL TAB
   ══════════════════════════════════════════════════════════════════════════ */
function GeneralTab({ mission, getTruckName, getEquipmentProgress, setDrawerTab, handleTimeChange }: any) {
  const prog = getEquipmentProgress(mission.equipments);
  return (
    <div className="space-y-3 tech-stagger">
      {/* Schedule */}
      <div className="tech-card overflow-hidden">
        <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom: '1px solid var(--tech-border)' }}>
          <Calendar className="w-4 h-4 shrink-0" style={{ color: mission.color }} />
          <span className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--tech-text-muted)' }}>Planification</span>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-[10px] font-bold uppercase mb-0.5" style={{ color: 'var(--tech-text-muted)' }}>Début</div>
              <div className="font-bold text-sm capitalize" style={{ color: 'var(--tech-text)' }}>
                {format(mission.start, 'EEEE d MMMM yyyy', { locale: fr })}
              </div>
              <input
                type="time"
                value={format(mission.start, 'HH:mm')}
                onChange={e => handleTimeChange('start', e.target.value)}
                className="text-xs font-semibold bg-transparent outline-none cursor-pointer"
                style={{ color: 'var(--tech-text-secondary)', borderBottom: '1px dashed var(--tech-border-strong)' }}
              />
            </div>
            <div className="w-px h-10 self-center" style={{ background: 'var(--tech-border)' }} />
            <div className="text-right flex flex-col items-end">
              <div className="text-[10px] font-bold uppercase mb-0.5" style={{ color: 'var(--tech-text-muted)' }}>Fin</div>
              <div className="font-bold text-sm capitalize" style={{ color: 'var(--tech-text)' }}>
                {format(mission.end, 'EEEE d MMMM yyyy', { locale: fr })}
              </div>
              <input
                type="time"
                value={format(mission.end, 'HH:mm')}
                onChange={e => handleTimeChange('end', e.target.value)}
                className="text-xs font-semibold bg-transparent outline-none cursor-pointer text-right"
                style={{ color: 'var(--tech-text-secondary)', borderBottom: '1px dashed var(--tech-border-strong)' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="tech-card overflow-hidden">
        <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom: '1px solid var(--tech-border)' }}>
          <MapPin className="w-4 h-4 shrink-0" style={{ color: mission.color }} />
          <span className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--tech-text-muted)' }}>Lieu de rendez-vous</span>
        </div>
        <div className="p-4">
          <p className="font-bold text-sm leading-snug mb-3" style={{ color: 'var(--tech-text)' }}>{mission.address}</p>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mission.address)}`}
            target="_blank" rel="noopener noreferrer"
            onClick={() => triggerVibrate('click')}
            className="tech-btn text-xs"
            style={{ background: mission.color, color: '#fff' }}
          >
            <Navigation className="w-3.5 h-3.5" />
            Itinéraire Google Maps
          </a>
        </div>
      </div>

      {/* Truck */}
      {mission.truckId && (
        <div className="tech-card overflow-hidden">
          <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom: '1px solid var(--tech-border)' }}>
            <TruckIcon className="w-4 h-4 shrink-0" style={{ color: mission.color }} />
            <span className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--tech-text-muted)' }}>Véhicule assigné</span>
          </div>
          <div className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: mission.color + '20' }}>
              <TruckIcon className="w-5 h-5" style={{ color: mission.color }} />
            </div>
            <div>
              <div className="font-extrabold text-sm" style={{ color: 'var(--tech-text)' }}>{getTruckName(mission.truckId)}</div>
              <div className="text-xs font-medium mt-0.5" style={{ color: 'var(--tech-text-muted)' }}>Véhicule de la mission</div>
            </div>
          </div>
        </div>
      )}

      {/* Equipment shortcut */}
      {mission.equipments?.length > 0 && (
        <div
          className="p-4 rounded-2xl flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-all"
          style={{ border: `1px solid ${mission.color}30`, background: `${mission.color}08` }}
          onClick={() => { triggerVibrate('click'); setDrawerTab('equipment'); }}
        >
          <div className="relative w-12 h-12 shrink-0">
            <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
              <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
              <circle cx="18" cy="18" r="15" fill="none" stroke={mission.color} strokeWidth="3" strokeDasharray={`${prog.percent * 0.942} 100`} strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black" style={{ color: mission.color }}>{prog.percent}%</span>
          </div>
          <div className="flex-1">
            <div className="font-extrabold text-sm" style={{ color: 'var(--tech-text)' }}>Pointage matériel</div>
            <div className="text-xs font-semibold mt-0.5" style={{ color: 'var(--tech-text-muted)' }}>{prog.pointed} / {prog.total} éléments chargés</div>
          </div>
          <ChevronRight className="w-4 h-4 shrink-0" style={{ color: 'var(--tech-text-muted)' }} />
        </div>
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
      <div className="tech-card p-6 text-center space-y-2">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--tech-card)' }}>
          <Info className="w-7 h-7" style={{ color: 'var(--tech-text-muted)' }} />
        </div>
        <h4 className="font-bold text-sm" style={{ color: 'var(--tech-text)' }}>Pas de fiche client associée</h4>
        <p className="text-xs" style={{ color: 'var(--tech-text-muted)' }}>Ce client a été saisi manuellement.</p>
        <div className="mt-3 p-3 rounded-xl text-left" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--tech-border)' }}>
          <span className="text-[10px] font-bold uppercase" style={{ color: 'var(--tech-text-muted)' }}>Nom saisi</span>
          <div className="font-bold mt-0.5 text-sm" style={{ color: 'var(--tech-text)' }}>{mission.client}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 tech-stagger">
      <div className="tech-card overflow-hidden">
        <div className="px-4 pt-4 pb-3 flex items-center gap-3" style={{ borderBottom: '1px solid var(--tech-border)' }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-base shrink-0 shadow-xs" style={{ backgroundColor: mission.color }}>
            {client.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider inline-block mb-1" style={{ background: 'var(--tech-accent-soft)', color: 'var(--tech-accent)' }}>Fiche Client</div>
            <div className="font-black text-base leading-tight" style={{ color: 'var(--tech-text)' }}>{client.name}</div>
            {client.contactName && <p className="text-xs font-medium" style={{ color: 'var(--tech-text-muted)' }}>Contact : <span className="font-bold" style={{ color: 'var(--tech-text-secondary)' }}>{client.contactName}</span></p>}
          </div>
        </div>
        <div style={{ borderColor: 'var(--tech-border)' }}>
          {client.phone && (
            <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: '1px solid var(--tech-border)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(59,130,246,0.1)' }}><Phone className="w-4 h-4 text-blue-400" /></div>
              <div>
                <div className="text-[10px] font-bold uppercase" style={{ color: 'var(--tech-text-muted)' }}>Téléphone</div>
                <a href={`tel:${client.phone}`} onClick={() => triggerVibrate('click')} className="font-bold text-blue-400 text-sm hover:underline">{client.phone}</a>
              </div>
            </div>
          )}
          {client.email && (
            <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: '1px solid var(--tech-border)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(168,85,247,0.1)' }}><Mail className="w-4 h-4 text-purple-400" /></div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase" style={{ color: 'var(--tech-text-muted)' }}>Email</div>
                <a href={`mailto:${client.email}`} onClick={() => triggerVibrate('click')} className="font-bold text-purple-400 text-sm hover:underline truncate block">{client.email}</a>
              </div>
            </div>
          )}
          {client.address && (
            <div className="px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }}><MapPin className="w-4 h-4" style={{ color: 'var(--tech-text-muted)' }} /></div>
              <div>
                <div className="text-[10px] font-bold uppercase" style={{ color: 'var(--tech-text-muted)' }}>Adresse</div>
                <span className="font-semibold text-sm" style={{ color: 'var(--tech-text-secondary)' }}>{client.address}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick action buttons */}
      <div className="grid grid-cols-3 gap-2">
        {client.phone && (
          <>
            <a href={`tel:${client.phone}`} onClick={() => triggerVibrate('click')} className="tech-card flex flex-col items-center justify-center py-3.5 px-2 gap-1.5 active:scale-95 transition-all">
              <Phone className="w-5 h-5 text-blue-400" /><span className="text-[10px] font-extrabold" style={{ color: 'var(--tech-text-secondary)' }}>Appeler</span>
            </a>
            <a href={`sms:${client.phone}`} onClick={() => triggerVibrate('click')} className="tech-card flex flex-col items-center justify-center py-3.5 px-2 gap-1.5 active:scale-95 transition-all">
              <MessageSquare className="w-5 h-5 text-green-400" /><span className="text-[10px] font-extrabold" style={{ color: 'var(--tech-text-secondary)' }}>SMS</span>
            </a>
          </>
        )}
        {client.email && (
          <a href={`mailto:${client.email}?subject=Mission%20${encodeURIComponent(mission.title)}`} onClick={() => triggerVibrate('click')} className="tech-card flex flex-col items-center justify-center py-3.5 px-2 gap-1.5 active:scale-95 transition-all">
            <Mail className="w-5 h-5 text-purple-400" /><span className="text-[10px] font-extrabold" style={{ color: 'var(--tech-text-secondary)' }}>E-mail</span>
          </a>
        )}
      </div>

      {client.notes && (
        <div className="p-4 rounded-2xl space-y-2" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
          <h4 className="text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 text-amber-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Consignes & Notes Client
          </h4>
          <p className="text-xs font-semibold text-amber-200/80 leading-relaxed whitespace-pre-line">{client.notes}</p>
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
      <div className="tech-card overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--tech-border)' }}>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 shrink-0" style={{ color: mission.color }} />
            <span className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--tech-text-muted)' }}>Membres de l'équipe</span>
          </div>
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: mission.color }}>
            {mission.technicianIds.length}
          </span>
        </div>
        <ul>
          {team.map((tech: any) => (
            <li key={tech.id} className="px-4 py-3.5 flex items-center gap-3 transition-colors" style={{ borderBottom: '1px solid var(--tech-border)' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0" style={{ backgroundColor: tech.color }}>
                {tech.name.split(' ').map((n: string) => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm flex items-center gap-1.5 flex-wrap" style={{ color: 'var(--tech-text)' }}>
                  <span>{tech.name}</span>
                  {tech.isSelf && <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded" style={{ background: 'var(--tech-accent-soft)', color: 'var(--tech-accent)' }}>Vous</span>}
                </div>
                <p className="text-xs font-semibold truncate" style={{ color: 'var(--tech-text-muted)' }}>{tech.specialty}</p>
              </div>
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--tech-accent)' }} />
            </li>
          ))}
        </ul>
      </div>
      <div className="p-4 rounded-2xl flex items-start gap-3" style={{ border: `1px solid ${mission.color}25`, background: `${mission.color}08` }}>
        <Users className="w-4 h-4 shrink-0 mt-0.5" style={{ color: mission.color }} />
        <p className="text-[11px] leading-relaxed font-semibold" style={{ color: mission.color }}>
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
  return (
    <div className="space-y-3">
      <div className="tech-card overflow-hidden">
        <div className="px-4 pt-4 pb-3 space-y-2" style={{ borderBottom: '1px solid var(--tech-border)' }}>
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-sm" style={{ color: 'var(--tech-text)' }}>Chargement matériel</h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--tech-text-muted)' }}>Scannez ou cochez les éléments requis</p>
            </div>
            <div className="text-right">
              <span className="text-xl font-black" style={{ color: mission.color }}>{prog.percent}%</span>
              <div className="text-[10px] font-bold" style={{ color: 'var(--tech-text-muted)' }}>{prog.pointed}/{prog.total}</div>
            </div>
          </div>
          <div className="tech-progress-track">
            <div className="tech-progress-fill" style={{ width: `${prog.percent}%`, background: prog.percent === 100 ? 'var(--tech-accent)' : mission.color }} />
          </div>
          {mission.status !== 'Terminée' && (
            <button
              onClick={openScanner}
              className="w-full tech-btn text-xs mt-1"
              style={{ background: mission.color, color: '#fff' }}
            >
              <QrCode className="w-4 h-4" />Scanner un QR Code
            </button>
          )}
        </div>
        {mission.equipments?.length > 0 ? (
          <ul>
            {mission.equipments.map((me: any) => {
              const def = equipmentDefs.find((e: any) => e.id === me.equipmentId);
              const isChecked = !!me.checked;
              const isFlashing = scannedItemId === me.equipmentId;
              return (
                <li
                  key={me.equipmentId}
                  onClick={() => { if (mission.status !== 'Terminée') handleToggle(mission.id, me.equipmentId); }}
                  className={`px-4 py-3.5 flex items-center justify-between cursor-pointer transition-all ${isFlashing ? 'animate-pulse' : ''}`}
                  style={{
                    borderBottom: '1px solid var(--tech-border)',
                    background: isChecked ? 'rgba(6,193,103,0.06)' : isFlashing ? 'rgba(245,158,11,0.1)' : 'transparent',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0"
                      style={isChecked
                        ? { background: 'var(--tech-accent)', borderColor: 'var(--tech-accent)', color: '#000' }
                        : { borderColor: 'var(--tech-border-strong)', background: 'transparent' }
                      }
                    >
                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <span className={`text-sm font-bold ${isChecked ? 'line-through' : ''}`} style={{ color: isChecked ? 'var(--tech-text-muted)' : 'var(--tech-text)' }}>
                      {def?.name || 'Matériel inconnu'}
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md shrink-0" style={{
                    background: isChecked ? 'var(--tech-accent-soft)' : 'rgba(255,255,255,0.05)',
                    color: isChecked ? 'var(--tech-accent)' : 'var(--tech-text-secondary)',
                  }}>
                    ×{me.quantity}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="p-8 text-center text-xs italic" style={{ color: 'var(--tech-text-muted)' }}>
            Aucun matériel requis pour cette mission.
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   REPORT TAB
   ══════════════════════════════════════════════════════════════════════════ */
function ReportTab({ mission, localReports, savingStatus, handleReportChange }: any) {
  return (
    <div className="space-y-3 tech-stagger">
      <div className="tech-card overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--tech-border)' }}>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 shrink-0" style={{ color: mission.color }} />
            <span className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--tech-text-muted)' }}>Rapport de fin de mission</span>
          </div>
          <span className="text-[10px] font-bold font-mono">
            {savingStatus === 'saving' && <span className="text-amber-400">Enregistrement…</span>}
            {savingStatus === 'saved' && <span style={{ color: 'var(--tech-accent)' }}>Sauvegardé ✓</span>}
            {savingStatus === 'idle' && <span style={{ color: 'var(--tech-text-muted)' }}>Brouillon local</span>}
          </span>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-xs leading-relaxed" style={{ color: 'var(--tech-text-muted)' }}>
            Saisissez ici vos observations, retours, anomalies ou matériels endommagés.
          </p>
          <textarea
            placeholder="Ex: Le projecteur LED #4 ne s'allume pas..."
            value={localReports[mission.id] || ''}
            onChange={e => handleReportChange(mission.id, e.target.value)}
            rows={7}
            className="w-full text-sm rounded-xl p-3.5 outline-none transition-all resize-none font-medium"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--tech-border)',
              color: 'var(--tech-text)',
              caretColor: 'var(--tech-accent)',
            }}
          />
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold flex items-center gap-1" style={{ color: 'var(--tech-text-muted)' }}>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              Enregistré sur cet appareil uniquement
            </span>
            {localReports[mission.id] && (
              <button
                onClick={() => { triggerVibrate('click'); if (window.confirm('Voulez-vous effacer le rapport local ?')) handleReportChange(mission.id, ''); }}
                className="text-red-400 hover:text-red-300 text-xs font-bold cursor-pointer"
              >
                Effacer
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="tech-card p-4 text-[11px] leading-relaxed font-semibold flex items-start gap-2" style={{ color: 'var(--tech-text-muted)' }}>
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>Les rapports sont enregistrés sur votre terminal. L'administrateur les consultera lors de l'archivage ou du débriefing technique.</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   HOURS TAB (wrapper)
   ══════════════════════════════════════════════════════════════════════════ */
function HoursTab({ mission }: any) {
  return <TimeLogPanel missionId={mission.id} missionColor={mission.color} missionStatus={mission.status} />;
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN EXPORT
   ══════════════════════════════════════════════════════════════════════════ */
export default function DrawerTabs(props: DrawerTabsProps) {
  const { mission, drawerTab } = props;

  switch (drawerTab) {
    case 'general':
      return <GeneralTab mission={mission} getTruckName={props.getTruckName} getEquipmentProgress={props.getEquipmentProgress} setDrawerTab={props.setDrawerTab} handleTimeChange={props.handleTimeChange} />;
    case 'client':
      return <ClientTab mission={mission} getClientInfo={props.getClientInfo} />;
    case 'team':
      return <TeamTab mission={mission} getColleaguesDetailed={props.getColleaguesDetailed} />;
    case 'equipment':
      return <EquipmentTab mission={mission} getEquipmentProgress={props.getEquipmentProgress} equipmentDefs={props.equipmentDefs} handleToggle={props.handleToggle} openScanner={props.openScanner} scannedItemId={props.scannedItemId} />;
    case 'hours':
      return <HoursTab mission={mission} />;
    case 'report':
      return <ReportTab mission={mission} localReports={props.localReports} savingStatus={props.savingStatus} handleReportChange={props.handleReportChange} />;
    default:
      return null;
  }
}

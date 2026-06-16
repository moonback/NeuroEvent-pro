import React, { useMemo, useState } from 'react';
import { useStore } from '../store';
import { MissionType, MissionStatus } from '../types';
import {
  X, AlertTriangle, Calendar, Users, Plus, Trash2, MapPin, Check,
  Camera, FileText, Image, ArrowLeft, ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import Modal from './ui/Modal';
import { toast } from '../store/toast';
import { getDraftConflicts, rangesOverlap } from '../lib/conflicts';
import { SKILL_CATALOG } from '../lib/constants';
import { useIsMobile } from '../hooks/useMediaQuery';

interface MissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  missionId?: string | null;
  initialDates?: { start: Date; end: Date } | null;
}

const inputClass = 'w-full rounded-xl border border-[#e2e8f0] px-3.5 py-2.5 focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] outline-none bg-[#f8fafc] text-sm transition-all text-[#0f172a] placeholder-[#cbd5e1]';
const labelClass = 'block text-[10px] font-extrabold text-[#64748b] tracking-wider uppercase mb-1.5';

const typeColors: Record<MissionType, string> = {
  'Livraison': '#10b981',
  'Montage': '#3b82f6',
  'Démontage': '#ef4444',
  'Événement complet': '#8b5cf6',
};

function renderTechCard(tech: any, isChecked: boolean, toggleTech: (id: string) => void, triggerVibrate: () => void) {
  return (
    <label
      key={tech.id}
      onClick={triggerVibrate}
      className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all select-none hover:bg-slate-50 active:scale-95 duration-100 ${
        isChecked ? 'border-[#2563eb]/30 bg-blue-50/20' : 'border-[#e2e8f0] bg-white'
      }`}
    >
      <input
        type="checkbox"
        checked={isChecked}
        onChange={() => toggleTech(tech.id)}
        className="mr-2.5 h-4.5 w-4.5 text-[#2563eb] focus:ring-[#2563eb]/20 border-[#cbd5e1] rounded-lg transition-all"
      />
      <div className="flex flex-col">
        <span className="text-xs font-bold text-[#0f172a]">{tech.firstName} {tech.lastName}</span>
        <span className="text-[9px] font-semibold text-[#94a3b8]">{tech.specialty}</span>
      </div>
    </label>
  );
}

export default function MissionModal({ isOpen, onClose, missionId, initialDates }: MissionModalProps) {
  const missions = useStore((state) => state.missions);
  const technicians = useStore((state) => state.technicians);
  const trucks = useStore((state) => state.trucks);
  const equipment = useStore((state) => state.equipment);
  const clients = useStore((state) => state.clients);
  const addMission = useStore((state) => state.addMission);
  const updateMission = useStore((state) => state.updateMission);
  const deleteMission = useStore((state) => state.deleteMission);
  const unavailabilities = useStore((state) => state.unavailabilities);
  const fetchMissionPhotos = useStore((state) => state.fetchMissionPhotos);

  const existingMission = missionId ? missions.find((m) => m.id === missionId) : null;

  const [activeTab, setActiveTab] = useState<'general' | 'resources' | 'report'>('general');
  const [adminLightbox, setAdminLightbox] = useState<string | null>(null);
  React.useEffect(() => {
    if (isOpen && missionId) {
      fetchMissionPhotos(missionId).catch(console.error);
    }
  }, [isOpen, missionId, fetchMissionPhotos]);

  const [title, setTitle] = useState(existingMission?.title || '');
  const [client, setClient] = useState(existingMission?.client || '');
  const [clientId, setClientId] = useState(existingMission?.clientId || '');
  const [address, setAddress] = useState(existingMission?.address || '');
  const [type, setType] = useState<MissionType>(existingMission?.type || 'Montage');
  const [status, setStatus] = useState<MissionStatus>(existingMission?.status || 'Planifiée');

  const defaultStart = initialDates?.start || new Date();
  const defaultEnd = initialDates?.end || new Date(defaultStart.getTime() + 2 * 60 * 60 * 1000);
  const [startDate, setStartDate] = useState(format(existingMission?.start || defaultStart, "yyyy-MM-dd'T'HH:mm"));
  const [endDate, setEndDate] = useState(format(existingMission?.end || defaultEnd, "yyyy-MM-dd'T'HH:mm"));
  const [deliveryDate, setDeliveryDate] = useState(
    existingMission?.deliveryDate ? format(existingMission.deliveryDate, "yyyy-MM-dd'T'HH:mm") : ''
  );
  const [pickupDate, setPickupDate] = useState(
    existingMission?.pickupDate ? format(existingMission.pickupDate, "yyyy-MM-dd'T'HH:mm") : ''
  );
  const [setupDuration, setSetupDuration] = useState(
    existingMission?.setupDuration !== undefined && existingMission?.setupDuration !== null
      ? String(existingMission.setupDuration)
      : ''
  );

  const [selectedTechs, setSelectedTechs] = useState<string[]>(existingMission?.technicianIds || []);
  const [selectedTruck, setSelectedTruck] = useState<string>(existingMission?.truckId || '');
  const [requiredSkills, setRequiredSkills] = useState<string[]>(existingMission?.requiredSkills || []);
  const [selectedEquipments, setSelectedEquipments] = useState<{ equipmentId: string; quantity: number }[]>(
    existingMission?.equipments.map((eq) => ({ equipmentId: eq.equipmentId, quantity: eq.quantity })) || []
  );

  const isMobile = useIsMobile();
  const wizardOrder: Array<'general' | 'resources' | 'report'> = ['general', 'resources', 'report'];
  const resourcesStepOrder: Array<'equipment' | 'technicians'> = ['equipment', 'technicians'];
  const [wizardStep, setWizardStep] = useState<'general' | 'resources' | 'report'>('general');
  const [resourcesView, setResourcesView] = useState<'equipment' | 'technicians'>('equipment');
  const currentView = isMobile ? wizardStep : activeTab;

  const conflicts = useMemo(
    () =>
      getDraftConflicts(
        {
          id: missionId,
          start: new Date(startDate),
          end: new Date(endDate),
          technicianIds: selectedTechs,
          truckId: selectedTruck || undefined,
          requiredSkills,
          equipments: selectedEquipments.filter((eq) => eq.equipmentId !== ''),
        },
        missions, technicians, trucks, equipment, unavailabilities
      ),
    [missionId, startDate, endDate, selectedTechs, selectedTruck, requiredSkills, selectedEquipments, missions, technicians, trucks, equipment, unavailabilities]
  );

  if (!isOpen) return null;

  const addEquipmentSelection = () => setSelectedEquipments([...selectedEquipments, { equipmentId: '', quantity: 1 }]);
  const updateEquipmentSelection = (index: number, id: string, qty: number) => {
    const updated = [...selectedEquipments];
    updated[index] = { equipmentId: id, quantity: qty || 1 };
    setSelectedEquipments(updated);
  };
  const removeEquipmentSelection = (index: number) => setSelectedEquipments(selectedEquipments.filter((_, i) => i !== index));

  const triggerVibrate = () => {
    if ('vibrate' in navigator) navigator.vibrate(10);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) {
      toast.error('La date de fin doit être postérieure à la date de début.');
      return;
    }
    if (conflicts.length > 0) {
      const ok = window.confirm(`Conflits détectés :\n\n- ${conflicts.join('\n- ')}\n\nEnregistrer quand même ?`);
      if (!ok) return;
    }
    const delivery = deliveryDate ? new Date(deliveryDate) : null;
    const pickup = pickupDate ? new Date(pickupDate) : null;
    const setup = setupDuration ? parseInt(setupDuration, 10) : null;

    const missionData = {
      title,
      client: clientId ? (clients.find((c) => c.id === clientId)?.name ?? client) : client,
      clientId: clientId || undefined,
      address,
      type,
      status,
      start,
      end,
      technicianIds: selectedTechs,
      truckId: selectedTruck || undefined,
      requiredSkills,
      equipments: selectedEquipments.filter((eq) => eq.equipmentId !== ''),
      color: typeColors[type],
      deliveryDate: delivery,
      pickupDate: pickup,
      setupDuration: setup,
    };

    if (existingMission) updateMission(existingMission.id, missionData);
    else addMission(missionData);
    onClose();
  };

  const handleDelete = () => {
    if (existingMission && window.confirm(`Supprimer la mission « ${existingMission.title} » ? Cette action est définitive.`)) {
      deleteMission(existingMission.id);
      onClose();
    }
  };

  const toggleTech = (id: string) => setSelectedTechs((prev) => (prev.includes(id) ? prev.filter((tId) => tId !== id) : [...prev, id]));
  const toggleRequiredSkill = (id: string) => setRequiredSkills((prev) => (prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]));

  const categorizedTechs = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return { recommended: [], available: [], unavailable: [] };

    const recommended: typeof technicians = [];
    const available: typeof technicians = [];
    const unavailable: typeof technicians = [];

    const overlappingMissions = missions.filter((m) => m.id !== missionId && rangesOverlap(start, end, m.start, m.end));
    const overlappingUnavailabilities = unavailabilities.filter((u) => rangesOverlap(start, end, u.start, u.end));

    technicians.forEach((tech) => {
      const isUnavailable =
        overlappingMissions.some((m) => m.technicianIds.includes(tech.id)) ||
        overlappingUnavailabilities.some((u) => u.technicianId === tech.id);
      if (isUnavailable) unavailable.push(tech);
      else {
        const missingSkills = requiredSkills.filter((s) => !(tech.skills || []).includes(s));
        if (missingSkills.length === 0) recommended.push(tech);
        else available.push(tech);
      }
    });

    return { recommended, available, unavailable };
  }, [startDate, endDate, technicians, missions, unavailabilities, requiredSkills, missionId]);

  const TabGeneral = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2">
        <label htmlFor="mission-title" className={labelClass}>Titre de la mission</label>
        <input id="mission-title" required type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ex: Soirée annuelle Acme Corp" className={inputClass} />
      </div>

      <div>
        <label htmlFor="mission-client-select" className={labelClass}>Client</label>
        {clients.length > 0 ? (
          <div className="space-y-2">
            <select id="mission-client-select" value={clientId} onChange={(e) => { const id = e.target.value; setClientId(id); const c = clients.find((cl) => cl.id === id); if (c) setClient(c.name); }} className={inputClass}>
              <option value="">— Saisie libre —</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {!clientId && (
              <input id="mission-client" required type="text" value={client} onChange={(e) => setClient(e.target.value)} placeholder="Nom du client" aria-label="Nom du client (saisie libre)" className={inputClass} />
            )}
          </div>
        ) : (
          <input id="mission-client" required type="text" value={client} onChange={(e) => setClient(e.target.value)} placeholder="Nom du client" className={inputClass} />
        )}
      </div>

      <div>
        <label htmlFor="mission-type" className={labelClass}>Type</label>
        <select id="mission-type" value={type} onChange={(e) => setType(e.target.value as MissionType)} className={inputClass}>
          <option value="Livraison">Livraison</option>
          <option value="Montage">Montage</option>
          <option value="Démontage">Démontage</option>
          <option value="Événement complet">Événement complet</option>
        </select>
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="mission-address" className={labelClass}>Adresse de livraison</label>
        <div className="relative">
          <MapPin className="w-4 h-4 absolute left-3 top-3.5 text-[#94a3b8]" />
          <input id="mission-address" required type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="ex: 12 rue des Fêtes, 75019 Paris" className={`${inputClass} pl-9`} />
        </div>
      </div>

      <div>
        <label htmlFor="mission-start" className={labelClass}>Date de début évent</label>
        <input id="mission-start" required type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
      </div>

      <div>
        <label htmlFor="mission-end" className={labelClass}>Date de fin évent</label>
        <input id="mission-end" required type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
      </div>

      <div className="col-span-1 sm:col-span-2 border-t border-[#e2e8f0] pt-4 mt-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="mission-delivery" className={labelClass}>Livraison (Date & Heure)</label>
          <input id="mission-delivery" type="datetime-local" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="mission-pickup" className={labelClass}>Reprise (Date & Heure)</label>
          <input id="mission-pickup" type="datetime-local" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="mission-setup" className={labelClass}>Temps installation</label>
          <input id="mission-setup" type="number" min="0" placeholder="Durée en minutes" value={setupDuration} onChange={(e) => setSetupDuration(e.target.value)} className={inputClass} />
        </div>
      </div>

      <div className="sm:col-span-2">
        <label className={labelClass}>Statut de la mission</label>
        <div className="flex items-center gap-2 mt-1">
          {([
            { key: 'Planifiée', label: 'Planifiée', color: '#2563eb', bg: '#eff6ff', done: ['En cours', 'Terminée'].includes(status), active: status === 'Planifiée' },
            { key: 'En cours', label: 'En cours', color: '#d97706', bg: '#fffbeb', done: status === 'Terminée', active: status === 'En cours' },
            { key: 'Terminée', label: 'Terminée', color: '#059669', bg: '#ecfdf5', done: false, active: status === 'Terminée' },
          ] as const).map((step, i, arr) => (
            <React.Fragment key={step.key}>
              <button type="button" onClick={() => setStatus(step.key as MissionStatus)} className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-xs font-bold transition-all cursor-pointer active:scale-95 duration-100 ${step.active ? 'shadow-sm' : step.done ? 'opacity-60 hover:opacity-100' : 'border-[#e2e8f0] bg-white text-[#94a3b8]'}`}
                style={step.active ? { borderColor: step.color, backgroundColor: step.bg, color: step.color } : step.done ? { borderColor: step.color + '60', backgroundColor: step.bg, color: step.color } : {}}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 ${step.active || step.done ? 'text-white' : 'bg-slate-100 text-slate-400'}`}
                  style={step.active || step.done ? { backgroundColor: step.color } : {}}>
                  {step.done ? <Check className="w-3 h-3 stroke-[3]" /> : i + 1}
                </div>
                {step.label}
              </button>
              {i < arr.length - 1 && <div className={`flex-1 h-px rounded ${step.done || step.active ? 'bg-[#e2e8f0]' : 'bg-[#e2e8f0]'}`} />}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );

  const TabResources = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="mission-truck" className={labelClass}>Camion assigné</label>
          <select id="mission-truck" value={selectedTruck} onChange={(e) => setSelectedTruck(e.target.value)} className={inputClass}>
            <option value="">Aucun camion</option>
            {trucks.map((truck) => <option key={truck.id} value={truck.id}>{truck.name} ({truck.volume}m³)</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Compétences requises</label>
        <div className="flex flex-wrap gap-2">
          {SKILL_CATALOG.map((skill) => {
            const isSelected = requiredSkills.includes(skill.id);
            return (
              <button key={skill.id} type="button" onClick={() => { triggerVibrate(); toggleRequiredSkill(skill.id); }} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors border active:scale-95 duration-100 ${isSelected ? 'bg-violet-100 text-violet-800 border-violet-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                {skill.emoji} {skill.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className={labelClass}>Techniciens assignés</label>
        {technicians.length === 0 ? (
          <p className="text-xs text-[#64748b] italic">Aucun technicien enregistré.</p>
        ) : (
          <div className="space-y-4">
            {categorizedTechs.recommended.length > 0 && (
              <div>
                <h5 className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> Disponibles & Qualifiés</h5>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {categorizedTechs.recommended.map((tech) => renderTechCard(tech, selectedTechs.includes(tech.id), toggleTech, triggerVibrate))}
                </div>
              </div>
            )}
            {categorizedTechs.available.length > 0 && (
              <div>
                <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">{requiredSkills.length > 0 ? 'Disponibles (Compétences manquantes)' : 'Disponibles'}</h5>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {categorizedTechs.available.map((tech) => renderTechCard(tech, selectedTechs.includes(tech.id), toggleTech, triggerVibrate))}
                </div>
              </div>
            )}
            {categorizedTechs.unavailable.length > 0 && (
              <div>
                <h5 className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Indisponibles / Déjà pris</h5>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 opacity-60 hover:opacity-100 transition-opacity">
                  {categorizedTechs.unavailable.map((tech) => renderTechCard(tech, selectedTechs.includes(tech.id), toggleTech, triggerVibrate))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className={labelClass}>Matériel requis</label>
          <button type="button" onClick={() => { triggerVibrate(); addEquipmentSelection(); }} className="flex items-center gap-1 text-[11px] font-extrabold text-[#2563eb] hover:text-blue-700 transition-colors active:scale-95 duration-100"><Plus className="w-3.5 h-3.5" /><span>Ajouter une ligne</span></button>
        </div>
        {selectedEquipments.length === 0 ? (
          <div className="p-6 border border-dashed border-[#e2e8f0] rounded-2xl text-center text-xs text-[#94a3b8] italic">Aucun matériel sélectionné. Cliquez sur &quot;Ajouter une ligne&quot; ci-dessus.</div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1 no-scrollbar">
            {selectedEquipments.map((eq, index) => (
              <div key={index} className="flex items-center gap-2">
                <select value={eq.equipmentId} onChange={(e) => updateEquipmentSelection(index, e.target.value, eq.quantity)} aria-label="Matériel" className="flex-1 rounded-xl border border-[#e2e8f0] px-3.5 py-2.5 focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] outline-none text-xs bg-[#f8fafc] text-slate-700 transition-all">
                  <option value="">Sélectionner un équipement...</option>
                  {equipment.map((e) => <option key={e.id} value={e.id}>{e.name} (Max: {e.totalQuantity})</option>)}
                </select>
                <div className="flex items-center border border-[#e2e8f0] bg-white rounded-xl overflow-hidden shrink-0">
                  <button type="button" onClick={() => { triggerVibrate(); updateEquipmentSelection(index, eq.equipmentId, Math.max(1, eq.quantity - 1)); }} className="px-2.5 py-2 hover:bg-slate-50 text-slate-500 font-bold active:scale-95 duration-100">-</button>
                  <input type="number" min="1" value={eq.quantity} onChange={(e) => updateEquipmentSelection(index, eq.equipmentId, parseInt(e.target.value, 10) || 1)} aria-label="Quantité" className="w-12 text-center text-xs font-bold border-none outline-none focus:ring-0 select-all p-0 text-slate-800" />
                  <button type="button" onClick={() => { triggerVibrate(); updateEquipmentSelection(index, eq.equipmentId, eq.quantity + 1); }} className="px-2.5 py-2 hover:bg-slate-50 text-slate-500 font-bold active:scale-95 duration-100">+</button>
                </div>
                <button type="button" onClick={() => { triggerVibrate(); removeEquipmentSelection(index); }} aria-label="Retirer ce matériel" className="p-2.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all cursor-pointer active:scale-90"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const TabReport = () => {
    if (!existingMission) return null;
    const allPhotos = existingMission.photos || [];
    const before = allPhotos.filter((photo) => photo.type === 'before');
    const after = allPhotos.filter((photo) => photo.type === 'after');
    const hasPhotos = allPhotos.length > 0;

    if (!hasPhotos && !existingMission.photoBeforeUrl && !existingMission.photoAfterUrl && !existingMission.report && !existingMission.signatureUrl) {
      return (
        <div className="py-10 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center"><Camera className="w-6 h-6 text-slate-300" /></div>
          <p className="text-sm font-semibold text-slate-400">Aucun rapport technicien disponible</p>
          <p className="text-xs text-slate-300">Le rapport apparaîtra ici une fois la mission terminée par le technicien.</p>
        </div>
      );
    }

    const renderGrid = (photos: any[], legacyUrl: string | null | undefined, label: string, accent: string) => {
      const items = [...photos.map((p: any) => p.url), ...(legacyUrl && !photos.length ? [legacyUrl] : [])];
      if (!items.length) return null;
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: accent }} />
            <span className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: accent }}>{label} — {items.length} photo{items.length > 1 ? 's' : ''}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {items.map((url: string, i: number) => (
              <button key={i} type="button" onClick={() => setAdminLightbox(url)} className="aspect-square rounded-xl overflow-hidden border border-slate-200 hover:border-blue-400 transition-all group relative">
                <img src={url} alt={label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center"><Image className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" /></div>
              </button>
            ))}
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-5">
        <div>
          <label className={labelClass}><Camera className="w-3.5 h-3.5 inline mr-1" />Photos terrain</label>
          <div className="mt-2 space-y-4 bg-slate-50 border border-slate-200 rounded-2xl p-4">
            {renderGrid(before, existingMission.photoBeforeUrl, 'Avant Montage', '#2563eb')}
            {renderGrid(after, existingMission.photoAfterUrl, 'Après Montage', '#059669')}
          </div>
        </div>

        {existingMission.report && (
          <div>
            <label className={labelClass}><FileText className="w-3.5 h-3.5 inline mr-1" />Rapport de fin de mission</label>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap max-h-52 overflow-y-auto">{existingMission.report}</div>
          </div>
        )}

        {existingMission.signatureUrl && (
          <div>
            <label className={labelClass}>Signature du client (Bon de Livraison)</label>
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col items-center justify-center gap-2">
              <img src={existingMission.signatureUrl} alt="Signature" className="max-h-[150px] object-contain" />
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1"><Check className="w-3 h-3" /> Signé</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingMission ? 'Modifier la mission' : 'Nouvelle mission'}
      maxWidth="max-w-[95vw] sm:max-w-5xl"
      footer={
        <div className="flex justify-between items-center w-full">
          {existingMission ? (
            <button type="button" onClick={handleDelete} className="text-red-500 hover:text-red-700 font-bold text-xs hover:bg-red-50 px-3 py-2 rounded-xl transition-all cursor-pointer active:scale-95 duration-100">Supprimer la mission</button>
          ) : <div />}
          <div className="flex space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 border border-[#e2e8f0] rounded-xl text-slate-700 font-bold hover:bg-[#f1f5f9] transition-all text-xs cursor-pointer active:scale-95 duration-100">Annuler</button>
            <button type="submit" form="mission-form" className="px-5 py-2.5 bg-[#2563eb] text-white rounded-xl font-bold hover:bg-blue-700 transition-all text-xs shadow-xs cursor-pointer active:scale-95 duration-100">Enregistrer</button>
          </div>
        </div>
      }
    >
      {conflicts.length > 0 && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-2xs animate-pulse duration-1000" role="alert">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-sm mb-1.5">
            <AlertTriangle className="w-4.5 h-4.5 text-amber-600 shrink-0" />
            <span>Attention: {conflicts.length} conflit{conflicts.length > 1 ? 's' : ''} planning détecté{conflicts.length > 1 ? 's' : ''}</span>
          </div>
          <ul className="text-xs text-amber-700 list-disc pl-5 space-y-1">{conflicts.map((c, i) => <li key={i} className="font-semibold">{c}</li>)}</ul>
        </div>
      )}

      {isMobile ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            {currentView !== 'general' && (
              <button type="button" onClick={() => setWizardStep('general')} className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#64748b] px-2.5 py-1.5 rounded-xl border border-[#e2e8f0]"><ArrowLeft className="w-3.5 h-3.5" /> Retour</button>
            )}
            <div className="text-[10px] font-black text-[#94a3b8]">Étape {wizardOrder.indexOf(currentView) + 1}/{wizardOrder.length}</div>
            {currentView !== 'report' && (
              <button type="button" onClick={() => setWizardStep(wizardOrder[wizardOrder.indexOf(currentView) + 1])} className="inline-flex items-center gap-1 text-[10px] font-extrabold text-white bg-[#2563eb] px-2.5 py-1.5 rounded-xl">Suivant <ArrowRight className="w-3.5 h-3.5" /></button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {wizardOrder.map((step, i) => {
              const isActive = currentView === step;
              const isDone = wizardOrder.indexOf(currentView) > i;
              const color = step === 'report' ? '#059669' : '#2563eb';
              return (
                <React.Fragment key={step}>
                  {i > 0 && <div className="flex-1 h-px rounded" style={{ background: isDone ? color : '#e2e8f0' }} />}
                  <button type="button" onClick={() => setWizardStep(step)} className="h-7 w-7 rounded-full text-[10px] font-black text-white flex items-center justify-center" style={{ background: isActive || isDone ? color : '#cbd5e1' }}>{isDone && !isActive ? '✓' : i + 1}</button>
                  {i < wizardOrder.length - 1 && <div className="flex-1 h-px rounded" style={{ background: isDone ? color : '#e2e8f0' }} />}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex border-b border-[#e2e8f0] mb-5 select-none">
          <button type="button" onClick={() => setActiveTab('general')} className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer active:scale-95 duration-100 ${activeTab === 'general' ? 'border-[#2563eb] text-[#2563eb]' : 'border-transparent text-[#64748b] hover:text-[#334155]'}`}>
            <Calendar className="w-4 h-4" /><span>1. Général</span>
          </button>
          <button type="button" onClick={() => setActiveTab('resources')} className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer active:scale-95 duration-100 ${activeTab === 'resources' ? 'border-[#2563eb] text-[#2563eb]' : 'border-transparent text-[#64748b] hover:text-[#334155]'}`}>
            <Users className="w-4 h-4" /><span>2. Ressources & Matériel</span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{selectedTechs.length} tech • {selectedEquipments.filter(e => e.equipmentId).length} mat.</span>
          </button>
          {existingMission && (existingMission.report || existingMission.photoBeforeUrl || existingMission.photoAfterUrl || existingMission.signatureUrl || (existingMission.photos && existingMission.photos.length > 0)) && (
            <button type="button" onClick={() => setActiveTab('report')} className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer active:scale-95 duration-100 ${activeTab === 'report' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-[#64748b] hover:text-[#334155]'}`}>
              <FileText className="w-4 h-4" /><span>3. Rapport Tech.</span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-extrabold">✓</span>
            </button>
          )}
        </div>
      )}

      <form id="mission-form" onSubmit={handleSubmit} className="space-y-4">
        {currentView === 'general' && <TabGeneral />}
        {currentView === 'resources' && <TabResources />}
        {currentView === 'report' && existingMission && (
          <div className="animate-fade-in">
            <TabReport />
          </div>
        )}
      </form>

      {adminLightbox && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90" onClick={() => setAdminLightbox(null)}>
          <div className="relative max-w-[95vw] max-h-[90vh]">
            <img src={adminLightbox} alt="Photo" className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl" />
            <button onClick={() => setAdminLightbox(null)} className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center text-lg font-bold cursor-pointer">×</button>
            <a href={adminLightbox} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="absolute bottom-2 right-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/15 text-white">Ouvrir l’original ↗</a>
          </div>
        </div>
      )}
    </Modal>
  );
}

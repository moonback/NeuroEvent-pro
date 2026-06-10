import React, { useMemo, useState } from 'react';
import { useStore } from '../store';
import { MissionType, MissionStatus } from '../types';
import { X, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import Modal from './ui/Modal';
import { toast } from '../store/toast';
import { getDraftConflicts } from '../lib/conflicts';

interface MissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  missionId?: string | null;
  initialDates?: { start: Date; end: Date } | null;
}

const inputClass = 'w-full rounded-md border border-[#e2e8f0] px-3 py-2 focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none bg-[#f8fafc] text-sm';
const labelClass = 'block text-[10px] font-bold text-[#64748b] tracking-wider uppercase mb-1';

// Couleur d'affichage dérivée du type de mission.
const typeColors: Record<MissionType, string> = {
  'Livraison': '#10b981',
  'Montage': '#3b82f6',
  'Démontage': '#ef4444',
  'Événement complet': '#8b5cf6'
};

export default function MissionModal({ isOpen, onClose, missionId, initialDates }: MissionModalProps) {
  const missions = useStore(state => state.missions);
  const technicians = useStore(state => state.technicians);
  const trucks = useStore(state => state.trucks);
  const equipment = useStore(state => state.equipment);
  const clients = useStore(state => state.clients);
  const addMission = useStore(state => state.addMission);
  const updateMission = useStore(state => state.updateMission);
  const deleteMission = useStore(state => state.deleteMission);

  const existingMission = missionId ? missions.find(m => m.id === missionId) : null;

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

  const [selectedTechs, setSelectedTechs] = useState<string[]>(existingMission?.technicianIds || []);
  const [selectedTruck, setSelectedTruck] = useState<string>(existingMission?.truckId || '');
  const [selectedEquipments, setSelectedEquipments] = useState<{ equipmentId: string, quantity: number }[]>(
    existingMission?.equipments.map(e => ({ equipmentId: e.equipmentId, quantity: e.quantity })) || []
  );

  // Conflits recalculés en direct : double affectation technicien/camion
  // et sur-allocation de matériel sur les créneaux qui se chevauchent.
  const conflicts = useMemo(() => getDraftConflicts(
    {
      id: missionId,
      start: new Date(startDate),
      end: new Date(endDate),
      technicianIds: selectedTechs,
      truckId: selectedTruck || undefined,
      equipments: selectedEquipments.filter(e => e.equipmentId !== '')
    },
    missions, technicians, trucks, equipment
  ), [missionId, startDate, endDate, selectedTechs, selectedTruck, selectedEquipments, missions, technicians, trucks, equipment]);

  if (!isOpen) return null;

  const addEquipmentSelection = () => setSelectedEquipments([...selectedEquipments, { equipmentId: '', quantity: 1 }]);
  const updateEquipmentSelection = (index: number, id: string, qty: number) => {
    const updated = [...selectedEquipments];
    updated[index] = { equipmentId: id, quantity: qty || 1 };
    setSelectedEquipments(updated);
  };
  const removeEquipmentSelection = (index: number) => setSelectedEquipments(selectedEquipments.filter((_, i) => i !== index));

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

    const missionData = {
      title,
      client: clientId ? (clients.find(c => c.id === clientId)?.name ?? client) : client,
      clientId: clientId || undefined,
      address,
      type,
      status,
      start,
      end,
      technicianIds: selectedTechs,
      truckId: selectedTruck || undefined,
      equipments: selectedEquipments.filter(eq => eq.equipmentId !== ''),
      color: typeColors[type]
    };

    if (existingMission) {
      updateMission(existingMission.id, missionData);
    } else {
      addMission(missionData);
    }
    onClose();
  };

  const handleDelete = () => {
    if (existingMission && window.confirm(`Supprimer la mission « ${existingMission.title} » ? Cette action est définitive.`)) {
      deleteMission(existingMission.id);
      onClose();
    }
  };

  const toggleTech = (id: string) => {
    setSelectedTechs(prev => prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingMission ? 'Modifier la mission' : 'Nouvelle mission'}
      maxWidth="max-w-2xl"
      footer={
        <div className="flex justify-between items-center">
          {existingMission ? (
            <button type="button" onClick={handleDelete} className="text-red-600 hover:text-red-700 font-medium text-sm">
              Supprimer la mission
            </button>
          ) : <div></div>}
          <div className="flex space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-[#e2e8f0] rounded-md text-[#1e293b] font-medium hover:bg-[#f1f5f9] transition-colors text-sm">Annuler</button>
            <button type="submit" form="mission-form" className="px-4 py-2 bg-[#2563eb] text-white rounded-md font-medium hover:bg-blue-700 transition-colors text-sm">Enregistrer</button>
          </div>
        </div>
      }
    >
      <form id="mission-form" onSubmit={handleSubmit} className="space-y-6">
        {conflicts.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3" role="alert">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-sm mb-1">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Conflits détectés
            </div>
            <ul className="text-xs text-amber-700 list-disc pl-5 space-y-0.5">
              {conflicts.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label htmlFor="mission-title" className={labelClass}>Titre de la mission</label>
            <input id="mission-title" required type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="ex: Soirée annuelle Acme Corp" className={inputClass} />
          </div>

          <div>
            <label htmlFor="mission-client-select" className={labelClass}>Client</label>
            {clients.length > 0 ? (
              <>
                <select
                  id="mission-client-select"
                  value={clientId}
                  onChange={e => {
                    const id = e.target.value;
                    setClientId(id);
                    const c = clients.find(cl => cl.id === id);
                    if (c) setClient(c.name);
                  }}
                  className={inputClass}
                >
                  <option value="">— Saisie libre —</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {!clientId && (
                  <input
                    id="mission-client"
                    required
                    type="text"
                    value={client}
                    onChange={e => setClient(e.target.value)}
                    placeholder="Nom du client"
                    aria-label="Nom du client (saisie libre)"
                    className={`${inputClass} mt-2`}
                  />
                )}
              </>
            ) : (
              <input id="mission-client" required type="text" value={client} onChange={e => setClient(e.target.value)} placeholder="Nom du client" className={inputClass} />
            )}
          </div>

          <div>
            <label htmlFor="mission-type" className={labelClass}>Type</label>
            <select id="mission-type" value={type} onChange={e => setType(e.target.value as MissionType)} className={inputClass}>
              <option value="Livraison">Livraison</option>
              <option value="Montage">Montage</option>
              <option value="Démontage">Démontage</option>
              <option value="Événement complet">Événement complet</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="mission-address" className={labelClass}>Adresse</label>
            <input id="mission-address" required type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="ex: 12 rue des Fêtes, 75019 Paris" className={inputClass} />
          </div>

          <div>
            <label htmlFor="mission-start" className={labelClass}>Date de début</label>
            <input id="mission-start" required type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputClass} />
          </div>

          <div>
            <label htmlFor="mission-end" className={labelClass}>Date de fin</label>
            <input id="mission-end" required type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputClass} />
          </div>

          <fieldset className="sm:col-span-2">
            <legend className="block text-[10px] font-bold text-[#64748b] tracking-wider uppercase mb-2">Techniciens assignés</legend>
            {technicians.length === 0 ? (
              <p className="text-xs text-[#64748b] italic">Aucun technicien enregistré pour le moment.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {technicians.map(tech => (
                  <label key={tech.id} className="flex items-center p-3 border border-[#e2e8f0] rounded-lg cursor-pointer hover:bg-[#f1f5f9] transition-colors bg-[#fdfdfd]">
                    <input
                      type="checkbox"
                      checked={selectedTechs.includes(tech.id)}
                      onChange={() => toggleTech(tech.id)}
                      className="mr-3 h-4 w-4 text-[#2563eb] focus:ring-[#2563eb] border-[#e2e8f0] rounded"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#0f172a]">{tech.firstName} {tech.lastName}</span>
                      <span className="text-[10px] text-[#64748b]">{tech.specialty}</span>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </fieldset>

          <div className="col-span-2 sm:col-span-1">
            <label htmlFor="mission-truck" className={labelClass}>Camion assigné</label>
            <select id="mission-truck" value={selectedTruck} onChange={e => setSelectedTruck(e.target.value)} className={inputClass}>
              <option value="">Aucun camion</option>
              {trucks.map(truck => (
                <option key={truck.id} value={truck.id}>{truck.name} ({truck.volume}m³)</option>
              ))}
            </select>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label htmlFor="mission-status" className={labelClass}>Statut</label>
            <select id="mission-status" value={status} onChange={e => setStatus(e.target.value as MissionStatus)} className={inputClass}>
              <option value="Planifiée">Planifiée</option>
              <option value="En cours">En cours</option>
              <option value="Terminée">Terminée</option>
            </select>
          </div>

          <fieldset className="sm:col-span-2">
            <legend className="block text-[10px] font-bold text-[#64748b] tracking-wider uppercase mb-2">Matériel requis</legend>
            <div className="space-y-3">
              {selectedEquipments.map((eq, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <select
                    value={eq.equipmentId}
                    onChange={(e) => updateEquipmentSelection(index, e.target.value, eq.quantity)}
                    aria-label="Matériel"
                    className="flex-1 rounded-md border border-[#e2e8f0] px-3 py-2 focus:ring-[#2563eb] focus:border-[#2563eb] outline-none text-sm"
                  >
                    <option value="">Sélectionner du matériel</option>
                    {equipment.map(e => (
                      <option key={e.id} value={e.id}>{e.name} (Max: {e.totalQuantity})</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={eq.quantity}
                    onChange={(e) => updateEquipmentSelection(index, eq.equipmentId, parseInt(e.target.value))}
                    aria-label="Quantité"
                    className="w-24 rounded-md border border-[#e2e8f0] px-3 py-2 focus:ring-[#2563eb] focus:border-[#2563eb] outline-none text-sm"
                  />
                  <button type="button" onClick={() => removeEquipmentSelection(index)} aria-label="Retirer ce matériel" className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button type="button" onClick={addEquipmentSelection} className="text-sm text-[#2563eb] font-medium hover:text-blue-700">
                + Ajouter du matériel
              </button>
            </div>
          </fieldset>
        </div>
      </form>
    </Modal>
  );
}

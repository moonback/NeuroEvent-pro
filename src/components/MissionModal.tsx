import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Mission, MissionType, MissionStatus } from '../types';
import { X } from 'lucide-react';
import { format } from 'date-fns';

interface MissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  missionId?: string | null;
  initialDates?: { start: Date; end: Date } | null;
}

export default function MissionModal({ isOpen, onClose, missionId, initialDates }: MissionModalProps) {
  const store = useStore();
  const existingMission = missionId ? store.missions.find(m => m.id === missionId) : null;

  const [title, setTitle] = useState(existingMission?.title || '');
  const [client, setClient] = useState(existingMission?.client || '');
  const [address, setAddress] = useState(existingMission?.address || '');
  const [type, setType] = useState<MissionType>(existingMission?.type || 'Montage');
  const [status, setStatus] = useState<MissionStatus>(existingMission?.status || 'Planifiée');
  
  // Handling Dates
  const defaultStart = initialDates?.start || new Date();
  const defaultEnd = initialDates?.end || new Date(defaultStart.getTime() + 2 * 60 * 60 * 1000);
  
  const [startDate, setStartDate] = useState(format(existingMission?.start || defaultStart, "yyyy-MM-dd'T'HH:mm"));
  const [endDate, setEndDate] = useState(format(existingMission?.end || defaultEnd, "yyyy-MM-dd'T'HH:mm"));

  const [selectedTechs, setSelectedTechs] = useState<string[]>(existingMission?.technicianIds || []);
  const [selectedTruck, setSelectedTruck] = useState<string>(existingMission?.truckId || '');

  const [selectedEquipments, setSelectedEquipments] = useState<{equipmentId: string, quantity: number}[]>(existingMission?.equipments || []);

  const addEquipmentSelection = () => setSelectedEquipments([...selectedEquipments, { equipmentId: '', quantity: 1 }]);
  const updateEquipmentSelection = (index: number, id: string, qty: number) => {
    const updated = [...selectedEquipments];
    updated[index] = { equipmentId: id, quantity: qty || 1 };
    setSelectedEquipments(updated);
  };
  const removeEquipmentSelection = (index: number) => setSelectedEquipments(selectedEquipments.filter((_, i) => i !== index));

  // For simplicity, we just assign a color based on type
  const typeColors: Record<MissionType, string> = {
    'Livraison': '#10b981', // emerald
    'Montage': '#3b82f6', // blue
    'Démontage': '#ef4444', // red
    'Événement complet': '#8b5cf6' // violet
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const missionData = {
      title,
      client,
      address,
      type,
      status,
      start: new Date(startDate),
      end: new Date(endDate),
      technicianIds: selectedTechs,
      truckId: selectedTruck || undefined,
      equipments: selectedEquipments.filter(e => e.equipmentId !== ''),
      color: typeColors[type]
    };

    if (existingMission) {
      store.updateMission(existingMission.id, missionData);
    } else {
      store.addMission(missionData);
    }
    onClose();
  };

  const handleDelete = () => {
    if (existingMission) {
      store.deleteMission(existingMission.id);
      onClose();
    }
  };

  const toggleTech = (id: string) => {
    setSelectedTechs(prev => prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-[#e2e8f0]">
          <h2 className="text-xl font-bold text-[#0f172a] uppercase tracking-tight">{existingMission ? 'Modifier la mission' : 'Nouvelle mission'}</h2>
          <button onClick={onClose} className="text-[#94a3b8] hover:text-[#64748b]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-[#64748b] tracking-wider uppercase mb-1">Titre de la mission</label>
              <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full rounded-md border border-[#e2e8f0] px-3 py-2 focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none bg-[#f8fafc] text-sm" />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#64748b] tracking-wider uppercase mb-1">Client</label>
              <input required type="text" value={client} onChange={e => setClient(e.target.value)} className="w-full rounded-md border border-[#e2e8f0] px-3 py-2 focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none bg-[#f8fafc] text-sm" />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#64748b] tracking-wider uppercase mb-1">Type</label>
              <select value={type} onChange={e => setType(e.target.value as MissionType)} className="w-full rounded-md border border-[#e2e8f0] px-3 py-2 focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none bg-[#f8fafc] text-sm">
                <option value="Livraison">Livraison</option>
                <option value="Montage">Montage</option>
                <option value="Démontage">Démontage</option>
                <option value="Événement complet">Événement complet</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-[#64748b] tracking-wider uppercase mb-1">Adresse</label>
              <input required type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full rounded-md border border-[#e2e8f0] px-3 py-2 focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none bg-[#f8fafc] text-sm" />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#64748b] tracking-wider uppercase mb-1">Date de début</label>
              <input required type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full rounded-md border border-[#e2e8f0] px-3 py-2 focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none bg-[#f8fafc] text-sm" />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#64748b] tracking-wider uppercase mb-1">Date de fin</label>
              <input required type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full rounded-md border border-[#e2e8f0] px-3 py-2 focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none bg-[#f8fafc] text-sm" />
            </div>

            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-[#64748b] tracking-wider uppercase mb-2">Techniciens assignés</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {store.technicians.map(tech => (
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
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[10px] font-bold text-[#64748b] tracking-wider uppercase mb-1">Camion assigné</label>
              <select value={selectedTruck} onChange={e => setSelectedTruck(e.target.value)} className="w-full rounded-md border border-[#e2e8f0] px-3 py-2 focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none bg-[#f8fafc] text-sm">
                <option value="">Aucun camion</option>
                {store.trucks.map(truck => (
                  <option key={truck.id} value={truck.id}>{truck.name} ({truck.volume}m³)</option>
                ))}
              </select>
            </div>

           <div className="col-span-2 sm:col-span-1">
              <label className="block text-[10px] font-bold text-[#64748b] tracking-wider uppercase mb-1">Statut</label>
              <select value={status} onChange={e => setStatus(e.target.value as MissionStatus)} className="w-full rounded-md border border-[#e2e8f0] px-3 py-2 focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none bg-[#f8fafc] text-sm">
                <option value="Planifiée">Planifiée</option>
                <option value="En cours">En cours</option>
                <option value="Terminée">Terminée</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-[#64748b] tracking-wider uppercase mb-2">Matériel requis</label>
              <div className="space-y-3">
                {selectedEquipments.map((eq, index) => {
                  const item = store.equipment.find(e => e.id === eq.equipmentId);
                  return (
                    <div key={index} className="flex items-center space-x-3">
                      <select 
                        value={eq.equipmentId}
                        onChange={(e) => updateEquipmentSelection(index, e.target.value, eq.quantity)}
                        className="flex-1 rounded-md border border-[#e2e8f0] px-3 py-2 focus:ring-[#2563eb] focus:border-[#2563eb] outline-none text-sm"
                      >
                        <option value="">Sélectionner du matériel</option>
                        {store.equipment.map(e => (
                          <option key={e.id} value={e.id}>{e.name} (Max: {e.totalQuantity})</option>
                        ))}
                      </select>
                      <input 
                        type="number" 
                        min="1" 
                        value={eq.quantity}
                        onChange={(e) => updateEquipmentSelection(index, eq.equipmentId, parseInt(e.target.value))}
                        className="w-24 rounded-md border border-[#e2e8f0] px-3 py-2 focus:ring-[#2563eb] focus:border-[#2563eb] outline-none text-sm"
                      />
                      <button type="button" onClick={() => removeEquipmentSelection(index)} className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
                <button type="button" onClick={addEquipmentSelection} className="text-sm text-[#2563eb] font-medium hover:text-blue-700">
                  + Ajouter du matériel
                </button>
              </div>
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-between items-center shrink-0">
          {existingMission ? (
             <button type="button" onClick={handleDelete} className="text-red-600 hover:text-red-700 font-medium text-sm">
                Supprimer la mission
             </button>
          ) : <div></div>}
          <div className="flex space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-[#e2e8f0] rounded-md text-[#1e293b] font-medium hover:bg-[#f1f5f9] transition-colors">Annuler</button>
            <button type="button" onClick={handleSubmit} className="px-4 py-2 bg-[#2563eb] text-white rounded-md font-medium hover:bg-blue-700 transition-colors">Enregistrer</button>
          </div>
        </div>
      </div>
    </div>
  );
}

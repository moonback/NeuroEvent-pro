import React, { useState } from 'react';
import { useStore } from '../store';
import { Truck } from '../types';
import Modal from './ui/Modal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Si fourni, la modale passe en mode édition (avec suppression possible). */
  truck?: Truck | null;
}

const inputClass = 'w-full rounded-md border border-[#e2e8f0] px-3 py-2 focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none bg-[#f8fafc] text-sm';
const labelClass = 'block text-[10px] font-bold text-[#64748b] tracking-wider uppercase mb-1';

export default function TruckModal({ isOpen, onClose, truck = null }: Props) {
  const addTruck = useStore(state => state.addTruck);
  const updateTruck = useStore(state => state.updateTruck);
  const deleteTruck = useStore(state => state.deleteTruck);

  const [name, setName] = useState(truck?.name || '');
  const [plate, setPlate] = useState(truck?.plate || '');
  const [volume, setVolume] = useState<number>(truck?.volume ?? 20);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (truck) {
      updateTruck(truck.id, { name, plate, volume });
    } else {
      addTruck({ name, plate, volume });
    }
    onClose();
  };

  const handleDelete = () => {
    if (truck && window.confirm(`Supprimer le camion ${truck.name} ? Les missions qui l'utilisent perdront leur véhicule.`)) {
      deleteTruck(truck.id);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={truck ? 'Modifier le camion' : 'Nouveau camion'}
      footer={
        <div className="flex justify-between items-center">
          {truck ? (
            <button type="button" onClick={handleDelete} className="text-red-600 hover:text-red-700 font-medium text-sm">
              Supprimer
            </button>
          ) : <div></div>}
          <div className="flex space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-[#e2e8f0] rounded-md text-[#1e293b] font-medium hover:bg-[#f1f5f9] transition-colors text-sm">Annuler</button>
            <button type="submit" form="truck-form" className="px-4 py-2 bg-[#2563eb] text-white rounded-md font-medium hover:bg-blue-700 transition-colors text-sm">Enregistrer</button>
          </div>
        </div>
      }
    >
      <form id="truck-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="truck-name" className={labelClass}>Nom du véhicule</label>
          <input id="truck-name" required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="ex: Renault Master" className={inputClass} />
        </div>
        <div>
          <label htmlFor="truck-plate" className={labelClass}>Plaque d'immatriculation</label>
          <input id="truck-plate" required type="text" value={plate} onChange={e => setPlate(e.target.value)} placeholder="ex: AB-123-CD" className={inputClass} />
        </div>
        <div>
          <label htmlFor="truck-volume" className={labelClass}>Volume (m³)</label>
          <input id="truck-volume" required type="number" min="1" value={volume} onChange={e => setVolume(Number(e.target.value))} className={inputClass} />
        </div>
      </form>
    </Modal>
  );
}

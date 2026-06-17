import React, { useState } from 'react';
import { useStore } from '../store';
import { toast } from '../store/toast';
import { Truck } from '../types';
import Modal from './ui/Modal';
import ConfirmModal from './ui/ConfirmModal';
import { truckSchema, type TruckFormValues } from '../lib/validations';

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
  const [volume, setVolume] = useState(truck?.volume?.toString() || '');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof TruckFormValues, string>>>({});

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name,
      plate,
      volume: Number(volume),
    };
    const result = truckSchema.safeParse(data);
    if (!result.success) {
      const fieldErrs: Partial<Record<keyof TruckFormValues, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof TruckFormValues;
        fieldErrs[key] = issue.message;
      }
      setFormErrors(fieldErrs);
      toast.error('Corrigez les erreurs du formulaire.');
      return;
    }
    setFormErrors({});
    if (truck) {
      updateTruck(truck.id, data);
    } else {
      addTruck(data);
    }
    onClose();
  };

  const handleDelete = () => setConfirmDelete(true);

  const confirmDeleteAction = () => {
    if (truck) {
      deleteTruck(truck.id);
      onClose();
    }
    setConfirmDelete(false);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={truck ? 'Modifier le camion' : 'Nouveau camion'}
        maxWidth="max-w-lg"
        footer={
          <div className="flex justify-between items-center">
            {truck ? (
              <button type="button" onClick={handleDelete} className="text-red-600 hover:text-red-700 font-medium text-sm">
                Supprimer
              </button>
            ) : <div></div>}
            <div className="flex space-x-3">
              <button type="button" onClick={onClose} className="px-4 py-2 border border-[#e2e8f0] rounded-md text-[#1e293b] font-medium hover:bg-[#f1f5f9] transition-colors text-sm">
                Annuler
              </button>
              <button type="submit" form="truck-form" className="px-4 py-2 bg-[#2563eb] text-white rounded-md font-medium hover:bg-blue-700 transition-colors text-sm">
                Enregistrer
              </button>
            </div>
          </div>
        }
      >
        <form id="truck-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="truck-name" className={labelClass}>Nom du camion</label>
            <input id="truck-name" required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="ex: Renault Master" className={inputClass} />
            {formErrors.name && <span className="text-red-500 text-xs">{formErrors.name}</span>}
          </div>
          <div>
            <label htmlFor="truck-plate" className={labelClass}>Plaque d'immatriculation</label>
            <input id="truck-plate" required type="text" value={plate} onChange={e => setPlate(e.target.value)} placeholder="ex: AB-123-CD" className={inputClass} />
            {formErrors.plate && <span className="text-red-500 text-xs">{formErrors.plate}</span>}
          </div>
          <div>
            <label htmlFor="truck-volume" className={labelClass}>Volume (m³)</label>
            <input id="truck-volume" required type="number" value={volume} onChange={e => setVolume(e.target.value)} min="0" step="0.1" className={inputClass} />
            {formErrors.volume && <span className="text-red-500 text-xs">{formErrors.volume}</span>}
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={confirmDelete}
        title="Supprimer le camion ?"
        message={`Supprimer le camion « ${truck?.name} » ?`}
        confirmLabel="Supprimer"
        variant="danger"
        onConfirm={confirmDeleteAction}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
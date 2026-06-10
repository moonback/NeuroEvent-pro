import React, { useState } from 'react';
import { useStore } from '../store';
import { Technician } from '../types';
import Modal from './ui/Modal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Si fourni, la modale passe en mode édition (avec suppression possible). */
  technician?: Technician | null;
}

const inputClass = 'w-full rounded-md border border-[#e2e8f0] px-3 py-2 focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none bg-[#f8fafc] text-sm';
const labelClass = 'block text-[10px] font-bold text-[#64748b] tracking-wider uppercase mb-1';

export default function TechnicianModal({ isOpen, onClose, technician = null }: Props) {
  const addTechnician = useStore(state => state.addTechnician);
  const updateTechnician = useStore(state => state.updateTechnician);
  const deleteTechnician = useStore(state => state.deleteTechnician);

  const [firstName, setFirstName] = useState(technician?.firstName || '');
  const [lastName, setLastName] = useState(technician?.lastName || '');
  const [specialty, setSpecialty] = useState(technician?.specialty || '');
  const [color, setColor] = useState(technician?.color || '#3b82f6');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (technician) {
      updateTechnician(technician.id, { firstName, lastName, specialty, color });
    } else {
      addTechnician({ firstName, lastName, specialty, color });
    }
    onClose();
  };

  const handleDelete = () => {
    if (technician && window.confirm(`Supprimer ${technician.firstName} ${technician.lastName} ? Ses affectations aux missions seront retirées.`)) {
      deleteTechnician(technician.id);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={technician ? 'Modifier le technicien' : 'Nouveau technicien'}
      footer={
        <div className="flex justify-between items-center">
          {technician ? (
            <button type="button" onClick={handleDelete} className="text-red-600 hover:text-red-700 font-medium text-sm">
              Supprimer
            </button>
          ) : <div></div>}
          <div className="flex space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-[#e2e8f0] rounded-md text-[#1e293b] font-medium hover:bg-[#f1f5f9] transition-colors text-sm">Annuler</button>
            <button type="submit" form="technician-form" className="px-4 py-2 bg-[#2563eb] text-white rounded-md font-medium hover:bg-blue-700 transition-colors text-sm">Enregistrer</button>
          </div>
        </div>
      }
    >
      <form id="technician-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="tech-firstname" className={labelClass}>Prénom</label>
          <input id="tech-firstname" required type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="tech-lastname" className={labelClass}>Nom</label>
          <input id="tech-lastname" required type="text" value={lastName} onChange={e => setLastName(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="tech-specialty" className={labelClass}>Spécialité</label>
          <input id="tech-specialty" required type="text" value={specialty} onChange={e => setSpecialty(e.target.value)} placeholder="ex: Son, Lumière, Montage" className={inputClass} />
        </div>
        <div>
          <label htmlFor="tech-color" className={labelClass}>Couleur d'affichage</label>
          <input id="tech-color" required type="color" value={color} onChange={e => setColor(e.target.value)} className="h-10 w-full rounded-md border border-[#e2e8f0] cursor-pointer" />
        </div>
      </form>
    </Modal>
  );
}

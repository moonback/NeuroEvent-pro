import React, { useState } from 'react';
import { useStore } from '../store';
import { Equipment, EquipmentCategory } from '../types';
import Modal from './ui/Modal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Si fourni, la modale passe en mode édition (avec suppression possible). */
  equipment?: Equipment | null;
}

const inputClass = 'w-full rounded-md border border-[#e2e8f0] px-3 py-2 focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none bg-[#f8fafc] text-sm';
const labelClass = 'block text-[10px] font-bold text-[#64748b] tracking-wider uppercase mb-1';

export default function EquipmentModal({ isOpen, onClose, equipment = null }: Props) {
  const addEquipment = useStore(state => state.addEquipment);
  const updateEquipment = useStore(state => state.updateEquipment);
  const deleteEquipment = useStore(state => state.deleteEquipment);

  const [name, setName] = useState(equipment?.name || '');
  const [category, setCategory] = useState<EquipmentCategory>(equipment?.category || 'Arcade');
  const [totalQuantity, setTotalQuantity] = useState<number>(equipment?.totalQuantity ?? 1);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (equipment) {
      updateEquipment(equipment.id, { name, category, totalQuantity });
    } else {
      addEquipment({ name, category, totalQuantity });
    }
    onClose();
  };

  const handleDelete = () => {
    if (equipment && window.confirm(`Supprimer « ${equipment.name} » ? Il sera retiré des missions qui l'utilisent.`)) {
      deleteEquipment(equipment.id);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={equipment ? 'Modifier le matériel' : 'Nouveau matériel'}
      footer={
        <div className="flex justify-between items-center">
          {equipment ? (
            <button type="button" onClick={handleDelete} className="text-red-600 hover:text-red-700 font-medium text-sm">
              Supprimer
            </button>
          ) : <div></div>}
          <div className="flex space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-[#e2e8f0] rounded-md text-[#1e293b] font-medium hover:bg-[#f1f5f9] transition-colors text-sm">Annuler</button>
            <button type="submit" form="equipment-form" className="px-4 py-2 bg-[#2563eb] text-white rounded-md font-medium hover:bg-blue-700 transition-colors text-sm">Enregistrer</button>
          </div>
        </div>
      }
    >
      <form id="equipment-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="eq-name" className={labelClass}>Nom de l'équipement</label>
          <input id="eq-name" required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="ex: Borne d'arcade retro" className={inputClass} />
        </div>
        <div>
          <label htmlFor="eq-category" className={labelClass}>Catégorie</label>
          <select id="eq-category" required value={category} onChange={e => setCategory(e.target.value as EquipmentCategory)} className={inputClass}>
            <option value="Arcade">Arcade</option>
            <option value="Sonorisation">Sonorisation</option>
            <option value="Éclairage">Éclairage</option>
            <option value="Scène">Scène</option>
            <option value="Décoration">Décoration</option>
            <option value="Autre">Autre</option>
          </select>
        </div>
        <div>
          <label htmlFor="eq-quantity" className={labelClass}>Quantité totale au dépôt</label>
          <input id="eq-quantity" required type="number" min="1" value={totalQuantity} onChange={e => setTotalQuantity(Number(e.target.value))} className={inputClass} />
        </div>
      </form>
    </Modal>
  );
}

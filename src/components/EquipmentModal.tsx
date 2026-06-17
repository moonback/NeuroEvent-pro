import React, { useState } from 'react';
import { useStore } from '../store';
import { toast } from '../store/toast';
import { Equipment, EquipmentCategory } from '../types';
import Modal from './ui/Modal';
import ConfirmModal from './ui/ConfirmModal';
import { equipmentSchema, type EquipmentFormValues } from '../lib/validations';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Si fourni, la modale passe en mode édition (avec suppression possible). */
  equipment?: Equipment | null;
}

const inputClass = 'w-full rounded-md border border-[#e2e8f0] px-3 py-2 focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none bg-[#f8fafc] text-sm';
const labelClass = 'block text-[10px] font-bold text-[#64748b] tracking-wider uppercase mb-1';

const equipmentCategories: EquipmentCategory[] = [
  'Arcade',
  'Sonorisation',
  'Éclairage',
  'Scène',
  'Décoration',
  'Autre',
];

export default function EquipmentModal({ isOpen, onClose, equipment = null }: Props) {
  const addEquipment = useStore(state => state.addEquipment);
  const updateEquipment = useStore(state => state.updateEquipment);
  const deleteEquipment = useStore(state => state.deleteEquipment);

  const [name, setName] = useState(equipment?.name || '');
  const [category, setCategory] = useState<EquipmentCategory | ''>(equipment?.category ?? '');
  const [totalQuantity, setTotalQuantity] = useState(equipment?.totalQuantity?.toString() || '');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof EquipmentFormValues, string>>>({});

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name,
      category: category as EquipmentCategory,
      totalQuantity: Number(totalQuantity),
    };
    const result = equipmentSchema.safeParse(data);
    if (!result.success) {
      const fieldErrs: Partial<Record<keyof EquipmentFormValues, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof EquipmentFormValues;
        fieldErrs[key] = issue.message;
      }
      setFormErrors(fieldErrs);
      toast.error('Corrigez les erreurs du formulaire.');
      return;
    }
    setFormErrors({});
    if (equipment) {
      updateEquipment(equipment.id, data);
    } else {
      addEquipment(data);
    }
    onClose();
  };

  const handleDelete = () => setConfirmDelete(true);

  const confirmDeleteAction = () => {
    if (equipment) {
      deleteEquipment(equipment.id);
      onClose();
    }
    setConfirmDelete(false);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={equipment ? 'Modifier le matériel' : 'Nouveau matériel'}
        maxWidth="max-w-lg"
        footer={
          <div className="flex justify-between items-center">
            {equipment ? (
              <button type="button" onClick={handleDelete} className="text-red-600 hover:text-red-700 font-medium text-sm">
                Supprimer
              </button>
            ) : <div></div>}
            <div className="flex space-x-3">
              <button type="button" onClick={onClose} className="px-4 py-2 border border-[#e2e8f0] rounded-md text-[#1e293b] font-medium hover:bg-[#f1f5f9] transition-colors text-sm">
                Annuler
              </button>
              <button type="submit" form="equipment-form" className="px-4 py-2 bg-[#2563eb] text-white rounded-md font-medium hover:bg-blue-700 transition-colors text-sm">
                Enregistrer
              </button>
            </div>
          </div>
        }
      >
        <form id="equipment-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="equipment-name" className={labelClass}>Nom du matériel</label>
            <input id="equipment-name" required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="ex: Micro Shure SM58" className={inputClass} />
            {formErrors.name && <span className="text-red-500 text-xs">{formErrors.name}</span>}
          </div>
          <div>
            <label htmlFor="equipment-category" className={labelClass}>Catégorie</label>
            <select id="equipment-category" value={category} onChange={e => setCategory(e.target.value as EquipmentCategory)} className={inputClass}>
              {equipmentCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {formErrors.category && <span className="text-red-500 text-xs">{formErrors.category}</span>}
          </div>
          <div>
            <label htmlFor="equipment-quantity" className={labelClass}>Quantité totale</label>
            <input id="equipment-quantity" required type="number" value={totalQuantity} onChange={e => setTotalQuantity(e.target.value)} min="1" className={inputClass} />
            {formErrors.totalQuantity && <span className="text-red-500 text-xs">{formErrors.totalQuantity}</span>}
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={confirmDelete}
        title="Supprimer le matériel ?"
        message={`Supprimer le matériel « ${equipment?.name} » ?`}
        confirmLabel="Supprimer"
        variant="danger"
        onConfirm={confirmDeleteAction}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
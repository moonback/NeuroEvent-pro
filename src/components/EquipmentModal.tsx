import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useStore } from '../store';
import { EquipmentCategory } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function EquipmentModal({ isOpen, onClose }: Props) {
  const store = useStore();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<EquipmentCategory>('Arcade');
  const [totalQuantity, setTotalQuantity] = useState<number>(1);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    store.addEquipment({ name, category, totalQuantity });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-[#e2e8f0]">
          <h2 className="text-lg font-bold text-[#0f172a] uppercase tracking-tight">Nouveau Matériel</h2>
          <button onClick={onClose} className="text-[#94a3b8] hover:text-[#64748b]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-[#64748b] tracking-wider uppercase mb-1">Nom de l'équipement</label>
            <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="ex: Borne d'arcade retro" className="w-full rounded-md border border-[#e2e8f0] px-3 py-2 focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none bg-[#f8fafc] text-sm" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#64748b] tracking-wider uppercase mb-1">Catégorie</label>
            <select required value={category} onChange={e => setCategory(e.target.value as EquipmentCategory)} className="w-full rounded-md border border-[#e2e8f0] px-3 py-2 focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none bg-[#f8fafc] text-sm">
              <option value="Arcade">Arcade</option>
              <option value="Sonorisation">Sonorisation</option>
              <option value="Éclairage">Éclairage</option>
              <option value="Scène">Scène</option>
              <option value="Décoration">Décoration</option>
              <option value="Autre">Autre</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#64748b] tracking-wider uppercase mb-1">Quantité totale au dépôt</label>
            <input required type="number" min="1" value={totalQuantity} onChange={e => setTotalQuantity(Number(e.target.value))} className="w-full rounded-md border border-[#e2e8f0] px-3 py-2 focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none bg-[#f8fafc] text-sm" />
          </div>
        </form>

        <div className="p-6 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-end shrink-0 space-x-3">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-[#e2e8f0] rounded-md text-[#1e293b] font-medium hover:bg-[#f1f5f9] transition-colors text-sm">Annuler</button>
          <button type="button" onClick={handleSubmit} className="px-4 py-2 bg-[#2563eb] text-white rounded-md font-medium hover:bg-blue-700 transition-colors text-sm">Enregistrer</button>
        </div>
      </div>
    </div>
  );
}

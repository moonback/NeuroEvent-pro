import React, { useState } from 'react';
import { useStore } from '../store';
import { Technician } from '../types';
import Modal from './ui/Modal';
import { Award, Car, Shield } from 'lucide-react';

const SKILL_CATALOG = [
  { id: 'montage_scene',     label: 'Montage scène',     emoji: '🎭' },
  { id: 'sono',              label: 'Sonorisation',       emoji: '🔊' },
  { id: 'eclairage',         label: 'Éclairage',          emoji: '💡' },
  { id: 'video',             label: 'Vidéo / Mapping',    emoji: '📽️' },
  { id: 'rigging',           label: 'Rigging',            emoji: '⛓️' },
  { id: 'electricite',       label: 'Électricité',        emoji: '⚡' },
  { id: 'decoration',        label: 'Décoration',         emoji: '🎀' },
  { id: 'securite',          label: 'Sécurité événement', emoji: '🦺' },
  { id: 'logistique',        label: 'Logistique',         emoji: '📦' },
  { id: 'conduite_poids',    label: 'Conduite poids lourd', emoji: '🚛' },
  { id: 'nacelle',           label: 'Nacelle / PEMP',    emoji: '🏗️' },
  { id: 'coordination',      label: 'Coordination équipe', emoji: '📋' },
  { id: 'manutention',       label: 'Manutention',        emoji: '🪝' },
  { id: 'froid',             label: 'Froid / Clim.',      emoji: '❄️' },
];

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

        {/* Read-only skills & license display for planning team */}
        {technician && (
          <div className="pt-4 border-t border-[#e2e8f0] space-y-4">
            <h4 className="text-xs font-bold text-[#0f172a] uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-violet-500" /> Profil Complété
            </h4>
            
            {/* Skills */}
            {technician.skills && technician.skills.length > 0 && (
              <div>
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-[#64748b] tracking-wider uppercase mb-2">
                  <Award className="w-3.5 h-3.5" /> Compétences
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {technician.skills.map(skillId => {
                    const def = SKILL_CATALOG.find(s => s.id === skillId);
                    return (
                      <span key={skillId} className="px-2 py-1 bg-violet-50 text-violet-700 text-[10px] font-bold rounded border border-violet-100 flex items-center gap-1">
                        <span>{def?.emoji}</span>
                        <span>{def?.label || skillId}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* License */}
            {technician.driverLicense?.hasLicense && (
              <div>
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-[#64748b] tracking-wider uppercase mb-2">
                  <Car className="w-3.5 h-3.5" /> Permis de conduire
                </label>
                <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-md p-3 text-xs space-y-2">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-[#0f172a]">Catégories</span>
                    <span className="text-blue-600">{technician.driverLicense.categories?.join(', ') || '-'}</span>
                  </div>
                  {technician.driverLicense.since && (
                    <div className="flex items-center justify-between text-[10px] font-medium text-[#64748b]">
                      <span>Obtention</span>
                      <span>{new Date(technician.driverLicense.since).toLocaleDateString('fr-FR')}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(!technician.skills?.length && !technician.driverLicense?.hasLicense) && (
              <p className="text-[10px] text-[#94a3b8] italic">Le technicien n'a pas encore rempli ses informations de profil.</p>
            )}
          </div>
        )}
      </form>
    </Modal>
  );
}

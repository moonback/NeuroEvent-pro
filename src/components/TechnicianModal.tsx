import React, { useState } from 'react';
import { useStore } from '../store';
import { Technician } from '../types';
import Modal from './ui/Modal';
import { Award, Car, Shield, CalendarDays, Plus, Trash2, User } from 'lucide-react';
import { SKILL_CATALOG } from '../lib/constants';
import { UnavailabilityType, TechnicianUnavailability } from '../types';



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
  const unavailabilities = useStore(state => state.unavailabilities);
  const addUnavailability = useStore(state => state.addUnavailability);
  const deleteUnavailability = useStore(state => state.deleteUnavailability);

  const [activeTab, setActiveTab] = useState<'profil' | 'dispos'>('profil');

  const [firstName, setFirstName] = useState(technician?.firstName || '');
  const [lastName, setLastName] = useState(technician?.lastName || '');
  const [specialty, setSpecialty] = useState(technician?.specialty || '');
  const [color, setColor] = useState(technician?.color || '#3b82f6');

  // Nouveaux états pour l'ajout d'indisponibilité
  const [unavailStart, setUnavailStart] = useState('');
  const [unavailEnd, setUnavailEnd] = useState('');
  const [unavailType, setUnavailType] = useState<UnavailabilityType>('Congé');
  const [unavailReason, setUnavailReason] = useState('');

  const techUnavailabilities = technician 
    ? unavailabilities.filter(u => u.technicianId === technician.id).sort((a, b) => b.start.getTime() - a.start.getTime())
    : [];

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

  const handleAddUnavailability = () => {
    if (!technician || !unavailStart || !unavailEnd) return;
    addUnavailability({
      technicianId: technician.id,
      start: new Date(unavailStart),
      end: new Date(unavailEnd),
      type: unavailType,
      reason: unavailReason
    });
    setUnavailStart('');
    setUnavailEnd('');
    setUnavailReason('');
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
      {technician && (
        <div className="flex border-b border-[#e2e8f0] mb-5 select-none">
          <button
            type="button"
            onClick={() => setActiveTab('profil')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer active:scale-95 duration-100 ${
              activeTab === 'profil' ? 'border-[#2563eb] text-[#2563eb]' : 'border-transparent text-[#64748b] hover:text-[#334155]'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profil</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('dispos')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer active:scale-95 duration-100 ${
              activeTab === 'dispos' ? 'border-[#2563eb] text-[#2563eb]' : 'border-transparent text-[#64748b] hover:text-[#334155]'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>Indisponibilités</span>
            {techUnavailabilities.length > 0 && (
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{techUnavailabilities.length}</span>
            )}
          </button>
        </div>
      )}

      <form id="technician-form" onSubmit={handleSubmit} className="space-y-4">
        {activeTab === 'profil' && (
          <div className="space-y-4 animate-fade-in">
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
          </div>
        )}

        {activeTab === 'dispos' && technician && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-[#0f172a] uppercase tracking-wider flex items-center gap-1.5">
                Ajouter une indisponibilité
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Du</label>
                  <input type="datetime-local" value={unavailStart} onChange={e => setUnavailStart(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Au</label>
                  <input type="datetime-local" value={unavailEnd} onChange={e => setUnavailEnd(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Type</label>
                  <select value={unavailType} onChange={e => setUnavailType(e.target.value as UnavailabilityType)} className={inputClass}>
                    <option value="Congé">Congé</option>
                    <option value="Indisponibilité">Indisponibilité</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Motif (optionnel)</label>
                  <input type="text" value={unavailReason} onChange={e => setUnavailReason(e.target.value)} placeholder="ex: Vacances" className={inputClass} />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAddUnavailability}
                  disabled={!unavailStart || !unavailEnd}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Ajouter
                </button>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-[#0f172a] uppercase tracking-wider mb-3">Historique des indisponibilités</h4>
              {techUnavailabilities.length === 0 ? (
                <p className="text-xs text-[#64748b] italic">Aucune indisponibilité enregistrée.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1 no-scrollbar">
                  {techUnavailabilities.map(u => (
                    <div key={u.id} className="flex justify-between items-center p-3 border border-[#e2e8f0] rounded-xl bg-white hover:border-slate-300 transition-colors">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${u.type === 'Congé' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                            {u.type}
                          </span>
                          {u.reason && <span className="text-xs font-medium text-slate-700">{u.reason}</span>}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          {u.start.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          {' → '}
                          {u.end.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteUnavailability(u.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}

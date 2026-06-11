import React, { useState } from 'react';
import { useStore } from '../store';
import { useAuthStore } from '../store/auth';
import { CalendarDays, Plus, Trash2, CalendarX2 } from 'lucide-react';
import { UnavailabilityType } from '../types';

export default function TechnicianUnavailabilities() {
  const user = useAuthStore(state => state.user);
  const unavailabilities = useStore(state => state.unavailabilities);
  const addUnavailability = useStore(state => state.addUnavailability);
  const deleteUnavailability = useStore(state => state.deleteUnavailability);

  const [unavailStart, setUnavailStart] = useState('');
  const [unavailEnd, setUnavailEnd] = useState('');
  const [unavailType, setUnavailType] = useState<UnavailabilityType>('Congé');
  const [unavailReason, setUnavailReason] = useState('');

  if (!user) return null;

  const myUnavailabilities = unavailabilities
    .filter(u => u.technicianId === user.id)
    .sort((a, b) => b.start.getTime() - a.start.getTime());

  const handleAddUnavailability = () => {
    if (!unavailStart || !unavailEnd) return;
    addUnavailability({
      technicianId: user.id,
      start: new Date(unavailStart),
      end: new Date(unavailEnd),
      type: unavailType,
      reason: unavailReason
    });
    setUnavailStart('');
    setUnavailEnd('');
    setUnavailReason('');
  };

  const inputClass = "w-full rounded-xl border border-[#e2e8f0] px-3.5 py-2.5 focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] outline-none bg-[#f8fafc] text-sm transition-all text-[#0f172a] placeholder-[#cbd5e1]";
  const labelClass = "block text-[10px] font-extrabold text-[#64748b] tracking-wider uppercase mb-1.5";

  return (
    <div className="p-4 space-y-6 animate-fade-in pb-8">
      {/* Ajout d'indisponibilité */}
      <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0]/80 shadow-xs space-y-4">
        <h4 className="text-sm font-bold text-[#0f172a] flex items-center gap-2 mb-2">
          <CalendarDays className="w-4 h-4 text-[#2563eb]" />
          Déclarer une absence
        </h4>
        
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Du</label>
              <input type="datetime-local" value={unavailStart} onChange={e => setUnavailStart(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Au</label>
              <input type="datetime-local" value={unavailEnd} onChange={e => setUnavailEnd(e.target.value)} className={inputClass} />
            </div>
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
            <input type="text" value={unavailReason} onChange={e => setUnavailReason(e.target.value)} placeholder="ex: Rendez-vous médical" className={inputClass} />
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddUnavailability}
          disabled={!unavailStart || !unavailEnd}
          className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-3 bg-[#0f172a] text-white rounded-xl text-sm font-bold hover:bg-[#1e293b] disabled:opacity-50 transition-colors active:scale-95 duration-100"
        >
          <Plus className="w-4 h-4" /> Enregistrer l'absence
        </button>
      </div>

      {/* Liste des indisponibilités */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0]/80 overflow-hidden shadow-xs">
        <div className="px-4 py-3 border-b border-[#f1f5f9] flex justify-between items-center bg-[#f8fafc]">
          <div className="flex items-center gap-2 text-[#0f172a]">
            <CalendarX2 className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold uppercase tracking-wider">Mes absences prévues</span>
          </div>
          <span className="text-[10px] font-bold text-[#64748b] bg-white px-2 py-1 rounded-md border border-[#e2e8f0]">
            {myUnavailabilities.length} au total
          </span>
        </div>

        {myUnavailabilities.length === 0 ? (
          <div className="p-8 text-center">
            <CalendarDays className="w-8 h-8 text-[#cbd5e1] mx-auto mb-2" />
            <p className="text-sm font-bold text-[#64748b]">Aucune absence prévue</p>
          </div>
        ) : (
          <div className="divide-y divide-[#f1f5f9]">
            {myUnavailabilities.map(u => (
              <div key={u.id} className="p-4 flex items-center justify-between hover:bg-[#f8fafc]/50 transition-colors">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      u.type === 'Congé' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {u.type}
                    </span>
                    {u.reason && <span className="text-sm font-bold text-[#0f172a]">{u.reason}</span>}
                  </div>
                  <div className="text-[11px] font-medium text-[#64748b]">
                    {u.start.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    <span className="mx-1.5 opacity-50">→</span>
                    {u.end.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Supprimer cette absence ?')) {
                      deleteUnavailability(u.id);
                    }
                  }}
                  className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer active:scale-95 ml-2 shrink-0"
                  aria-label="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useMemo, useState } from 'react';
import { useStore } from '../store';
import { CalendarX2, Search, Info } from 'lucide-react';
import { TechnicianUnavailability, Technician } from '../types';

function formatDateRange(start: Date, end: Date) {
  return `${start.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} ${start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
  → ${end.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} ${end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
}

export default function Disponibilites() {
  const technicians = useStore((state) => state.technicians);
  const unavailabilities = useStore((state) => state.unavailabilities);

  const [search, setSearch] = useState('');

  const filteredTechnicians = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return technicians
      .filter((tech) => {
        if (!normalized) return true;
        return [tech.firstName, tech.lastName, tech.specialty].join(' ').toLowerCase().includes(normalized);
      })
      .sort((a, b) => a.firstName.localeCompare(b.firstName));
  }, [technicians, search]);

  const unavailabilitiesByTech = useMemo(() => {
    return filteredTechnicians.reduce((acc, tech) => {
      acc[tech.id] = unavailabilities
        .filter((u) => u.technicianId === tech.id)
        .sort((a, b) => a.start.getTime() - b.start.getTime());
      return acc;
    }, {} as Record<string, TechnicianUnavailability[]>);
  }, [filteredTechnicians, unavailabilities]);

  const totalUnavailabilities = unavailabilities.length;
  const nextUnavailability = unavailabilities.slice().sort((a, b) => a.start.getTime() - b.start.getTime())[0];

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-[#0f172a] uppercase tracking-tight">Disponibilités des techniciens</h2>
          <p className="text-xs text-[#64748b] font-medium">Suivez les absences, indisponibilités et créneaux bloqués pour chaque technicien.</p>
        </div>
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un technicien..."
            aria-label="Rechercher un technicien"
            className="w-full pl-10 pr-3 py-2 text-sm border border-[#e2e8f0] rounded-lg bg-white placeholder-[#94a3b8] text-[#0f172a] focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none"
          />
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-3xl border border-[#e2e8f0] bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#64748b]">Techniciens</p>
          <p className="mt-3 text-3xl font-bold text-[#0f172a]">{filteredTechnicians.length}</p>
          <p className="mt-1 text-xs text-[#64748b]">Affichés</p>
        </div>
        <div className="rounded-3xl border border-[#e2e8f0] bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#64748b]">Absences enregistrées</p>
          <p className="mt-3 text-3xl font-bold text-[#0f172a]">{totalUnavailabilities}</p>
          <p className="mt-1 text-xs text-[#64748b]">Total</p>
        </div>
        <div className="rounded-3xl border border-[#e2e8f0] bg-white p-4 flex items-start gap-3">
          <CalendarX2 className="w-5 h-5 text-[#2563eb]" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#64748b]">Prochaine indisponibilité</p>
            <p className="mt-2 text-sm text-[#0f172a]">
              {nextUnavailability
                ? formatDateRange(nextUnavailability.start, nextUnavailability.end)
                : 'Aucune absence programmée'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 overflow-hidden flex-1">
        {filteredTechnicians.map((tech) => {
          const techUnavail = unavailabilitiesByTech[tech.id] ?? [];
          return (
            <div key={tech.id} className="rounded-3xl border border-[#e2e8f0] bg-white overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-[#e2e8f0] bg-[#f8fafc] flex items-center gap-3">
                <div className="rounded-2xl bg-[#e2e8f0] text-[#1e3a8a] w-11 h-11 flex items-center justify-center font-bold uppercase">
                  {tech.firstName.charAt(0)}{tech.lastName.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#0f172a] truncate">{tech.firstName} {tech.lastName}</p>
                  <p className="text-xs text-[#64748b]">{tech.specialty || 'Spécialité non définie'}</p>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {techUnavail.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-4 text-sm text-[#64748b]">
                    Aucune indisponibilité signalée pour le moment.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {techUnavail.map((unav) => (
                      <div key={unav.id} className="rounded-3xl border border-[#e2e8f0] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-[#64748b]">{unav.type}</p>
                            <p className="mt-2 text-sm text-[#0f172a]">{formatDateRange(unav.start, unav.end)}</p>
                          </div>
                          <div className="rounded-full px-3 py-1 text-[11px] font-semibold text-[#0f172a] bg-[#e2e8f0] border border-[#cbd5e1]">
                            {unav.reason || 'Sans raison'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-3xl border border-[#e2e8f0] bg-[#eef2ff] p-4 text-sm text-[#334155] flex items-start gap-3">
        <Info className="w-5 h-5 text-[#4338ca] mt-0.5" />
        <div>
          <p className="font-semibold text-[#0f172a]">Note</p>
          <p>Les indisponibilités sont mises à jour automatiquement depuis la base et sont utilisées pour détecter les conflits de planning.</p>
        </div>
      </div>
    </div>
  );
}

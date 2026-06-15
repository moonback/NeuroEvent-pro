import React, { useMemo, useState } from 'react';
import { useStore } from '../store';
import { CalendarX2, Search, Info } from 'lucide-react';
import { TechnicianUnavailability } from '../types';

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

  const now = new Date();

  const displayedUnavailabilities = useMemo(() => {
    const techIds = new Set(filteredTechnicians.map((tech) => tech.id));
    return unavailabilities
      .filter((u) => techIds.has(u.technicianId))
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [filteredTechnicians, unavailabilities]);

  const activeUnavailabilities = displayedUnavailabilities.filter(
    (u) => u.start.getTime() <= now.getTime() && u.end.getTime() > now.getTime()
  );

  const futureUnavailabilities = displayedUnavailabilities.filter((u) => u.start.getTime() > now.getTime());
  const totalUnavailabilities = displayedUnavailabilities.length;
  const currentAbsentTechnicians = new Set(activeUnavailabilities.map((u) => u.technicianId)).size;
  const futureAbsentTechnicians = new Set(futureUnavailabilities.map((u) => u.technicianId)).size;
  const nextUnavailability = futureUnavailabilities[0];
  const hasNoResults = filteredTechnicians.length === 0;

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

      <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="rounded-3xl border border-[#e2e8f0] bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#64748b]">Techniciens</p>
          <p className="mt-3 text-3xl font-bold text-[#0f172a]">{filteredTechnicians.length}</p>
          <p className="mt-1 text-xs text-[#64748b]">Affichés</p>
        </div>
        <div className="rounded-3xl border border-[#e2e8f0] bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#64748b]">Absences affichées</p>
          <p className="mt-3 text-3xl font-bold text-[#0f172a]">{totalUnavailabilities}</p>
          <p className="mt-1 text-xs text-[#64748b]">Sur le filtre actuel</p>
        </div>
        <div className="rounded-3xl border border-[#e2e8f0] bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#64748b]">Techniciens absents</p>
          <p className="mt-3 text-3xl font-bold text-[#0f172a]">{currentAbsentTechnicians}</p>
          <p className="mt-1 text-xs text-[#64748b]">En cours</p>
        </div>
        <div className="rounded-3xl border border-[#e2e8f0] bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#64748b]">Absences à venir</p>
          <p className="mt-3 text-3xl font-bold text-[#0f172a]">{futureAbsentTechnicians}</p>
          <p className="mt-1 text-xs text-[#64748b]">Techniciens concernés</p>
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

      {hasNoResults ? (
        <div className="rounded-3xl border border-[#e2e8f0] bg-white p-10 text-center text-sm text-[#64748b]">
          Aucun technicien ne correspond à votre recherche.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto min-h-0 max-h-[68vh] flex-1">
          {filteredTechnicians.map((tech) => {
          const techUnavail = unavailabilitiesByTech[tech.id] ?? [];
          const isCurrentlyUnavailable = techUnavail.some(
            (u) => u.start.getTime() <= now.getTime() && u.end.getTime() > now.getTime()
          );
          const nextTechUnavail = techUnavail.find((u) => u.start.getTime() > now.getTime());

          return (
            <div key={tech.id} className="rounded-3xl border border-[#e2e8f0] bg-white overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-[#e2e8f0] bg-[#f8fafc] flex items-center gap-3">
                <div className="rounded-2xl bg-[#e2e8f0] text-[#1e3a8a] w-11 h-11 flex items-center justify-center font-bold uppercase">
                  {tech.firstName.charAt(0)}{tech.lastName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#0f172a] truncate">{tech.firstName} {tech.lastName}</p>
                  <p className="text-xs text-[#64748b]">{tech.specialty || 'Spécialité non définie'}</p>
                </div>
                <span className={`ml-auto text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${isCurrentlyUnavailable ? 'bg-[#ffe4e8] text-[#b91c1c]' : nextTechUnavail ? 'bg-[#e0f2fe] text-[#0369a1]' : 'bg-[#ecfccb] text-[#365314]'}`}>
                  {isCurrentlyUnavailable ? 'Absent maintenant' : nextTechUnavail ? 'Absence à venir' : 'Disponible'}
                </span>
              </div>

              <div className="p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wider text-[#64748b]">
                  <span className="rounded-full bg-[#f8fafc] px-2.5 py-1 border border-[#e2e8f0]">{techUnavail.length} absence{techUnavail.length > 1 ? 's' : ''}</span>
                  {nextTechUnavail && (
                    <span className="rounded-full bg-[#e0f2fe] px-2.5 py-1 border border-[#bfdbfe] text-[#0369a1]">Prochaine : {nextTechUnavail.start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                  )}
                </div>

                {techUnavail.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-4 text-sm text-[#64748b]">
                    Aucune indisponibilité signalée pour le moment.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {techUnavail.slice(0, 2).map((unav) => (
                      <div key={unav.id} className="rounded-3xl border border-[#e2e8f0] p-3 bg-[#ffffff]">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748b]">{unav.type}</p>
                            <p className="mt-1 text-sm text-[#0f172a]">{formatDateRange(unav.start, unav.end)}</p>
                          </div>
                        </div>
                        <div className="mt-2 text-[11px] text-[#64748b]">{unav.reason || 'Sans raison'}</div>
                      </div>
                    ))}
                    {techUnavail.length > 2 && (
                      <div className="text-[11px] text-[#334155] font-semibold">+ {techUnavail.length - 2} autre{techUnavail.length - 2 > 1 ? 's' : ''}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}

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

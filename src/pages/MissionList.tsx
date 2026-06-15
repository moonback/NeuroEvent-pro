import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { Search, List, Calendar, Users, Truck, Package, FileText, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function MissionList() {
  const missions = useStore((state) => state.missions);
  const technicians = useStore((state) => state.technicians);
  const trucks = useStore((state) => state.trucks);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Planifiée' | 'En cours' | 'Terminée'>('all');

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return missions
      .filter((mission) => {
        const matchesSearch = query === '' || [mission.title, mission.client, mission.address, mission.type]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(query);
        const matchesStatus = statusFilter === 'all' || mission.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => b.start.getTime() - a.start.getTime());
  }, [missions, search, statusFilter]);

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <List className="w-5 h-5 text-[#2563eb]" />
            <div>
              <h1 className="text-xl font-bold text-[#0f172a] uppercase tracking-tight">Liste des missions</h1>
              <p className="text-xs text-[#64748b]">Affichage en lecture seule sans action directe sur les missions.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['all', 'Planifiée', 'En cours', 'Terminée'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${statusFilter === status ? 'bg-[#2563eb] text-white' : 'bg-white text-[#64748b] border border-[#e2e8f0] hover:bg-[#f1f5f9]'}`}
              >
                {status === 'all' ? 'Toutes' : status}
              </button>
            ))}
          </div>
        </div>

        <div className="relative max-w-sm flex-1 sm:flex-none">
          <Search className="w-4 h-4 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une mission..."
            className="w-full pl-10 pr-3 py-2 border border-[#e2e8f0] rounded-lg bg-white text-sm text-[#0f172a] placeholder-[#94a3b8] focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-hidden rounded-3xl border border-[#e2e8f0] bg-white shadow-sm">
        <div className="overflow-x-auto h-full">
          <table className="min-w-full border-separate border-spacing-0">
            <thead className="bg-[#f8fafc] border-b border-[#e2e8f0]">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-[#64748b]">Mission</th>
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-[#64748b]">Client</th>
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-[#64748b]">Statut</th>
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-[#64748b]">Type</th>
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-[#64748b]">Techniciens</th>
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-[#64748b]">Camion</th>
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-[#64748b]">Période</th>
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-[#64748b]">Détails</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-[#64748b]">Aucune mission correspondant aux critères.</td>
                </tr>
              ) : (
                filtered.map((mission) => {
                  const truck = trucks.find((t) => t.id === mission.truckId);
                  const technicianCount = mission.technicianIds.length;
                  return (
                    <tr key={mission.id} className="border-b border-[#f1f5f9] hover:bg-[#f8fafc]">
                      <td className="px-4 py-4 align-top">
                        <div className="font-semibold text-[#0f172a] truncate max-w-[220px]">{mission.title}</div>
                        <div className="text-xs text-[#64748b] truncate max-w-[220px]">{mission.address}</div>
                      </td>
                      <td className="px-4 py-4 align-top text-sm text-[#334155]">{mission.client}</td>
                      <td className="px-4 py-4 align-top text-sm">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${mission.status === 'Planifiée' ? 'bg-[#eff6ff] text-[#2563eb]' : mission.status === 'En cours' ? 'bg-[#fffbeb] text-[#d97706]' : 'bg-[#ecfdf5] text-[#059669]'}`}>
                          {mission.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top text-sm text-[#334155]">{mission.type}</td>
                      <td className="px-4 py-4 align-top text-sm text-[#334155]">{technicianCount}</td>
                      <td className="px-4 py-4 align-top text-sm text-[#334155]">{truck ? truck.name : 'Non attribué'}</td>
                      <td className="px-4 py-4 align-top text-sm text-[#334155]">
                        {format(mission.start, 'dd/MM/yyyy HH:mm', { locale: fr })}–{format(mission.end, 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </td>
                      <td className="px-4 py-4 align-top text-sm text-[#2563eb]">
                        <Link
                          to={`/missions/${mission.id}`}
                          className="inline-flex items-center gap-2 rounded-full border border-[#e2e8f0] px-3 py-1 text-xs font-semibold text-[#2563eb] hover:bg-[#eff6ff]"
                        >
                          Voir
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

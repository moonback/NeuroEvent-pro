import React from 'react';
import { useStore } from '../store';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Timer,
  Users,
  Search,
  Calendar,
  Clock,
  ChevronDown,
  ChevronRight,
  Download,
  BarChart2,
  AlertCircle,
} from 'lucide-react';
import { formatDuration, minutesToDisplay, totalMinutesFor } from '../lib/time';

interface TechnicianHoursAdminProps {
  /** If provided, filter logs for a specific mission */
  missionId?: string;
}

export default function TechnicianHoursAdmin({ missionId }: TechnicianHoursAdminProps) {
  const timeLogs = useStore(state => state.timeLogs);
  const fetchTimeLogs = useStore(state => state.fetchTimeLogs);
  const missions = useStore(state => state.missions);
  const technicians = useStore(state => state.technicians);

  const [searchTech, setSearchTech] = React.useState('');
  const [filterMissionId, setFilterMissionId] = React.useState(missionId || '');
  const [expandedTech, setExpandedTech] = React.useState<string | null>(null);
  const [groupBy, setGroupBy] = React.useState<'technician' | 'mission'>('technician');

  React.useEffect(() => {
    fetchTimeLogs(missionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missionId]);

  // Filter logic
  const filteredLogs = timeLogs.filter(l => {
    if (filterMissionId && l.missionId !== filterMissionId) return false;
    if (searchTech) {
      const tech = technicians.find(t => t.id === l.technicianId);
      if (!tech) return false;
      const name = `${tech.firstName} ${tech.lastName}`.toLowerCase();
      if (!name.includes(searchTech.toLowerCase())) return false;
    }
    return true;
  }).map(l => ({
    ...l,
    startTime: new Date(l.startTime),
    endTime: l.endTime ? new Date(l.endTime) : null
  }));

  // Group by technician
  const byTech = technicians
    .filter(t => {
      if (searchTech) {
        const name = `${t.firstName} ${t.lastName}`.toLowerCase();
        return name.includes(searchTech.toLowerCase());
      }
      return true;
    })
    .map(tech => ({
      tech,
      logs: filteredLogs
        .filter(l => l.technicianId === tech.id)
        .sort((a, b) => b.startTime.getTime() - a.startTime.getTime()),
    }))
    .filter(g => g.logs.length > 0);

  // Group by mission
  const byMission = missions
    .filter(m => !filterMissionId || m.id === filterMissionId)
    .map(mission => ({
      mission,
      logs: filteredLogs
        .filter(l => l.missionId === mission.id)
        .sort((a, b) => b.startTime.getTime() - a.startTime.getTime()),
    }))
    .filter(g => g.logs.length > 0);

  // Export CSV
  const exportCSV = () => {
    const rows = [
      ['Mission', 'Technicien', 'Début', 'Fin', 'Durée', 'Note'],
      ...filteredLogs.map(l => {
        const mission = missions.find(m => m.id === l.missionId);
        const tech = technicians.find(t => t.id === l.technicianId);
        return [
          mission?.title || l.missionId,
          tech ? `${tech.firstName} ${tech.lastName}` : l.technicianId,
          format(l.startTime, 'dd/MM/yyyy HH:mm'),
          l.endTime ? format(l.endTime, 'dd/MM/yyyy HH:mm') : 'En cours',
          formatDuration(l.startTime, l.endTime),
          l.note || '',
        ];
      }),
    ];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `heures_techniciens_${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalAll = minutesToDisplay(totalMinutesFor(filteredLogs));

  return (
    <div className="space-y-4">
      {/* Controls bar */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
          <input
            type="text"
            placeholder="Rechercher un technicien…"
            value={searchTech}
            onChange={e => setSearchTech(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-[#e2e8f0] rounded-xl bg-[#f8fafc] placeholder-[#94a3b8] text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all"
          />
        </div>

        {/* Mission filter */}
        {!missionId && (
          <select
            value={filterMissionId}
            onChange={e => setFilterMissionId(e.target.value)}
            className="text-xs border border-[#e2e8f0] rounded-xl bg-[#f8fafc] px-3 py-2 text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all"
          >
            <option value="">Toutes les missions</option>
            {missions.map(m => (
              <option key={m.id} value={m.id}>{m.title}</option>
            ))}
          </select>
        )}

        {/* Group by toggle */}
        <div className="flex border border-[#e2e8f0] rounded-xl overflow-hidden">
          {(['technician', 'mission'] as const).map(g => (
            <button
              key={g}
              onClick={() => setGroupBy(g)}
              className={`px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider transition-colors ${
                groupBy === g
                  ? 'bg-[#2563eb] text-white'
                  : 'bg-white text-[#64748b] hover:bg-slate-50'
              }`}
            >
              {g === 'technician' ? (
                <><Users className="w-3 h-3 inline mr-1" />Technicien</>
              ) : (
                <><Calendar className="w-3 h-3 inline mr-1" />Mission</>
              )}
            </button>
          ))}
        </div>

        {/* Export CSV */}
        <button
          onClick={exportCSV}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold border border-[#e2e8f0] rounded-xl text-[#475569] hover:bg-[#f1f5f9] transition-all active:scale-95 duration-100"
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
          <div className="text-lg font-black text-[#2563eb]">{filteredLogs.length}</div>
          <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Créneaux</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
          <div className="text-lg font-black text-emerald-600">{totalAll}</div>
          <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Total heures</div>
        </div>
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-center">
          <div className="text-lg font-black text-purple-600">
            {groupBy === 'technician' ? byTech.length : byMission.length}
          </div>
          <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
            {groupBy === 'technician' ? 'Techniciens' : 'Missions'}
          </div>
        </div>
      </div>

      {/* Content */}
      {filteredLogs.length === 0 ? (
        <div className="bg-white border border-dashed border-[#e2e8f0] rounded-2xl p-10 text-center">
          <Clock className="w-10 h-10 text-[#cbd5e1] mx-auto mb-3" />
          <p className="text-sm font-bold text-[#64748b]">Aucune heure enregistrée</p>
          <p className="text-xs text-[#94a3b8] mt-1">Les techniciens n'ont pas encore saisi leurs heures.</p>
        </div>
      ) : groupBy === 'technician' ? (
        // ── BY TECHNICIAN ──
        <div className="space-y-3">
          {byTech.map(({ tech, logs }) => {
            const totalMins = totalMinutesFor(logs);
            const isExpanded = expandedTech === tech.id;
            return (
              <div key={tech.id} className="bg-white border border-[#e2e8f0]/80 rounded-2xl overflow-hidden shadow-xs">
                <button
                  onClick={() => setExpandedTech(isExpanded ? null : tech.id)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-slate-50/50 transition-colors cursor-pointer"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0 shadow-xs"
                    style={{ backgroundColor: tech.color }}
                  >
                    {tech.firstName[0]}{tech.lastName[0]}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-extrabold text-sm text-[#0f172a]">{tech.firstName} {tech.lastName}</div>
                    <div className="text-[10px] text-[#64748b] font-semibold">{tech.specialty} · {logs.length} créneau{logs.length > 1 ? 'x' : ''}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-black text-[#0f172a]">{minutesToDisplay(totalMins)}</div>
                    <div className="text-[10px] text-[#94a3b8] font-bold uppercase">Total</div>
                  </div>
                  {isExpanded
                    ? <ChevronDown className="w-4 h-4 text-[#94a3b8] shrink-0" />
                    : <ChevronRight className="w-4 h-4 text-[#94a3b8] shrink-0" />
                  }
                </button>

                {isExpanded && (
                  <div className="border-t border-[#f1f5f9]">
                    {logs.map(log => {
                      const mission = missions.find(m => m.id === log.missionId);
                      return (
                        <div key={log.id} className="px-4 py-3 flex items-center gap-3 border-b border-[#f8fafc] hover:bg-[#f8fafc]/50 transition-colors">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${log.endTime ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-[#0f172a] truncate">{mission?.title || '—'}</div>
                            <div className="text-[10px] text-[#64748b] font-semibold">
                              {format(log.startTime, 'EEEE d MMM · HH:mm', { locale: fr })}
                              {' → '}
                              {log.endTime ? format(log.endTime, 'HH:mm') : <span className="text-amber-500">En cours</span>}
                            </div>
                            {log.note && <div className="text-[10px] italic text-[#94a3b8] mt-0.5">{log.note}</div>}
                          </div>
                          <span
                            className="text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0"
                            style={{ backgroundColor: tech.color + '15', color: tech.color }}
                          >
                            {formatDuration(log.startTime, log.endTime)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        // ── BY MISSION ──
        <div className="space-y-3">
          {byMission.map(({ mission, logs }) => {
            const totalMins = totalMinutesFor(logs);
            const isExpanded = expandedTech === mission.id;
            return (
              <div key={mission.id} className="bg-white border border-[#e2e8f0]/80 rounded-2xl overflow-hidden shadow-xs">
                <button
                  onClick={() => setExpandedTech(isExpanded ? null : mission.id)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-slate-50/50 transition-colors cursor-pointer"
                >
                  <div
                    className="w-2.5 h-10 rounded-full shrink-0"
                    style={{ backgroundColor: mission.color }}
                  />
                  <div className="flex-1 text-left">
                    <div className="font-extrabold text-sm text-[#0f172a]">{mission.title}</div>
                    <div className="text-[10px] text-[#64748b] font-semibold">
                      {mission.client} · {logs.length} créneau{logs.length > 1 ? 'x' : ''}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-black text-[#0f172a]">{minutesToDisplay(totalMins)}</div>
                    <div className="text-[10px] text-[#94a3b8] font-bold uppercase">Total</div>
                  </div>
                  {isExpanded
                    ? <ChevronDown className="w-4 h-4 text-[#94a3b8] shrink-0" />
                    : <ChevronRight className="w-4 h-4 text-[#94a3b8] shrink-0" />
                  }
                </button>

                {isExpanded && (
                  <div className="border-t border-[#f1f5f9]">
                    {logs.map(log => {
                      const tech = technicians.find(t => t.id === log.technicianId);
                      return (
                        <div key={log.id} className="px-4 py-3 flex items-center gap-3 border-b border-[#f8fafc] hover:bg-[#f8fafc]/50 transition-colors">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0"
                            style={{ backgroundColor: tech?.color || '#94a3b8' }}
                          >
                            {tech ? `${tech.firstName[0]}${tech.lastName[0]}` : '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-[#0f172a]">
                              {tech ? `${tech.firstName} ${tech.lastName}` : 'Inconnu'}
                            </div>
                            <div className="text-[10px] text-[#64748b] font-semibold">
                              {format(log.startTime, 'EEEE d MMM · HH:mm', { locale: fr })}
                              {' → '}
                              {log.endTime ? format(log.endTime, 'HH:mm') : <span className="text-amber-500">En cours</span>}
                            </div>
                            {log.note && <div className="text-[10px] italic text-[#94a3b8] mt-0.5">{log.note}</div>}
                          </div>
                          <span
                            className="text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0"
                            style={{ backgroundColor: mission.color + '15', color: mission.color }}
                          >
                            {formatDuration(log.startTime, log.endTime)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

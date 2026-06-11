import React from 'react';
import { useStore } from '../store';
import { useAuthStore } from '../store/auth';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Timer, Calendar, BarChart3, Clock } from 'lucide-react';

export default function TechnicianMyHours() {
  const user = useAuthStore(state => state.user);
  const timeLogs = useStore(state => state.timeLogs);
  const missions = useStore(state => state.missions);
  const fetchTimeLogs = useStore(state => state.fetchTimeLogs);

  React.useEffect(() => {
    fetchTimeLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) return null;

  const myLogs = timeLogs
    .filter(l => l.technicianId === user.id)
    .map(l => ({
      ...l,
      startTime: new Date(l.startTime),
      endTime: l.endTime ? new Date(l.endTime) : null
    }))
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

  const now = new Date();
  
  // Cette semaine
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const logsThisWeek = myLogs.filter(l => isWithinInterval(l.startTime, { start: weekStart, end: weekEnd }));
  
  // Ce mois
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const logsThisMonth = myLogs.filter(l => isWithinInterval(l.startTime, { start: monthStart, end: monthEnd }));

  const calculateTotalMinutes = (logs: typeof myLogs) => {
    return logs.reduce((acc, l) => {
      const end = l.endTime || new Date();
      return acc + Math.max(0, Math.floor((end.getTime() - l.startTime.getTime()) / 60000));
    }, 0);
  };

  const formatMins = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h${String(minutes).padStart(2, '0')}`;
  };

  const minsThisWeek = calculateTotalMinutes(logsThisWeek);
  const minsThisMonth = calculateTotalMinutes(logsThisMonth);
  const minsTotal = calculateTotalMinutes(myLogs);

  return (
    <div className="p-4 space-y-4 animate-fade-in pb-8">
      {/* Cards de résumé */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white shadow-sm">
          <div className="flex items-center gap-2 mb-2 opacity-90">
            <Calendar className="w-4 h-4" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Cette semaine</span>
          </div>
          <div className="text-2xl font-black">{formatMins(minsThisWeek)}</div>
          <div className="text-[10px] font-medium opacity-80 mt-1">{logsThisWeek.length} créneau(x)</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white shadow-sm">
          <div className="flex items-center gap-2 mb-2 opacity-90">
            <BarChart3 className="w-4 h-4" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Ce mois</span>
          </div>
          <div className="text-2xl font-black">{formatMins(minsThisMonth)}</div>
          <div className="text-[10px] font-medium opacity-80 mt-1">{logsThisMonth.length} créneau(x)</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#e2e8f0]/80 overflow-hidden shadow-xs">
        <div className="px-4 py-3 border-b border-[#f1f5f9] flex justify-between items-center bg-[#f8fafc]">
          <div className="flex items-center gap-2 text-[#0f172a]">
            <Timer className="w-4 h-4 text-[#2563eb]" />
            <span className="text-xs font-bold uppercase tracking-wider">Historique complet</span>
          </div>
          <span className="text-[10px] font-bold text-[#64748b] bg-white px-2 py-1 rounded-md border border-[#e2e8f0]">
            Total : {formatMins(minsTotal)}
          </span>
        </div>

        {myLogs.length === 0 ? (
          <div className="p-8 text-center">
            <Clock className="w-8 h-8 text-[#cbd5e1] mx-auto mb-2" />
            <p className="text-sm font-bold text-[#64748b]">Aucune heure enregistrée</p>
          </div>
        ) : (
          <div className="divide-y divide-[#f1f5f9]">
            {myLogs.map(log => {
              const mission = missions.find(m => m.id === log.missionId);
              const durationMins = Math.floor((Math.max(0, (log.endTime || new Date()).getTime() - log.startTime.getTime())) / 60000);
              return (
                <div key={log.id} className="p-4 flex items-center justify-between hover:bg-[#f8fafc]/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${log.endTime ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-[#0f172a] truncate">{mission?.title || 'Mission inconnue'}</div>
                      <div className="text-[10px] text-[#64748b] font-semibold mt-0.5">
                        {format(log.startTime, 'EEEE d MMM', { locale: fr })}
                        <span className="mx-1.5 opacity-50">•</span>
                        {format(log.startTime, 'HH:mm')} → {log.endTime ? format(log.endTime, 'HH:mm') : <span className="text-amber-500">En cours</span>}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 ml-3 text-right">
                    <div className="text-sm font-black text-[#0f172a]">{formatMins(durationMins)}</div>
                    {log.note && <div className="text-[9px] text-[#94a3b8] italic">Note incluse</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

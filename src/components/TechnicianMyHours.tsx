import React from 'react';
import { useStore } from '../store';
import { useAuthStore } from '../store/auth';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Timer, Calendar, BarChart3, Clock, TrendingUp, Sun } from 'lucide-react';

export default function TechnicianMyHours() {
  const user = useAuthStore((state) => state.user);
  const timeLogs = useStore((state) => state.timeLogs);
  const dayLogs = useStore((state) => state.dayLogs);
  const missions = useStore((state) => state.missions);
  const fetchTimeLogs = useStore((state) => state.fetchTimeLogs);
  const fetchDayLogs = useStore((state) => state.fetchDayLogs);

  React.useEffect(() => {
    fetchTimeLogs();
    if (user?.id) fetchDayLogs(user.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!user) return null;

  const myLogs = timeLogs
    .filter((l) => l.technicianId === user.id)
    .map((l) => ({
      ...l,
      startTime: new Date(l.startTime),
      endTime: l.endTime ? new Date(l.endTime) : null,
    }))
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

  const myDayLogs = dayLogs
    .filter((d) => d.technicianId === user.id)
    .map((d) => ({
      ...d,
      date: new Date(d.date),
      firstMissionStart: new Date(d.firstMissionStart),
      dayEndTime: new Date(d.dayEndTime),
    }))
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  const now = new Date();

  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const logsThisWeek = myLogs.filter((l) =>
    isWithinInterval(l.startTime, { start: weekStart, end: weekEnd })
  );
  const dayLogsThisWeek = myDayLogs.filter((d) =>
    isWithinInterval(d.date, { start: weekStart, end: weekEnd })
  );

  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const logsThisMonth = myLogs.filter((l) =>
    isWithinInterval(l.startTime, { start: monthStart, end: monthEnd })
  );
  const dayLogsThisMonth = myDayLogs.filter((d) =>
    isWithinInterval(d.date, { start: monthStart, end: monthEnd })
  );

  const calculateTotalMinutes = (logs: typeof myLogs) =>
    logs.reduce((acc, l) => {
      const end = l.endTime || new Date();
      return acc + Math.max(0, Math.floor((end.getTime() - l.startTime.getTime()) / 60000));
    }, 0);

  const calculateDayLogMinutes = (logs: typeof myDayLogs) =>
    logs.reduce((acc, d) => acc + d.totalMinutes, 0);

  const formatMins = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h${String(minutes).padStart(2, '0')}`;
  };

  const minsThisWeek = calculateTotalMinutes(logsThisWeek) + calculateDayLogMinutes(dayLogsThisWeek);
  const minsThisMonth = calculateTotalMinutes(logsThisMonth) + calculateDayLogMinutes(dayLogsThisMonth);
  const minsTotal = calculateTotalMinutes(myLogs) + calculateDayLogMinutes(myDayLogs);

  const totalEntries = myLogs.length + myDayLogs.length;

  const statCards = [
    {
      label: 'Cette semaine',
      value: formatMins(minsThisWeek),
      sub: `${logsThisWeek.length + dayLogsThisWeek.length} créneau(x)`,
      icon: Calendar,
      gradient: 'linear-gradient(135deg, rgba(77,159,255,0.15) 0%, rgba(77,159,255,0.05) 100%)',
      border: 'rgba(77,159,255,0.20)',
      color: 'var(--tech-blue)',
      glow: 'rgba(77,159,255,0.15)',
    },
    {
      label: 'Ce mois',
      value: formatMins(minsThisMonth),
      sub: `${logsThisMonth.length + dayLogsThisMonth.length} créneau(x)`,
      icon: BarChart3,
      gradient: 'linear-gradient(135deg, rgba(167,139,250,0.15) 0%, rgba(167,139,250,0.05) 100%)',
      border: 'rgba(167,139,250,0.20)',
      color: 'var(--tech-purple)',
      glow: 'rgba(167,139,250,0.15)',
    },
    {
      label: 'Total cumulé',
      value: formatMins(minsTotal),
      sub: `${totalEntries} sessions`,
      icon: TrendingUp,
      gradient: 'linear-gradient(135deg, rgba(0,229,160,0.15) 0%, rgba(0,229,160,0.05) 100%)',
      border: 'rgba(0,229,160,0.20)',
      color: 'var(--tech-accent)',
      glow: 'rgba(0,229,160,0.15)',
    },
  ];

  return (
    <div className="px-4 space-y-4 tech-animate-in pb-8">
      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-2">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-2xl p-3 relative overflow-hidden tech-animate-in"
              style={{
                background: card.gradient,
                border: `1px solid ${card.border}`,
                animationDelay: `${i * 60}ms`,
                boxShadow: `0 4px 20px ${card.glow}`,
              }}
            >
              {/* bg glow orb */}
              <div
                className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full pointer-events-none"
                style={{ background: card.glow, filter: 'blur(12px)' }}
              />
              <Icon className="w-3.5 h-3.5 mb-2" style={{ color: card.color }} />
              <div className="text-xl font-black tracking-tight" style={{ color: card.color }}>
                {card.value}
              </div>
              <div
                className="text-[9px] font-black uppercase tracking-wider mt-0.5"
                style={{ color: card.color, opacity: 0.6 }}
              >
                {card.label}
              </div>
              <div
                className="text-[9px] font-semibold mt-1"
                style={{ color: card.color, opacity: 0.45 }}
              >
                {card.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* History list */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'var(--tech-card)',
          border: '1px solid var(--tech-border)',
        }}
      >
        {/* List header */}
        <div
          className="px-4 py-3 flex justify-between items-center"
          style={{
            background: 'rgba(255,255,255,0.02)',
            borderBottom: '1px solid var(--tech-border)',
          }}
        >
          <div className="flex items-center gap-2">
            <Timer className="w-3.5 h-3.5" style={{ color: 'var(--tech-blue)' }} />
            <span
              className="text-[10px] font-black uppercase tracking-widest"
              style={{ color: 'var(--tech-text-secondary)' }}
            >
              Historique
            </span>
          </div>
          <span
            className="text-[9px] font-black px-2.5 py-1 rounded-full"
            style={{
              background: 'rgba(0,229,160,0.08)',
              border: '1px solid rgba(0,229,160,0.15)',
              color: 'var(--tech-accent)',
            }}
          >
            {formatMins(minsTotal)} total
          </span>
        </div>

        {myLogs.length === 0 && myDayLogs.length === 0 ? (
          <div className="py-12 text-center">
            <Clock
              className="w-8 h-8 mx-auto mb-3 tech-animate-float"
              style={{ color: 'var(--tech-text-muted)' }}
            />
            <p className="text-sm font-bold" style={{ color: 'var(--tech-text-muted)' }}>
              Aucune heure enregistrée
            </p>
          </div>
        ) : (
          <div>
            {/* Merge timeLogs and dayLogs sorted by date desc */}
            {[...myLogs.map((l) => ({ kind: 'time' as const, log: l })), ...myDayLogs.map((d) => ({ kind: 'day' as const, log: d }))]
              .sort((a, b) => {
                const dateA = a.kind === 'time' ? a.log.startTime.getTime() : a.log.date.getTime();
                const dateB = b.kind === 'time' ? b.log.startTime.getTime() : b.log.date.getTime();
                return dateB - dateA;
              })
              .map((entry, idx, arr) => {
                if (entry.kind === 'day') {
                  const d = entry.log;
                  return (
                    <div
                      key={`day-${d.id}`}
                      className="px-4 py-3.5 flex items-center justify-between transition-all tech-animate-in"
                      style={{
                        borderBottom: idx < arr.length - 1 ? '1px solid var(--tech-border)' : 'none',
                        animationDelay: `${idx * 35}ms`,
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{
                              background: 'var(--tech-accent)',
                              boxShadow: '0 0 6px rgba(0,229,160,0.4)',
                            }}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Sun className="w-3 h-3" style={{ color: 'var(--tech-accent)' }} />
                            <span
                              className="text-sm font-bold"
                              style={{ color: 'var(--tech-accent)' }}
                            >
                              Journée terminée
                            </span>
                          </div>
                          <div
                            className="text-[10px] font-semibold mt-0.5"
                            style={{ color: 'var(--tech-text-muted)' }}
                          >
                            {format(d.date, 'EEEE d MMM', { locale: fr })}
                            <span className="mx-1.5 opacity-40">·</span>
                            {format(d.firstMissionStart, 'HH:mm')}
                            <span className="mx-1 opacity-40">→</span>
                            {format(d.dayEndTime, 'HH:mm')}
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0 ml-3 text-right">
                        <div
                          className="text-sm font-black tabular-nums"
                          style={{ color: 'var(--tech-accent)' }}
                        >
                          {formatMins(d.totalMinutes)}
                        </div>
                      </div>
                    </div>
                  );
                }
                const l = entry.log;
                const mission = missions.find((m) => m.id === l.missionId);
                const durationMins = Math.floor(
                  Math.max(0, ((l.endTime || new Date()).getTime() - l.startTime.getTime())) / 60000
                );
                const isActive = !l.endTime;
                return (
                  <div
                    key={l.id}
                    className="px-4 py-3.5 flex items-center justify-between transition-all tech-animate-in"
                    style={{
                      borderBottom: idx < arr.length - 1 ? '1px solid var(--tech-border)' : 'none',
                      animationDelay: `${idx * 35}ms`,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.025)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Status dot */}
                      <div className="relative shrink-0">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{
                            background: isActive ? '#ffb700' : 'var(--tech-accent)',
                            boxShadow: isActive
                              ? '0 0 8px rgba(255,183,0,0.6)'
                              : '0 0 6px rgba(0,229,160,0.4)',
                          }}
                        />
                        {isActive && (
                          <span
                            className="absolute inset-0 rounded-full"
                            style={{
                              background: '#ffb700',
                              animation: 'tech-dot-ping 2s cubic-bezier(0,0,0.2,1) infinite',
                            }}
                          />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div
                          className="text-sm font-bold truncate"
                          style={{ color: 'var(--tech-text)' }}
                        >
                          {mission?.title || 'Mission inconnue'}
                        </div>
                        <div
                          className="text-[10px] font-semibold mt-0.5"
                          style={{ color: 'var(--tech-text-muted)' }}
                        >
                          {format(l.startTime, 'EEEE d MMM', { locale: fr })}
                          <span className="mx-1.5 opacity-40">·</span>
                          {format(l.startTime, 'HH:mm')}
                          <span className="mx-1 opacity-40">→</span>
                          {l.endTime ? (
                            format(l.endTime, 'HH:mm')
                          ) : (
                            <span style={{ color: '#ffb700', fontWeight: 800 }}>En cours</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 ml-3 text-right">
                      <div
                        className="text-sm font-black tabular-nums"
                        style={{ color: isActive ? '#ffb700' : 'var(--tech-text)' }}
                      >
                        {formatMins(durationMins)}
                      </div>
                      {l.note && (
                        <div
                          className="text-[9px] italic mt-0.5"
                          style={{ color: 'var(--tech-text-muted)' }}
                        >
                          Note incluse
                        </div>
                      )}
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

import React from 'react';
import { useStore } from '../store';
import { useAuthStore } from '../store/auth';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Clock,
  Play,
  Square,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  AlertCircle,
  Timer,
} from 'lucide-react';
import { toast } from '../store/toast';
import { TimeLog } from '../types';

interface TimeLogPanelProps {
  missionId: string;
  missionColor: string;
  missionStatus: string;
}

function formatDuration(startTime: Date, endTime: Date | null): string {
  const end = endTime || new Date();
  const diffMs = end.getTime() - startTime.getTime();
  if (diffMs <= 0) return '0h00';
  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h${String(minutes).padStart(2, '0')}`;
}

function formatDatetimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function TimeLogPanel({ missionId, missionColor, missionStatus }: TimeLogPanelProps) {
  const user = useAuthStore(state => state.user);
  const timeLogs = useStore(state => state.timeLogs);
  const fetchTimeLogs = useStore(state => state.fetchTimeLogs);
  const addTimeLog = useStore(state => state.addTimeLog);
  const updateTimeLog = useStore(state => state.updateTimeLog);
  const deleteTimeLog = useStore(state => state.deleteTimeLog);

  const [isAdding, setIsAdding] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  // Form state
  const [formStart, setFormStart] = React.useState('');
  const [formEnd, setFormEnd] = React.useState('');
  const [formNote, setFormNote] = React.useState('');

  // Filter logs for this mission and this technician
  const myLogs = timeLogs
    .filter(l => l.missionId === missionId && l.technicianId === (user?.id || ''))
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

  // Fetch logs for this mission on mount
  React.useEffect(() => {
    fetchTimeLogs(missionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missionId]);

  // Ticker to refresh running durations
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const openAddForm = () => {
    const now = new Date();
    setFormStart(formatDatetimeLocal(now));
    setFormEnd('');
    setFormNote('');
    setIsAdding(true);
    setEditingId(null);
  };

  const openEditForm = (log: TimeLog) => {
    setFormStart(formatDatetimeLocal(log.startTime));
    setFormEnd(log.endTime ? formatDatetimeLocal(log.endTime) : '');
    setFormNote(log.note || '');
    setEditingId(log.id);
    setIsAdding(false);
  };

  const cancelForm = () => {
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !formStart) return;

    const startTime = new Date(formStart);
    const endTime = formEnd ? new Date(formEnd) : null;

    if (endTime && endTime <= startTime) {
      toast.error("L'heure de fin doit être après l'heure de début.");
      return;
    }

    setLoading(true);
    await addTimeLog({
      missionId,
      technicianId: user.id,
      startTime,
      endTime,
      note: formNote || undefined,
    });
    setLoading(false);
    setIsAdding(false);
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !formStart) return;

    const startTime = new Date(formStart);
    const endTime = formEnd ? new Date(formEnd) : null;

    if (endTime && endTime <= startTime) {
      toast.error("L'heure de fin doit être après l'heure de début.");
      return;
    }

    setLoading(true);
    await updateTimeLog(editingId, { startTime, endTime, note: formNote });
    setLoading(false);
    setEditingId(null);
  };

  const handleClockOut = async (log: TimeLog) => {
    const endTime = new Date();
    setLoading(true);
    await updateTimeLog(log.id, { endTime });
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer ce créneau ?')) return;
    await deleteTimeLog(id);
  };

  // Total hours for this mission
  const totalMinutes = myLogs.reduce((acc, l) => {
    const end = l.endTime || new Date();
    const diff = Math.max(0, end.getTime() - l.startTime.getTime());
    return acc + Math.floor(diff / 60000);
  }, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalMins = totalMinutes % 60;

  const isTerminated = missionStatus === 'Terminée';

  const renderForm = (onSubmit: (e: React.FormEvent) => void, title: string) => (
    <form
      onSubmit={onSubmit}
      className="bg-white border-2 rounded-2xl p-4 space-y-3 shadow-sm"
      style={{ borderColor: missionColor + '40' }}
    >
      <h4 className="text-xs font-extrabold uppercase tracking-wider" style={{ color: missionColor }}>
        {title}
      </h4>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Début</label>
          <input
            required
            type="datetime-local"
            value={formStart}
            onChange={e => setFormStart(e.target.value)}
            className="w-full text-xs border border-slate-200 rounded-xl px-2.5 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:border-transparent"
            style={{ '--tw-ring-color': missionColor } as React.CSSProperties}
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fin (optionnel)</label>
          <input
            type="datetime-local"
            value={formEnd}
            onChange={e => setFormEnd(e.target.value)}
            className="w-full text-xs border border-slate-200 rounded-xl px-2.5 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:border-transparent"
            style={{ '--tw-ring-color': missionColor } as React.CSSProperties}
          />
        </div>
      </div>
      <div>
        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Note (optionnel)</label>
        <input
          type="text"
          value={formNote}
          onChange={e => setFormNote(e.target.value)}
          placeholder="ex: Pause déjeuner incluse…"
          className="w-full text-xs border border-slate-200 rounded-xl px-2.5 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:border-transparent"
          style={{ '--tw-ring-color': missionColor } as React.CSSProperties}
        />
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-extrabold text-white transition-all active:scale-95 duration-100 disabled:opacity-50"
          style={{ backgroundColor: missionColor }}
        >
          <Check className="w-3.5 h-3.5 stroke-[3]" />
          {loading ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button
          type="button"
          onClick={cancelForm}
          className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all active:scale-95 duration-100"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </form>
  );

  return (
    <div className="space-y-3">
      {/* Header card with totals */}
      <div
        className="rounded-2xl p-4 flex items-center gap-4 shadow-xs border"
        style={{ backgroundColor: missionColor + '10', borderColor: missionColor + '30' }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: missionColor + '20' }}
        >
          <Timer className="w-6 h-6" style={{ color: missionColor }} />
        </div>
        <div className="flex-1">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Total heures travaillées</div>
          <div className="text-2xl font-black mt-0.5" style={{ color: missionColor }}>
            {totalHours}h{String(totalMins).padStart(2, '0')}
          </div>
          <div className="text-[10px] text-slate-400 font-semibold">{myLogs.length} créneau{myLogs.length > 1 ? 'x' : ''} enregistré{myLogs.length > 1 ? 's' : ''}</div>
        </div>
        {!isTerminated && !isAdding && editingId === null && (
          <button
            onClick={openAddForm}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-extrabold text-white transition-all active:scale-95 duration-100 shadow-xs"
            style={{ backgroundColor: missionColor }}
          >
            <Plus className="w-3.5 h-3.5" />
            Ajouter
          </button>
        )}
      </div>

      {/* Add form */}
      {isAdding && renderForm(handleSubmitAdd, '+ Nouveau créneau')}

      {/* Logs list */}
      {myLogs.length === 0 && !isAdding ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-6 text-center">
          <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-400">Aucune heure enregistrée</p>
          {!isTerminated && (
            <button
              onClick={openAddForm}
              className="mt-3 px-4 py-2 rounded-xl text-xs font-extrabold text-white transition-all active:scale-95 duration-100"
              style={{ backgroundColor: missionColor }}
            >
              <Plus className="w-3.5 h-3.5 inline mr-1" />
              Ajouter un créneau
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {myLogs.map(log => (
            <div key={log.id}>
              {editingId === log.id ? (
                renderForm(handleSubmitEdit, 'Modifier le créneau')
              ) : (
                <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
                  <div className="flex items-center gap-3 px-4 py-3">
                    {/* Status indicator */}
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${log.endTime ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />

                    {/* Times */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-extrabold text-slate-800">
                          {format(log.startTime, 'HH:mm', { locale: fr })}
                        </span>
                        <span className="text-slate-300 text-xs">→</span>
                        {log.endTime ? (
                          <span className="text-sm font-extrabold text-slate-800">
                            {format(log.endTime, 'HH:mm', { locale: fr })}
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-amber-500 animate-pulse">En cours…</span>
                        )}
                        <span
                          className="text-[10px] font-extrabold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: missionColor + '15', color: missionColor }}
                        >
                          {formatDuration(log.startTime, log.endTime)}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                        {format(log.startTime, 'EEEE d MMMM', { locale: fr })}
                        {log.note && <> · <span className="italic text-slate-500">{log.note}</span></>}
                      </div>
                    </div>

                    {/* Actions */}
                    {!isTerminated && (
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Clock-out button if not ended */}
                        {!log.endTime && (
                          <button
                            onClick={() => handleClockOut(log)}
                            disabled={loading}
                            title="Pointer la fin"
                            className="p-2 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 transition-all active:scale-90 duration-100"
                          >
                            <Square className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => openEditForm(log)}
                          title="Modifier"
                          className="p-2 rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 transition-all active:scale-90 duration-100"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(log.id)}
                          title="Supprimer"
                          className="p-2 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-all active:scale-90 duration-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info note */}
      <div className="flex items-start gap-2 bg-white border border-slate-100 rounded-xl p-3 shadow-xs">
        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
        <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
          Les heures saisies sont synchronisées en temps réel et visibles par l'administrateur.
        </p>
      </div>
    </div>
  );
}

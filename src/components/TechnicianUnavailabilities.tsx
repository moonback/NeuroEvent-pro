import React, { useState } from 'react';
import { useStore } from '../store';
import { useAuthStore } from '../store/auth';
import { CalendarDays, Plus, Trash2, CalendarX2, Info, X } from 'lucide-react';
import { UnavailabilityType } from '../types';

export default function TechnicianUnavailabilities() {
  const user = useAuthStore((state) => state.user);
  const unavailabilities = useStore((state) => state.unavailabilities);
  const addUnavailability = useStore((state) => state.addUnavailability);
  const deleteUnavailability = useStore((state) => state.deleteUnavailability);

  const [modalOpen, setModalOpen] = useState(false);
  const [unavailStart, setUnavailStart] = useState('');
  const [unavailEnd, setUnavailEnd] = useState('');
  const [unavailType, setUnavailType] = useState<UnavailabilityType>('Congé');
  const [unavailReason, setUnavailReason] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  if (!user) return null;

  const myUnavailabilities = unavailabilities
    .filter((u) => u.technicianId === user.id)
    .sort((a, b) => b.start.getTime() - a.start.getTime());

  const handleAddUnavailability = () => {
    if (!unavailStart || !unavailEnd) return;
    addUnavailability({
      technicianId: user.id,
      start: new Date(unavailStart),
      end: new Date(unavailEnd),
      type: unavailType,
      reason: unavailReason,
    });
    setUnavailStart('');
    setUnavailEnd('');
    setUnavailReason('');
    setUnavailType('Congé');
    setModalOpen(false);
  };

  const handleOpenModal = () => setModalOpen(true);
  const handleCloseModal = () => {
    setModalOpen(false);
    setUnavailStart('');
    setUnavailEnd('');
    setUnavailReason('');
    setUnavailType('Congé');
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: '0.875rem',
    padding: '0.7rem 0.875rem',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--tech-text)',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    colorScheme: 'dark',
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = 'rgba(0,229,160,0.40)';
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,229,160,0.08)';
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)';
    e.currentTarget.style.boxShadow = 'none';
  };

  const typeConfig: Record<string, { bg: string; border: string; color: string }> = {
    Congé: {
      bg: 'rgba(255,183,0,0.10)',
      border: 'rgba(255,183,0,0.22)',
      color: '#ffd84d',
    },
    Indisponibilité: {
      bg: 'rgba(255,77,109,0.10)',
      border: 'rgba(255,77,109,0.22)',
      color: '#ff8fa0',
    },
  };

  const canSubmit = !!unavailStart && !!unavailEnd;

  return (
    <>
      <div className="px-4 space-y-4 tech-animate-in pb-8">

        {/* ── CTA button ──────────────────────────────────────────────── */}
        <button
          type="button"
          onClick={handleOpenModal}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl font-black text-sm text-black uppercase tracking-wider transition-all active:scale-[0.97]"
          style={{
            background: 'linear-gradient(135deg, var(--tech-accent) 0%, var(--tech-accent-dim) 100%)',
            boxShadow: '0 4px 24px rgba(0,229,160,0.28)',
          }}
        >
          <Plus className="w-4 h-4" strokeWidth={3} />
          Déclarer une absence
        </button>

        {/* ── Liste des absences ───────────────────────────────────────── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'var(--tech-card)',
            border: '1px solid var(--tech-border)',
          }}
        >
          {/* Header */}
          <div
            className="px-4 py-3 flex justify-between items-center"
            style={{
              background: 'rgba(255,255,255,0.02)',
              borderBottom: '1px solid var(--tech-border)',
            }}
          >
            <div className="flex items-center gap-2">
              <CalendarX2 className="w-3.5 h-3.5" style={{ color: '#ffb700' }} />
              <span
                className="text-[10px] font-black uppercase tracking-widest"
                style={{ color: 'var(--tech-text-secondary)' }}
              >
                Mes absences prévues
              </span>
            </div>
            <span
              className="text-[9px] font-black px-2.5 py-1 rounded-full"
              style={{
                background: 'rgba(255,183,0,0.08)',
                border: '1px solid rgba(255,183,0,0.18)',
                color: '#ffb700',
              }}
            >
              {myUnavailabilities.length} au total
            </span>
          </div>

          {myUnavailabilities.length === 0 ? (
            <div className="py-14 text-center">
              <CalendarDays
                className="w-8 h-8 mx-auto mb-3 tech-animate-float"
                style={{ color: 'var(--tech-text-muted)' }}
              />
              <p className="text-sm font-bold" style={{ color: 'var(--tech-text-muted)' }}>
                Aucune absence prévue
              </p>
              <p className="text-[11px] mt-1 max-w-[200px] mx-auto" style={{ color: 'var(--tech-text-muted)', opacity: 0.55 }}>
                Appuyez sur le bouton ci-dessus pour en déclarer une.
              </p>
            </div>
          ) : (
            <div>
              {myUnavailabilities.map((u, idx) => {
                const cfg = typeConfig[u.type] ?? typeConfig['Indisponibilité'];
                const isConfirming = confirmId === u.id;
                return (
                  <div
                    key={u.id}
                    className="px-4 py-3.5 flex items-center justify-between transition-all tech-animate-in"
                    style={{
                      borderBottom:
                        idx < myUnavailabilities.length - 1 ? '1px solid var(--tech-border)' : 'none',
                      animationDelay: `${idx * 40}ms`,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.025)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span
                          className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider"
                          style={{
                            background: cfg.bg,
                            border: `1px solid ${cfg.border}`,
                            color: cfg.color,
                          }}
                        >
                          {u.type}
                        </span>
                        {u.reason && (
                          <span
                            className="text-xs font-semibold truncate"
                            style={{ color: 'var(--tech-text)' }}
                          >
                            {u.reason}
                          </span>
                        )}
                      </div>
                      <div
                        className="text-[10px] font-semibold"
                        style={{ color: 'var(--tech-text-muted)' }}
                      >
                        {u.start.toLocaleDateString('fr-FR', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        <span className="mx-2 opacity-40">→</span>
                        {u.end.toLocaleDateString('fr-FR', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>

                    {/* Delete */}
                    <div className="ml-3 shrink-0">
                      {isConfirming ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setConfirmId(null)}
                            className="text-[9px] font-black px-2.5 py-1.5 rounded-xl transition-all"
                            style={{
                              background: 'rgba(255,255,255,0.05)',
                              border: '1px solid var(--tech-border)',
                              color: 'var(--tech-text-muted)',
                            }}
                          >
                            Annuler
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              deleteUnavailability(u.id);
                              setConfirmId(null);
                            }}
                            className="text-[9px] font-black px-2.5 py-1.5 rounded-xl transition-all"
                            style={{
                              background: 'rgba(255,77,109,0.14)',
                              border: '1px solid rgba(255,77,109,0.28)',
                              color: '#ff8fa0',
                            }}
                          >
                            Supprimer
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmId(u.id)}
                          className="p-2 rounded-xl transition-all active:scale-90"
                          style={{
                            background: 'rgba(255,77,109,0.06)',
                            border: '1px solid transparent',
                            color: 'rgba(255,77,109,0.45)',
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.background = 'rgba(255,77,109,0.12)';
                            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,77,109,0.22)';
                            (e.currentTarget as HTMLElement).style.color = '#ff8fa0';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.background = 'rgba(255,77,109,0.06)';
                            (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
                            (e.currentTarget as HTMLElement).style.color = 'rgba(255,77,109,0.45)';
                          }}
                          aria-label="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Info note */}
        <div
          className="flex items-start gap-2.5 px-3.5 py-3 rounded-2xl tech-animate-in"
          style={{
            background: 'rgba(77,159,255,0.06)',
            border: '1px solid rgba(77,159,255,0.12)',
            animationDelay: '160ms',
          }}
        >
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'var(--tech-blue)' }} />
          <p
            className="text-[10px] font-semibold leading-relaxed"
            style={{ color: 'var(--tech-blue)', opacity: 0.8 }}
          >
            Vos absences sont visibles par votre administrateur et bloquent les affectations sur ces plages horaires.
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          MODAL — Déclarer une absence (bottom sheet)
      ══════════════════════════════════════════════════════════════════ */}
      {modalOpen && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.70)', backdropFilter: 'blur(4px)' }}
            onClick={handleCloseModal}
          />

          {/* Sheet */}
          <div
            className="relative w-full max-w-md rounded-t-3xl p-5 space-y-5 z-10 tech-animate-slide-up"
            style={{
              background: 'rgba(13,17,28,0.98)',
              backdropFilter: 'blur(28px)',
              borderTop: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {/* Grab handle */}
            <div
              className="w-9 h-[3px] rounded-full mx-auto"
              style={{ background: 'rgba(255,255,255,0.14)' }}
            />

            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h3
                  className="text-base font-black tracking-tight"
                  style={{ color: 'var(--tech-text)' }}
                >
                  Déclarer une absence
                </h3>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--tech-text-muted)' }}>
                  Renseignez vos dates et le type d'absence.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-2 rounded-xl transition-all active:scale-90"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--tech-border)',
                }}
              >
                <X className="w-4 h-4" style={{ color: 'var(--tech-text-muted)' }} />
              </button>
            </div>

            {/* ── Form ── */}
            <div className="space-y-4">
              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className="block text-[9px] font-black uppercase tracking-widest mb-1.5"
                    style={{ color: 'var(--tech-text-muted)' }}
                  >
                    Du
                  </label>
                  <input
                    type="datetime-local"
                    value={unavailStart}
                    onChange={(e) => setUnavailStart(e.target.value)}
                    style={inputStyle}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>
                <div>
                  <label
                    className="block text-[9px] font-black uppercase tracking-widest mb-1.5"
                    style={{ color: 'var(--tech-text-muted)' }}
                  >
                    Au
                  </label>
                  <input
                    type="datetime-local"
                    value={unavailEnd}
                    onChange={(e) => setUnavailEnd(e.target.value)}
                    style={inputStyle}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>
              </div>

              {/* Type segmented picker */}
              <div>
                <label
                  className="block text-[9px] font-black uppercase tracking-widest mb-1.5"
                  style={{ color: 'var(--tech-text-muted)' }}
                >
                  Type
                </label>
                <div
                  className="flex p-1 rounded-xl gap-1"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--tech-border)',
                  }}
                >
                  {(['Congé', 'Indisponibilité'] as UnavailabilityType[]).map((t) => {
                    const cfg = typeConfig[t];
                    const active = unavailType === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setUnavailType(t)}
                        className="flex-1 py-2 text-[10px] font-black rounded-lg transition-all duration-200"
                        style={{
                          background: active ? cfg.bg : 'transparent',
                          border: active ? `1px solid ${cfg.border}` : '1px solid transparent',
                          color: active ? cfg.color : 'var(--tech-text-muted)',
                          boxShadow: active ? `0 0 12px ${cfg.bg}` : 'none',
                        }}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reason */}
              <div>
                <label
                  className="block text-[9px] font-black uppercase tracking-widest mb-1.5"
                  style={{ color: 'var(--tech-text-muted)' }}
                >
                  Motif{' '}
                  <span style={{ opacity: 0.45, textTransform: 'none', letterSpacing: 0 }}>
                    (optionnel)
                  </span>
                </label>
                <input
                  type="text"
                  value={unavailReason}
                  onChange={(e) => setUnavailReason(e.target.value)}
                  placeholder="ex: Rendez-vous médical"
                  style={{
                    ...inputStyle,
                    caretColor: 'var(--tech-accent)',
                  }}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="button"
              onClick={handleAddUnavailability}
              disabled={!canSubmit}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm text-black uppercase tracking-wider transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, var(--tech-accent) 0%, var(--tech-accent-dim) 100%)',
                boxShadow: canSubmit ? '0 4px 24px rgba(0,229,160,0.28)' : 'none',
              }}
            >
              <Plus className="w-4 h-4" strokeWidth={3} />
              Enregistrer l'absence
            </button>
          </div>
        </div>
      )}
    </>
  );
}

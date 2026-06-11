import React from 'react';
import { Play, CheckCircle } from 'lucide-react';
import { TimeModalState } from './useTechDashboard';

interface TimeModalProps {
  timeModal: TimeModalState;
  selectedMission: {
    title: string;
    client: string;
    color: string;
  };
  onClose: () => void;
  onConfirm: () => void;
  setTimeModal: React.Dispatch<React.SetStateAction<TimeModalState | null>>;
}

export const TimeModal: React.FC<TimeModalProps> = ({
  timeModal,
  selectedMission,
  onClose,
  onConfirm,
  setTimeModal,
}) => {
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
        onClick={() => !timeModal.loading && onClose()}
      />

      {/* Card */}
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md shadow-2xl overflow-hidden z-10 animate-fade-in tech-time-modal">
        {/* Colored header band */}
        <div
          className="px-6 pt-6 pb-5 relative"
          style={{ backgroundColor: selectedMission.color }}
        >
          {/* Notch */}
          <div className="w-10 h-1 bg-white/30 rounded-full mx-auto mb-4 sm:hidden" />

          <div className="flex items-center gap-3 text-white">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 backdrop-blur-sm">
              {timeModal.type === 'start' ? (
                <Play className="w-6 h-6 text-white fill-white" />
              ) : (
                <CheckCircle className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-widest text-white/70">
                {timeModal.type === 'start' ? 'Démarrage de la mission' : 'Clôture de la mission'}
              </div>
              <div className="font-black text-lg leading-tight">{selectedMission.title}</div>
              <div className="text-xs font-semibold text-white/80 mt-0.5">{selectedMission.client}</div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 bg-[#0f172a] text-white">
          <div>
            <p className="text-sm font-semibold text-slate-300 leading-relaxed">
              {timeModal.type === 'start'
                ? 'Indiquez votre heure de prise de poste. Cette heure sera enregistrée comme début de votre créneau.'
                : 'Indiquez votre heure de fin de mission. Votre créneau de travail sera clôturé.'}
            </p>
          </div>

          {/* Time picker */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
              {timeModal.type === 'start' ? 'Heure de début' : 'Heure de fin'}
            </label>
            <input
              type="time"
              value={timeModal.time}
              onChange={(e) =>
                setTimeModal((prev) => (prev ? { ...prev, time: e.target.value } : null))
              }
              className="w-full text-3xl font-black text-white text-center border-2 border-slate-700 focus:border-slate-500 rounded-2xl py-4 focus:outline-none transition-all bg-slate-900"
              autoFocus
            />
            <p className="text-center text-xs text-slate-400 font-semibold mt-2">
              {new Date().toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-1 pb-safe">
            <button
              type="button"
              onClick={onClose}
              disabled={timeModal.loading}
              className="flex-1 py-3.5 rounded-2xl text-sm font-extrabold text-slate-300 bg-slate-800 hover:bg-slate-750 transition-all active:scale-95 duration-100 disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={timeModal.loading || !timeModal.time}
              className="flex-[2] py-3.5 rounded-2xl text-sm font-extrabold text-white transition-all active:scale-95 duration-100 disabled:opacity-50 shadow-sm flex items-center justify-center gap-2"
              style={{ backgroundColor: selectedMission.color }}
            >
              {timeModal.loading ? (
                <span className="animate-pulse">Enregistrement…</span>
              ) : (
                <>
                  {timeModal.type === 'start' ? (
                    <Play className="w-4 h-4 fill-white" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  {timeModal.type === 'start' ? 'Démarrer' : 'Terminer'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

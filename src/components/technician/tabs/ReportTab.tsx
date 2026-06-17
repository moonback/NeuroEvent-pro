import React, { useState } from 'react';
import { FileText, AlertTriangle } from 'lucide-react';
import { triggerVibrate } from '../useTechDashboard';
import { InfoCard, CardHeader } from './InfoCard';
import PhotoGrid from './PhotoGrid';

interface ReportTabProps {
  mission: any;
  localReports: Record<string, string>;
  savingStatus: 'idle' | 'saving' | 'saved';
  handleReportChange: (missionId: string, value: string) => void;
  photoUploading: { missionId: string; type: 'before' | 'after' } | null;
  handlePhotoUpload: (missionId: string, type: 'before' | 'after', file: File) => Promise<void>;
  handlePhotoDelete: (missionId: string, photoId: string) => void;
}

export default function ReportTab({
  mission,
  localReports,
  savingStatus,
  handleReportChange,
  photoUploading,
  handlePhotoUpload,
  handlePhotoDelete,
}: ReportTabProps) {
  const [confirmClear, setConfirmClear] = useState(false);

  const photoBefore = (mission.photos || []).filter((p: any) => p.type === 'before');
  const photoAfter = (mission.photos || []).filter((p: any) => p.type === 'after');

  return (
    <div className="space-y-3 tech-stagger">
      {/* ── Rapport de fin de mission ── */}
      <InfoCard>
        <CardHeader
          icon={<FileText className="w-3.5 h-3.5" style={{ color: mission.color }} />}
          label="Rapport de fin de mission"
          right={
            <span className="text-[9px] font-bold font-mono">
              {savingStatus === 'saving' && <span style={{ color: '#ffb700' }}>Enregistrement…</span>}
              {savingStatus === 'saved' && <span style={{ color: 'var(--tech-accent)' }}>Sauvegardé ✓</span>}
              {savingStatus === 'idle' && <span style={{ color: 'var(--tech-text-muted)' }}>Brouillon</span>}
            </span>
          }
        />
        <div className="p-4 space-y-3">
          <textarea
            placeholder="Ex: Le projecteur LED #4 ne s'allume pas..."
            value={localReports[mission.id] || ''}
            onChange={(e) => handleReportChange(mission.id, e.target.value)}
            rows={6}
            className="w-full text-sm rounded-2xl p-4 outline-none transition-all resize-none font-medium no-scrollbar"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--tech-border)',
              color: 'var(--tech-text)',
              caretColor: 'var(--tech-accent)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0,229,160,0.30)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,229,160,0.06)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--tech-border)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            aria-label="Contenu du rapport de mission"
          />
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-bold flex items-center gap-1" style={{ color: 'var(--tech-text-muted)' }}>
              <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
              Auto-sauvegardé localement
            </span>
            {localReports[mission.id] && (
              confirmClear ? (
                <div className="flex items-center gap-1.5" role="group" aria-label="Confirmation d'effacement">
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="text-[9px] font-black px-2 py-1 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--tech-text-muted)' }}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerVibrate('click');
                      handleReportChange(mission.id, '');
                      setConfirmClear(false);
                    }}
                    className="text-[9px] font-black px-2 py-1 rounded-lg"
                    style={{ background: 'rgba(255,77,109,0.14)', color: '#ff8fa0', border: '1px solid rgba(255,77,109,0.25)' }}
                  >
                    Supprimer
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="text-[10px] font-bold cursor-pointer hover:underline focus:outline-none"
                  style={{ color: 'rgba(255,77,109,0.6)' }}
                >
                  Effacer
                </button>
              )
            )}
          </div>
        </div>
      </InfoCard>

      {/* ── Photo Before Grid ── */}
      <InfoCard>
        <div className="p-4">
          <PhotoGrid
            missionId={mission.id}
            type="before"
            photos={photoBefore}
            photoUploading={photoUploading}
            handlePhotoUpload={handlePhotoUpload}
            handlePhotoDelete={handlePhotoDelete}
            accentColor="#4d9fff"
          />
        </div>
      </InfoCard>

      {/* ── Photo After Grid ── */}
      <InfoCard>
        <div className="p-4">
          <PhotoGrid
            missionId={mission.id}
            type="after"
            photos={photoAfter}
            photoUploading={photoUploading}
            handlePhotoUpload={handlePhotoUpload}
            handlePhotoDelete={handlePhotoDelete}
            accentColor="#00e5a0"
          />
        </div>
      </InfoCard>
    </div>
  );
}

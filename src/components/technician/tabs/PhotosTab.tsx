import React from 'react';
import { Camera, Check } from 'lucide-react';
import { InfoCard, CardHeader } from './InfoCard';
import PhotoGrid from './PhotoGrid';

interface PhotosTabProps {
  mission: any;
  photoUploading: { missionId: string; type: 'before' | 'after' } | null;
  handlePhotoUpload: (missionId: string, type: 'before' | 'after', file: File) => Promise<void>;
  handlePhotoDelete: (missionId: string, photoId: string) => void;
}

export default function PhotosTab({
  mission,
  photoUploading,
  handlePhotoUpload,
  handlePhotoDelete,
}: PhotosTabProps) {
  const photoBefore = (mission.photos || []).filter((p: any) => p.type === 'before');
  const photoAfter = (mission.photos || []).filter((p: any) => p.type === 'after');
  const totalPhotos = (mission.photos || []).length;

  return (
    <div className="space-y-3 tech-stagger">
      {/* ── Photos Header Card ── */}
      <InfoCard>
        <CardHeader
          icon={<Camera className="w-3.5 h-3.5" style={{ color: mission.color }} />}
          label="Galerie Photos Terrain"
          right={
            <span
              className="text-[9px] font-black px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(0,229,160,0.1)', color: 'var(--tech-accent)' }}
            >
              {totalPhotos} photo{totalPhotos > 1 ? 's' : ''}
            </span>
          }
        />
        <div className="p-4 space-y-2">
          <p className="text-[10px] leading-relaxed" style={{ color: 'var(--tech-text-muted)' }}>
            Documentez chaque étape de la mission. Les photos sont conservées sécurisément et consultables par l'administrateur.
          </p>
          {totalPhotos > 0 && (
            <div className="flex items-center gap-2 mt-2 p-2 rounded-lg" style={{ background: 'rgba(0,229,160,0.08)', border: '1px solid rgba(0,229,160,0.15)' }}>
              <Check className="w-3.5 h-3.5" style={{ color: 'var(--tech-accent)' }} />
              <span className="text-[9px] font-semibold" style={{ color: 'var(--tech-accent)' }}>
                {totalPhotos} photo{totalPhotos > 1 ? 's' : ''} documentée{totalPhotos > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </InfoCard>

      {/* ── Photos Avant Montage ── */}
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

      {/* ── Photos Après Montage ── */}
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

      {/* ── Empty state ── */}
      {totalPhotos === 0 && (
        <InfoCard>
          <div className="p-8 text-center" role="status">
            <Camera className="w-12 h-12 mx-auto mb-3 tech-animate-float" style={{ color: 'var(--tech-text-muted)' }} />
            <h4 className="font-bold text-sm" style={{ color: 'var(--tech-text)' }}>Aucune photo</h4>
            <p className="text-[10px] mt-2" style={{ color: 'var(--tech-text-muted)' }}>
              Commencez par photographier l'état des lieux avant et après montage pour justifier la mission.
            </p>
          </div>
        </InfoCard>
      )}
    </div>
  );
}

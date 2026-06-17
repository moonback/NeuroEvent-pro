import React, { useState } from 'react';
import { Camera, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react';

interface Photo {
  id: string;
  url: string;
}

interface PhotoGridProps {
  missionId: string;
  type: 'before' | 'after';
  photos: Photo[];
  photoUploading: { missionId: string; type: 'before' | 'after' } | null;
  handlePhotoUpload: (missionId: string, type: 'before' | 'after', file: File) => Promise<void>;
  handlePhotoDelete: (missionId: string, photoId: string) => void;
  accentColor: string;
}

export default function PhotoGrid({
  missionId,
  type,
  photos,
  photoUploading,
  handlePhotoUpload,
  handlePhotoDelete,
  accentColor,
}: PhotoGridProps) {
  const [lightbox, setLightbox] = useState<string | null>(null);

  const label = type === 'before' ? 'Avant Montage' : 'Après Montage';
  const isUploading = photoUploading?.missionId === missionId && photoUploading?.type === type;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    for (const file of files) {
      await handlePhotoUpload(missionId, type, file);
    }
    e.target.value = '';
  };

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span
            className="text-[9px] font-black uppercase tracking-widest"
            style={{ color: accentColor }}
          >
            {label}
          </span>
          <span
            className="text-[9px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: `${accentColor}18`, color: accentColor }}
          >
            {photos.length} photo{photos.length > 1 ? 's' : ''}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* Existing photos */}
          {photos.map((photo) => (
            <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden group">
              <img
                src={photo.url}
                alt={label}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => setLightbox(photo.url)}
              />
              {/* Delete / View overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => handlePhotoDelete(missionId, photo.id)}
                  className="p-1.5 rounded-full transition-all cursor-pointer"
                  style={{ background: 'rgba(255,60,80,0.25)', color: '#ff8fa0' }}
                  title="Supprimer la photo"
                  aria-label="Supprimer la photo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setLightbox(photo.url)}
                  className="p-1.5 rounded-full transition-all cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
                  title="Agrandir la photo"
                  aria-label="Agrandir la photo"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {/* Add camera button */}
          <label
            className="aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all group"
            style={{
              borderColor: isUploading ? accentColor : 'var(--tech-border-strong)',
              background: isUploading ? `${accentColor}08` : 'rgba(255,255,255,0.01)',
            }}
            tabIndex={0}
            role="button"
            aria-label={`Prendre une photo ${label} avec l'appareil`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const fileInput = e.currentTarget.querySelector('input');
                fileInput?.click();
              }
            }}
          >
            {isUploading ? (
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: accentColor }} />
            ) : (
              <>
                <Camera
                  className="w-4 h-4 mb-0.5 transition-colors group-hover:scale-110"
                  style={{ color: 'var(--tech-text-muted)' }}
                />
                <span className="text-[7px] font-black uppercase tracking-wider text-center" style={{ color: 'var(--tech-text-muted)' }}>Appareil</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
              disabled={isUploading}
            />
          </label>

          {/* Add gallery button */}
          <label
            className="aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all group"
            style={{
              borderColor: isUploading ? accentColor : 'var(--tech-border-strong)',
              background: isUploading ? `${accentColor}08` : 'rgba(255,255,255,0.01)',
            }}
            tabIndex={0}
            role="button"
            aria-label={`Ajouter une photo ${label} depuis la galerie`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const fileInput = e.currentTarget.querySelector('input');
                fileInput?.click();
              }
            }}
          >
            {isUploading ? (
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: accentColor }} />
            ) : (
              <>
                <ImageIcon
                  className="w-4 h-4 mb-0.5 transition-colors group-hover:scale-110"
                  style={{ color: 'var(--tech-text-muted)' }}
                />
                <span className="text-[7px] font-black uppercase tracking-wider text-center" style={{ color: 'var(--tech-text-muted)' }}>Galerie</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
              disabled={isUploading}
            />
          </label>
        </div>
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Aperçu de la photo"
        >
          {/* Overlay closure */}
          <div className="absolute inset-0" onClick={() => setLightbox(null)} aria-hidden="true" />

          <div className="relative max-w-[95vw] max-h-[90vh] z-10 animate-in zoom-in-95 duration-150">
            <img src={lightbox} alt="Agrandissement" className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl" />
            <button
              type="button"
              onClick={() => setLightbox(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-900/80 text-white flex items-center justify-center text-lg font-bold cursor-pointer hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Fermer la photo"
            >
              ×
            </button>
            <a
              href={lightbox}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-2 right-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white hover:bg-slate-900/60 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
              style={{ background: 'rgba(0,0,0,0.45)' }}
            >
              Ouvrir l'original ↗
            </a>
          </div>
        </div>
      )}
    </>
  );
}

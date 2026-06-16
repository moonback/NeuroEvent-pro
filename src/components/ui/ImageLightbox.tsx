import React, { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  index: number;
  urls: string[];
  onIndexChange?: (index: number) => void;
}

export default function ImageLightbox({ isOpen, onClose, index, urls, onIndexChange }: ImageLightboxProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, index, urls.length, onClose, onIndexChange]);

  const clamp = (value: number) => {
    if (!urls.length) return 0;
    return ((value % urls.length) + urls.length) % urls.length;
  };

  const goPrev = () => {
    if (!isOpen || urls.length <= 1 || !onIndexChange) return;
    onIndexChange(clamp(index - 1));
  };

  const goNext = () => {
    if (!isOpen || urls.length <= 1 || !onIndexChange) return;
    onIndexChange(clamp(index + 1));
  };

  if (!isOpen || !urls.length) return null;

  const current = clamp(index);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-2"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative max-h-[95vh] max-w-[95vw] flex items-center justify-center">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute -top-2 -right-2 sm:top-2 sm:right-2 z-10 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
        >
          <X className="h-5 w-5" />
        </button>

        {urls.length > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Précédent"
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 disabled:opacity-40"
            >
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Suivant"
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 disabled:opacity-40"
            >
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </>
        )}

        <img
          src={urls[current]}
          alt={`Photo ${current + 1}/${urls.length}`}
          className="max-h-[95vh] max-w-[95vw] object-contain rounded-xl select-none"
        />

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
          {current + 1} / {urls.length}
        </div>
      </div>
    </div>
  );
}

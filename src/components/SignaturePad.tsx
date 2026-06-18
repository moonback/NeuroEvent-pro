import React, { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { X, Check, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from '../store/toast';
import ConfirmModal from './ui/ConfirmModal';

interface SignaturePadProps {
  missionId: string;
  onSave: (url: string) => void;
  onClose: () => void;
}

export default function SignaturePad({ missionId, onSave, onClose }: SignaturePadProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);

  const clear = () => {
    sigCanvas.current?.clear();
  };

  /** Demande confirmation si la signature n'est pas vide, sinon ferme directement. */
  const requestClose = () => {
    if (isUploading) return;
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      setConfirmCloseOpen(true);
    } else {
      onClose();
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') requestClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUploading]);

  const save = async () => {
    if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
      toast.error('Veuillez signer avant de valider.');
      return;
    }

    setIsUploading(true);
    try {
      const dataUrl = sigCanvas.current.getCanvas().toDataURL('image/png');
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const fileName = `signature_${missionId}_${Date.now()}.png`;

      const { data, error } = await supabase.storage
        .from('signatures')
        .upload(fileName, blob, {
          contentType: 'image/png',
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Return the file path (not a public URL) for storage in the database
      onSave(data.path);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la signature', error);
      toast.error('Erreur lors de l\'enregistrement de la signature.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          onClick={requestClose}
          aria-hidden={isUploading}
        />
        
        <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up sm:animate-fade-in">
          <div className="p-4 border-b border-[#e2e8f0]/60 flex justify-between items-center bg-[#f8fafc]">
            <h3 className="text-sm font-black text-[#0f172a] uppercase tracking-wider">
              Signature du Client
            </h3>
            <button 
              onClick={requestClose}
              className="p-2 text-[#64748b] hover:bg-[#e2e8f0] rounded-xl transition-colors"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 bg-slate-50 flex-1 min-h-[300px] flex items-center justify-center relative" role="group" aria-label="Zone de signature">
            <div className="w-full bg-white rounded-2xl border-2 border-dashed border-[#cbd5e1] overflow-hidden">
              <SignatureCanvas 
                ref={sigCanvas}
                penColor="#0f172a"
                canvasProps={{
                  className: 'signature-canvas w-full h-64 touch-none cursor-crosshair',
                  style: { background: '#ffffff' }
                }}
              />
            </div>
            <div className="absolute bottom-6 text-[10px] font-bold text-[#94a3b8] pointer-events-none uppercase tracking-widest text-center w-full">
              Signez dans le cadre ci-dessus
            </div>
          </div>

          <div className="p-4 bg-white border-t border-[#e2e8f0]/60 grid grid-cols-2 gap-3">
            <button
              onClick={clear}
              disabled={isUploading}
              className="px-4 py-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Trash2 className="w-4 h-4" />
              Effacer
            </button>
            
            <button
              onClick={save}
              disabled={isUploading}
              aria-disabled={isUploading}
              className="px-4 py-3 bg-[#0f172a] text-white rounded-xl text-xs font-bold hover:bg-[#1e293b] flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Valider
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmCloseOpen}
        title="Fermer sans sauvegarder ?"
        message="La signature sera perdue. Fermer quand même ?"
        confirmLabel="Fermer"
        cancelLabel="Continuer"
        variant="warning"
        onConfirm={() => { setConfirmCloseOpen(false); onClose(); }}
        onCancel={() => setConfirmCloseOpen(false)}
      />
    </>
  );
}

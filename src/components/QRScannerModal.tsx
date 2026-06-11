import React, { useEffect, useRef, useState } from 'react';
import { X, CheckCircle2, XCircle, Camera } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (decodedText: string) => boolean | void;
  equipmentDefs?: { id: string; name: string }[];
}

interface ScannedItem {
  id: string;
  name: string;
  status: 'success' | 'error';
  timestamp: number;
}

export function QRScannerModal({ isOpen, onClose, onScan, equipmentDefs }: QRScannerModalProps) {
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [showFlash, setShowFlash] = useState(false);
  const cooldownRef = useRef<{ [key: string]: number }>({});

  useEffect(() => {
    if (!isOpen) return;

    // Custom configuration for responsive scanning performance
    const scanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 15,
        qrbox: { width: 220, height: 220 },
        aspectRatio: 1.0
      },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        const now = Date.now();
        const lastScannedTime = cooldownRef.current[decodedText] || 0;
        
        // Cooldown mechanism: ignore same QR scanned within 2 seconds
        if (now - lastScannedTime < 2000) {
          return;
        }
        cooldownRef.current[decodedText] = now;

        // Execute scan callback (returns boolean for validation success)
        const isSuccess = onScan(decodedText) !== false;

        // Dynamic success flash effect
        if (isSuccess) {
          setShowFlash(true);
          setTimeout(() => setShowFlash(false), 250);
        }

        // Retrieve equipment name from definitions or default to ID
        const eqDef = equipmentDefs?.find(e => e.id === decodedText);
        const name = eqDef?.name || `ID: ${decodedText.substring(0, 12)}`;

        // Prepend to history, max 3 items
        setScannedItems(prev => [
          {
            id: `${decodedText}-${now}`,
            name,
            status: isSuccess ? 'success' as const : 'error' as const,
            timestamp: now
          },
          ...prev
        ].slice(0, 3));
      },
      (errorMessage) => {
        // Suppress continuous scan frame error logs
      }
    );

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [isOpen, onScan, equipmentDefs]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
      <div 
        className="w-full max-w-sm rounded-3xl overflow-hidden flex flex-col relative tech-glow-sm"
        style={{
          background: 'rgba(10, 13, 20, 0.96)',
          border: '1px solid rgba(0, 229, 160, 0.15)',
        }}
      >
        {/* Flash effect overlay */}
        <div 
          className={`absolute inset-0 bg-emerald-500/20 pointer-events-none z-50 transition-opacity duration-200 ${
            showFlash ? 'opacity-100' : 'opacity-0'
          }`} 
        />

        {/* Header */}
        <div className="p-5 border-b border-white/[0.04] flex justify-between items-center bg-[#070a0f]">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-[var(--tech-accent)] animate-pulse" />
            <h2 className="font-extrabold text-sm uppercase tracking-wider text-[#f0f4ff]">
              Scanner Multi-Code
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] rounded-full transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Scanner Viewport */}
        <div className="p-5 flex flex-col items-center">
          <div className="relative w-full overflow-hidden rounded-2xl border border-white/[0.06] bg-black max-w-[280px]">
            <div id="reader" className="w-full text-white bg-black"></div>
            
            {/* Holographic Laser line overlay */}
            <div className="tech-laser-line" />
          </div>
          
          <div className="mt-3 text-center">
            <p className="text-[9px] uppercase font-black tracking-widest text-neutral-500">
              Vibration haptique active
            </p>
          </div>
        </div>

        {/* Recent Scans History List */}
        <div className="px-5 pb-5 flex-1 flex flex-col justify-end">
          <div className="space-y-2 mb-4">
            <h3 className="text-[9px] uppercase font-black tracking-widest text-neutral-400">
              Historique des Scans ({scannedItems.length})
            </h3>
            {scannedItems.length === 0 ? (
              <div className="py-5 text-center rounded-2xl border border-dashed border-white/[0.03] bg-white/[0.01]">
                <p className="text-xs text-neutral-600">Aucun équipement scanné pour le moment</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto no-scrollbar">
                {scannedItems.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between p-2.5 rounded-xl border bg-white/[0.01] tech-animate-in"
                    style={{
                      borderColor: item.status === 'success' ? 'rgba(0, 229, 160, 0.12)' : 'rgba(255, 77, 109, 0.12)',
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {item.status === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-[var(--tech-accent)] shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-[var(--tech-danger)] shrink-0" />
                      )}
                      <span className="text-xs font-semibold text-white truncate">
                        {item.name}
                      </span>
                    </div>
                    <span 
                      className={`text-[8.5px] uppercase font-black shrink-0 ${
                        item.status === 'success' ? 'text-[var(--tech-accent)]' : 'text-[var(--tech-danger)]'
                      }`}
                    >
                      {item.status === 'success' ? 'Validé' : 'Erreur'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Validation Button */}
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl font-black text-xs uppercase tracking-wider text-black bg-[var(--tech-accent)] hover:bg-[var(--tech-accent-dim)] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-[rgba(0,229,160,0.15)]"
          >
            Terminer le pointage
          </button>
        </div>
      </div>
    </div>
  );
}

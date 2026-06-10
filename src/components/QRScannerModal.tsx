import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (decodedText: string) => void;
}

export function QRScannerModal({ isOpen, onClose, onScan }: QRScannerModalProps) {
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;

    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        onScan(decodedText);
        scanner.clear();
        onClose();
      },
      (errorMessage) => {
        // Ignore errors, they are frequent during scanning
      }
    );

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-[#e2e8f0] flex justify-between items-center bg-[#f8fafc]">
          <h2 className="font-bold text-[#0f172a]">Scanner un équipement</h2>
          <button 
            onClick={onClose}
            className="p-2 text-[#64748b] hover:text-[#0f172a] hover:bg-[#e2e8f0] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4">
          <div id="reader" className="w-full"></div>
          
          <div className="mt-4 text-center text-sm text-[#64748b]">
            <p>Pointez la caméra vers le QR code de l'équipement pour le valider automatiquement.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

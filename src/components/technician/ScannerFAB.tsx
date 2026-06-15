import React from 'react';
import { QrCode } from 'lucide-react';
import { triggerVibrate } from './useTechDashboard';
import { toast } from '../../store/toast';

export default function ScannerFAB() {
  const openScanner = () => {
    triggerVibrate('click');
    try {
      window.dispatchEvent(new CustomEvent('open-qr-scanner'));
      toast.info('Scanner QR activé');
    } catch (e) {
      console.error('Failed to dispatch scanner event', e);
    }
  };

  return (
    <button
      onClick={openScanner}
      aria-label="Ouvrir le scanner"
      className="fixed bottom-[86px] right-4 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-lg tech-glow-sm"
      style={{
        background: 'linear-gradient(135deg, var(--tech-accent) 0%, var(--tech-accent-dim) 100%)',
        boxShadow: '0 8px 26px rgba(0,229,160,0.22)',
      }}
    >
      <QrCode className="w-6 h-6 text-black" />
    </button>
  );
}

import React from 'react';
import ScannerFAB from './ScannerFAB';

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="tech-dark min-h-screen bg-black text-[var(--tech-text)] font-sans relative">
      <div className="max-w-md mx-auto px-0">
        {children}
      </div>

      {/* Floating scanner FAB */}
      <ScannerFAB />
    </div>
  );
}

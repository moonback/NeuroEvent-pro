import React from 'react';

export interface InfoCardProps {
  children: React.ReactNode;
  className?: string;
}

export function InfoCard({ children, className = '' }: InfoCardProps) {
  return (
    <div
      className={`rounded-2xl overflow-hidden ${className}`}
      style={{ background: 'var(--tech-card)', border: '1px solid var(--tech-border)' }}
    >
      {children}
    </div>
  );
}

export interface CardHeaderProps {
  icon: React.ReactNode;
  label: string;
  right?: React.ReactNode;
}

export function CardHeader({ icon, label, right }: CardHeaderProps) {
  return (
    <div
      className="px-4 py-2.5 flex items-center justify-between"
      style={{ borderBottom: '1px solid var(--tech-border)', background: 'rgba(255,255,255,0.02)' }}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--tech-text-muted)' }}>
          {label}
        </span>
      </div>
      {right}
    </div>
  );
}

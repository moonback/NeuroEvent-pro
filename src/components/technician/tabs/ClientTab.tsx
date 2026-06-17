import React from 'react';
import { Phone, Mail, MapPin, MessageSquare, AlertCircle, Info } from 'lucide-react';
import { triggerVibrate } from '../useTechDashboard';
import { InfoCard, CardHeader } from './InfoCard';

interface ClientTabProps {
  mission: any;
  getClientInfo: (id?: string) => any;
}

export default function ClientTab({ mission, getClientInfo }: ClientTabProps) {
  const client = getClientInfo(mission.clientId);

  if (!client) {
    return (
      <InfoCard>
        <div className="p-8 text-center" role="status">
          <div
            className="w-14 h-14 rounded-3xl flex items-center justify-center mx-auto mb-3 tech-animate-float"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--tech-border)' }}
          >
            <Info className="w-6 h-6" style={{ color: 'var(--tech-text-muted)' }} />
          </div>
          <h4 className="font-bold text-sm" style={{ color: 'var(--tech-text)' }}>Pas de fiche client</h4>
          <p className="text-xs mt-1" style={{ color: 'var(--tech-text-muted)' }}>Client saisi manuellement.</p>
          <div className="mt-4 p-3.5 rounded-2xl text-left" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--tech-border)' }}>
            <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--tech-text-muted)' }}>Nom saisi</span>
            <div className="font-bold mt-1 text-sm" style={{ color: 'var(--tech-text)' }}>{mission.client}</div>
          </div>
        </div>
      </InfoCard>
    );
  }

  return (
    <div className="space-y-3 tech-stagger">
      {/* Client card */}
      <InfoCard>
        {/* Avatar header */}
        <div className="px-4 pt-4 pb-3 flex items-center gap-3" style={{ borderBottom: '1px solid var(--tech-border)' }}>
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-base shrink-0"
            style={{
              background: `linear-gradient(135deg, ${mission.color} 0%, ${mission.color}88 100%)`,
              boxShadow: `0 4px 16px ${mission.color}30`,
            }}
          >
            {client.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div
              className="text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider inline-block mb-1"
              style={{ background: 'var(--tech-accent-soft)', color: 'var(--tech-accent)' }}
            >
              Fiche Client
            </div>
            <div className="font-black text-sm leading-tight" style={{ color: 'var(--tech-text)' }}>{client.name}</div>
            {client.contactName && (
              <p className="text-[10px] font-medium mt-0.5" style={{ color: 'var(--tech-text-muted)' }}>
                Contact : <span style={{ color: 'var(--tech-text-secondary)' }}>{client.contactName}</span>
              </p>
            )}
          </div>
        </div>

        {/* Contact rows */}
        {client.phone && (
          <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: '1px solid var(--tech-border)' }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(77,159,255,0.12)' }}>
              <Phone className="w-3.5 h-3.5" style={{ color: 'var(--tech-blue)' }} />
            </div>
            <div>
              <div className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--tech-text-muted)' }}>Téléphone</div>
              <a href={`tel:${client.phone}`} onClick={() => triggerVibrate('click')} className="font-bold text-sm hover:underline" style={{ color: 'var(--tech-blue)' }}>
                {client.phone}
              </a>
            </div>
          </div>
        )}
        {client.email && (
          <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: '1px solid var(--tech-border)' }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(167,139,250,0.12)' }}>
              <Mail className="w-3.5 h-3.5" style={{ color: 'var(--tech-purple)' }} />
            </div>
            <div className="min-w-0">
              <div className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--tech-text-muted)' }}>Email</div>
              <a href={`mailto:${client.email}`} onClick={() => triggerVibrate('click')} className="font-bold text-sm hover:underline truncate block" style={{ color: 'var(--tech-purple)' }}>
                {client.email}
              </a>
            </div>
          </div>
        )}
        {client.address && (
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <MapPin className="w-3.5 h-3.5" style={{ color: 'var(--tech-text-muted)' }} />
            </div>
            <div>
              <div className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--tech-text-muted)' }}>Adresse</div>
              <span className="font-semibold text-sm" style={{ color: 'var(--tech-text-secondary)' }}>{client.address}</span>
            </div>
          </div>
        )}
      </InfoCard>

      {/* Quick action buttons */}
      <div className="grid grid-cols-3 gap-2">
        {client.phone && (
          <>
            <a
              href={`tel:${client.phone}`}
              onClick={() => triggerVibrate('click')}
              className="flex flex-col items-center justify-center py-4 rounded-2xl gap-1.5 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ background: 'rgba(77,159,255,0.08)', border: '1px solid rgba(77,159,255,0.15)' }}
              aria-label="Appeler le responsable"
            >
              <Phone className="w-5 h-5" style={{ color: 'var(--tech-blue)' }} />
              <span className="text-[9px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--tech-blue)' }}>Appeler</span>
            </a>
            <a
              href={`sms:${client.phone}`}
              onClick={() => triggerVibrate('click')}
              className="flex flex-col items-center justify-center py-4 rounded-2xl gap-1.5 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ background: 'rgba(0,229,160,0.08)', border: '1px solid rgba(0,229,160,0.15)' }}
              aria-label="Envoyer un SMS"
            >
              <MessageSquare className="w-5 h-5" style={{ color: 'var(--tech-accent)' }} />
              <span className="text-[9px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--tech-accent)' }}>SMS</span>
            </a>
          </>
        )}
        {client.email && (
          <a
            href={`mailto:${client.email}?subject=Mission%20${encodeURIComponent(mission.title)}`}
            onClick={() => triggerVibrate('click')}
            className="flex flex-col items-center justify-center py-4 rounded-2xl gap-1.5 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.15)' }}
            aria-label="Envoyer un e-mail"
          >
            <Mail className="w-5 h-5" style={{ color: 'var(--tech-purple)' }} />
            <span className="text-[9px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--tech-purple)' }}>E-mail</span>
          </a>
        )}
      </div>

      {/* Notes */}
      {client.notes && (
        <div
          className="p-4 rounded-2xl space-y-2"
          style={{ background: 'rgba(255,183,0,0.07)', border: '1px solid rgba(255,183,0,0.15)' }}
        >
          <h4 className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5" style={{ color: '#ffb700' }}>
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            Consignes &amp; Notes
          </h4>
          <p className="text-xs font-semibold leading-relaxed whitespace-pre-line" style={{ color: 'rgba(255,183,0,0.8)' }}>
            {client.notes}
          </p>
        </div>
      )}
    </div>
  );
}

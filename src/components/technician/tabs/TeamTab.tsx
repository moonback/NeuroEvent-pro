import React from 'react';
import { Users, Check } from 'lucide-react';
import { InfoCard, CardHeader } from './InfoCard';

interface TechColleague {
  id: string;
  name: string;
  specialty: string;
  color: string;
  isSelf: boolean;
}

interface TeamTabProps {
  mission: any;
  getColleaguesDetailed: (ids: string[]) => TechColleague[];
}

export default function TeamTab({ mission, getColleaguesDetailed }: TeamTabProps) {
  const team = getColleaguesDetailed(mission.technicianIds);

  return (
    <div className="space-y-3 tech-stagger">
      <InfoCard>
        <CardHeader
          icon={<Users className="w-3.5 h-3.5" style={{ color: mission.color }} />}
          label="Membres de l'équipe"
          right={
            <span
              className="text-[9px] font-black px-2.5 py-1 rounded-full text-white"
              style={{ background: mission.color, boxShadow: `0 0 10px ${mission.color}40` }}
            >
              {mission.technicianIds.length}
            </span>
          }
        />
        <ul>
          {team.map((tech, idx) => (
            <li
              key={tech.id}
              className="px-4 py-3.5 flex items-center gap-3 transition-all"
              style={{
                borderBottom: idx < team.length - 1 ? '1px solid var(--tech-border)' : 'none',
              }}
            >
              {/* Avatar */}
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black text-white shrink-0 relative"
                style={{ background: `linear-gradient(135deg, ${tech.color} 0%, ${tech.color}aa 100%)` }}
              >
                {tech.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                {tech.isSelf && (
                  <span
                    className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center"
                    style={{
                      background: 'var(--tech-accent)',
                      borderColor: 'var(--tech-card)',
                    }}
                  >
                    <Check className="w-2 h-2 text-black stroke-[3]" />
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm flex items-center gap-2 flex-wrap" style={{ color: 'var(--tech-text)' }}>
                  <span>{tech.name}</span>
                  {tech.isSelf && (
                    <span
                      className="text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider"
                      style={{ background: 'var(--tech-accent-soft)', color: 'var(--tech-accent)' }}
                    >
                      Vous
                    </span>
                  )}
                </div>
                <p className="text-[10px] font-semibold truncate mt-0.5" style={{ color: 'var(--tech-text-muted)' }}>{tech.specialty}</p>
              </div>
              {/* Online indicator */}
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: 'var(--tech-accent)', boxShadow: '0 0 6px rgba(0,229,160,0.5)' }}
              />
            </li>
          ))}
        </ul>
      </InfoCard>

      {/* Tip */}
      <div
        className="p-3.5 rounded-2xl flex items-start gap-2.5"
        style={{
          border: `1px solid ${mission.color}22`,
          background: `${mission.color}08`,
        }}
      >
        <Users className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: mission.color, opacity: 0.8 }} />
        <p className="text-[10px] leading-relaxed font-semibold" style={{ color: mission.color, opacity: 0.8 }}>
          Coordonnez vos actions avec vos collègues. Pensez à pointer le matériel au chargement et au déchargement.
        </p>
      </div>
    </div>
  );
}

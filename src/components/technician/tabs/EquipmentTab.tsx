import React from 'react';
import { QrCode, CheckCircle2, Check, Package } from 'lucide-react';
import { InfoCard } from './InfoCard';

interface EquipmentTabProps {
  mission: any;
  getEquipmentProgress: (eqs: any[]) => { total: number; pointed: number; percent: number };
  equipmentDefs: { id: string; name: string }[];
  handleToggle: (missionId: string, equipmentId: string) => void;
  openScanner: () => void;
  scannedItemId: string | null;
}

export default function EquipmentTab({
  mission,
  getEquipmentProgress,
  equipmentDefs,
  handleToggle,
  openScanner,
  scannedItemId,
}: EquipmentTabProps) {
  const prog = getEquipmentProgress(mission.equipments);
  const allDone = prog.percent === 100;

  return (
    <div className="space-y-3">
      {/* Progress header */}
      <InfoCard>
        <div className="p-4 space-y-3" style={{ borderBottom: '1px solid var(--tech-border)' }}>
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-sm" style={{ color: 'var(--tech-text)' }}>Chargement matériel</h3>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--tech-text-muted)' }}>
                Scannez ou cochez les éléments requis
              </p>
            </div>
            <div className="text-right">
              <span
                className="text-2xl font-black"
                style={{ color: allDone ? 'var(--tech-accent)' : mission.color }}
              >
                {prog.percent}%
              </span>
              <div className="text-[10px] font-bold" style={{ color: 'var(--tech-text-muted)' }}>
                {prog.pointed}/{prog.total}
              </div>
            </div>
          </div>
          {/* Progress bar */}
          <div className="tech-progress-track">
            <div
              className="tech-progress-fill"
              style={{
                width: `${prog.percent}%`,
                background: allDone
                  ? 'linear-gradient(90deg, var(--tech-accent), var(--tech-accent-dim))'
                  : `linear-gradient(90deg, ${mission.color}, ${mission.color}aa)`,
                boxShadow: allDone ? '0 0 10px rgba(0,229,160,0.4)' : 'none',
              }}
            />
          </div>
          {allDone && (
            <div
              className="flex items-center gap-1.5 text-[10px] font-black tech-animate-in"
              style={{ color: 'var(--tech-accent)' }}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Tout le matériel est chargé !
            </div>
          )}
          {mission.status !== 'Terminée' && (
            <button
              onClick={openScanner}
              type="button"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-extrabold text-white transition-all active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              style={{
                background: `linear-gradient(135deg, ${mission.color} 0%, ${mission.color}aa 100%)`,
                boxShadow: `0 4px 14px ${mission.color}28`,
              }}
            >
              <QrCode className="w-4 h-4" /> Scanner un QR Code
            </button>
          )}
        </div>

        {/* Equipment list */}
        {mission.equipments?.length > 0 ? (
          <ul>
            {mission.equipments.map((me: any, idx: number) => {
              const def = equipmentDefs.find((e: any) => e.id === me.equipmentId);
              const isChecked = !!me.checked;
              const isFlashing = scannedItemId === me.equipmentId;
              return (
                <li
                  key={me.equipmentId}
                  onClick={() => {
                    if (mission.status !== 'Terminée') handleToggle(mission.id, me.equipmentId);
                  }}
                  className={`px-4 py-3.5 flex items-center justify-between cursor-pointer transition-all ${
                    isFlashing ? 'animate-pulse' : ''
                  }`}
                  style={{
                    borderBottom: idx < mission.equipments.length - 1 ? '1px solid var(--tech-border)' : 'none',
                    background: isChecked
                      ? 'rgba(0,229,160,0.05)'
                      : isFlashing
                      ? 'rgba(255,183,0,0.08)'
                      : 'transparent',
                  }}
                  tabIndex={0}
                  role="checkbox"
                  aria-checked={isChecked}
                  aria-label={`${def?.name || 'Matériel'}, quantité ${me.quantity}, chargé : ${isChecked ? 'oui' : 'non'}`}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      if (mission.status !== 'Terminée') handleToggle(mission.id, me.equipmentId);
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    {/* Checkbox */}
                    <div
                      className="w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0"
                      style={
                        isChecked
                          ? {
                              background: 'var(--tech-accent)',
                              borderColor: 'var(--tech-accent)',
                              boxShadow: '0 0 8px rgba(0,229,160,0.4)',
                            }
                          : { borderColor: 'var(--tech-border-strong)', background: 'transparent' }
                      }
                    >
                      {isChecked && <Check className="w-3.5 h-3.5 text-black stroke-[3]" />}
                    </div>
                    <span
                      className={`text-sm font-bold ${isChecked ? 'line-through' : ''}`}
                      style={{ color: isChecked ? 'var(--tech-text-muted)' : 'var(--tech-text)' }}
                    >
                      {def?.name || 'Matériel inconnu'}
                    </span>
                  </div>
                  <span
                    className="text-[10px] font-extrabold px-2 py-0.5 rounded-lg shrink-0"
                    style={{
                      background: isChecked ? 'rgba(0,229,160,0.10)' : 'rgba(255,255,255,0.05)',
                      color: isChecked ? 'var(--tech-accent)' : 'var(--tech-text-secondary)',
                    }}
                  >
                    ×{me.quantity}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="py-10 text-center" role="status">
            <Package className="w-7 h-7 mx-auto mb-2 tech-animate-float" style={{ color: 'var(--tech-text-muted)' }} />
            <p className="text-xs italic" style={{ color: 'var(--tech-text-muted)' }}>
              Aucun matériel requis pour cette mission.
            </p>
          </div>
        )}
      </InfoCard>
    </div>
  );
}

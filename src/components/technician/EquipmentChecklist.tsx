import React from 'react';
import { Check } from 'lucide-react';
import { triggerVibrate } from './useTechDashboard';

interface EquipmentItem {
  equipmentId: string;
  quantity: number;
  checked?: boolean;
}

interface Props {
  missionId: string;
  equipments: EquipmentItem[];
  equipmentDefs: { id: string; name: string }[];
  onToggle: (missionId: string, equipmentId: string) => void;
  scannedItemId: string | null;
  missionStatus: string;
  missionColor?: string;
}

function ItemRow({ me, def, isChecked, onToggle, isFlashing, missionId }: any) {
  return (
    <button
      onClick={() => { if (isChecked && false) return; triggerVibrate('click'); onToggle(missionId, me.equipmentId); }}
      className={`w-full px-4 py-3.5 flex items-center justify-between transition-all active:scale-95 focus:outline-none`}
      style={{
        minHeight: '48px',
        borderBottom: '1px solid var(--tech-border)',
        background: isChecked ? 'rgba(0,229,160,0.05)' : isFlashing ? 'rgba(255,183,0,0.08)' : 'transparent',
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0"
          style={isChecked ? { background: 'var(--tech-accent)', borderColor: 'var(--tech-accent)', boxShadow: '0 0 8px rgba(0,229,160,0.35)' } : { borderColor: 'var(--tech-border-strong)' }}
        >
          {isChecked ? <Check className="w-4 h-4 text-black stroke-[3]" /> : null}
        </div>
        <span className="text-sm font-bold truncate" style={{ color: isChecked ? 'var(--tech-text-muted)' : 'var(--tech-text)' }}>{def?.name || 'Matériel inconnu'}</span>
      </div>

      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-lg" style={{ background: isChecked ? 'rgba(0,229,160,0.10)' : 'rgba(255,255,255,0.05)', color: isChecked ? 'var(--tech-accent)' : 'var(--tech-text-secondary)' }}>×{me.quantity}</span>
    </button>
  );
}

const ItemRowMemo = React.memo(ItemRow);

function EquipmentChecklistInner({ missionId, equipments, equipmentDefs, onToggle, scannedItemId, missionStatus }: Props) {
  return (
    <ul>
      {equipments.map((me) => {
        const def = equipmentDefs.find(d => d.id === me.equipmentId);
        const isChecked = !!me.checked;
        const isFlashing = scannedItemId === me.equipmentId;
        return (
          <li key={me.equipmentId} className={isFlashing ? 'tech-animate-pulse-glow' : ''}>
            <ItemRowMemo me={me} def={def} isChecked={isChecked} onToggle={onToggle} isFlashing={isFlashing} missionId={missionId} />
          </li>
        );
      })}
    </ul>
  );
}

const EquipmentChecklist = React.memo(EquipmentChecklistInner, (a, b) => {
  // shallow compare arrays length and scanned id to avoid unnecessary rerenders
  return a.equipments.length === b.equipments.length && a.scannedItemId === b.scannedItemId;
});

export default EquipmentChecklist;

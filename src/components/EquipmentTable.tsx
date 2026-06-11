import React, { useState, useMemo } from 'react';
import { Equipment, EquipmentCategory, Mission } from '../types';
import { Pencil, QrCode, ArrowUpDown, AlertTriangle, CheckCircle2, Package } from 'lucide-react';

interface Props {
  equipment: Equipment[];
  missions: Mission[];
  onEdit: (item: Equipment) => void;
  onQR: (e: React.MouseEvent, id: string, name: string) => void;
}

const CATEGORY_COLORS: Record<EquipmentCategory | string, { bg: string; text: string; border: string; dot: string }> = {
  Arcade:        { bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-200', dot: '#7c3aed' },
  Sonorisation:  { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',   dot: '#1d4ed8' },
  Éclairage:     { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',  dot: '#b45309' },
  Scène:         { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200',dot: '#047857' },
  Décoration:    { bg: 'bg-pink-50',    text: 'text-pink-700',    border: 'border-pink-200',   dot: '#be185d' },
  Autre:         { bg: 'bg-slate-50',   text: 'text-slate-600',   border: 'border-slate-200',  dot: '#475569' },
};

function computeReserved(equipmentId: string, missions: Mission[]): number {
  return missions.reduce((sum, mission) => {
    const eq = mission.equipments.find(e => e.equipmentId === equipmentId);
    return sum + (eq ? eq.quantity : 0);
  }, 0);
}

type SortField = 'name' | 'category' | 'reserved' | 'available' | 'totalQuantity';
type SortDirection = 'asc' | 'desc';

export default function EquipmentTable({ equipment, missions, onEdit, onQR }: Props) {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const tableData = useMemo(() => {
    return equipment.map(item => {
      const reserved = computeReserved(item.id, missions);
      const available = item.totalQuantity - reserved;
      return {
        ...item,
        reserved,
        available,
      };
    });
  }, [equipment, missions]);

  const sortedData = useMemo(() => {
    const sorted = [...tableData];
    sorted.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [tableData, sortField, sortDirection]);

  if (sortedData.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-[#94a3b8] gap-3 py-10">
        <Package className="w-12 h-12 opacity-30" />
        <p className="text-sm font-medium">Aucun matériel à afficher</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto pr-1">
      <div className="border border-[#e2e8f0] rounded-xl overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-[#e2e8f0] text-[#64748b] font-bold uppercase tracking-wider">
                <th 
                  onClick={() => handleSort('name')} 
                  className="px-6 py-3.5 cursor-pointer hover:bg-[#f1f5f9] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Matériel
                    <ArrowUpDown className="w-3 h-3 text-[#94a3b8]" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('category')} 
                  className="px-6 py-3.5 cursor-pointer hover:bg-[#f1f5f9] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Catégorie
                    <ArrowUpDown className="w-3 h-3 text-[#94a3b8]" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('reserved')} 
                  className="px-6 py-3.5 text-right cursor-pointer hover:bg-[#f1f5f9] transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    Réservé
                    <ArrowUpDown className="w-3 h-3 text-[#94a3b8]" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('available')} 
                  className="px-6 py-3.5 text-right cursor-pointer hover:bg-[#f1f5f9] transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    Disponible
                    <ArrowUpDown className="w-3 h-3 text-[#94a3b8]" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('totalQuantity')} 
                  className="px-6 py-3.5 text-right cursor-pointer hover:bg-[#f1f5f9] transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    Stock Dépôt
                    <ArrowUpDown className="w-3 h-3 text-[#94a3b8]" />
                  </div>
                </th>
                <th className="px-6 py-3.5 text-center">
                  Statut
                </th>
                <th className="px-6 py-3.5 text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {sortedData.map(item => {
                const colors = CATEGORY_COLORS[item.category] || CATEGORY_COLORS['Autre'];
                const isOverbooked = item.available < 0;
                
                return (
                  <tr key={item.id} className="hover:bg-[#f8fafc]/50 transition-colors">
                    {/* Nom */}
                    <td className="px-6 py-4 font-semibold text-[#0f172a] text-sm max-w-[240px] truncate">
                      <button 
                        type="button" 
                        onClick={() => onEdit(item)}
                        className="hover:text-[#2563eb] transition-colors text-left"
                      >
                        {item.name}
                      </button>
                    </td>
                    
                    {/* Catégorie */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${colors.bg} ${colors.text} ${colors.border}`}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.dot }} />
                        {item.category}
                      </span>
                    </td>

                    {/* Réservé */}
                    <td className="px-6 py-4 text-right font-medium text-[#64748b] text-sm">
                      {item.reserved}
                    </td>

                    {/* Disponible */}
                    <td className={`px-6 py-4 text-right font-bold text-sm ${
                      isOverbooked 
                        ? 'text-red-600' 
                        : item.available === 0 
                        ? 'text-amber-600' 
                        : 'text-emerald-600'
                    }`}>
                      {item.available}
                    </td>

                    {/* Total Stock */}
                    <td className="px-6 py-4 text-right font-bold text-[#0f172a] text-sm">
                      {item.totalQuantity}
                    </td>

                    {/* Statut Badge */}
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      {isOverbooked ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
                          <AlertTriangle className="w-3 h-3" />
                          Surréservé
                        </span>
                      ) : item.available === 0 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertTriangle className="w-3 h-3" />
                          Indisponible
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Disponible
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => onEdit(item)}
                          className="p-1.5 text-[#64748b] hover:text-[#2563eb] hover:bg-[#eff6ff] rounded transition-colors"
                          title="Modifier le matériel"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => onQR(e, item.id, item.name)}
                          className="p-1.5 text-[#64748b] hover:text-[#2563eb] hover:bg-[#eff6ff] rounded transition-colors"
                          title="QR Code"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

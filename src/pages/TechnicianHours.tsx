import React from 'react';
import { Timer } from 'lucide-react';
import TechnicianHoursAdmin from '../components/TechnicianHoursAdmin';

export default function TechnicianHours() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-purple-50 border border-purple-100 rounded-xl flex items-center justify-center">
          <Timer className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#0f172a] uppercase tracking-tight">Heures des Techniciens</h2>
          <p className="text-xs text-[#64748b] font-medium">Suivi des créneaux de travail par mission et par technicien</p>
        </div>
      </div>
      <TechnicianHoursAdmin />
    </div>
  );
}

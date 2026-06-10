import React, { useMemo } from 'react';
import { useStore } from '../store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Package, Calendar } from 'lucide-react';
import { format, subMonths, isAfter } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function Stats() {
  const missions = useStore(state => state.missions);
  const technicians = useStore(state => state.technicians);
  const equipment = useStore(state => state.equipment);

  // General Stats
  const totalMissions = missions.length;
  
  // Recent missions (last 3 months)
  const threeMonthsAgo = subMonths(new Date(), 3);
  const recentMissions = missions.filter(m => isAfter(m.start, threeMonthsAgo));
  
  // Missions per month chart data
  const missionsPerMonth = useMemo(() => {
    const data: Record<string, number> = {};
    recentMissions.forEach(m => {
      const month = format(m.start, 'MMM yyyy', { locale: fr });
      data[month] = (data[month] || 0) + 1;
    });
    return Object.entries(data).map(([name, count]) => ({ name, count }));
  }, [recentMissions]);

  // Technicians usage chart data
  const techUsage = useMemo(() => {
    const data: Record<string, number> = {};
    missions.forEach(m => {
      m.technicianIds.forEach(tid => {
        const tech = technicians.find(t => t.id === tid);
        if (tech) {
          const name = `${tech.firstName} ${tech.lastName}`;
          data[name] = (data[name] || 0) + 1;
        }
      });
    });
    return Object.entries(data)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5
  }, [missions, technicians]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#0f172a]">Statistiques & Analytique</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-[#e2e8f0] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <div className="text-sm font-bold text-[#64748b] uppercase">Missions Totales</div>
            <div className="text-2xl font-black text-[#0f172a]">{totalMissions}</div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-[#e2e8f0] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
            <Users className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <div className="text-sm font-bold text-[#64748b] uppercase">Techniciens</div>
            <div className="text-2xl font-black text-[#0f172a]">{technicians.length}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-[#e2e8f0] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center">
            <Package className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <div className="text-sm font-bold text-[#64748b] uppercase">Matériels</div>
            <div className="text-2xl font-black text-[#0f172a]">{equipment.length}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-[#e2e8f0] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <div className="text-sm font-bold text-[#64748b] uppercase">Missions / Mois</div>
            <div className="text-2xl font-black text-[#0f172a]">
              {missionsPerMonth.length > 0 ? (recentMissions.length / missionsPerMonth.length).toFixed(1) : 0}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-[#e2e8f0] shadow-sm">
          <h2 className="text-lg font-bold text-[#0f172a] mb-6">Évolution des missions (3 derniers mois)</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={missionsPerMonth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <RechartsTooltip 
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} name="Missions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-[#e2e8f0] shadow-sm">
          <h2 className="text-lg font-bold text-[#0f172a] mb-6">Top 5 Techniciens (plus sollicités)</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={techUsage} layout="vertical" margin={{top: 0, right: 0, left: 40, bottom: 0}}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} width={100} />
                <RechartsTooltip 
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} name="Participations" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { useStore } from '../store';
import { useAuthStore } from '../store/auth';
import { Calendar, MapPin, Truck as TruckIcon, Users, CheckCircle, Clock, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';

export default function TechnicianDashboard() {
  const user = useAuthStore(state => state.user);
  const signOut = useAuthStore(state => state.signOut);
  const missions = useStore(state => state.missions);
  const updateMission = useStore(state => state.updateMission);
  const trucks = useStore(state => state.trucks);
  const technicians = useStore(state => state.technicians);

  // Filter missions assigned to the logged-in technician
  const myMissions = missions
    .filter(m => m.technicianIds.includes(user?.id || ''))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const getTruckName = (truckId?: string) => {
    if (!truckId) return 'Aucun camion';
    const truck = trucks.find(t => t.id === truckId);
    return truck ? truck.name : 'Camion inconnu';
  };

  const getColleagues = (missionTechIds: string[]) => {
    return missionTechIds
      .filter(id => id !== user?.id)
      .map(id => {
        const tech = technicians.find(t => t.id === id);
        return tech ? `${tech.firstName} ${tech.lastName}` : 'Inconnu';
      });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Planifiée': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'En cours': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Terminée': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#f8fafc] pb-20">
      <header className="bg-white px-6 py-4 shadow-sm border-b border-[#e2e8f0] sticky top-0 z-10 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-[#0f172a]">Mes Missions</h1>
          <p className="text-sm text-[#64748b]">{user?.user_metadata?.first_name || 'Technicien'}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/settings" className="p-2 text-[#64748b] hover:text-[#2563eb] bg-[#f1f5f9] hover:bg-blue-50 rounded-lg transition-colors">
            <SettingsIcon className="w-5 h-5" />
          </Link>
          <button onClick={() => signOut()} className="p-2 text-[#64748b] hover:text-[#ef4444] bg-[#f1f5f9] hover:bg-red-50 rounded-lg transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {myMissions.length === 0 ? (
          <div className="bg-white p-8 rounded-xl text-center shadow-sm border border-[#e2e8f0]">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-[#0f172a]">Aucune mission</h3>
            <p className="text-sm text-[#64748b] mt-1">Vous n'avez aucune mission assignée pour le moment.</p>
          </div>
        ) : (
          myMissions.map(mission => {
            const colleagues = getColleagues(mission.technicianIds);
            const isToday = isSameDay(mission.start, new Date());
            
            return (
              <div key={mission.id} className="bg-white rounded-xl shadow-sm border border-[#e2e8f0] overflow-hidden">
                <div className="h-2 w-full" style={{ backgroundColor: mission.color }}></div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-[#0f172a] text-lg leading-tight">{mission.title}</h3>
                      <p className="text-sm font-medium text-[#64748b]">{mission.client}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(mission.status)}`}>
                      {mission.status}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-[#334155]">
                      <Clock className="w-4 h-4 text-[#94a3b8]" />
                      <span className={isToday ? "font-bold text-[#ea580c]" : ""}>
                        {format(mission.start, 'EEEE d MMM HH:mm', { locale: fr })} - {format(mission.end, 'HH:mm')}
                      </span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-[#334155]">
                      <MapPin className="w-4 h-4 text-[#94a3b8] shrink-0 mt-0.5" />
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mission.address)}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#2563eb] hover:underline leading-snug"
                      >
                        {mission.address}
                      </a>
                    </div>
                    {mission.truckId && (
                      <div className="flex items-center gap-2 text-sm text-[#334155]">
                        <TruckIcon className="w-4 h-4 text-[#94a3b8]" />
                        <span>{getTruckName(mission.truckId)}</span>
                      </div>
                    )}
                    {colleagues.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-[#334155]">
                        <Users className="w-4 h-4 text-[#94a3b8]" />
                        <span>Avec : {colleagues.join(', ')}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2 pt-3 border-t border-[#f1f5f9]">
                    {mission.status === 'Planifiée' && (
                      <button 
                        onClick={() => updateMission(mission.id, { status: 'En cours' })}
                        className="w-full py-2.5 text-center text-sm font-bold bg-[#2563eb] text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Démarrer la mission
                      </button>
                    )}
                    {mission.status === 'En cours' && (
                      <button 
                        onClick={() => updateMission(mission.id, { status: 'Terminée' })}
                        className="w-full py-2.5 text-center text-sm font-bold bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                      >
                        Marquer comme terminée
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

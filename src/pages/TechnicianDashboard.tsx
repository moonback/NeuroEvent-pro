import React from 'react';
import { useStore } from '../store';
import { useAuthStore } from '../store/auth';
import { Calendar, MapPin, Truck as TruckIcon, Users, CheckCircle, Clock, LogOut, Settings as SettingsIcon, Check, QrCode } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { QRScannerModal } from '../components/QRScannerModal';

export default function TechnicianDashboard() {
  const user = useAuthStore(state => state.user);
  const signOut = useAuthStore(state => state.signOut);
  const missions = useStore(state => state.missions);
  const updateMission = useStore(state => state.updateMission);
  const trucks = useStore(state => state.trucks);
  const technicians = useStore(state => state.technicians);

  const [activeTab, setActiveTab] = React.useState<'active' | 'history'>('active');
  const [checkedEquipments, setCheckedEquipments] = React.useState<Record<string, boolean>>({});
  const [scannerOpen, setScannerOpen] = React.useState(false);
  const [activeMissionIdForScanner, setActiveMissionIdForScanner] = React.useState<string | null>(null);

  const toggleEquipment = (missionId: string, equipmentId: string) => {
    const key = `${missionId}-${equipmentId}`;
    setCheckedEquipments(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleScan = (decodedText: string) => {
    if (activeMissionIdForScanner) {
      // Assuming decodedText is the equipmentId
      toggleEquipment(activeMissionIdForScanner, decodedText);
    }
  };

  const myMissions = missions
    .filter(m => m.technicianIds.includes(user?.id || ''))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const displayedMissions = myMissions.filter(m => 
    activeTab === 'active' ? m.status !== 'Terminée' : m.status === 'Terminée'
  );

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
      <header className="bg-white px-6 py-4 shadow-sm border-b border-[#e2e8f0] sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-[#0f172a]">Mes Missions</h1>
          <p className="text-sm text-[#64748b]">Bonjour, {user?.user_metadata?.first_name || 'Technicien'}</p>
        </div>
      </header>

      <div className="bg-white border-b border-[#e2e8f0] px-4 py-2 flex gap-4 sticky top-[73px] z-10">
        <button 
          onClick={() => setActiveTab('active')}
          className={`pb-2 px-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'active' ? 'border-[#2563eb] text-[#2563eb]' : 'border-transparent text-[#64748b]'}`}
        >
          À venir & En cours
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`pb-2 px-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'history' ? 'border-[#2563eb] text-[#2563eb]' : 'border-transparent text-[#64748b]'}`}
        >
          Historique
        </button>
      </div>

      <div className="p-4 space-y-4">
        {displayedMissions.length === 0 ? (
          <div className="bg-white p-8 rounded-xl text-center shadow-sm border border-[#e2e8f0]">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-[#0f172a]">Aucune mission</h3>
            <p className="text-sm text-[#64748b] mt-1">Vous n'avez aucune mission dans cet onglet pour le moment.</p>
          </div>
        ) : (
          displayedMissions.map(mission => {
            const colleagues = getColleagues(mission.technicianIds);
            const isToday = isSameDay(mission.start, new Date());
            
            return (
              <div key={mission.id} className="bg-white rounded-xl shadow-sm border border-[#e2e8f0] overflow-hidden transition-all hover:shadow-md">
                <div className="h-2 w-full" style={{ backgroundColor: mission.color }}></div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#f1f5f9] text-[#64748b] uppercase tracking-wider">{mission.type}</span>
                      </div>
                      <h3 className="font-bold text-[#0f172a] text-lg leading-tight mt-1">{mission.title}</h3>
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
                    
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {mission.truckId && (
                        <div className="flex items-center gap-2 text-sm text-[#334155] bg-[#f8fafc] p-2 rounded-lg border border-[#e2e8f0]">
                          <TruckIcon className="w-4 h-4 text-[#64748b]" />
                          <span className="font-medium truncate">{getTruckName(mission.truckId)}</span>
                        </div>
                      )}
                      {colleagues.length > 0 && (
                        <div className="flex items-center gap-2 text-sm text-[#334155] bg-[#f8fafc] p-2 rounded-lg border border-[#e2e8f0]">
                          <Users className="w-4 h-4 text-[#64748b]" />
                          <span className="font-medium truncate" title={colleagues.join(', ')}>
                            {colleagues.length} collègue{colleagues.length > 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Equipment list */}
                    {mission.equipments && mission.equipments.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-[#f1f5f9]">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-xs font-bold text-[#64748b] uppercase tracking-wider">Matériel requis</h4>
                          <button 
                            onClick={() => {
                              setActiveMissionIdForScanner(mission.id);
                              setScannerOpen(true);
                            }}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#f1f5f9] text-[#2563eb] rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>Scanner</span>
                          </button>
                        </div>
                        <ul className="space-y-1">
                          {mission.equipments.map((me, idx) => {
                            const equipmentDef = useStore.getState().equipment.find(e => e.id === me.equipmentId);
                            const isChecked = checkedEquipments[`${mission.id}-${me.equipmentId}`];
                            return (
                              <li 
                                key={idx} 
                                onClick={() => toggleEquipment(mission.id, me.equipmentId)}
                                className={`flex justify-between items-center text-sm py-2 px-1 border-b border-[#f8fafc] last:border-0 cursor-pointer transition-colors ${isChecked ? 'text-[#94a3b8]' : 'text-[#334155]'}`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isChecked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-[#cbd5e1] bg-white'}`}>
                                    {isChecked && <Check className="w-3.5 h-3.5" />}
                                  </div>
                                  <span className={`flex-1 ${isChecked ? 'line-through' : ''}`}>
                                    {equipmentDef?.name || 'Matériel inconnu'}
                                  </span>
                                </div>
                                <span className={`font-semibold px-2 py-0.5 rounded text-xs transition-colors ${isChecked ? 'bg-emerald-50 text-emerald-600' : 'bg-[#f1f5f9]'}`}>
                                  {me.quantity} unités
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2 pt-3 border-t border-[#f1f5f9]">
                    {mission.status === 'Planifiée' && (
                      <button 
                        onClick={() => updateMission(mission.id, { status: 'En cours' })}
                        className="w-full py-3 px-4 text-center text-sm font-bold bg-[#2563eb] text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                      >
                        Démarrer la mission
                      </button>
                    )}
                    {mission.status === 'En cours' && (
                      <button 
                        onClick={() => updateMission(mission.id, { status: 'Terminée' })}
                        className="w-full py-3 px-4 text-center text-sm font-bold bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors shadow-sm"
                      >
                        Terminer la mission
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e2e8f0] pb-safe z-50">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto px-4">
          <button className="flex flex-col items-center justify-center w-full h-full text-[#2563eb]">
            <Calendar className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-semibold">Missions</span>
          </button>
          
          <Link to="/settings" className="flex flex-col items-center justify-center w-full h-full text-[#64748b] hover:text-[#0f172a]">
            <SettingsIcon className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium">Profil</span>
          </Link>

          <button onClick={() => signOut()} className="flex flex-col items-center justify-center w-full h-full text-[#64748b] hover:text-red-500">
            <LogOut className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium">Quitter</span>
          </button>
        </div>
      </nav>

      <QRScannerModal 
        isOpen={scannerOpen}
        onClose={() => {
          setScannerOpen(false);
          setActiveMissionIdForScanner(null);
        }}
        onScan={handleScan}
      />
    </div>
  );
}

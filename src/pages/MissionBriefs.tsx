import React, { useState } from 'react';
import { useStore } from '../store';
import { FileText, Printer, Search, Calendar as CalendarIcon, MapPin, Truck as TruckIcon, Users, Package, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function MissionBriefs() {
  const missions = useStore(state => state.missions);
  const equipmentDef = useStore(state => state.equipment);
  const techniciansDef = useStore(state => state.technicians);
  const trucksDef = useStore(state => state.trucks);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);

  const filteredMissions = missions
    .filter(m => m.title.toLowerCase().includes(searchTerm.toLowerCase()) || m.client.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => b.start.getTime() - a.start.getTime());

  const selectedMission = missions.find(m => m.id === selectedMissionId);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col md:flex-row h-full gap-4 md:gap-6">
      {/* Liste (sur mobile : masquée dès qu'une fiche est ouverte) */}
      <div className={`${selectedMissionId ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col bg-white border border-[#e2e8f0] rounded-xl overflow-hidden shrink-0 print:hidden`}>
        <div className="p-4 border-b border-[#e2e8f0] bg-[#f8fafc]">
          <h2 className="font-bold text-[#0f172a] flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#2563eb]" />
            Fiches de Mission
          </h2>
          <div className="mt-4 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            <input
              type="text"
              placeholder="Rechercher une mission..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-[#e2e8f0] rounded-lg bg-white placeholder-[#94a3b8] text-[#0f172a]"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredMissions.map(mission => (
            <button
              key={mission.id}
              onClick={() => setSelectedMissionId(mission.id)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                selectedMissionId === mission.id 
                  ? 'bg-[#eff6ff] border-[#2563eb] text-[#1e3a8a]' 
                  : 'bg-white border-transparent hover:bg-[#f8fafc] text-[#334155]'
              }`}
            >
              <div className="font-semibold text-sm truncate">{mission.title}</div>
              <div className="text-xs text-[#64748b] mt-1 flex items-center gap-1">
                <CalendarIcon className="w-3 h-3" />
                {format(mission.start, 'dd MMM yyyy', { locale: fr })}
              </div>
            </button>
          ))}
          {filteredMissions.length === 0 && (
            <div className="p-4 text-center text-sm text-[#94a3b8]">Aucune mission trouvée</div>
          )}
        </div>
      </div>

      {/* Zone d'aperçu / impression (sur mobile : visible seulement si une fiche est ouverte) */}
      <div className={`${selectedMissionId ? 'flex' : 'hidden md:flex'} flex-1 flex-col min-w-0 bg-white border border-[#e2e8f0] rounded-xl overflow-hidden print:border-none print:shadow-none`}>
        {selectedMission ? (
          <>
            <div className="p-4 border-b border-[#e2e8f0] flex justify-between items-center gap-3 bg-[#f8fafc] print:hidden">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  onClick={() => setSelectedMissionId(null)}
                  className="md:hidden p-2 -ml-1 text-[#64748b] hover:text-[#0f172a] rounded-lg shrink-0"
                  aria-label="Retour à la liste"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h3 className="font-bold text-[#0f172a] truncate">Aperçu de la Fiche</h3>
              </div>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 bg-[#2563eb] text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm shrink-0"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Imprimer</span>
              </button>
            </div>
            
            {/* Printable Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 print:p-0">
              <div className="max-w-3xl mx-auto printable-sheet">
                {/* Header */}
                <div className="border-b-2 border-black pb-4 mb-6 flex flex-col sm:flex-row gap-2 sm:justify-between sm:items-end print:flex-row print:justify-between print:items-end">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black mb-1">{selectedMission.title}</h1>
                    <p className="text-base sm:text-lg font-medium text-gray-700">{selectedMission.client}</p>
                  </div>
                  <div className="text-left sm:text-right print:text-right">
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">Fiche de Mission</p>
                    <p className="font-mono text-xs text-gray-400">ID: {selectedMission.id.toUpperCase().substring(0,8)}</p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-6 sm:gap-8 mb-8">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <CalendarIcon className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <div className="font-bold text-xs text-gray-500 uppercase">Date & Heure</div>
                        <div className="font-medium text-sm text-black">
                          Du {format(selectedMission.start, 'EEEE d MMMM yyyy à HH:mm', { locale: fr })}<br />
                          Au {format(selectedMission.end, 'EEEE d MMMM yyyy à HH:mm', { locale: fr })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <div className="font-bold text-xs text-gray-500 uppercase">Lieu</div>
                        <div className="font-medium text-sm text-black">{selectedMission.address}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Users className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <div className="font-bold text-xs text-gray-500 uppercase">Équipe ({selectedMission.technicianIds.length})</div>
                        <ul className="text-sm font-medium text-black">
                          {selectedMission.technicianIds.length > 0 ? (
                            selectedMission.technicianIds.map(tid => {
                              const tech = techniciansDef.find(t => t.id === tid);
                              return <li key={tid}>• {tech?.firstName} {tech?.lastName}</li>;
                            })
                          ) : (
                            <li className="text-gray-400 italic">Aucun technicien assigné</li>
                          )}
                        </ul>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <TruckIcon className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <div className="font-bold text-xs text-gray-500 uppercase">Véhicule</div>
                        <div className="font-medium text-sm text-black">
                          {selectedMission.truckId ? (() => {
                            const truck = trucksDef.find(t => t.id === selectedMission.truckId);
                            return truck ? `${truck.name} (${truck.plate})` : 'Camion inconnu';
                          })() : <span className="text-gray-400 italic">Aucun camion</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Equipment List */}
                <div className="mb-8">
                  <h2 className="text-lg font-bold border-b border-gray-300 pb-2 mb-4 flex items-center gap-2 text-black">
                    <Package className="w-5 h-5" />
                    Liste du Matériel
                  </h2>
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="py-2 px-4 font-bold text-gray-600 w-12 text-center">✓</th>
                        <th className="py-2 px-4 font-bold text-gray-600 w-24 text-center">Qté</th>
                        <th className="py-2 px-4 font-bold text-gray-600">Désignation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedMission.equipments && selectedMission.equipments.length > 0 ? (
                        selectedMission.equipments.map((me, idx) => {
                          const eq = equipmentDef.find(e => e.id === me.equipmentId);
                          return (
                            <tr key={idx} className="border-b border-gray-100">
                              <td className="py-3 px-4 text-center border-r border-gray-100">
                                <div className="w-5 h-5 border-2 border-gray-300 rounded mx-auto"></div>
                              </td>
                              <td className="py-3 px-4 text-center font-bold font-mono border-r border-gray-100">{me.quantity}</td>
                              <td className="py-3 px-4 font-medium text-gray-800">{eq?.name || 'Matériel inconnu'}</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={3} className="py-4 text-center text-gray-500 italic">Aucun matériel requis.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  
                  {/* Empty rows for manual additions */}
                  <table className="w-full text-sm text-left border-collapse mt-4">
                    <tbody>
                      <tr className="border-b border-gray-200"><td className="py-4 text-gray-400 w-12 text-center border-r border-gray-200">+</td><td className="py-4 border-r border-gray-200 w-24"></td><td className="py-4"></td></tr>
                      <tr className="border-b border-gray-200"><td className="py-4 text-gray-400 w-12 text-center border-r border-gray-200">+</td><td className="py-4 border-r border-gray-200 w-24"></td><td className="py-4"></td></tr>
                    </tbody>
                  </table>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-6 sm:gap-8 mt-12 bg-gray-50 p-4 sm:p-6 rounded-xl border border-gray-200">
                  <div className="h-32 border-2 border-dashed border-gray-300 rounded-lg p-4 relative">
                    <span className="absolute top-2 left-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Visa Technicien</span>
                  </div>
                  <div className="h-32 border-2 border-dashed border-gray-300 rounded-lg p-4 relative">
                    <span className="absolute top-2 left-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Visa Client / Référent</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#f8fafc] print:hidden">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-[#e2e8f0] mb-4">
              <FileText className="w-8 h-8 text-[#94a3b8]" />
            </div>
            <h3 className="text-lg font-bold text-[#0f172a]">Sélectionnez une mission</h3>
            <p className="text-sm text-[#64748b] mt-1">Choisissez une mission dans la liste pour afficher et imprimer sa fiche.</p>
          </div>
        )}
      </div>
    </div>
  );
}

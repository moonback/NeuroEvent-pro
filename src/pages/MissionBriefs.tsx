import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store';
import { FileText, Printer, Search, Calendar as CalendarIcon, MapPin, Truck as TruckIcon, Users, Package, ArrowLeft, Clock, CheckCircle2, Circle, AlertCircle, Timer, Camera, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import TechnicianHoursAdmin from '../components/TechnicianHoursAdmin';
import { supabase } from '../lib/supabase';

export default function MissionBriefs() {
  const missions = useStore(state => state.missions);
  const equipmentDef = useStore(state => state.equipment);
  const techniciansDef = useStore(state => state.technicians);
  const trucksDef = useStore(state => state.trucks);
  const updateMission = useStore(state => state.updateMission);

  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'Planifi\u00e9e' | 'En cours' | 'Termin\u00e9e'>('all');
  const [selectedMissionId, setSelectedMissionId] = React.useState<string | null>(null);
  const [detailTab, setDetailTab] = React.useState<'fiche' | 'heures'>('fiche');

  const selectedMission = useMemo(() => selectedMissionId ? missions.find(m => m.id === selectedMissionId) : null, [selectedMissionId, missions]);
  const [signatureUrlSigned, setSignatureUrlSigned] = useState<string | null>(null);
  useEffect(() => {
    if (selectedMission?.signatureUrl) {
      supabase.storage
        .from('signatures')
        .createSignedUrl(selectedMission.signatureUrl, 60 * 60 * 24 * 365)
        .then(({ data }) => {
          setSignatureUrlSigned(data?.signedUrl ?? null);
        })
        .catch(() => setSignatureUrlSigned(null));
    } else {
      setSignatureUrlSigned(null);
    }
  }, [selectedMission?.signatureUrl]);

  const [signedPhotoUrls, setSignedPhotoUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchSignedUrls = async () => {
      const newSignedUrls: Record<string, string> = {};
      for (const photo of selectedMission?.photos || []) {
        if (photo.filePath) {
          // Avoid duplicates
          if (!newSignedUrls[photo.filePath]) {
            const signedUrl = await createSignedUrl('mission-photos', photo.filePath);
            if (signedUrl) {
              newSignedUrls[photo.filePath] = signedUrl;
            }
          }
        }
      }
      setSignedPhotoUrls(newSignedUrls);
    };
    fetchSignedUrls();
  }, [selectedMission?.photos]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Planifi\u00e9e': return { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', label: 'Planifi\u00e9e', dot: 'bg-blue-500 animate-pulse' };
      case 'En cours':  return { color: '#d97706', bg: '#fffbeb', border: '#fde68a', label: 'En cours',  dot: 'bg-amber-500 animate-pulse' };
      case 'Termin\u00e9e':  return { color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', label: 'Termin\u00e9e',  dot: 'bg-emerald-500' };
      default: return { color: '#64748b', bg: '#f8fafc', border: '#e2e8f0', label: status, dot: 'bg-slate-400' };
    }
  };

  const filteredMissions = missions
    .filter(m => {
      const matchSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) || m.client.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'all' || m.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => b.start.getTime() - a.start.getTime());
   
   
    // Quick status change directly from the brief
  const handleStatusChange = async (newStatus: 'Planifi\u00e9e' | 'En cours' | 'Termin\u00e9e') => {
    if (!selectedMission || selectedMission.status === newStatus) return;
    await updateMission(selectedMission.id, { status: newStatus });
  };

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
          {/* Status filter pills */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {(['all', 'Planifi\u00e9e', 'En cours', 'Termin\u00e9e'] as const).map(s => {
              const cfg = s === 'all' ? null : getStatusConfig(s);
              const isActive = statusFilter === s;
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer active:scale-95 ${
                    isActive
                      ? s === 'all' ? 'bg-[#0f172a] text-white border-[#0f172a]' : ''
                      : 'bg-white text-[#64748b] border-[#e2e8f0] hover:border-slate-300'
                  }`}
                  style={isActive && cfg ? { backgroundColor: cfg.bg, color: cfg.color, borderColor: cfg.border } : {}}
                >
                  {s === 'all' ? 'Toutes' : s}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredMissions.map(mission => {
            const cfg = getStatusConfig(mission.status);
            return (
            <button
              key={mission.id}
              onClick={() => setSelectedMissionId(mission.id)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                selectedMissionId === mission.id 
                  ? 'bg-[#eff6ff] border-[#2563eb] text-[#1e3a8a]' 
                  : 'bg-white border-transparent hover:bg-[#f8fafc] text-[#334155]'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="font-semibold text-sm truncate">{mission.title}</div>
                <span
                  className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shrink-0 flex items-center gap-1"
                  style={{ backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                >
                  <span className={`w-1 h-1 rounded-full inline-block ${cfg.dot}`} />
                  {cfg.label}
                </span>
              </div>
              <div className="text-xs text-[#64748b] mt-1 flex items-center gap-1">
                <CalendarIcon className="w-3 h-3" />
                {format(mission.start, 'dd MMM yyyy · HH:mm', { locale: fr })}
              </div>
            </button>
            );
          })}
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
              <div className="flex items-center gap-2">
                {/* Tab switcher */}
                <div className="flex border border-[#e2e8f0] rounded-lg overflow-hidden print:hidden">
                  <button
                    onClick={() => setDetailTab('fiche')}
                    className={`flex items-center gap-1 px-3 py-1.5 text-[10px] font-extrabold uppercase transition-colors ${
                      detailTab === 'fiche' ? 'bg-[#2563eb] text-white' : 'text-[#64748b] hover:bg-slate-50'
                    }`}
                  >
                    <FileText className="w-3 h-3" />
                    Fiche
                  </button>
                  <button
                    onClick={() => setDetailTab('heures')}
                    className={`flex items-center gap-1 px-3 py-1.5 text-[10px] font-extrabold uppercase transition-colors ${
                      detailTab === 'heures' ? 'bg-[#2563eb] text-white' : 'text-[#64748b] hover:bg-slate-50'
                    }`}
                  >
                    <Timer className="w-3 h-3" />
                    Heures
                  </button>
                </div>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 bg-[#2563eb] text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm shrink-0 print:hidden"
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">Imprimer</span>
                </button>
              </div>
            </div>
            
            {/* Tab Content */}
            {detailTab === 'heures' ? (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 print:hidden">
                <TechnicianHoursAdmin missionId={selectedMission.id} />
              </div>
            ) : (
            /* Printable Content */
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 print:p-0">
              <div className="max-w-3xl mx-auto printable-sheet">
                {/* Header */}
              <div style={{ borderColor: getStatusConfig(selectedMission.status).color }} className="border-b-2 pb-4 mb-6 flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-end print:flex-row print:justify-between print:items-end">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black mb-1">{selectedMission.title}</h1>
                  <p className="text-base sm:text-lg font-medium text-gray-700">{selectedMission.client}</p>
                </div>
                <div className="flex flex-col items-start sm:items-end gap-2 print:items-end">
                  {/* Status control for admin */}
                  <div className="flex items-center gap-1.5 print:hidden">
                    {(['Planifi\u00e9e', 'En cours', 'Termin\u00e9e'] as const).map((s) => {
                      const cfg = getStatusConfig(s);
                      const isActive = selectedMission.status === s;
                      return (
                        <button
                          key={s}
                          onClick={() => handleStatusChange(s)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border-2 transition-all cursor-pointer active:scale-95 ${
                            isActive ? 'shadow-sm' : 'opacity-50 hover:opacity-100'
                          }`}
                          style={isActive
                            ? { backgroundColor: cfg.bg, color: cfg.color, borderColor: cfg.color }
                            : { backgroundColor: '#f8fafc', color: cfg.color, borderColor: cfg.border }
                          }
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                  {/* Status badge for print */}
                  <div className="hidden print:flex items-center gap-2">
                    <span className="text-xs font-extrabold uppercase px-3 py-1 rounded-lg" style={{ backgroundColor: getStatusConfig(selectedMission.status).bg, color: getStatusConfig(selectedMission.status).color }}>
                      {selectedMission.status}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Fiche de Mission</p>
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

                {/* Photos Preuves Section */}
                {selectedMission.photos && selectedMission.photos.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-lg font-bold border-b border-gray-300 pb-2 mb-4 flex items-center gap-2 text-black">
                      <Camera className="w-5 h-5" />
                      Photos Preuves
                    </h2>
                    
                    {/* Avant Montage */}
                    {selectedMission.photos.some((p: any) => p.type === 'before') && (
                      <div className="mb-6">
                        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          Avant Montage
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {selectedMission.photos
                            .filter((p: any) => p.type === 'before')
                            .map((photo: any) => (
                              <div key={photo.id} className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 aspect-square">
                                <img \n
                                  src={signedPhotoUrls[photo.filePath] || ''} \n
                                  alt="Photo avant"\n
                                  className="w-full h-full object-cover print:max-h-40"
                                />
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Après Montage */}
                    {selectedMission.photos.some((p: any) => p.type === 'after') && (
                      <div>
                        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          Après Montage
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {selectedMission.photos
                            .filter((p: any) => p.type === 'after')
                            .map((photo: any) => (
                              <div key={photo.id} className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 aspect-square">
                                <img 
                                  src={signedPhotoUrls[photo.filePath] || ''} 
                                  alt="Photo après"
                                  className="w-full h-full object-cover print:max-h-40"
                                />
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Signature Client */}
                <div className="mt-12 bg-gray-50 p-4 sm:p-6 rounded-xl border border-gray-200">
                  <h2 className="text-lg font-bold border-b border-gray-300 pb-2 mb-4 text-black">
                    Signature Client / Référent
                  </h2>
                  <div className="h-32 border-2 border-dashed border-gray-300 rounded-lg p-4 relative flex items-center justify-center bg-white">
                    {signatureUrlSigned && (
                      <img 
                        src={signatureUrlSigned} 
                        alt="Signature Client" 
                        className="max-h-full max-w-full object-contain"
                      />
                    )}
                    {!signatureUrlSigned && (
                      <span className="text-sm text-gray-400 italic">Aucune signature enregistrée</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            )} {/* end detailTab ternary */}
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

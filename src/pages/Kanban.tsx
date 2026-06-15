import React, { useMemo, useState } from 'react';
import { useStore } from '../store';
import MissionModal from '../components/MissionModal';
import { Mission, MissionStatus } from '../types';

const STATUS_ORDER: MissionStatus[] = ['Planifiée', 'En cours', 'Terminée'];
const STATUS_LABELS: Record<MissionStatus, string> = {
  'Planifiée': 'Planifiée',
  'En cours': 'En cours',
  'Terminée': 'Terminée'
};

const statusStyles: Record<MissionStatus, string> = {
  'Planifiée': 'bg-[#eff6ff] border-[#bfdbfe] text-[#1d4ed8]',
  'En cours': 'bg-[#fef3c7] border-[#fde68a] text-[#ca8a04]',
  'Terminée': 'bg-[#ecfdf5] border-[#bbf7d0] text-[#15803d]'
};

export default function Kanban() {
  const missions = useStore(state => state.missions);
  const updateMission = useStore(state => state.updateMission);

  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredMissions = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return missions;

    return missions.filter((mission) => {
      const content = [mission.title, mission.client, mission.address, mission.type]
        .filter(Boolean)
        .join(' ') 
        .toLowerCase();
      return content.includes(normalized);
    });
  }, [missions, search]);

  const groups = useMemo(() => {
    return STATUS_ORDER.reduce((acc, status) => {
      acc[status] = filteredMissions.filter(mission => mission.status === status);
      return acc;
    }, {} as Record<MissionStatus, Mission[]>);
  }, [filteredMissions]);

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, missionId: string) => {
    event.dataTransfer.setData('text/plain', missionId);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>, status: MissionStatus) => {
    event.preventDefault();
    const missionId = event.dataTransfer.getData('text/plain');
    if (!missionId) return;
    const mission = missions.find((m) => m.id === missionId);
    if (!mission || mission.status === status) return;
    updateMission(missionId, { status });
  };

  const handleOpen = (missionId: string) => {
    setSelectedMissionId(missionId);
    setModalOpen(true);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-[#0f172a] uppercase tracking-tight">Tableau Kanban</h2>
          <p className="text-xs text-[#64748b] font-medium">Suivi complet des missions par statut et transition rapide.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une mission..."
              aria-label="Rechercher une mission"
              className="w-full max-w-xs pl-3 pr-3 py-2 text-sm border border-[#e2e8f0] rounded-lg bg-white text-[#0f172a] placeholder-[#94a3b8] focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 h-full min-h-[24rem]">
          {STATUS_ORDER.map((status) => (
            <section
              key={status}
              className="flex flex-col rounded-3xl border border-[#e2e8f0] bg-[#f8fafc] p-4 overflow-hidden"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => handleDrop(event, status)}
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-[#0f172a]">{STATUS_LABELS[status]}</span>
                  <span className="text-xs text-[#64748b]">{groups[status].length} mission{groups[status].length > 1 ? 's' : ''}</span>
                </div>
                <span className={`text-xs font-semibold uppercase px-2 py-1 rounded-full border ${statusStyles[status]}`}>
                  {status}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {groups[status].length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-[#cbd5e1] bg-white/70 p-5 text-sm text-[#64748b] text-center">
                    Glissez une mission ici ou créez-en une nouvelle.
                  </div>
                ) : (
                  groups[status].map((mission) => (
                    <div
                      key={mission.id}
                      draggable
                      onDragStart={(event) => handleDragStart(event, mission.id)}
                      onClick={() => handleOpen(mission.id)}
                      className="cursor-pointer rounded-3xl border border-[#e2e8f0] bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[#0f172a] truncate">{mission.title}</p>
                          <p className="text-xs text-[#64748b] truncate">{mission.client}</p>
                        </div>
                        <div className="rounded-full px-2 py-1 text-[11px] font-semibold uppercase" style={{ backgroundColor: mission.color ?? '#e2e8f0', color: '#0f172a' }}>
                          {mission.type}
                        </div>
                      </div>
                      <div className="mt-3 grid gap-2 text-xs text-[#475569]">
                        <span>{new Date(mission.start).toLocaleDateString('fr-FR')} → {new Date(mission.end).toLocaleDateString('fr-FR')}</span>
                        <span>{mission.address}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-[#64748b]">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#f1f5f9] border border-[#e2e8f0]">{mission.technicianIds.length} technicien{mission.technicianIds.length > 1 ? 's' : ''}</span>
                        {mission.truckId && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#f1f5f9] border border-[#e2e8f0]">Camion attribué</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          ))}
        </div>
      </div>

      {modalOpen && selectedMissionId && (
        <MissionModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          missionId={selectedMissionId}
          initialDates={null}
        />
      )}
    </div>
  );
}

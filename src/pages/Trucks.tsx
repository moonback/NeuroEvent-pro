import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Truck as TruckIcon, Pencil, Maximize2, Minimize2 } from 'lucide-react';
import { useStore } from '../store';
import { Truck } from '../types';
import TruckModal from '../components/TruckModal';
import MissionModal from '../components/MissionModal';
import { useIsMobile } from '../hooks/useMediaQuery';
import { useFullscreen } from '../hooks/useFullscreen';

export default function Trucks() {
  const isMobile = useIsMobile();
  const trucks = useStore(state => state.trucks);
  const missions = useStore(state => state.missions);
  const updateMission = useStore(state => state.updateMission);

  const [truckModalOpen, setTruckModalOpen] = useState(false);
  const [editing, setEditing] = useState<Truck | null>(null);
  const [missionModalOpen, setMissionModalOpen] = useState(false);
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);
  const { ref: fsRef, isFullscreen, toggle: toggleFullscreen } = useFullscreen();

  // Un événement par mission avec camion, coloré par la mission
  const events = missions
    .filter(m => m.truckId)
    .map(m => {
      const truck = trucks.find(t => t.id === m.truckId);
      return {
        id: m.id,
        title: m.title,
        start: m.start,
        end: m.end,
        backgroundColor: m.color,
        borderColor: m.color,
        extendedProps: {
          missionId: m.id,
          truckName: truck?.name ?? '',
          truckPlate: truck?.plate ?? '',
        },
      };
    });

  const handleEventClick = (info: any) => {
    setSelectedMissionId(info.event.extendedProps.missionId);
    setMissionModalOpen(true);
  };

  const handleEventDrop = (info: any) => {
    updateMission(info.event.extendedProps.missionId, {
      start: info.event.start,
      end: info.event.end || info.event.start,
    });
  };

  const handleEventResize = (info: any) => {
    updateMission(info.event.extendedProps.missionId, {
      start: info.event.start,
      end: info.event.end || info.event.start,
    });
  };

  const openCreate = () => { setEditing(null); setTruckModalOpen(true); };
  const openEdit = (truck: Truck | undefined) => {
    if (!truck) return;
    setEditing(truck);
    setTruckModalOpen(true);
  };

  return (
    <div ref={fsRef} className={`bg-white border border-[#e2e8f0] p-3 sm:p-6 flex flex-col relative z-0 ${isFullscreen ? 'h-screen' : 'h-full'}`}>

      {/* ── En-tête ──────────────────────────────────────────────────────── */}
      <div className="mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg sm:text-xl font-bold text-[#0f172a] uppercase tracking-tight">Planning des Camions</h2>
          <p className="text-xs text-[#64748b] font-medium">Missions affectées aux véhicules — cliquez sur un événement pour ouvrir la fiche</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
            className="p-2 rounded-md text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9] border border-[#e2e8f0] transition-colors"
            aria-label={isFullscreen ? 'Quitter le plein écran' : 'Passer en plein écran'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={openCreate}
            className="flex items-center justify-center gap-2 bg-[#0f172a] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-black transition-colors"
          >
            + Nouveau Camion
          </button>
        </div>
      </div>

      {/* ── Légende camions ───────────────────────────────────────────────── */}
      {trucks.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4 pb-3 border-b border-[#f1f5f9]">
          {trucks.map(truck => {
            const missionCount = missions.filter(m => m.truckId === truck.id).length;
            return (
              <button
                key={truck.id}
                onClick={() => openEdit(truck)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-[#e2e8f0] bg-white hover:bg-[#f8fafc] hover:border-[#cbd5e1] transition-all group"
                title={`Modifier ${truck.name}`}
              >
                <TruckIcon className="w-3.5 h-3.5 text-[#6366f1] shrink-0" />
                <span className="text-xs font-semibold text-[#0f172a]">{truck.name}</span>
                <span className="text-[10px] bg-[#f1f5f9] text-[#64748b] px-1.5 py-0.5 rounded-full border border-[#e2e8f0]">
                  {truck.plate}
                </span>
                <span className="text-[10px] bg-[#eff6ff] text-[#2563eb] px-1.5 py-0.5 rounded-full border border-[#bfdbfe]">
                  {truck.volume} m³
                </span>
                <span className="text-[10px] text-[#94a3b8]">{missionCount} mission{missionCount > 1 ? 's' : ''}</span>
                <Pencil className="w-3 h-3 text-[#94a3b8] opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            );
          })}
        </div>
      )}

      {/* ── Calendrier ───────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0">
        <FullCalendar
          key={isMobile ? 'mobile' : 'desktop'}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={isMobile ? 'timeGridDay' : 'timeGridWeek'}
          headerToolbar={
            isMobile
              ? { left: 'prev,next', center: 'title', right: 'today' }
              : { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }
          }
          footerToolbar={
            isMobile
              ? { left: '', center: 'dayGridMonth,timeGridWeek,timeGridDay', right: '' }
              : undefined
          }
          events={events}
          editable={true}
          selectable={false}
          dayMaxEvents={true}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          height="100%"
          locale="fr"
          buttonText={{
            today: "Aujourd'hui",
            month: 'Mois',
            week: 'Semaine',
            day: 'Jour',
            list: 'Liste',
          }}
          slotMinTime="06:00:00"
          slotMaxTime="24:00:00"
          allDaySlot={false}
          eventContent={(info) => (
            <div className="flex flex-col overflow-hidden text-xs px-0.5 py-0.5">
              <div className="font-semibold truncate">{info.event.title}</div>
              <div className="opacity-85 truncate flex items-center gap-1">
                <TruckIcon className="w-2.5 h-2.5 shrink-0 inline-block" />
                {info.event.extendedProps.truckName}
              </div>
            </div>
          )}
        />
      </div>

      {/* ── Modales ──────────────────────────────────────────────────────── */}
      {truckModalOpen && (
        <TruckModal
          isOpen={truckModalOpen}
          onClose={() => { setTruckModalOpen(false); setEditing(null); }}
          truck={editing}
        />
      )}
      {missionModalOpen && (
        <MissionModal
          isOpen={missionModalOpen}
          onClose={() => setMissionModalOpen(false)}
          missionId={selectedMissionId}
          initialDates={null}
        />
      )}
    </div>
  );
}

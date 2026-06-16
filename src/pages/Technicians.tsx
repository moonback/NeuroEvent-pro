import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Pencil, Maximize2, Minimize2 } from 'lucide-react';
import { useStore } from '../store';
import { Technician } from '../types';
import TechnicianModal from '../components/TechnicianModal';
import MissionModal from '../components/MissionModal';
import { UserAvatar } from '../components/ui/UserAvatar';
import { toast } from '../store/toast';
import { useIsMobile } from '../hooks/useMediaQuery';
import { useFullscreen } from '../hooks/useFullscreen';

export default function Technicians() {
  const isMobile = useIsMobile();
  const technicians = useStore(state => state.technicians);
  const missions = useStore(state => state.missions);
  const updateMission = useStore(state => state.updateMission);

  const [techModalOpen, setTechModalOpen] = useState(false);
  const [editing, setEditing] = useState<Technician | null>(null);
  const [missionModalOpen, setMissionModalOpen] = useState(false);
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);
  const { ref: fsRef, isFullscreen, toggle: toggleFullscreen } = useFullscreen();

  // Un événement par couple (mission × technicien), coloré par technicien
  const events = missions.flatMap(m =>
    m.technicianIds.map(techId => {
      const tech = technicians.find(t => t.id === techId);
      return {
        id: `${m.id}::${techId}`,
        title: m.title,
        start: m.start,
        end: m.end,
        backgroundColor: tech?.color ?? m.color,
        borderColor: tech?.color ?? m.color,
        extendedProps: {
          missionId: m.id,
          techName: tech ? `${tech.firstName} ${tech.lastName}` : '',
          specialty: tech?.specialty ?? '',
        },
      };
    })
  );

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

  const openEdit = (tech: Technician | undefined) => {
    if (!tech) return;
    setEditing(tech);
    setTechModalOpen(true);
  };

  return (
    <div ref={fsRef} className={`bg-white border border-[#e2e8f0] p-3 sm:p-6 flex flex-col relative z-0 ${isFullscreen ? 'h-screen' : 'h-full'}`}>

      {/* ── En-tête ──────────────────────────────────────────────────────── */}
      <div className="mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg sm:text-xl font-bold text-[#0f172a] uppercase tracking-tight">Planning des Techniciens</h2>
          <p className="text-xs text-[#64748b] font-medium">Visualisation des missions par technicien — cliquez sur un événement pour ouvrir la fiche</p>
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
        </div>
      </div>

      {/* ── Légende techniciens ───────────────────────────────────────────── */}
      {technicians.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4 pb-3 border-b border-[#f1f5f9]">
          {technicians.map(tech => (
            <button
              key={tech.id}
              onClick={() => openEdit(tech)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-[#e2e8f0] bg-white hover:bg-[#f8fafc] hover:border-[#cbd5e1] transition-all group"
              title={`Modifier ${tech.firstName} ${tech.lastName}`}
            >
              {tech.avatarUrl ? (
                <UserAvatar
                  src={tech.avatarUrl}
                  name={`${tech.firstName} ${tech.lastName}`}
                  size="xs"
                  shape="circle"
                  className="w-5 h-5 text-[9px]"
                />
              ) : (
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: tech.color }}
                />
              )}
              <span className="text-xs font-semibold text-[#0f172a]">
                {tech.firstName} {tech.lastName}
              </span>
              <span className="text-[10px] text-[#94a3b8]">{tech.specialty}</span>
              <Pencil className="w-3 h-3 text-[#94a3b8] opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
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
              <div className="opacity-85 truncate">{info.event.extendedProps.techName}</div>
            </div>
          )}
        />
      </div>

      {/* ── Modales ──────────────────────────────────────────────────────── */}
      {techModalOpen && (
        <TechnicianModal
          isOpen={techModalOpen}
          onClose={() => { setTechModalOpen(false); setEditing(null); }}
          technician={editing}
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

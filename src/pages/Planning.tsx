import React, { useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { AlertTriangle, Maximize2, Minimize2 } from 'lucide-react';
import { useStore } from '../store';
import MissionModal from '../components/MissionModal';
import { getGlobalConflicts } from '../lib/conflicts';
import { useIsMobile } from '../hooks/useMediaQuery';
import { useFullscreen } from '../hooks/useFullscreen';

export default function Planning() {
  const isMobile = useIsMobile();
  const missions = useStore(state => state.missions);
  const technicians = useStore(state => state.technicians);
  const trucks = useStore(state => state.trucks);
  const equipment = useStore(state => state.equipment);
  const unavailabilities = useStore(state => state.unavailabilities);
  const updateMission = useStore(state => state.updateMission);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);
  const [initialDates, setInitialDates] = useState<{start: Date, end: Date} | null>(null);
  const [conflictsExpanded, setConflictsExpanded] = useState(false);
  const { ref: fsRef, isFullscreen, toggle: toggleFullscreen } = useFullscreen();

  const conflicts = useMemo(
    () => getGlobalConflicts(missions, technicians, trucks, equipment, unavailabilities),
    [missions, technicians, trucks, equipment, unavailabilities]
  );

  const events = missions.map(m => ({
    id: m.id,
    title: m.title,
    start: m.start,
    end: m.end,
    backgroundColor: m.status === 'Termin\u00e9e' ? '#6b7280' : m.status === 'En cours' ? m.color : m.color,
    borderColor: m.status === 'Termin\u00e9e' ? '#4b5563' : m.color,
    textColor: '#ffffff',
    extendedProps: {
      status: m.status,
      type: m.type
    }
  }));

  const handleEventClick = (info: any) => {
    setSelectedMissionId(info.event.id);
    setInitialDates(null);
    setModalOpen(true);
  };

  const handleDateSelect = (info: any) => {
    setSelectedMissionId(null);
    setInitialDates({ start: info.start, end: info.end });
    setModalOpen(true);
  };

  const handleEventDrop = (info: any) => {
    updateMission(info.event.id, {
      start: info.event.start,
      end: info.event.end || info.event.start
    });
  };

  const handleEventResize = (info: any) => {
    updateMission(info.event.id, {
      start: info.event.start,
      end: info.event.end || info.event.start
    });
  };

  const displayedConflicts = conflictsExpanded ? conflicts : conflicts.slice(0, 3);

  return (
    <div ref={fsRef} className={`bg-white border border-[#e2e8f0] p-3 sm:p-6 flex flex-col relative z-0 ${isFullscreen ? 'h-screen' : 'h-full'}`}>
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg sm:text-xl font-bold text-[#0f172a] uppercase tracking-tight">Calendrier Global</h2>
          <p className="text-xs text-[#64748b] font-medium">Visualisation et gestion des missions événementielles</p>
        </div>
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
          className="shrink-0 p-2 rounded-md text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9] border border-[#e2e8f0] transition-colors"
          aria-label={isFullscreen ? 'Quitter le plein écran' : 'Passer en plein écran'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {conflicts.length > 0 && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3 print:hidden" role="alert">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {conflicts.length} conflit{conflicts.length > 1 ? 's' : ''} détecté{conflicts.length > 1 ? 's' : ''} dans le planning
          </div>
          <ul className="mt-1 text-xs text-amber-700 list-disc pl-6 space-y-0.5">
            {displayedConflicts.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
          {conflicts.length > 3 && (
            <button
              onClick={() => setConflictsExpanded(expanded => !expanded)}
              className="mt-1 text-xs font-semibold text-amber-800 hover:underline"
            >
              {conflictsExpanded ? 'Réduire' : `Afficher les ${conflicts.length - 3} autres`}
            </button>
          )}
        </div>
      )}

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
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          select={handleDateSelect}
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
            list: 'Liste'
          }}
          slotMinTime="06:00:00"
          slotMaxTime="24:00:00"
          allDaySlot={false}
          eventContent={renderEventContent}
        />
      </div>

      {modalOpen && (
        <MissionModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          missionId={selectedMissionId}
          initialDates={initialDates}
        />
      )}
    </div>
  );
}

function renderEventContent(eventInfo: any) {
  const status = eventInfo.event.extendedProps?.status;
  const statusDot = {
    'Planifi\u00e9e': { bg: 'rgba(255,255,255,0.3)', label: '\u25CF' },
    'En cours':  { bg: 'rgba(251,191,36,0.8)',  label: '\u25CF' },
    'Termin\u00e9e':  { bg: 'rgba(52,211,153,0.9)',  label: '\u2713' },
  }[status] || { bg: 'rgba(255,255,255,0.3)', label: '\u25CF' };

  return (
    <div className="flex flex-col overflow-hidden text-xs px-0.5">
      <div className="flex items-center gap-1 mb-0.5">
        <span style={{ color: statusDot.bg, fontWeight: 900, fontSize: '10px', lineHeight: 1 }}>{statusDot.label}</span>
        <span className="font-bold truncate">{eventInfo.event.title}</span>
      </div>
      <div className="opacity-80 text-[10px]">{eventInfo.timeText}</div>
    </div>
  );
}

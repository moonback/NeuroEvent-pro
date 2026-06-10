import React, { useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { AlertTriangle } from 'lucide-react';
import { useStore } from '../store';
import MissionModal from '../components/MissionModal';
import { getGlobalConflicts } from '../lib/conflicts';

export default function Planning() {
  const missions = useStore(state => state.missions);
  const technicians = useStore(state => state.technicians);
  const trucks = useStore(state => state.trucks);
  const equipment = useStore(state => state.equipment);
  const updateMission = useStore(state => state.updateMission);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);
  const [initialDates, setInitialDates] = useState<{start: Date, end: Date} | null>(null);
  const [conflictsExpanded, setConflictsExpanded] = useState(false);

  const conflicts = useMemo(
    () => getGlobalConflicts(missions, technicians, trucks, equipment),
    [missions, technicians, trucks, equipment]
  );

  const events = missions.map(m => ({
    id: m.id,
    title: m.title,
    start: m.start,
    end: m.end,
    backgroundColor: m.color,
    borderColor: m.color,
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
    <div className="h-full bg-white border border-[#e2e8f0] p-6 flex flex-col relative z-0">
      <div className="mb-4 flex flex-col gap-1">
        <h2 className="text-xl font-bold text-[#0f172a] uppercase tracking-tight">Calendrier Global</h2>
        <p className="text-xs text-[#64748b] font-medium">Visualisation et gestion des missions événementielles</p>
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
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
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
  return (
    <div className="flex flex-col overflow-hidden text-xs">
      <div className="font-semibold truncate">{eventInfo.event.title}</div>
      <div className="opacity-90">{eventInfo.timeText}</div>
    </div>
  );
}

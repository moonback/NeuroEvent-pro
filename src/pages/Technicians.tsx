import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin from '@fullcalendar/interaction';
import { useStore } from '../store';
import TechnicianModal from '../components/TechnicianModal';

export default function Technicians() {
  const technicians = useStore(state => state.technicians);
  const missions = useStore(state => state.missions);
  const [modalOpen, setModalOpen] = useState(false);

  const resources = technicians.map(tech => ({
    id: tech.id,
    title: `${tech.firstName} ${tech.lastName}`,
    specialty: tech.specialty,
    eventColor: tech.color
  }));

  const events = missions.flatMap(m => 
    m.technicianIds.map(techId => ({
      id: `${m.id}-${techId}`,
      resourceId: techId,
      title: m.title,
      start: m.start,
      end: m.end,
    }))
  );

  return (
    <div className="h-full bg-white border border-[#e2e8f0] p-6 flex flex-col relative z-0">
      <div className="mb-4 flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-[#0f172a] uppercase tracking-tight">Planning des Techniciens</h2>
          <p className="text-xs text-[#64748b] font-medium">Vue individuelle et détection des conflits</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 bg-[#0f172a] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-black transition-colors">
          + Nouveau Technicien
        </button>
      </div>

      <div className="flex-1 min-h-0">
        <FullCalendar
          plugins={[resourceTimelinePlugin, interactionPlugin]}
          initialView="resourceTimelineWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'resourceTimelineDay,resourceTimelineWeek,resourceTimelineMonth'
          }}
          resources={resources}
          events={events}
          editable={false}
          selectable={true}
          height="100%"
          locale="fr"
          buttonText={{
            today: "Aujourd'hui",
            month: 'Mois',
            week: 'Semaine',
            day: 'Jour'
          }}
          resourceAreaWidth="250px"
          resourceAreaHeaderContent="Techniciens"
          slotMinTime="06:00:00"
          slotMaxTime="24:00:00"
          resourceLabelContent={(arg) => (
            <div className="flex flex-col p-1">
              <span className="font-semibold text-[#0f172a]">{arg.resource.title}</span>
              <span className="text-xs text-[#64748b]">{arg.resource.extendedProps.specialty}</span>
            </div>
          )}
        />
      </div>

      <TechnicianModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}


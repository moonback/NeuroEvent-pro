import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin from '@fullcalendar/interaction';
import { useStore } from '../store';
import TruckModal from '../components/TruckModal';

export default function Trucks() {
  const trucks = useStore(state => state.trucks);
  const missions = useStore(state => state.missions);
  const [modalOpen, setModalOpen] = useState(false);

  const resources = trucks.map(truck => ({
    id: truck.id,
    title: truck.name,
    plate: truck.plate,
    volume: truck.volume,
    eventColor: '#6366f1' // indigo-500
  }));

  const events = missions
    .filter(m => m.truckId)
    .map(m => ({
      id: m.id,
      resourceId: m.truckId,
      title: m.title,
      start: m.start,
      end: m.end,
      backgroundColor: m.color,
      borderColor: m.color,
    }));

  return (
    <div className="h-full bg-white border border-[#e2e8f0] p-6 flex flex-col relative z-0">
      <div className="mb-4 flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-[#0f172a] uppercase tracking-tight">Planning des Camions</h2>
          <p className="text-xs text-[#64748b] font-medium">Suivi occupation et disponibilité des véhicules</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 bg-[#0f172a] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-black transition-colors">
          + Nouveau Camion
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
          selectable={false}
          height="100%"
          locale="fr"
          buttonText={{
            today: "Aujourd'hui",
            month: 'Mois',
            week: 'Semaine',
            day: 'Jour'
          }}
          resourceAreaWidth="280px"
          resourceAreaHeaderContent="Véhicules"
          slotMinTime="06:00:00"
          slotMaxTime="24:00:00"
          resourceLabelContent={(arg) => (
            <div className="flex flex-col p-1">
              <span className="font-semibold text-[#0f172a]">{arg.resource.title}</span>
              <div className="flex space-x-2 text-xs text-[#64748b] mt-1">
                <span className="bg-[#f1f5f9] px-1.5 py-0.5 rounded border border-[#e2e8f0]">{arg.resource.extendedProps.plate}</span>
                <span className="bg-[#eff6ff] text-[#2563eb] px-1.5 py-0.5 rounded border border-[#bfdbfe]">{arg.resource.extendedProps.volume} m³</span>
              </div>
            </div>
          )}
        />
      </div>

      <TruckModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}

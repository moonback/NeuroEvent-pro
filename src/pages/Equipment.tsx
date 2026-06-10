import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin from '@fullcalendar/interaction';
import { useStore } from '../store';
import EquipmentModal from '../components/EquipmentModal';

export default function Equipment() {
  const store = useStore();
  const [modalOpen, setModalOpen] = useState(false);

  const resources = store.equipment.map(item => ({
    id: item.id,
    title: item.name,
    category: item.category,
    totalQuantity: item.totalQuantity,
  }));

  const events: any[] = [];
  store.missions.forEach(mission => {
    mission.equipments.forEach(eq => {
      events.push({
        id: `${mission.id}-${eq.equipmentId}`,
        resourceId: eq.equipmentId,
        title: `${mission.title} (${eq.quantity}x)`,
        start: mission.start,
        end: mission.end,
        backgroundColor: '#14b8a6', // teal
        borderColor: '#0d9488',
      });
    });
  });

  return (
    <div className="h-full bg-white border border-[#e2e8f0] p-6 flex flex-col relative z-0">
      <div className="mb-4 flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-[#0f172a] uppercase tracking-tight">Planning du Matériel</h2>
          <p className="text-xs text-[#64748b] font-medium">Allocation du matériel et prévention des conflits</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 bg-[#0f172a] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-black transition-colors">
          + Nouveau Matériel
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
          resourceAreaWidth="300px"
          resourceAreaHeaderContent="Matériel"
          slotMinTime="06:00:00"
          slotMaxTime="24:00:00"
          resourceGroupField="category"
          resourceLabelContent={(arg) => (
            <div className="flex justify-between items-center w-full pr-2 p-1">
              <span className="font-semibold text-[#0f172a] text-sm truncate">{arg.resource.title}</span>
              <span className="text-xs bg-[#f1f5f9] text-[#64748b] px-2 py-1 rounded-full font-medium ml-2 whitespace-nowrap">
                Total: {arg.resource.extendedProps.totalQuantity}
              </span>
            </div>
          )}
        />
      </div>

      <EquipmentModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}

import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin from '@fullcalendar/interaction';
import { Pencil } from 'lucide-react';
import { useStore } from '../store';
import { Technician } from '../types';
import TechnicianModal from '../components/TechnicianModal';
import { toast } from '../store/toast';
import { useIsMobile } from '../hooks/useMediaQuery';

export default function Technicians() {
  const isMobile = useIsMobile();
  const technicians = useStore(state => state.technicians);
  const missions = useStore(state => state.missions);
  const updateMission = useStore(state => state.updateMission);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Technician | null>(null);

  const resources = technicians.map(tech => ({
    id: tech.id,
    title: `${tech.firstName} ${tech.lastName}`,
    specialty: tech.specialty,
    eventColor: tech.color
  }));

  const events = missions.flatMap(m =>
    m.technicianIds.map(techId => ({
      // Les UUID contiennent des tirets : on ne reconstruit jamais les ids
      // par split, les vraies références passent par extendedProps.
      id: `${m.id}::${techId}`,
      resourceId: techId,
      title: m.title,
      start: m.start,
      end: m.end,
      extendedProps: { missionId: m.id, technicianId: techId }
    }))
  );

  // Déplacement / redimensionnement : met à jour les dates de la mission ;
  // un glisser vers une autre ligne réaffecte la mission à ce technicien.
  const handleEventChange = (info: any) => {
    const { missionId, technicianId } = info.event.extendedProps;
    const mission = missions.find(m => m.id === missionId);
    if (!mission) { info.revert(); return; }

    const updates: { start: Date; end: Date; technicianIds?: string[] } = {
      start: info.event.start,
      end: info.event.end || info.event.start
    };

    if (info.newResource && info.newResource.id !== technicianId) {
      if (mission.technicianIds.includes(info.newResource.id)) {
        toast.info('Ce technicien est déjà affecté à cette mission.');
        info.revert();
        return;
      }
      updates.technicianIds = mission.technicianIds.map(id => id === technicianId ? info.newResource.id : id);
    }

    updateMission(missionId, updates);
  };

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (tech: Technician | undefined) => {
    if (!tech) return;
    setEditing(tech);
    setModalOpen(true);
  };

  return (
    <div className="h-full bg-white border border-[#e2e8f0] p-3 sm:p-6 flex flex-col relative z-0">
      <div className="mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg sm:text-xl font-bold text-[#0f172a] uppercase tracking-tight">Planning des Techniciens</h2>
          <p className="text-xs text-[#64748b] font-medium">Glissez une mission pour la déplacer ou la réaffecter — cliquez sur un nom pour modifier la fiche</p>
        </div>
        <button onClick={openCreate} className="flex items-center justify-center gap-2 bg-[#0f172a] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-black transition-colors shrink-0 self-start sm:self-auto">
          + Nouveau Technicien
        </button>
      </div>

      <div className="flex-1 min-h-0">
        <FullCalendar
          key={isMobile ? 'mobile' : 'desktop'}
          schedulerLicenseKey="CC-Attribution-NonCommercial-NoDerivatives"
          plugins={[resourceTimelinePlugin, interactionPlugin]}
          initialView={isMobile ? 'resourceTimelineDay' : 'resourceTimelineWeek'}
          headerToolbar={
            isMobile
              ? { left: 'prev,next', center: 'title', right: 'today' }
              : { left: 'prev,next today', center: 'title', right: 'resourceTimelineDay,resourceTimelineWeek,resourceTimelineMonth' }
          }
          footerToolbar={
            isMobile
              ? { left: '', center: 'resourceTimelineDay,resourceTimelineWeek,resourceTimelineMonth', right: '' }
              : undefined
          }
          resources={resources}
          events={events}
          editable={true}
          eventDrop={handleEventChange}
          eventResize={handleEventChange}
          selectable={true}
          height="100%"
          locale="fr"
          buttonText={{
            today: "Aujourd'hui",
            month: 'Mois',
            week: 'Semaine',
            day: 'Jour'
          }}
          resourceAreaWidth={isMobile ? '120px' : '250px'}
          resourceAreaHeaderContent="Techniciens"
          slotMinTime="06:00:00"
          slotMaxTime="24:00:00"
          resourceLabelContent={(arg) => (
            <button
              type="button"
              onClick={() => openEdit(technicians.find(t => t.id === arg.resource.id))}
              className="flex flex-col p-1 text-left w-full rounded hover:bg-[#f1f5f9] transition-colors group"
              title="Modifier ce technicien"
            >
              <span className="font-semibold text-[#0f172a] flex items-center gap-1.5">
                {arg.resource.title}
                <Pencil className="w-3 h-3 text-[#64748b] opacity-0 group-hover:opacity-100 transition-opacity" />
              </span>
              <span className="text-xs text-[#64748b]">{arg.resource.extendedProps.specialty}</span>
            </button>
          )}
        />
      </div>

      {modalOpen && (
        <TechnicianModal
          isOpen={modalOpen}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          technician={editing}
        />
      )}
    </div>
  );
}

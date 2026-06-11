import { Mission, Technician, Truck, Equipment, TechnicianUnavailability } from '../types';

export interface MissionDraft {
  id?: string | null;
  start: Date;
  end: Date;
  technicianIds: string[];
  truckId?: string;
  requiredSkills?: string[];
  equipments: { equipmentId: string; quantity: number }[];
}

export function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Détecte les conflits d'une mission (brouillon ou existante) contre le reste
 * du planning : double affectation technicien, camion déjà pris, et
 * sur-allocation de matériel sur les créneaux qui se chevauchent.
 */
export function getDraftConflicts(
  draft: MissionDraft,
  missions: Mission[],
  technicians: Technician[],
  trucks: Truck[],
  equipment: Equipment[],
  unavailabilities: TechnicianUnavailability[]
): string[] {
  const messages: string[] = [];
  if (isNaN(draft.start.getTime()) || isNaN(draft.end.getTime())) return messages;
  if (draft.end <= draft.start) {
    messages.push('La date de fin doit être postérieure à la date de début.');
    return messages;
  }

  const overlapping = missions.filter(
    m => m.id !== draft.id && rangesOverlap(draft.start, draft.end, m.start, m.end)
  );

  for (const m of overlapping) {
    for (const techId of draft.technicianIds) {
      if (m.technicianIds.includes(techId)) {
        const tech = technicians.find(t => t.id === techId);
        const name = tech ? `${tech.firstName} ${tech.lastName}` : 'Un technicien';
        messages.push(`${name} est déjà affecté à « ${m.title} » sur ce créneau.`);
      }
    }
    if (draft.truckId && m.truckId === draft.truckId) {
      const truck = trucks.find(t => t.id === draft.truckId);
      messages.push(`Le camion ${truck ? truck.name : ''} est déjà affecté à « ${m.title} » sur ce créneau.`.replace('  ', ' '));
    }
  }

  // Check unavailabilities
  const overlappingUnavailabilities = unavailabilities.filter(
    u => rangesOverlap(draft.start, draft.end, u.start, u.end)
  );

  for (const techId of draft.technicianIds) {
    const unavail = overlappingUnavailabilities.find(u => u.technicianId === techId);
    if (unavail) {
      const tech = technicians.find(t => t.id === techId);
      const name = tech ? `${tech.firstName} ${tech.lastName}` : 'Un technicien';
      const reason = unavail.reason ? ` (${unavail.reason})` : '';
      messages.push(`${name} est en ${unavail.type.toLowerCase()}${reason} sur ce créneau.`);
    }

    // Check skills
    if (draft.requiredSkills && draft.requiredSkills.length > 0) {
      const tech = technicians.find(t => t.id === techId);
      if (tech) {
        const missingSkills = draft.requiredSkills.filter(s => !(tech.skills || []).includes(s));
        if (missingSkills.length > 0) {
          const name = `${tech.firstName} ${tech.lastName}`;
          messages.push(`${name} ne possède pas toutes les compétences requises pour cette mission.`);
        }
      }
    }
  }

  for (const req of draft.equipments) {
    if (!req.equipmentId) continue;
    const def = equipment.find(e => e.id === req.equipmentId);
    if (!def) continue;
    const usedElsewhere = overlapping.reduce(
      (acc, m) => acc + (m.equipments.find(e => e.equipmentId === req.equipmentId)?.quantity || 0),
      0
    );
    const available = def.totalQuantity - usedElsewhere;
    if (req.quantity > available) {
      messages.push(
        `Stock insuffisant pour « ${def.name} » : demandé ${req.quantity}, disponible ${Math.max(available, 0)} (total dépôt : ${def.totalQuantity}).`
      );
    }
  }

  return messages;
}

/**
 * Balaye tout le planning et remonte la liste des conflits existants
 * (affichée en bannière sur la page Planning).
 */
export function getGlobalConflicts(
  missions: Mission[],
  technicians: Technician[],
  trucks: Truck[],
  equipment: Equipment[],
  unavailabilities: TechnicianUnavailability[]
): string[] {
  const seen = new Set<string>();
  const messages: string[] = [];

  for (const m of missions) {
    const conflicts = getDraftConflicts(
      {
        id: m.id,
        start: m.start,
        end: m.end,
        technicianIds: m.technicianIds,
        truckId: m.truckId,
        equipments: m.equipments,
        requiredSkills: m.requiredSkills,
      },
      missions,
      technicians,
      trucks,
      equipment,
      unavailabilities
    );
    for (const msg of conflicts) {
      const full = `« ${m.title} » : ${msg}`;
      if (!seen.has(full)) {
        seen.add(full);
        messages.push(full);
      }
    }
  }

  return messages;
}

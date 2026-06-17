import { Mission, Technician, Truck, Equipment, TechnicianUnavailability } from '../types';
import { checkStockShortages } from './stock';

export interface MissionDraft {
  id?: string | null;
  start: Date;
  end: Date;
  deliveryDate?: Date | null;
  pickupDate?: Date | null;
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
 *
 * Remarque P0-3 : le calcul de stock est délégué à `lib/stock.ts#reservedQuantityFor`
 * qui filtre désormais sur les statuts de mission actifs (les missions "Terminée"
 * ne consomment plus de stock).
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
  // Use delivery/pickup as primary window, fallback to start/end
  const effectiveStart = draft.deliveryDate ?? draft.start;
  const effectiveEnd = draft.pickupDate ?? draft.end;
  if (isNaN(effectiveStart.getTime()) || isNaN(effectiveEnd.getTime())) return messages;
  if (effectiveEnd <= effectiveStart) {
    messages.push('La date de fin doit être postérieure à la date de début.');
    return messages;
  }

  const overlapping = missions.filter(
    m => m.id !== draft.id && rangesOverlap(effectiveStart, effectiveEnd, m.start, m.end)
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
    u => rangesOverlap(effectiveStart, effectiveEnd, u.start, u.end)
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

  // Stock — délègue au module dédié (filtre P0-3 sur les missions actives).
  messages.push(
    ...checkStockShortages(
      { id: draft.id, start: effectiveStart, end: effectiveEnd, equipments: draft.equipments },
      missions,
      equipment
    )
  );

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
        deliveryDate: m.deliveryDate,
        pickupDate: m.pickupDate,
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
import { describe, it, expect } from 'vitest';
import { rangesOverlap, getDraftConflicts, getGlobalConflicts } from './conflicts';
import type { Mission, Technician, Truck, Equipment, TechnicianUnavailability } from '../types';

// ─── Helpers ────────────────────────────────────────────────────────────────

const d = (iso: string) => new Date(iso);

function makeMission(overrides: Partial<Mission> & Pick<Mission, 'id' | 'start' | 'end'>): Mission {
  return {
    title: `Mission ${overrides.id}`,
    type: 'Livraison',
    client: 'Client',
    address: 'Paris',
    technicianIds: [],
    equipments: [],
    status: 'Planifiée',
    color: '#000000',
    ...overrides,
  };
}

const tech1: Technician = { id: 't1', firstName: 'Alice', lastName: 'Dupont', specialty: 'Son', color: '#f00' };
const tech2: Technician = { id: 't2', firstName: 'Bob', lastName: 'Martin', specialty: 'Lumière', color: '#0f0', skills: ['Rigger'] };
const truck1: Truck = { id: 'tr1', name: 'Iveco', plate: 'AB-123-CD', volume: 20 };
const equip1: Equipment = { id: 'eq-1', name: 'Scène', category: 'Scène', totalQuantity: 5 };

const noUnavail: TechnicianUnavailability[] = [];

// ─── rangesOverlap (réexportée de conflicts.ts) ──────────────────────────────

describe('rangesOverlap (conflicts)', () => {
  it('chevauchement partiel → true', () => {
    expect(rangesOverlap(d('2026-06-01'), d('2026-06-10'), d('2026-06-05'), d('2026-06-15'))).toBe(true);
  });
  it('adjacents → false', () => {
    expect(rangesOverlap(d('2026-06-01'), d('2026-06-05'), d('2026-06-05'), d('2026-06-10'))).toBe(false);
  });
  it('disjoints → false', () => {
    expect(rangesOverlap(d('2026-06-01'), d('2026-06-03'), d('2026-06-10'), d('2026-06-15'))).toBe(false);
  });
});

// ─── getDraftConflicts — dates invalides ─────────────────────────────────────

describe('getDraftConflicts — validation des dates', () => {
  it('retourne [] si start invalide (NaN)', () => {
    const msgs = getDraftConflicts(
      { start: new Date('bad'), end: d('2026-06-10'), technicianIds: [], equipments: [] },
      [], [], [], [], []
    );
    expect(msgs).toHaveLength(0);
  });

  it('retourne message si end ≤ start', () => {
    const msgs = getDraftConflicts(
      { start: d('2026-06-10'), end: d('2026-06-05'), technicianIds: [], equipments: [] },
      [], [], [], [], []
    );
    expect(msgs).toHaveLength(1);
    expect(msgs[0]).toMatch(/fin doit être postérieure/);
  });
});

// ─── getDraftConflicts — double-affectation technicien ───────────────────────

describe('getDraftConflicts — conflit technicien', () => {
  const existingMission: Mission = makeMission({
    id: 'm1',
    start: d('2026-06-05'),
    end: d('2026-06-10'),
    technicianIds: ['t1'],
  });

  it('détecte le double-planning sur même créneau', () => {
    const msgs = getDraftConflicts(
      { start: d('2026-06-07'), end: d('2026-06-12'), technicianIds: ['t1'], equipments: [] },
      [existingMission], [tech1], [], [], noUnavail
    );
    expect(msgs.some(m => m.includes('Alice Dupont'))).toBe(true);
    expect(msgs.some(m => m.includes('Mission m1'))).toBe(true);
  });

  it('aucun conflit si créneaux disjoints', () => {
    const msgs = getDraftConflicts(
      { start: d('2026-06-15'), end: d('2026-06-20'), technicianIds: ['t1'], equipments: [] },
      [existingMission], [tech1], [], [], noUnavail
    );
    expect(msgs.filter(m => m.includes('Alice'))).toHaveLength(0);
  });

  it('aucun conflit avec soi-même (même id)', () => {
    const msgs = getDraftConflicts(
      { id: 'm1', start: d('2026-06-07'), end: d('2026-06-12'), technicianIds: ['t1'], equipments: [] },
      [existingMission], [tech1], [], [], noUnavail
    );
    expect(msgs.filter(m => m.includes('Alice'))).toHaveLength(0);
  });

  it('affiche "Un technicien" si technicien inconnu', () => {
    const msgs = getDraftConflicts(
      { start: d('2026-06-07'), end: d('2026-06-12'), technicianIds: ['t-unknown'], equipments: [] },
      [makeMission({ id: 'm2', start: d('2026-06-05'), end: d('2026-06-10'), technicianIds: ['t-unknown'] })],
      [], [], [], noUnavail
    );
    expect(msgs.some(m => m.includes('Un technicien'))).toBe(true);
  });
});

// ─── getDraftConflicts — conflit camion ──────────────────────────────────────

describe('getDraftConflicts — conflit camion', () => {
  const existingMission: Mission = makeMission({
    id: 'm1',
    start: d('2026-06-05'),
    end: d('2026-06-10'),
    truckId: 'tr1',
  });

  it('détecte un camion déjà affecté', () => {
    const msgs = getDraftConflicts(
      { start: d('2026-06-07'), end: d('2026-06-12'), technicianIds: [], truckId: 'tr1', equipments: [] },
      [existingMission], [], [truck1], [], noUnavail
    );
    expect(msgs.some(m => m.includes('Iveco'))).toBe(true);
  });

  it('pas de conflit si camion différent', () => {
    const msgs = getDraftConflicts(
      { start: d('2026-06-07'), end: d('2026-06-12'), technicianIds: [], truckId: 'tr-autre', equipments: [] },
      [existingMission], [], [truck1], [], noUnavail
    );
    expect(msgs.filter(m => m.includes('Iveco'))).toHaveLength(0);
  });
});

// ─── getDraftConflicts — indisponibilité technicien ──────────────────────────

describe('getDraftConflicts — indisponibilité', () => {
  const unavail: TechnicianUnavailability = {
    id: 'u1',
    technicianId: 't1',
    start: d('2026-06-05'),
    end: d('2026-06-12'),
    type: 'Congé',
    reason: 'Vacances',
    createdAt: new Date(),
  };

  it('signale indisponibilité avec raison', () => {
    const msgs = getDraftConflicts(
      { start: d('2026-06-07'), end: d('2026-06-10'), technicianIds: ['t1'], equipments: [] },
      [], [tech1], [], [], [unavail]
    );
    expect(msgs.some(m => m.includes('Alice Dupont') && m.includes('congé') && m.includes('Vacances'))).toBe(true);
  });

  it('pas de message si hors plage d\'indisponibilité', () => {
    const msgs = getDraftConflicts(
      { start: d('2026-06-20'), end: d('2026-06-25'), technicianIds: ['t1'], equipments: [] },
      [], [tech1], [], [], [unavail]
    );
    expect(msgs.filter(m => m.includes('Alice'))).toHaveLength(0);
  });
});

// ─── getDraftConflicts — compétences manquantes ──────────────────────────────

describe('getDraftConflicts — compétences', () => {
  it('signale compétence manquante', () => {
    const msgs = getDraftConflicts(
      {
        start: d('2026-06-07'),
        end: d('2026-06-10'),
        technicianIds: ['t1'],
        requiredSkills: ['Rigger'],
        equipments: [],
      },
      [], [tech1], [], [], noUnavail
    );
    // tech1 n'a pas skills défini → manque 'Rigger'
    expect(msgs.some(m => m.includes('compétences requises'))).toBe(true);
  });

  it('aucun message si technicien a toutes les compétences', () => {
    const msgs = getDraftConflicts(
      {
        start: d('2026-06-07'),
        end: d('2026-06-10'),
        technicianIds: ['t2'],
        requiredSkills: ['Rigger'],
        equipments: [],
      },
      [], [tech2], [], [], noUnavail
    );
    expect(msgs.filter(m => m.includes('compétences'))).toHaveLength(0);
  });
});

// ─── getDraftConflicts — stock ───────────────────────────────────────────────

describe('getDraftConflicts — stock matériel', () => {
  const existingMission: Mission = makeMission({
    id: 'm1',
    start: d('2026-06-05'),
    end: d('2026-06-15'),
    status: 'Planifiée',
    equipments: [{ equipmentId: 'eq-1', quantity: 4 }],
  });

  it('signale pénurie de stock', () => {
    const msgs = getDraftConflicts(
      { start: d('2026-06-07'), end: d('2026-06-12'), technicianIds: [], equipments: [{ equipmentId: 'eq-1', quantity: 3 }] },
      [existingMission], [], [], [equip1], noUnavail
    );
    // total=5, réservé=4, dispo=1, demandé=3 → pénurie
    expect(msgs.some(m => m.includes('Stock insuffisant'))).toBe(true);
  });

  it('aucun conflit si stock suffisant', () => {
    const msgs = getDraftConflicts(
      { start: d('2026-06-07'), end: d('2026-06-12'), technicianIds: [], equipments: [{ equipmentId: 'eq-1', quantity: 1 }] },
      [existingMission], [], [], [equip1], noUnavail
    );
    expect(msgs.filter(m => m.includes('Stock'))).toHaveLength(0);
  });

  it('mission Terminée ne bloque pas le stock', () => {
    const terminedMission: Mission = { ...existingMission, id: 'm-done', status: 'Terminée' };
    const msgs = getDraftConflicts(
      { start: d('2026-06-07'), end: d('2026-06-12'), technicianIds: [], equipments: [{ equipmentId: 'eq-1', quantity: 5 }] },
      [terminedMission], [], [], [equip1], noUnavail
    );
    expect(msgs.filter(m => m.includes('Stock'))).toHaveLength(0);
  });
});

// ─── getGlobalConflicts ──────────────────────────────────────────────────────

describe('getGlobalConflicts', () => {
  it('détecte les conflits entre deux missions qui se chevauchent', () => {
    const missions: Mission[] = [
      makeMission({ id: 'm1', start: d('2026-06-05'), end: d('2026-06-10'), technicianIds: ['t1'] }),
      makeMission({ id: 'm2', start: d('2026-06-07'), end: d('2026-06-15'), technicianIds: ['t1'] }),
    ];
    const msgs = getGlobalConflicts(missions, [tech1], [], [], noUnavail);
    expect(msgs.length).toBeGreaterThan(0);
    expect(msgs.some(m => m.includes('Alice Dupont'))).toBe(true);
  });

  it('déduplique les messages identiques', () => {
    const missions: Mission[] = [
      makeMission({ id: 'm1', start: d('2026-06-05'), end: d('2026-06-10'), technicianIds: ['t1'] }),
      makeMission({ id: 'm2', start: d('2026-06-07'), end: d('2026-06-15'), technicianIds: ['t1'] }),
    ];
    const msgs = getGlobalConflicts(missions, [tech1], [], [], noUnavail);
    const unique = new Set(msgs);
    expect(msgs.length).toBe(unique.size);
  });

  it('retourne [] si aucun conflit', () => {
    const missions: Mission[] = [
      makeMission({ id: 'm1', start: d('2026-06-01'), end: d('2026-06-05'), technicianIds: ['t1'] }),
      makeMission({ id: 'm2', start: d('2026-06-10'), end: d('2026-06-15'), technicianIds: ['t1'] }),
    ];
    const msgs = getGlobalConflicts(missions, [tech1], [], [], noUnavail);
    expect(msgs).toHaveLength(0);
  });
});

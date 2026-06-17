import { describe, it, expect } from 'vitest';
import {
  rangesOverlap,
  isActiveMission,
  computeReservedByWindow,
  computeReservedAt,
  reservedQuantityFor,
  availableQuantityFor,
  stockOverviewAt,
  checkStockShortages,
  ACTIVE_STATUSES,
  RELEASED_STATUSES,
} from './stock';
import type { Mission, Equipment } from '../types';

// ─── Helpers ────────────────────────────────────────────────────────────────

const d = (iso: string) => new Date(iso);

function makeMission(overrides: Partial<Mission> & Pick<Mission, 'id' | 'start' | 'end' | 'status'>): Mission {
  return {
    title: 'Mission test',
    type: 'Livraison',
    client: 'Client test',
    address: 'Paris',
    technicianIds: [],
    equipments: [],
    color: '#000000',
    ...overrides,
  };
}

function makeEquipment(id: string, totalQuantity: number): Equipment {
  return { id, name: `Équip ${id}`, category: 'Autre', totalQuantity };
}

// ─── rangesOverlap ──────────────────────────────────────────────────────────

describe('rangesOverlap', () => {
  it('chevauchement partiel', () => {
    expect(rangesOverlap(d('2026-06-01'), d('2026-06-10'), d('2026-06-05'), d('2026-06-15'))).toBe(true);
  });

  it('contenu dans la fenêtre', () => {
    expect(rangesOverlap(d('2026-06-01'), d('2026-06-20'), d('2026-06-05'), d('2026-06-10'))).toBe(true);
  });

  it('adjacents (touching) — pas de chevauchement', () => {
    expect(rangesOverlap(d('2026-06-01'), d('2026-06-05'), d('2026-06-05'), d('2026-06-10'))).toBe(false);
  });

  it('totalement disjoints', () => {
    expect(rangesOverlap(d('2026-06-01'), d('2026-06-03'), d('2026-06-10'), d('2026-06-15'))).toBe(false);
  });

  it('identiques', () => {
    expect(rangesOverlap(d('2026-06-05'), d('2026-06-10'), d('2026-06-05'), d('2026-06-10'))).toBe(true);
  });
});

// ─── isActiveMission ────────────────────────────────────────────────────────

describe('isActiveMission', () => {
  it.each(ACTIVE_STATUSES)('statut actif : %s', (status) => {
    expect(isActiveMission({ status })).toBe(true);
  });

  it.each(RELEASED_STATUSES)('statut libéré : %s', (status) => {
    expect(isActiveMission({ status })).toBe(false);
  });
});

// ─── computeReservedByWindow ─────────────────────────────────────────────────

describe('computeReservedByWindow', () => {
  const equip1 = 'eq-1';
  const equip2 = 'eq-2';

  const missions: Mission[] = [
    makeMission({
      id: 'm1',
      start: d('2026-06-05'),
      end: d('2026-06-10'),
      status: 'Planifiée',
      equipments: [{ equipmentId: equip1, quantity: 3 }, { equipmentId: equip2, quantity: 2 }],
    }),
    makeMission({
      id: 'm2',
      start: d('2026-06-08'),
      end: d('2026-06-15'),
      status: 'En cours',
      equipments: [{ equipmentId: equip1, quantity: 2 }],
    }),
    makeMission({
      id: 'm3',
      start: d('2026-06-01'),
      end: d('2026-06-20'),
      status: 'Terminée', // doit être ignorée
      equipments: [{ equipmentId: equip1, quantity: 10 }],
    }),
  ];

  it('cumule les missions actives qui chevauchent', () => {
    const result = computeReservedByWindow(d('2026-06-06'), d('2026-06-09'), missions);
    // m1 (overlap) + m2 (overlap) pour equip1 → 3+2=5; m3 ignorée
    expect(result.get(equip1)).toBe(5);
    expect(result.get(equip2)).toBe(2);
  });

  it('retourne map vide si fenêtre invalide (end ≤ start)', () => {
    const result = computeReservedByWindow(d('2026-06-10'), d('2026-06-05'), missions);
    expect(result.size).toBe(0);
  });

  it('ignore les missions "Terminée"', () => {
    const result = computeReservedByWindow(d('2026-06-01'), d('2026-06-25'), missions);
    // m1 + m2 = 5 pour equip1; m3 Terminée ignorée
    expect(result.get(equip1)).toBe(5);
  });

  it('retourne 0 si aucune mission ne chevauche', () => {
    const result = computeReservedByWindow(d('2026-07-01'), d('2026-07-10'), missions);
    expect(result.size).toBe(0);
  });
});

// ─── computeReservedAt ───────────────────────────────────────────────────────

describe('computeReservedAt', () => {
  const missions: Mission[] = [
    makeMission({
      id: 'm1',
      start: d('2026-06-05T08:00:00'),
      end: d('2026-06-10T18:00:00'),
      status: 'Planifiée',
      equipments: [{ equipmentId: 'eq-1', quantity: 4 }],
    }),
    makeMission({
      id: 'm2',
      start: d('2026-06-05T08:00:00'),
      end: d('2026-06-10T18:00:00'),
      status: 'Terminée',
      equipments: [{ equipmentId: 'eq-1', quantity: 99 }],
    }),
  ];

  it('retourne la quantité réservée à un instant inclus', () => {
    const result = computeReservedAt(d('2026-06-07T12:00:00'), missions);
    expect(result.get('eq-1')).toBe(4); // m2 ignorée (Terminée)
  });

  it('retourne 0 en dehors de toutes les missions', () => {
    const result = computeReservedAt(d('2026-06-01T00:00:00'), missions);
    expect((result.get('eq-1') ?? 0)).toBe(0);
  });

  it('ne compte pas la borne end (half-open)', () => {
    const result = computeReservedAt(d('2026-06-10T18:00:00'), missions);
    expect((result.get('eq-1') ?? 0)).toBe(0);
  });
});

// ─── reservedQuantityFor ─────────────────────────────────────────────────────

describe('reservedQuantityFor', () => {
  const missions: Mission[] = [
    makeMission({
      id: 'm1',
      start: d('2026-06-05'),
      end: d('2026-06-10'),
      status: 'Planifiée',
      equipments: [{ equipmentId: 'eq-1', quantity: 3 }],
    }),
    makeMission({
      id: 'm2',
      start: d('2026-06-07'),
      end: d('2026-06-12'),
      status: 'En cours',
      equipments: [{ equipmentId: 'eq-1', quantity: 2 }],
    }),
  ];

  it('cumule les réservations actives chevauchantes', () => {
    expect(reservedQuantityFor('eq-1', d('2026-06-06'), d('2026-06-11'), missions)).toBe(5);
  });

  it('ignore la mission passée en ignoreMissionId', () => {
    expect(reservedQuantityFor('eq-1', d('2026-06-06'), d('2026-06-11'), missions, 'm1')).toBe(2);
  });

  it('retourne 0 si end ≤ start', () => {
    expect(reservedQuantityFor('eq-1', d('2026-06-10'), d('2026-06-05'), missions)).toBe(0);
  });

  it('retourne 0 pour un equip inexistant', () => {
    expect(reservedQuantityFor('eq-999', d('2026-06-06'), d('2026-06-11'), missions)).toBe(0);
  });
});

// ─── availableQuantityFor ────────────────────────────────────────────────────

describe('availableQuantityFor', () => {
  const missions: Mission[] = [
    makeMission({
      id: 'm1',
      start: d('2026-06-05T08:00:00'),
      end: d('2026-06-10T18:00:00'),
      status: 'Planifiée',
      equipments: [{ equipmentId: 'eq-1', quantity: 3 }],
    }),
  ];
  const eq = makeEquipment('eq-1', 10);

  it('retourne total − réservé', () => {
    expect(availableQuantityFor(eq, d('2026-06-07T12:00:00'), missions)).toBe(7);
  });

  it('retourne null si equipment undefined', () => {
    expect(availableQuantityFor(undefined, d('2026-06-07T12:00:00'), missions)).toBeNull();
  });

  it('ne descend pas en dessous de 0', () => {
    const eqSmall = makeEquipment('eq-1', 2);
    expect(availableQuantityFor(eqSmall, d('2026-06-07T12:00:00'), missions)).toBe(0);
  });

  it('retourne total entier si hors plage', () => {
    expect(availableQuantityFor(eq, d('2026-07-01T00:00:00'), missions)).toBe(10);
  });
});

// ─── stockOverviewAt ────────────────────────────────────────────────────────

describe('stockOverviewAt', () => {
  const missions: Mission[] = [
    makeMission({
      id: 'm1',
      start: d('2026-06-05T08:00:00'),
      end: d('2026-06-10T18:00:00'),
      status: 'Planifiée',
      equipments: [{ equipmentId: 'eq-1', quantity: 4 }],
    }),
  ];
  const equipment: Equipment[] = [makeEquipment('eq-1', 10), makeEquipment('eq-2', 5)];

  it('calcule total / reserved / available', () => {
    const rows = stockOverviewAt(d('2026-06-07T12:00:00'), equipment, missions);
    const r1 = rows.find((r) => r.equipment.id === 'eq-1')!;
    const r2 = rows.find((r) => r.equipment.id === 'eq-2')!;
    expect(r1.total).toBe(10);
    expect(r1.reserved).toBe(4);
    expect(r1.available).toBe(6);
    expect(r2.reserved).toBe(0);
    expect(r2.available).toBe(5);
  });

  it('ignoreMissionId exclut la mission du calcul', () => {
    const rows = stockOverviewAt(d('2026-06-07T12:00:00'), equipment, missions, { ignoreMissionId: 'm1' });
    const r1 = rows.find((r) => r.equipment.id === 'eq-1')!;
    expect(r1.reserved).toBe(0);
    expect(r1.available).toBe(10);
  });
});

// ─── checkStockShortages ────────────────────────────────────────────────────

describe('checkStockShortages', () => {
  const missions: Mission[] = [
    makeMission({
      id: 'm1',
      start: d('2026-06-05'),
      end: d('2026-06-15'),
      status: 'Planifiée',
      equipments: [{ equipmentId: 'eq-1', quantity: 6 }],
    }),
  ];
  const equipment: Equipment[] = [makeEquipment('eq-1', 8)];

  it('aucun message si stock suffisant', () => {
    const msgs = checkStockShortages(
      { start: d('2026-06-06'), end: d('2026-06-14'), equipments: [{ equipmentId: 'eq-1', quantity: 2 }] },
      missions,
      equipment
    );
    expect(msgs).toHaveLength(0);
  });

  it('retourne un message si stock insuffisant', () => {
    const msgs = checkStockShortages(
      { start: d('2026-06-06'), end: d('2026-06-14'), equipments: [{ equipmentId: 'eq-1', quantity: 4 }] },
      missions,
      equipment
    );
    expect(msgs).toHaveLength(1);
    expect(msgs[0]).toMatch(/Stock insuffisant/);
    expect(msgs[0]).toMatch(/Équip eq-1/);
  });

  it('ignore la mission Terminée dans le cumul', () => {
    const terminedMissions: Mission[] = [
      makeMission({
        id: 'm1',
        start: d('2026-06-05'),
        end: d('2026-06-15'),
        status: 'Terminée', // ne compte pas
        equipments: [{ equipmentId: 'eq-1', quantity: 8 }],
      }),
    ];
    const msgs = checkStockShortages(
      { start: d('2026-06-06'), end: d('2026-06-14'), equipments: [{ equipmentId: 'eq-1', quantity: 8 }] },
      terminedMissions,
      equipment
    );
    expect(msgs).toHaveLength(0);
  });

  it('ignore le draft courant via son id (pas de double-comptage)', () => {
    const msgs = checkStockShortages(
      { id: 'm1', start: d('2026-06-06'), end: d('2026-06-14'), equipments: [{ equipmentId: 'eq-1', quantity: 6 }] },
      missions,
      equipment
    );
    expect(msgs).toHaveLength(0); // m1 est ignorée, réservé = 0, dispo = 8
  });

  it('retourne liste vide si dates invalides', () => {
    const msgs = checkStockShortages(
      { start: new Date('invalid'), end: d('2026-06-14'), equipments: [{ equipmentId: 'eq-1', quantity: 1 }] },
      missions,
      equipment
    );
    expect(msgs).toHaveLength(0);
  });
});

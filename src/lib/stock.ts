/**
 * Normalisation du stock matériel (P0-3, juin 2026).
 *
 * Avant : la dispo était calculée en place dans `getDraftConflicts`, sans
 * notion explicite de "réservé à date", ni filtrage par statut de mission.
 * Risque : une mission "Terminée" continuait de bloquer visuellement le stock
 * tant qu'on ne la supprimait pas.
 *
 * Maintenant : un vocabulaire clair + des fonctions pures réutilisables
 * (testables, sans dépendance au store).
 *
 * Vocabulaire
 * ───────────
 *  • Stock dépôt          : quantité physiquement présente en entrepôt
 *                           (équivaut à `equipments.total_quantity`).
 *  • Réservation          : une ligne `mission_equipments` (quantité réservée
 *                           par une mission sur un créneau donné).
 *  • Réservation active   : mission dont `status` est dans `ACTIVE_STATUSES`
 *                           (rien de "Terminée"). Une mission annulée / passée
 *                           libère le stock.
 *  • Disponible à date    : stock dépôt − Σ réservations actives qui chevauchent.
 *  • Réservé à date       : Σ réservations actives qui chevauchent.
 *
 * Hypothèses (à court terme — pourrait être affiné plus tard)
 * ───────────────────────────────────────────────────────────
 *  • On ne tient pas compte de la "date de livraison" / "date de reprise" du
 *    matériel (champs `deliveryDate` / `pickupDate` du modèle Mission) pour
 *    borner la réservation : c'est la plage de la mission elle-même qui compte.
 *    Si un client veut affiner, on étendra la signature plus tard.
 *  • Une mission "En cours" réserve encore son matériel (logique raisonnable :
 *    on ignore le matériel déjà rendu tant que la mission n'est pas clôturée).
 */

import type { Equipment, Mission, MissionStatus } from '../types';

/** Statuts qui CONSOMMENT du stock (≠ "Terminée"). */
export const ACTIVE_STATUSES: readonly MissionStatus[] = ['Planifiée', 'En cours'];

/** Statut hors conso : Terminée uniquement, pour l'instant. */
export const RELEASED_STATUSES: readonly MissionStatus[] = ['Terminée'];

export function isActiveMission(m: Pick<Mission, 'status'>): boolean {
  return ACTIVE_STATUSES.includes(m.status);
}

/** Chevauchement half-open [aStart, aEnd) ∩ [bStart, bEnd) — cohérent avec conflicts.ts. */
export function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Pour une fenêtre [start, end) donnée, calcule le total **réservé** par équipement
 * parmi les missions actives qui chevauchent cette fenêtre.
 * - Ignore les statuts `RELEASED_STATUSES` (ex: "Terminée").
 * - `mission.equipments` est supposé déjà aplati (déjà ce que fournit le store).
 *
 * Renvoie une Map `equipmentId -> reservedQuantity`.
 */
export function computeReservedByWindow(
  start: Date,
  end: Date,
  missions: Mission[]
): Map<string, number> {
  if (end <= start || isNaN(start.getTime()) || isNaN(end.getTime())) {
    return new Map();
  }
  const reserved = new Map<string, number>();
  for (const m of missions) {
    if (!isActiveMission(m)) continue;
    if (!rangesOverlap(start, end, m.start, m.end)) continue;
    for (const e of m.equipments) {
      if (!e.equipmentId || !e.quantity) continue;
      reserved.set(e.equipmentId, (reserved.get(e.equipmentId) ?? 0) + e.quantity);
    }
  }
  return reserved;
}

/** Calcul "réservé à un instant t" — c'est un cas particulier de fenêtre de longueur nulle. */
export function computeReservedAt(date: Date, missions: Mission[]): Map<string, number> {
  // Fenêtre infinitésimale centrée sur `date` : on regarde tout ce qui contient ce point.
  const reserved = new Map<string, number>();
  for (const m of missions) {
    if (!isActiveMission(m)) continue;
    if (date < m.start || date >= m.end) continue;
    for (const e of m.equipments) {
      if (!e.equipmentId || !e.quantity) continue;
      reserved.set(e.equipmentId, (reserved.get(e.equipmentId) ?? 0) + e.quantity);
    }
  }
  return reserved;
}

/**
 * Réservé pour un équipement donné sur une fenêtre [start, end),
 * en ne regardant que les missions actives (P0-3).
 */
export function reservedQuantityFor(
  equipmentId: string,
  start: Date,
  end: Date,
  missions: Mission[],
  ignoreMissionId?: string
): number {
  if (end <= start) return 0;
  let total = 0;
  for (const m of missions) {
    if (ignoreMissionId && m.id === ignoreMissionId) continue; // ex: brouillon courant
    if (!isActiveMission(m)) continue;
    if (!rangesOverlap(start, end, m.start, m.end)) continue;
    for (const e of m.equipments) {
      if (e.equipmentId === equipmentId) total += e.quantity;
    }
  }
  return total;
}

/**
 * Disponible *à date* = stock dépôt − Σ réservations actives à ce moment.
 *
 *  • Si le stock dépôt est inconnu, retourne `null` (l'appelant choisit ce qu'il
 *    veut afficher, par exemple "—" plutôt que "0").
 */
export function availableQuantityFor(
  equipment: Pick<Equipment, 'id' | 'totalQuantity'> | undefined,
  date: Date,
  missions: Mission[]
): number | null {
  if (!equipment) return null;
  const reserved = computeReservedAt(date, missions).get(equipment.id) ?? 0;
  return Math.max(0, equipment.totalQuantity - reserved);
}

export interface StockRow {
  equipment: Equipment;
  total: number;
  reserved: number;
  available: number;
}

/**
 * Vue d'ensemble du stock à une date donnée : pour chaque équipement du parc,
 *  • `total`     = stock dépôt (non touché),
 *  • `reserved`  = quantité réservée par des missions actives à cette date,
 *  • `available` = total − reserved (≥ 0).
 *
 * Option pour exclure une mission (utile depuis un formulaire d'édition : on
 * ne veut pas que la mission en cours de modification se compte elle-même).
 */
export function stockOverviewAt(
  date: Date,
  equipment: Equipment[],
  missions: Mission[],
  options: { ignoreMissionId?: string } = {}
): StockRow[] {
  const reserved = computeReservedAt(date, missions);
  const filtered = options.ignoreMissionId
    ? missions.filter((m) => m.id !== options.ignoreMissionId)
    : missions;

  return equipment.map((e) => {
    const r = reserved.get(e.id) ?? 0;
    // Recalcule en ignorant self si besoin (la mission self peut être active)
    let rFinal = r;
    if (options.ignoreMissionId) {
      rFinal = computeReservedAt(date, filtered).get(e.id) ?? 0;
    }
    return {
      equipment: e,
      total: e.totalQuantity,
      reserved: rFinal,
      available: Math.max(0, e.totalQuantity - rFinal),
    };
  });
}

/**
 * **Variante de la fonction conflits** : remplace le calcul actuel par un
 * calcul filtré sur les statuts actifs.
 * Utilisée pour vérifier la dispo côté MissionModal : un admin peut-il quand
 * même créer une mission qui pointe du matos déjà rendu par une mission
 * finie ? Oui — mais ce n'est PLUS comptabilisé grâce à P0-3.
 *
 * `MissionDraft` est importé dynamiquement pour éviter une dépendance circulaire.
 */
export function checkStockShortages(
  draft: {
    id?: string | null;
    start: Date;
    end: Date;
    equipments: { equipmentId: string; quantity: number }[];
  },
  missions: Mission[],
  equipment: Equipment[]
): string[] {
  const messages: string[] = [];
  if (!draft.start || !draft.end || isNaN(draft.start.getTime()) || isNaN(draft.end.getTime())) {
    return messages;
  }
  if (draft.end <= draft.start) {
    return messages; // géré ailleurs
  }

  for (const req of draft.equipments) {
    if (!req.equipmentId || !req.quantity) continue;
    const def = equipment.find((e) => e.id === req.equipmentId);
    if (!def) continue;

    const reserved = reservedQuantityFor(
      req.equipmentId,
      draft.start,
      draft.end,
      missions,
      draft.id ?? undefined
    );
    const available = def.totalQuantity - reserved;
    if (req.quantity > available) {
      messages.push(
        `Stock insuffisant pour « ${def.name} » : demandé ${req.quantity}, ` +
          `disponible ${Math.max(available, 0)} sur ce créneau ` +
          `(total dépôt : ${def.totalQuantity}, réservé actif : ${reserved}).`
      );
    }
  }
  return messages;
}

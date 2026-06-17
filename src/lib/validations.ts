import { z } from 'zod';
export const techRoleEnum = z.enum(['Admin', 'Technicien']);
export const missionTypeEnum = z.enum(['Livraison', 'Montage', 'Démontage', 'Événement complet']);
export const missionStatusEnum = z.enum(['Planifiée', 'En cours', 'Terminée']);
export const equipmentCategoryEnum = z.enum(['Arcade', 'Sonorisation', 'Éclairage', 'Scène', 'Décoration', 'Autre']);
export const unavailabilityTypeEnum = z.enum(['Congé', 'Indisponibilité']);

export const technicianSchema = z.object({
  firstName: z.string().min(1, 'Prénom requis').max(80, 'Prénom trop long'),
  lastName: z.string().min(1, 'Nom requis').max(80, 'Nom trop long'),
  specialty: z.string().min(1, 'Spécialité requise').max(120, 'Spécialité trop longue'),
  color: z.string().regex(/^#([0-9a-f]{3}){1,2}$/i, 'Couleur invalide').min(1, 'Couleur requise'),
  checklistEnabled: z.boolean().optional(),
  unavailStart: z.string().datetime().optional().or(z.literal('')),
  unavailEnd: z.string().datetime().optional().or(z.literal('')),
  unavailReason: z.string().max(200, 'Motif trop long').optional().or(z.literal('')),
});

export const missionSchema = z.object({
  title: z.string().min(1, 'Titre requis').max(120, 'Titre trop long'),
  client: z.string().min(1, 'Client requis').max(120, 'Client trop long'),
  type: z.enum(['Livraison', 'Montage', 'Démontage', 'Événement complet']),
  address: z.string().min(1, 'Adresse requise').max(200, 'Adresse trop longue'),
  startDate: z.string().min(1, 'Date de début requise'),
  endDate: z.string().min(1, 'Date de fin requise'),
  status: z.enum(['Planifiée', 'En cours', 'Terminée']),
  deliveryDate: z.string().datetime().optional().or(z.literal('').transform(() => undefined)),
  pickupDate: z.string().datetime().optional().or(z.literal('').transform(() => undefined)),
  setupDuration: z.coerce.number().int().min(0, 'Durée >= 0').optional(),
});

export const clientSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(120, 'Nom trop long'),
  contactName: z.string().max(100, 'Contact trop long').optional().or(z.literal('')),
  email: z.string().email('Email invalide').optional().or(z.literal('').transform(() => undefined)),
  phone: z.string().max(40, 'Téléphone trop long').optional().or(z.literal('')),
  address: z.string().max(200, 'Adresse trop longue').optional().or(z.literal('')),
  notes: z.string().max(1000, 'Notes trop longues').optional().or(z.literal('')),
});

export const equipmentSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Nom requis').max(100, 'Nom trop long'),
  category: z.enum(['Arcade', 'Sonorisation', 'Éclairage', 'Scène', 'Décoration', 'Autre']),
  totalQuantity: z.coerce.number().int().min(1, 'Quantité >= 1').default(1),
});

export const truckSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Nom requis').max(100, 'Nom trop long'),
  plate: z.string().min(1, 'Plaque requise').max(20, 'Plaque trop longue'),
  volume: z.coerce.number().min(0, 'Volume >= 0').max(999, 'Volume trop élevé'),
});

export const timeLogSchema = z.object({
  startTime: z.string().min(1, 'Début requis'),
  endTime: z.string().optional().or(z.literal('').transform(() => undefined)),
  note: z.string().max(240, 'Note trop longue').optional().or(z.literal('')),
});

export type TechnicianFormValues = z.infer<typeof technicianSchema>;
export type MissionFormValues = z.infer<typeof missionSchema>;
export type ClientFormValues = z.infer<typeof clientSchema>;
export type EquipmentFormValues = z.infer<typeof equipmentSchema>;
export type TruckFormValues = z.infer<typeof truckSchema>;
export type TimeLogFormValues = z.infer<typeof timeLogSchema>;

export const fieldError = (issue: z.ZodIssue) => issue.message;

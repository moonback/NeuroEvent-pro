export type EquipmentCategory = 'Arcade' | 'Sonorisation' | 'Éclairage' | 'Scène' | 'Décoration' | 'Autre';

export type MissionStatus = 'Planifiée' | 'En cours' | 'Terminée';

export type MissionType = 'Livraison' | 'Montage' | 'Démontage' | 'Événement complet';

export type UserRole = 'Admin' | 'Technicien';

export type UnavailabilityType = 'Congé' | 'Indisponibilité';

export interface Profile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt?: string;
  /** URL publique de l'avatar (Storage bucket `avatars`), null si pas d'avatar */
  avatarUrl?: string | null;
}

export interface DriverLicense {
  hasLicense: boolean;
  since?: string; // ISO date string YYYY-MM-DD
  categories?: string[]; // e.g. ['B', 'C', 'BE']
}

export interface Technician {
  id: string;
  firstName: string;
  lastName: string;
  specialty: string;
  color: string;
  skills?: string[];
  driverLicense?: DriverLicense;
  checklistEnabled?: boolean;
  /** URL publique de l'avatar (Storage bucket `avatars`), null si pas d'avatar */
  avatarUrl?: string | null;
}

export interface TechnicianUnavailability {
  id: string;
  technicianId: string;
  start: Date;
  end: Date;
  type: UnavailabilityType;
  reason?: string;
  createdAt: Date;
}

export interface Truck {
  id: string;
  name: string;
  plate: string;
  volume: number; // m3
}

export interface Equipment {
  id: string;
  name: string;
  category: EquipmentCategory;
  totalQuantity: number;
}

export interface Client {
  id: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export interface MissionEquipment {
  equipmentId: string;
  quantity: number;
  /** Pointage par le technicien (persisté en base, colonne `checked`). */
  checked?: boolean;
}

export interface MissionPhoto {
  id: string;
  missionId: string;
  type: 'before' | 'after';
  url: string;
  filePath: string;
  uploadedBy?: string | null;
  createdAt: Date;
}

export interface Mission {
  id: string;
  title: string;
  type: MissionType;
  /** Nom du client affiché (saisie libre ou recopié depuis la fiche client). */
  client: string;
  /** Référence vers la fiche client (table `clients`), si sélectionnée. */
  clientId?: string;
  address: string;
  start: Date;
  end: Date;
  technicianIds: string[];
  truckId?: string;
  requiredSkills?: string[];
  equipments: MissionEquipment[];
  status: MissionStatus;
  color: string;
  signatureUrl?: string | null;
  deliveryDate?: Date | null;
  pickupDate?: Date | null;
  setupDuration?: number | null; // in minutes
  report?: string | null;
  /** Legacy – conservé pour compatibilité ascendante. Préférer photos[] */
  photoBeforeUrl?: string | null;
  photoAfterUrl?: string | null;
  /** Photos preuves (plusieurs par type), chargées depuis la table mission_photos */
  photos?: MissionPhoto[];
}

export interface TimeLog {
  id: string;
  missionId: string;
  technicianId: string;
  startTime: Date;
  endTime: Date | null;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TechnicianDayLog {
  id: string;
  technicianId: string;
  date: Date;
  firstMissionStart: Date;
  dayEndTime: Date;
  totalMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}


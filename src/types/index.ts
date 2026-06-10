export type EquipmentCategory = 'Arcade' | 'Sonorisation' | 'Éclairage' | 'Scène' | 'Décoration' | 'Autre';

export type MissionStatus = 'Planifiée' | 'En cours' | 'Terminée';

export type MissionType = 'Livraison' | 'Montage' | 'Démontage' | 'Événement complet';

export type UserRole = 'Admin' | 'Technicien';

export interface Profile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt?: string;
}

export interface Technician {
  id: string;
  firstName: string;
  lastName: string;
  specialty: string;
  color: string;
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
  equipments: MissionEquipment[];
  status: MissionStatus;
  color: string;
}

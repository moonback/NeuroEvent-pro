export type EquipmentCategory = 'Arcade' | 'Sonorisation' | 'Éclairage' | 'Scène' | 'Décoration' | 'Autre';

export type MissionStatus = 'Planifiée' | 'En cours' | 'Terminée';

export type MissionType = 'Livraison' | 'Montage' | 'Démontage' | 'Événement complet';

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

export interface MissionEquipment {
  equipmentId: string;
  quantity: number;
}

export interface Mission {
  id: string;
  title: string;
  type: MissionType;
  client: string;
  address: string;
  start: Date;
  end: Date;
  technicianIds: string[];
  truckId?: string;
  equipments: MissionEquipment[];
  status: MissionStatus;
  color: string;
}

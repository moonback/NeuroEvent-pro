import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Mission, Technician, Truck, Equipment, Client, MissionType, MissionStatus, EquipmentCategory, TimeLog, TechnicianUnavailability, UnavailabilityType, MissionPhoto } from '../types';
import { TableRow, TableInsert, TableUpdate } from '../types/database';
import { supabase } from '../lib/supabase';
import { toast } from './toast';

/**
 * Ligne `missions` enrichie des deux tables de jointure. Comme les relations
 * ne sont pas décrites dans le type `Database`, l'inférence d'embed de
 * supabase-js ne s'applique pas : on précise le type de retour via `.returns()`.
 */
type MissionRowWithRelations = TableRow<'missions'> & {
  mission_technicians: Pick<TableRow<'mission_technicians'>, 'technician_id'>[] | null;
  mission_equipments: TableRow<'mission_equipments'>[] | null;
};

interface AppState {
  missions: Mission[];
  technicians: Technician[];
  trucks: Truck[];
  equipment: Equipment[];
  clients: Client[];
  timeLogs: TimeLog[];
  unavailabilities: TechnicianUnavailability[];
  missionPhotos: MissionPhoto[];

  loading: boolean;
  
  // Offline sync queue
  syncQueue: Array<{
    id: string;
    type: 'TOGGLE_EQUIP';
    payload: { missionId: string; equipmentId: string; checked: boolean };
  }>;
  processSyncQueue: () => Promise<void>;

  initialize: () => Promise<void>;

  addMission: (mission: Omit<Mission, 'id'>) => Promise<void>;
  updateMission: (id: string, mission: Partial<Mission>) => Promise<void>;
  deleteMission: (id: string) => Promise<void>;
  toggleEquipmentCheck: (missionId: string, equipmentId: string, checked: boolean) => Promise<void>;

  addTechnician: (tech: Omit<Technician, 'id'>) => Promise<void>;
  updateTechnician: (id: string, tech: Partial<Technician>) => Promise<void>;
  deleteTechnician: (id: string) => Promise<void>;

  addUnavailability: (u: Omit<TechnicianUnavailability, 'id' | 'createdAt'>) => Promise<void>;
  deleteUnavailability: (id: string) => Promise<void>;

  addTruck: (truck: Omit<Truck, 'id'>) => Promise<void>;
  updateTruck: (id: string, truck: Partial<Truck>) => Promise<void>;
  deleteTruck: (id: string) => Promise<void>;

  addEquipment: (item: Omit<Equipment, 'id'>) => Promise<void>;
  updateEquipment: (id: string, item: Partial<Equipment>) => Promise<void>;
  deleteEquipment: (id: string) => Promise<void>;
  importEquipment: (items: (Omit<Equipment, 'id'> & { id?: string })[]) => Promise<void>;

  addClient: (client: Omit<Client, 'id'>) => Promise<void>;
  updateClient: (id: string, client: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;

  // Time Logs
  fetchTimeLogs: (missionId?: string) => Promise<void>;
  addTimeLog: (log: Omit<TimeLog, 'id' | 'createdAt' | 'updatedAt'>) => Promise<TimeLog | null>;
  updateTimeLog: (id: string, fields: Partial<Pick<TimeLog, 'startTime' | 'endTime' | 'note'>>) => Promise<void>;
  deleteTimeLog: (id: string) => Promise<void>;

  // Mission Photos
  fetchMissionPhotos: (missionId: string) => Promise<MissionPhoto[]>;
  addMissionPhoto: (missionId: string, type: 'before' | 'after', file: File, uploadedBy?: string) => Promise<MissionPhoto | null>;
  deleteMissionPhoto: (photo: MissionPhoto) => Promise<void>;
}

/** Aucun échec Supabase ne doit rester silencieux : on prévient l'utilisateur. */
function reportError(action: string, error: { message: string } | null | undefined): boolean {
  if (!error) return false;
  console.error(action, error);
  toast.error(`${action} : ${error.message}`);
  return true;
}

function parseMissionSkills(rawSkills: string[] | null) {
  const arr = rawSkills || [];
  const skills = arr.filter(s => !s.startsWith('meta:'));
  const dStr = arr.find(s => s.startsWith('meta:delivery:'))?.split('meta:delivery:')[1];
  const pStr = arr.find(s => s.startsWith('meta:pickup:'))?.split('meta:pickup:')[1];
  const sStr = arr.find(s => s.startsWith('meta:setup:'))?.split('meta:setup:')[1];
  const reportStr = arr.find(s => s.startsWith('meta:report:'))?.split('meta:report:')[1];
  const photoBeforeStr = arr.find(s => s.startsWith('meta:photo:before:'))?.split('meta:photo:before:')[1];
  const photoAfterStr = arr.find(s => s.startsWith('meta:photo:after:'))?.split('meta:photo:after:')[1];
  
  return {
    skills,
    deliveryDate: dStr ? new Date(dStr) : null,
    pickupDate: pStr ? new Date(pStr) : null,
    setupDuration: sStr ? parseInt(sStr, 10) : null,
    report: reportStr ? decodeURIComponent(reportStr) : null,
    photoBeforeUrl: photoBeforeStr || null,
    photoAfterUrl: photoAfterStr || null
  };
}

function serializeMissionSkills(
  skills: string[] | undefined, 
  delivery: Date | null | undefined, 
  pickup: Date | null | undefined, 
  setup: number | null | undefined,
  report?: string | null,
  photoBeforeUrl?: string | null,
  photoAfterUrl?: string | null
) {
  const result = [...(skills || [])];
  if (delivery) result.push(`meta:delivery:${delivery.toISOString()}`);
  if (pickup) result.push(`meta:pickup:${pickup.toISOString()}`);
  if (setup !== undefined && setup !== null) result.push(`meta:setup:${setup}`);
  if (report) result.push(`meta:report:${encodeURIComponent(report)}`);
  if (photoBeforeUrl) result.push(`meta:photo:before:${photoBeforeUrl}`);
  if (photoAfterUrl) result.push(`meta:photo:after:${photoAfterUrl}`);
  return result;
}

let refetchTimer: ReturnType<typeof setTimeout> | null = null;

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      missions: [],
      technicians: [],
      trucks: [],
      equipment: [],
      clients: [],
      timeLogs: [],
      unavailabilities: [],
      missionPhotos: [],
      loading: true,
      syncQueue: [],

      processSyncQueue: async () => {
        const queue = get().syncQueue;
        if (queue.length === 0 || !navigator.onLine) return;

        let remainingQueue = [...queue];
        let hasErrors = false;

        for (const action of queue) {
          try {
            if (action.type === 'TOGGLE_EQUIP') {
              const { missionId, equipmentId, checked } = action.payload;
              const { error } = await supabase
                .from('mission_equipments')
                .update({ checked })
                .eq('mission_id', missionId)
                .eq('equipment_id', equipmentId);
              
              if (error) throw error;
            }
            remainingQueue = remainingQueue.filter(a => a.id !== action.id);
          } catch (e) {
            console.error('Failed to sync action', action, e);
            hasErrors = true;
            break; // Stop at first error to preserve order
          }
        }
        
        set({ syncQueue: remainingQueue });
        if (!hasErrors && queue.length > 0) {
          toast.success(`${queue.length} action(s) synchronisée(s) avec succès !`);
        }
      },

      initialize: async () => {
        if (!navigator.onLine) {
          console.log('Mode hors ligne : chargement depuis le cache local.');
          set({ loading: false });
          return;
        }
        
        try {
      const [techsRes, trucksRes, equipRes, missionsRes, clientsRes, unavailRes] = await Promise.all([
        supabase.from('technicians').select('*'),
        supabase.from('trucks').select('*'),
        supabase.from('equipments').select('*'),
        // mission_equipments(*) : tolère l'absence de la colonne `checked`
        // tant que la migration SQL n'a pas été appliquée.
        supabase
          .from('missions')
          .select('*, mission_technicians(technician_id), mission_equipments(*)')
          .returns<MissionRowWithRelations[]>(),
        supabase.from('clients').select('*').order('name'),
        supabase.from('technician_unavailabilities').select('*')
      ]);

      const technicians: Technician[] = techsRes.data?.map(t => ({
        id: t.id,
        firstName: t.first_name,
        lastName: t.last_name,
        specialty: t.specialty,
        color: t.color,
        skills: t.skills || [],
        driverLicense: t.driver_license || { hasLicense: false, since: '', categories: [] },
        checklistEnabled: !!t.driver_license?.checklistEnabled,
        avatarUrl: t.avatar_url ?? null,
      })) || [];

      const trucks: Truck[] = trucksRes.data?.map(t => ({
        id: t.id,
        name: t.name,
        plate: t.plate,
        volume: t.volume
      })) || [];

      const equipment: Equipment[] = equipRes.data?.map(e => ({
        id: e.id,
        name: e.name,
        category: e.category as EquipmentCategory,
        totalQuantity: e.total_quantity
      })) || [];

      const clients: Client[] = clientsRes.data?.map((c) => ({
        id: c.id,
        name: c.name,
        contactName: c.contact_name || undefined,
        email: c.email || undefined,
        phone: c.phone || undefined,
        address: c.address || undefined,
        notes: c.notes || undefined
      })) || [];

      const unavailabilities: TechnicianUnavailability[] = unavailRes.data?.map(u => ({
        id: u.id,
        technicianId: u.technician_id,
        start: new Date(u.start_date),
        end: new Date(u.end_date),
        type: u.type as UnavailabilityType,
        reason: u.reason || undefined,
        createdAt: new Date(u.created_at)
      })) || [];

      const missions: Mission[] = missionsRes.data?.map((m) => {
        const parsed = parseMissionSkills(m.required_skills);
        return {
          id: m.id,
          title: m.title,
          type: m.type as MissionType,
          client: m.client,
          clientId: m.client_id || undefined,
          address: m.address,
          start: new Date(m.start_date),
          end: new Date(m.end_date),
          technicianIds: m.mission_technicians?.map((mt) => mt.technician_id) || [],
          truckId: m.truck_id || undefined,
          requiredSkills: parsed.skills,
          deliveryDate: parsed.deliveryDate,
          pickupDate: parsed.pickupDate,
          setupDuration: parsed.setupDuration,
          report: parsed.report || undefined,
          photoBeforeUrl: parsed.photoBeforeUrl || undefined,
          photoAfterUrl: parsed.photoAfterUrl || undefined,
          status: m.status as MissionStatus,
          color: m.color,
          signatureUrl: m.signature_url,
          equipments: m.mission_equipments?.map((me) => ({
            equipmentId: me.equipment_id,
            quantity: me.quantity,
            checked: !!me.checked
          })) || []
        };
      }) || [];

      set({ technicians, trucks, equipment, missions, clients, unavailabilities, loading: false });

      // Realtime : un seul canal, et les rafales d'événements sont
      // regroupées en un unique re-fetch (debounce 400 ms).
      const channels = supabase.getChannels();
      const hasChannel = channels.some(c => c.topic === 'realtime:public_db_changes');

      if (!hasChannel) {
        supabase.channel('public_db_changes')
          .on('postgres_changes', { event: '*', schema: 'public' }, () => {
            if (refetchTimer) clearTimeout(refetchTimer);
            refetchTimer = setTimeout(() => get().initialize(), 400);
          })
          .subscribe();
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      set({ loading: false });
    }
  },

  addMission: async (mission) => {
    const serializedSkills = serializeMissionSkills(
      mission.requiredSkills,
      mission.deliveryDate,
      mission.pickupDate,
      mission.setupDuration
    );
    const payload: TableInsert<'missions'> = {
      title: mission.title,
      type: mission.type,
      client: mission.client,
      address: mission.address,
      start_date: mission.start.toISOString(),
      end_date: mission.end.toISOString(),
      truck_id: mission.truckId || null,
      required_skills: serializedSkills,
      status: mission.status,
      color: mission.color,
      signature_url: mission.signatureUrl
    };
    // client_id seulement si renseigné : reste compatible avec une base non migrée.
    if (mission.clientId) payload.client_id = mission.clientId;

    const { data: mData, error: mError } = await supabase.from('missions').insert(payload).select().single();

    if (reportError('Création de la mission', mError) || !mData) return;

    if (mission.technicianIds.length > 0) {
      const { error } = await supabase.from('mission_technicians').insert(
        mission.technicianIds.map(tid => ({ mission_id: mData.id, technician_id: tid }))
      );
      reportError('Affectation des techniciens', error);
    }
    if (mission.equipments.length > 0) {
      const { error } = await supabase.from('mission_equipments').insert(
        mission.equipments.map(eq => ({ mission_id: mData.id, equipment_id: eq.equipmentId, quantity: eq.quantity }))
      );
      reportError('Affectation du matériel', error);
    }
    toast.success('Mission créée.');
    get().initialize();
  },

  updateMission: async (id, updatedFields) => {
    const changes: TableUpdate<'missions'> = {};
    if (updatedFields.title !== undefined) changes.title = updatedFields.title;
    if (updatedFields.type !== undefined) changes.type = updatedFields.type;
    if (updatedFields.client !== undefined) changes.client = updatedFields.client;
    if (updatedFields.clientId !== undefined) changes.client_id = updatedFields.clientId || null;
    if (updatedFields.address !== undefined) changes.address = updatedFields.address;
    if (updatedFields.start !== undefined) changes.start_date = updatedFields.start.toISOString();
    if (updatedFields.end !== undefined) changes.end_date = updatedFields.end.toISOString();
    if (updatedFields.truckId !== undefined) changes.truck_id = updatedFields.truckId || null;
    if (updatedFields.requiredSkills !== undefined || 
        updatedFields.deliveryDate !== undefined || 
        updatedFields.pickupDate !== undefined || 
        updatedFields.setupDuration !== undefined ||
        updatedFields.report !== undefined ||
        updatedFields.photoBeforeUrl !== undefined ||
        updatedFields.photoAfterUrl !== undefined) {
      
      const existing = get().missions.find(m => m.id === id);
      const skills = updatedFields.requiredSkills !== undefined ? updatedFields.requiredSkills : existing?.requiredSkills;
      const delivery = updatedFields.deliveryDate !== undefined ? updatedFields.deliveryDate : existing?.deliveryDate;
      const pickup = updatedFields.pickupDate !== undefined ? updatedFields.pickupDate : existing?.pickupDate;
      const setup = updatedFields.setupDuration !== undefined ? updatedFields.setupDuration : existing?.setupDuration;
      const report = updatedFields.report !== undefined ? updatedFields.report : existing?.report;
      const photoBefore = updatedFields.photoBeforeUrl !== undefined ? updatedFields.photoBeforeUrl : existing?.photoBeforeUrl;
      const photoAfter = updatedFields.photoAfterUrl !== undefined ? updatedFields.photoAfterUrl : existing?.photoAfterUrl;
      
      changes.required_skills = serializeMissionSkills(skills, delivery, pickup, setup, report, photoBefore, photoAfter);
    }
    if (updatedFields.status !== undefined) changes.status = updatedFields.status;
    if (updatedFields.color !== undefined) changes.color = updatedFields.color;
    if (updatedFields.signatureUrl !== undefined) changes.signature_url = updatedFields.signatureUrl;

    if (Object.keys(changes).length > 0) {
      const { error } = await supabase.from('missions').update(changes).eq('id', id);
      if (reportError('Mise à jour de la mission', error)) return;
    }

    if (updatedFields.technicianIds !== undefined) {
      await supabase.from('mission_technicians').delete().eq('mission_id', id);
      if (updatedFields.technicianIds.length > 0) {
        const { error } = await supabase.from('mission_technicians').insert(
          updatedFields.technicianIds.map(tid => ({ mission_id: id, technician_id: tid }))
        );
        reportError('Affectation des techniciens', error);
      }
    }

    if (updatedFields.equipments !== undefined) {
      await supabase.from('mission_equipments').delete().eq('mission_id', id);
      if (updatedFields.equipments.length > 0) {
        const { error } = await supabase.from('mission_equipments').insert(
          updatedFields.equipments.map(eq => ({ mission_id: id, equipment_id: eq.equipmentId, quantity: eq.quantity }))
        );
        reportError('Affectation du matériel', error);
      }
    }
    get().initialize();
  },

  deleteMission: async (id) => {
    const { error } = await supabase.from('missions').delete().eq('id', id);
    if (reportError('Suppression de la mission', error)) return;
    toast.success('Mission supprimée.');
    get().initialize();
  },

  toggleEquipmentCheck: async (missionId, equipmentId, checked) => {
    // Mise à jour optimiste : l'UI réagit immédiatement
    set(state => ({
      missions: state.missions.map(m =>
        m.id === missionId
          ? { ...m, equipments: m.equipments.map(e => e.equipmentId === equipmentId ? { ...e, checked } : e) }
          : m
      )
    }));

    if (!navigator.onLine) {
      set(state => ({
        syncQueue: [...state.syncQueue, { id: Date.now().toString(), type: 'TOGGLE_EQUIP', payload: { missionId, equipmentId, checked } }]
      }));
      toast.success("Mode hors ligne : pointage mis en attente.");
      return;
    }

    const { error } = await supabase
      .from('mission_equipments')
      .update({ checked })
      .eq('mission_id', missionId)
      .eq('equipment_id', equipmentId);

    if (error) {
      if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('Failed to fetch')) {
        set(state => ({
          syncQueue: [...state.syncQueue, { id: Date.now().toString(), type: 'TOGGLE_EQUIP', payload: { missionId, equipmentId, checked } }]
        }));
        toast.success("Réseau instable : pointage mis en attente.");
      } else {
        console.error('toggleEquipmentCheck', error);
        toast.error("Pointage non enregistré (erreur serveur).");
      }
    }
  },

  addTechnician: async (tech) => {
    const { error } = await supabase.from('technicians').insert({
      first_name: tech.firstName,
      last_name: tech.lastName,
      specialty: tech.specialty,
      color: tech.color,
      driver_license: { checklistEnabled: tech.checklistEnabled || false }
    });
    if (reportError('Création du technicien', error)) return;
    toast.success('Technicien ajouté.');
    get().initialize();
  },

  updateTechnician: async (id, updatedFields) => {
    const changes: TableUpdate<'technicians'> = {};
    if (updatedFields.firstName !== undefined) changes.first_name = updatedFields.firstName;
    if (updatedFields.lastName !== undefined) changes.last_name = updatedFields.lastName;
    if (updatedFields.specialty !== undefined) changes.specialty = updatedFields.specialty;
    if (updatedFields.color !== undefined) changes.color = updatedFields.color;
    if (updatedFields.skills !== undefined) changes.skills = updatedFields.skills;
    if (updatedFields.driverLicense !== undefined) changes.driver_license = updatedFields.driverLicense;
    if (updatedFields.checklistEnabled !== undefined) {
      const tech = get().technicians.find(t => t.id === id);
      const baseLicense = updatedFields.driverLicense !== undefined 
        ? updatedFields.driverLicense 
        : (tech?.driverLicense || { hasLicense: false });
      changes.driver_license = {
        ...baseLicense,
        checklistEnabled: updatedFields.checklistEnabled
      };
    } else if (updatedFields.driverLicense !== undefined) {
      const tech = get().technicians.find(t => t.id === id);
      const currentChecklist = tech?.checklistEnabled ?? false;
      changes.driver_license = {
        ...updatedFields.driverLicense,
        checklistEnabled: currentChecklist
      };
    }

    if (Object.keys(changes).length > 0) {
      const { error } = await supabase.from('technicians').update(changes).eq('id', id);
      if (reportError('Mise à jour du technicien', error)) return;
      toast.success('Technicien mis à jour.');
      get().initialize();
    }
  },

  deleteTechnician: async (id) => {
    const { error } = await supabase.from('technicians').delete().eq('id', id);
    if (reportError('Suppression du technicien', error)) return;
    toast.success('Technicien supprimé.');
    get().initialize();
  },

  addUnavailability: async (u) => {
    const { error } = await supabase.from('technician_unavailabilities').insert({
      technician_id: u.technicianId,
      start_date: u.start.toISOString(),
      end_date: u.end.toISOString(),
      type: u.type,
      reason: u.reason || null
    });
    if (reportError('Ajout de l\'indisponibilité', error)) return;
    toast.success('Indisponibilité ajoutée.');
    get().initialize();
  },

  deleteUnavailability: async (id) => {
    const { error } = await supabase.from('technician_unavailabilities').delete().eq('id', id);
    if (reportError('Suppression de l\'indisponibilité', error)) return;
    toast.success('Indisponibilité supprimée.');
    get().initialize();
  },

  addTruck: async (truck) => {
    const { error } = await supabase.from('trucks').insert({
      name: truck.name,
      plate: truck.plate,
      volume: truck.volume
    });
    if (reportError('Création du camion', error)) return;
    toast.success('Camion ajouté.');
    get().initialize();
  },

  updateTruck: async (id, updatedFields) => {
    const changes: TableUpdate<'trucks'> = {};
    if (updatedFields.name !== undefined) changes.name = updatedFields.name;
    if (updatedFields.plate !== undefined) changes.plate = updatedFields.plate;
    if (updatedFields.volume !== undefined) changes.volume = updatedFields.volume;

    if (Object.keys(changes).length > 0) {
      const { error } = await supabase.from('trucks').update(changes).eq('id', id);
      if (reportError('Mise à jour du camion', error)) return;
      toast.success('Camion mis à jour.');
      get().initialize();
    }
  },

  deleteTruck: async (id) => {
    const { error } = await supabase.from('trucks').delete().eq('id', id);
    if (reportError('Suppression du camion', error)) return;
    toast.success('Camion supprimé.');
    get().initialize();
  },

  addEquipment: async (item) => {
    const { error } = await supabase.from('equipments').insert({
      name: item.name,
      category: item.category,
      total_quantity: item.totalQuantity
    });
    if (reportError('Création du matériel', error)) return;
    toast.success('Matériel ajouté.');
    get().initialize();
  },

  updateEquipment: async (id, updatedFields) => {
    const changes: TableUpdate<'equipments'> = {};
    if (updatedFields.name !== undefined) changes.name = updatedFields.name;
    if (updatedFields.category !== undefined) changes.category = updatedFields.category;
    if (updatedFields.totalQuantity !== undefined) changes.total_quantity = updatedFields.totalQuantity;

    if (Object.keys(changes).length > 0) {
      const { error } = await supabase.from('equipments').update(changes).eq('id', id);
      if (reportError('Mise à jour du matériel', error)) return;
      toast.success('Matériel mis à jour.');
      get().initialize();
    }
  },

  deleteEquipment: async (id) => {
    const { error } = await supabase.from('equipments').delete().eq('id', id);
    if (reportError('Suppression du matériel', error)) return;
    toast.success('Matériel supprimé.');
    get().initialize();
  },

  importEquipment: async (items) => {
    const payload = items.map(item => {
      const obj: any = {
        name: item.name,
        category: item.category,
        total_quantity: item.totalQuantity
      };
      if (item.id) {
        obj.id = item.id;
      }
      return obj;
    });

    const { error } = await supabase.from('equipments').upsert(payload);
    if (reportError('Importation du matériel', error)) return;
    toast.success(`${items.length} matériel(s) importé(s) avec succès.`);
    get().initialize();
  },

  addClient: async (client) => {
    const { error } = await supabase.from('clients').insert({
      name: client.name,
      contact_name: client.contactName || null,
      email: client.email || null,
      phone: client.phone || null,
      address: client.address || null,
      notes: client.notes || null
    });
    if (reportError('Création du client', error)) return;
    toast.success('Client créé.');
    get().initialize();
  },

  updateClient: async (id, updatedFields) => {
    const changes: TableUpdate<'clients'> = {};
    if (updatedFields.name !== undefined) changes.name = updatedFields.name;
    if (updatedFields.contactName !== undefined) changes.contact_name = updatedFields.contactName || null;
    if (updatedFields.email !== undefined) changes.email = updatedFields.email || null;
    if (updatedFields.phone !== undefined) changes.phone = updatedFields.phone || null;
    if (updatedFields.address !== undefined) changes.address = updatedFields.address || null;
    if (updatedFields.notes !== undefined) changes.notes = updatedFields.notes || null;

    if (Object.keys(changes).length > 0) {
      const { error } = await supabase.from('clients').update(changes).eq('id', id);
      if (reportError('Mise à jour du client', error)) return;
      toast.success('Client mis à jour.');
      get().initialize();
    }
  },

  deleteClient: async (id) => {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (reportError('Suppression du client', error)) return;
    toast.success('Client supprimé.');
    get().initialize();
  },

  // ── TIME LOGS ──────────────────────────────────────────────
  fetchTimeLogs: async (missionId?: string) => {
    let query = supabase
      .from('mission_time_logs')
      .select('*')
      .order('start_time', { ascending: false });

    if (missionId) query = query.eq('mission_id', missionId) as typeof query;

    const { data, error } = await query;
    if (reportError('Chargement des heures', error) || !data) return;

    const logs: TimeLog[] = data.map((r) => ({
      id: r.id,
      missionId: r.mission_id,
      technicianId: r.technician_id,
      startTime: new Date(r.start_time),
      endTime: r.end_time ? new Date(r.end_time) : null,
      note: r.note || undefined,
      createdAt: new Date(r.created_at),
      updatedAt: new Date(r.updated_at),
    }));

    set({ timeLogs: logs });
  },

  addTimeLog: async (log) => {
    const { data, error } = await supabase
      .from('mission_time_logs')
      .insert({
        mission_id: log.missionId,
        technician_id: log.technicianId,
        start_time: log.startTime.toISOString(),
        end_time: log.endTime ? log.endTime.toISOString() : null,
        note: log.note || null,
      })
      .select()
      .single();

    if (reportError('Enregistrement des heures', error) || !data) return null;

    const newLog: TimeLog = {
      id: data.id,
      missionId: data.mission_id,
      technicianId: data.technician_id,
      startTime: new Date(data.start_time),
      endTime: data.end_time ? new Date(data.end_time) : null,
      note: data.note || undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };

    set((state) => ({ timeLogs: [newLog, ...state.timeLogs] }));
    toast.success('Heures enregistrées.');
    return newLog;
  },

  updateTimeLog: async (id, fields) => {
    const changes: TableUpdate<'mission_time_logs'> = {};
    if (fields.startTime !== undefined) changes.start_time = fields.startTime.toISOString();
    if (fields.endTime !== undefined) changes.end_time = fields.endTime ? fields.endTime.toISOString() : null;
    if (fields.note !== undefined) changes.note = fields.note || null;

    const { error } = await supabase.from('mission_time_logs').update(changes).eq('id', id);
    if (reportError('Mise à jour des heures', error)) return;

    set((state) => ({
      timeLogs: state.timeLogs.map((l) =>
        l.id === id
          ? {
              ...l,
              ...(fields.startTime !== undefined && { startTime: fields.startTime }),
              ...(fields.endTime !== undefined && { endTime: fields.endTime }),
              ...(fields.note !== undefined && { note: fields.note }),
            }
          : l
      ),
    }));
    toast.success('Heures mises à jour.');
  },

  deleteTimeLog: async (id) => {
    const { error } = await supabase.from('mission_time_logs').delete().eq('id', id);
    if (reportError('Suppression du créneau', error)) return;
    set((state) => ({ timeLogs: state.timeLogs.filter((l) => l.id !== id) }));
    toast.success('Créneau supprimé.');
  },

  // ── MISSION PHOTOS ─────────────────────────────────────────
  fetchMissionPhotos: async (missionId) => {
    const { data, error } = await supabase
      .from('mission_photos')
      .select('*')
      .eq('mission_id', missionId)
      .order('created_at', { ascending: true });

    if (reportError('Chargement des photos', error) || !data) return [];

    const photos: MissionPhoto[] = data.map((r) => ({
      id: r.id,
      missionId: r.mission_id,
      type: r.type as 'before' | 'after',
      url: r.url,
      filePath: r.file_path,
      uploadedBy: r.uploaded_by,
      createdAt: new Date(r.created_at),
    }));

    // Merge into the matching mission in state
    set((state) => ({
      missions: state.missions.map((m) =>
        m.id === missionId ? { ...m, photos } : m
      ),
      missionPhotos: [
        ...state.missionPhotos.filter((p) => p.missionId !== missionId),
        ...photos,
      ],
    }));

    return photos;
  },

  addMissionPhoto: async (missionId, type, file, uploadedBy) => {
    // 1. Compress
    const compressedBlob = await new Promise<Blob>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1920;
          let { width, height } = img;
          if (width > MAX_WIDTH) { height = Math.round((height * MAX_WIDTH) / width); width = MAX_WIDTH; }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) { reject(new Error('canvas context')); return; }
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('toBlob')), 'image/jpeg', 0.82);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });

    // 2. Upload to storage bucket
    const filePath = `${missionId}/${type}/${Date.now()}.jpg`;
    const { data: storageData, error: storageErr } = await supabase.storage
      .from('mission-photos')
      .upload(filePath, compressedBlob, { contentType: 'image/jpeg', cacheControl: '3600', upsert: false });

    if (storageErr) {
      reportError('Upload photo', storageErr);
      return null;
    }

    const { data: urlData } = supabase.storage.from('mission-photos').getPublicUrl(storageData.path);
    const publicUrl = urlData.publicUrl;

    // 3. Insert row in mission_photos table
    const { data, error } = await supabase
      .from('mission_photos')
      .insert({ mission_id: missionId, type, url: publicUrl, file_path: filePath, uploaded_by: uploadedBy || null })
      .select()
      .single();

    if (reportError('Enregistrement de la photo', error) || !data) return null;

    const photo: MissionPhoto = {
      id: data.id,
      missionId: data.mission_id,
      type: data.type as 'before' | 'after',
      url: data.url,
      filePath: data.file_path,
      uploadedBy: data.uploaded_by,
      createdAt: new Date(data.created_at),
    };

    set((state) => ({
      missions: state.missions.map((m) =>
        m.id === missionId
          ? { ...m, photos: [...(m.photos || []), photo] }
          : m
      ),
      missionPhotos: [...state.missionPhotos, photo],
    }));

    toast.success(`Photo ${type === 'before' ? 'avant' : 'après'} ajoutée.`);
    return photo;
  },

  deleteMissionPhoto: async (photo) => {
    // 1. Remove from storage
    await supabase.storage.from('mission-photos').remove([photo.filePath]);

    // 2. Remove row from table
    const { error } = await supabase.from('mission_photos').delete().eq('id', photo.id);
    if (reportError('Suppression de la photo', error)) return;

    set((state) => ({
      missions: state.missions.map((m) =>
        m.id === photo.missionId
          ? { ...m, photos: (m.photos || []).filter((p) => p.id !== photo.id) }
          : m
      ),
      missionPhotos: state.missionPhotos.filter((p) => p.id !== photo.id),
    }));

    toast.success('Photo supprimée.');
  },
  }),
  {
    name: 'eventplanner-storage',
    partialize: (state) => ({
      missions: state.missions,
      technicians: state.technicians,
      trucks: state.trucks,
      equipment: state.equipment,
      clients: state.clients,
      syncQueue: state.syncQueue,
      timeLogs: state.timeLogs,
      unavailabilities: state.unavailabilities,
      missionPhotos: state.missionPhotos,
    }),
  }
));

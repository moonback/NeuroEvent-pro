import { create } from 'zustand';
import { Mission, Technician, Truck, Equipment, MissionType, MissionStatus, EquipmentCategory } from '../types';
import { supabase } from '../lib/supabase';

interface AppState {
  missions: Mission[];
  technicians: Technician[];
  trucks: Truck[];
  equipment: Equipment[];
  
  loading: boolean;
  
  initialize: () => Promise<void>;
  
  addMission: (mission: Omit<Mission, 'id'>) => Promise<void>;
  updateMission: (id: string, mission: Partial<Mission>) => Promise<void>;
  deleteMission: (id: string) => Promise<void>;

  addTechnician: (tech: Omit<Technician, 'id'>) => Promise<void>;
  updateTechnician: (id: string, tech: Partial<Technician>) => Promise<void>;
  deleteTechnician: (id: string) => Promise<void>;

  addTruck: (truck: Omit<Truck, 'id'>) => Promise<void>;
  updateTruck: (id: string, truck: Partial<Truck>) => Promise<void>;
  deleteTruck: (id: string) => Promise<void>;

  addEquipment: (item: Omit<Equipment, 'id'>) => Promise<void>;
  updateEquipment: (id: string, item: Partial<Equipment>) => Promise<void>;
  deleteEquipment: (id: string) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  missions: [],
  technicians: [],
  trucks: [],
  equipment: [],
  loading: true,

  initialize: async () => {
    try {
      const [techsRes, trucksRes, equipRes, missionsRes] = await Promise.all([
        supabase.from('technicians').select('*'),
        supabase.from('trucks').select('*'),
        supabase.from('equipments').select('*'),
        supabase.from('missions').select('*, mission_technicians(technician_id), mission_equipments(equipment_id, quantity)')
      ]);

      const technicians: Technician[] = techsRes.data?.map(t => ({
        id: t.id,
        firstName: t.first_name,
        lastName: t.last_name,
        specialty: t.specialty,
        color: t.color
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

      const missions: Mission[] = missionsRes.data?.map((m: any) => ({
        id: m.id,
        title: m.title,
        type: m.type as MissionType,
        client: m.client,
        address: m.address,
        start: new Date(m.start_date),
        end: new Date(m.end_date),
        technicianIds: m.mission_technicians?.map((mt: any) => mt.technician_id) || [],
        truckId: m.truck_id || undefined,
        status: m.status as MissionStatus,
        color: m.color,
        equipments: m.mission_equipments?.map((me: any) => ({
          equipmentId: me.equipment_id,
          quantity: me.quantity
        })) || []
      })) || [];

      set({ technicians, trucks, equipment, missions, loading: false });

      // Realtime subscriptions
      const channels = supabase.getChannels();
      const hasChannel = channels.some(c => c.topic === 'realtime:public_db_changes');

      if (!hasChannel) {
        supabase.channel('public_db_changes')
          .on('postgres_changes', { event: '*', schema: 'public' }, () => {
            // Re-fetch data on any change
            get().initialize();
          })
          .subscribe();
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      set({ loading: false });
    }
  },

  addMission: async (mission) => {
    const { data: mData, error: mError } = await supabase.from('missions').insert({
      title: mission.title,
      type: mission.type,
      client: mission.client,
      address: mission.address,
      start_date: mission.start.toISOString(),
      end_date: mission.end.toISOString(),
      truck_id: mission.truckId || null,
      status: mission.status,
      color: mission.color
    }).select().single();

    if (mError || !mData) return;

    if (mission.technicianIds.length > 0) {
      await supabase.from('mission_technicians').insert(
        mission.technicianIds.map(tid => ({ mission_id: mData.id, technician_id: tid }))
      );
    }
    if (mission.equipments.length > 0) {
      await supabase.from('mission_equipments').insert(
        mission.equipments.map(eq => ({ mission_id: mData.id, equipment_id: eq.equipmentId, quantity: eq.quantity }))
      );
    }
    get().initialize();
  },

  updateMission: async (id, updatedFields) => {
    const changes: any = {};
    if (updatedFields.title !== undefined) changes.title = updatedFields.title;
    if (updatedFields.type !== undefined) changes.type = updatedFields.type;
    if (updatedFields.client !== undefined) changes.client = updatedFields.client;
    if (updatedFields.address !== undefined) changes.address = updatedFields.address;
    if (updatedFields.start !== undefined) changes.start_date = updatedFields.start.toISOString();
    if (updatedFields.end !== undefined) changes.end_date = updatedFields.end.toISOString();
    if (updatedFields.truckId !== undefined) changes.truck_id = updatedFields.truckId || null;
    if (updatedFields.status !== undefined) changes.status = updatedFields.status;
    if (updatedFields.color !== undefined) changes.color = updatedFields.color;

    if (Object.keys(changes).length > 0) {
      await supabase.from('missions').update(changes).eq('id', id);
    }

    if (updatedFields.technicianIds !== undefined) {
      await supabase.from('mission_technicians').delete().eq('mission_id', id);
      if (updatedFields.technicianIds.length > 0) {
        await supabase.from('mission_technicians').insert(
          updatedFields.technicianIds.map(tid => ({ mission_id: id, technician_id: tid }))
        );
      }
    }

    if (updatedFields.equipments !== undefined) {
      await supabase.from('mission_equipments').delete().eq('mission_id', id);
      if (updatedFields.equipments.length > 0) {
        await supabase.from('mission_equipments').insert(
          updatedFields.equipments.map(eq => ({ mission_id: id, equipment_id: eq.equipmentId, quantity: eq.quantity }))
        );
      }
    }
    get().initialize();
  },

  deleteMission: async (id) => {
    await supabase.from('missions').delete().eq('id', id);
    get().initialize();
  },

  addTechnician: async (tech) => {
    await supabase.from('technicians').insert({
      first_name: tech.firstName,
      last_name: tech.lastName,
      specialty: tech.specialty,
      color: tech.color
    });
    get().initialize();
  },

  updateTechnician: async (id, updatedFields) => {
    const changes: any = {};
    if (updatedFields.firstName !== undefined) changes.first_name = updatedFields.firstName;
    if (updatedFields.lastName !== undefined) changes.last_name = updatedFields.lastName;
    if (updatedFields.specialty !== undefined) changes.specialty = updatedFields.specialty;
    if (updatedFields.color !== undefined) changes.color = updatedFields.color;
    
    if (Object.keys(changes).length > 0) {
      await supabase.from('technicians').update(changes).eq('id', id);
      get().initialize();
    }
  },

  deleteTechnician: async (id) => {
    await supabase.from('technicians').delete().eq('id', id);
    get().initialize();
  },

  addTruck: async (truck) => {
    await supabase.from('trucks').insert({
      name: truck.name,
      plate: truck.plate,
      volume: truck.volume
    });
    get().initialize();
  },

  updateTruck: async (id, updatedFields) => {
    await supabase.from('trucks').update(updatedFields).eq('id', id);
    get().initialize();
  },

  deleteTruck: async (id) => {
    await supabase.from('trucks').delete().eq('id', id);
    get().initialize();
  },

  addEquipment: async (item) => {
    await supabase.from('equipments').insert({
      name: item.name,
      category: item.category,
      total_quantity: item.totalQuantity
    });
    get().initialize();
  },

  updateEquipment: async (id, updatedFields) => {
    const changes: any = {};
    if (updatedFields.name !== undefined) changes.name = updatedFields.name;
    if (updatedFields.category !== undefined) changes.category = updatedFields.category;
    if (updatedFields.totalQuantity !== undefined) changes.total_quantity = updatedFields.totalQuantity;
    
    if (Object.keys(changes).length > 0) {
      await supabase.from('equipments').update(changes).eq('id', id);
      get().initialize();
    }
  },

  deleteEquipment: async (id) => {
    await supabase.from('equipments').delete().eq('id', id);
    get().initialize();
  }
}));

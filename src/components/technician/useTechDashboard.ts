import React from 'react';
import { useStore } from '../../store';
import { useAuthStore } from '../../store/auth';
import { toast } from '../../store/toast';
import { isSameDay, startOfWeek, endOfWeek } from 'date-fns';

export type MainTab = 'active' | 'history' | 'mes_heures' | 'disponibilites' | 'profil';
export type DrawerTab = 'general' | 'client' | 'team' | 'equipment' | 'report' | 'hours' | 'checklist';
export type DateFilter = 'all' | 'today' | 'week';
export type StatusFilter = 'all' | 'Planifiée' | 'En cours';

export const DRAWER_TABS: DrawerTab[] = ['general', 'client', 'team', 'equipment', 'hours', 'checklist', 'report'];

export interface TimeModalState {
  type: 'start' | 'end';
  targetStatus: 'En cours' | 'Terminée';
  time: string;
  loading: boolean;
}

/** Centralized haptic feedback */
export function triggerVibrate(type: 'click' | 'success' | 'double' | 'error') {
  if (!('vibrate' in navigator)) return;
  switch (type) {
    case 'click':   navigator.vibrate(12); break;
    case 'success': navigator.vibrate(30); break;
    case 'double':  navigator.vibrate([30, 45, 30]); break;
    case 'error':   navigator.vibrate([100, 50, 100]); break;
  }
}

export function useTechDashboard() {
  const user = useAuthStore(state => state.user);
  const signOut = useAuthStore(state => state.signOut);

  const missions = useStore(state => state.missions);
  const updateMission = useStore(state => state.updateMission);
  const toggleEquipmentCheck = useStore(state => state.toggleEquipmentCheck);
  const trucks = useStore(state => state.trucks);
  const technicians = useStore(state => state.technicians);
  const equipmentDefs = useStore(state => state.equipment);
  const clients = useStore(state => state.clients);
  const addTimeLog = useStore(state => state.addTimeLog);
  const timeLogs = useStore(state => state.timeLogs);
  const updateTimeLog = useStore(state => state.updateTimeLog);
  const syncQueue = useStore(state => state.syncQueue);
  const processSyncQueue = useStore(state => state.processSyncQueue);

  // ── UI State ──
  const [activeTab, setActiveTab] = React.useState<MainTab>('active');
  const [scannerOpen, setScannerOpen] = React.useState(false);
  const [activeMissionIdForScanner, setActiveMissionIdForScanner] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [dateFilter, setDateFilter] = React.useState<DateFilter>('all');
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all');
  const [selectedMission, setSelectedMission] = React.useState<typeof missions[0] | null>(null);
  const [drawerTab, setDrawerTab] = React.useState<DrawerTab>('general');
  const [scannedItemId, setScannedItemId] = React.useState<string | null>(null);
  const [signatureModalOpen, setSignatureModalOpen] = React.useState(false);
  const [localReports, setLocalReports] = React.useState<Record<string, string>>({});
  const [savingStatus, setSavingStatus] = React.useState<'idle' | 'saving' | 'saved'>('idle');
  const [timeModal, setTimeModal] = React.useState<TimeModalState | null>(null);
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  // ── Drag / Swipe gestures ──
  const [dragOffsetY, setDragOffsetY] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const dragStartY = React.useRef(0);
  const swipeStartX = React.useRef(0);
  const swipeStartY = React.useRef(0);

  // ── Network sync ──
  React.useEffect(() => {
    const handleOnline = () => { setIsOnline(true); processSyncQueue(); };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    if (navigator.onLine && syncQueue.length > 0) processSyncQueue();
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [processSyncQueue, syncQueue.length]);

  // ── Local reports persistence ──
  React.useEffect(() => {
    if (user?.id) {
      const saved = localStorage.getItem(`eventflow_reports_${user.id}`);
      if (saved) {
        try { setLocalReports(JSON.parse(saved)); } catch {}
      }
    }
  }, [user?.id]);

  // ── Handlers ──
  const handleReportChange = (missionId: string, value: string) => {
    setSavingStatus('saving');
    const updated = { ...localReports, [missionId]: value };
    setLocalReports(updated);
    if (user?.id) localStorage.setItem(`eventflow_reports_${user.id}`, JSON.stringify(updated));
    setTimeout(() => { setSavingStatus('saved'); setTimeout(() => setSavingStatus('idle'), 1000); }, 500);
  };

  const handleScan = (decodedText: string) => {
    const missionId = activeMissionIdForScanner || selectedMission?.id;
    if (!missionId) return;
    const mission = missions.find(m => m.id === missionId);
    const item = mission?.equipments.find(e => e.equipmentId === decodedText);
    if (!item) {
      triggerVibrate('error');
      toast.error('Ce QR code ne correspond à aucun matériel de cette mission.');
      return;
    }
    toggleEquipmentCheck(missionId, decodedText, true);
    triggerVibrate('double');
    setScannedItemId(decodedText);
    setTimeout(() => setScannedItemId(null), 1500);
    const def = equipmentDefs.find(e => e.id === decodedText);
    toast.success(`${def?.name || 'Matériel'} pointé.`);
    if (selectedMission?.id === missionId) {
      setSelectedMission(prev => prev ? {
        ...prev,
        equipments: prev.equipments.map(e => e.equipmentId === decodedText ? { ...e, checked: true } : e)
      } : null);
    }
  };

  const handleToggle = (missionId: string, equipmentId: string) => {
    const mission = missions.find(m => m.id === missionId);
    const current = mission?.equipments.find(e => e.equipmentId === equipmentId)?.checked ?? false;
    const nextVal = !current;
    toggleEquipmentCheck(missionId, equipmentId, nextVal);
    triggerVibrate(nextVal ? 'success' : 'click');
    if (selectedMission?.id === missionId) {
      setSelectedMission(prev => prev ? {
        ...prev,
        equipments: prev.equipments.map(e => e.equipmentId === equipmentId ? { ...e, checked: nextVal } : e)
      } : null);
    }
  };

  const handleStatusChange = (newStatus: 'Planifiée' | 'En cours' | 'Terminée') => {
    if (!selectedMission || selectedMission.status === newStatus) return;
    if (selectedMission.status === 'Terminée') {
      triggerVibrate('error');
      toast.error("Impossible de modifier le statut d'une mission terminée.");
      return;
    }
    triggerVibrate('double');
    const pad = (n: number) => String(n).padStart(2, '0');
    const now = new Date();
    const defaultTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    if (newStatus === 'En cours') {
      setTimeModal({ type: 'start', targetStatus: 'En cours', time: defaultTime, loading: false });
      return;
    }
    if (newStatus === 'Terminée') {
      setTimeModal({ type: 'end', targetStatus: 'Terminée', time: defaultTime, loading: false });
      return;
    }
    setSelectedMission({ ...selectedMission, status: newStatus });
    updateMission(selectedMission.id, { status: newStatus });
    toast.success(`Statut mis à jour : ${newStatus}`);
  };

  const handleTimeModalConfirm = async () => {
    if (!timeModal || !selectedMission || !user?.id) return;
    setTimeModal(prev => prev ? { ...prev, loading: true } : null);
    const [h, m] = timeModal.time.split(':').map(Number);
    const logTime = new Date();
    logTime.setHours(h, m, 0, 0);
    try {
      if (timeModal.type === 'start') {
        await addTimeLog({ missionId: selectedMission.id, technicianId: user.id, startTime: logTime, endTime: null });
      } else {
        const openLog = timeLogs.find(
          l => l.missionId === selectedMission.id && l.technicianId === user.id && !l.endTime
        );
        if (openLog) {
          await updateTimeLog(openLog.id, { endTime: logTime });
        } else {
          const start = new Date(logTime);
          start.setHours(start.getHours() - 1);
          await addTimeLog({ missionId: selectedMission.id, technicianId: user.id, startTime: start, endTime: logTime });
        }
      }
      const newStatus = timeModal.targetStatus;
      setSelectedMission(prev => prev ? { ...prev, status: newStatus } : null);
      await updateMission(selectedMission.id, { status: newStatus });
      toast.success(`Statut mis à jour : ${newStatus}`);
    } finally {
      setTimeModal(null);
    }
  };

  const handleTimeChange = async (field: 'start' | 'end', newTimeString: string) => {
    if (!selectedMission || !newTimeString) return;
    const [hours, minutes] = newTimeString.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return;
    const newDate = new Date(selectedMission[field]);
    newDate.setHours(hours, minutes, 0, 0);
    setSelectedMission({ ...selectedMission, [field]: newDate });
    await updateMission(selectedMission.id, { [field]: newDate });
    toast.success(`Heure de ${field === 'start' ? 'début' : 'fin'} mise à jour`);
  };

  // ── Helpers ──
  const getTruckName = (truckId?: string) => {
    if (!truckId) return 'Aucun camion';
    const truck = trucks.find(t => t.id === truckId);
    return truck ? `${truck.name} (${truck.plate})` : 'Camion inconnu';
  };

  const getColleagues = (techIds: string[]) =>
    techIds.filter(id => id !== user?.id).map(id => {
      const tech = technicians.find(t => t.id === id);
      return tech ? `${tech.firstName} ${tech.lastName}` : 'Inconnu';
    });

  const getColleaguesDetailed = (techIds: string[]) =>
    techIds.map(id => {
      const tech = technicians.find(t => t.id === id);
      return tech ? { id: tech.id, name: `${tech.firstName} ${tech.lastName}`, specialty: tech.specialty, color: tech.color, isSelf: tech.id === user?.id } : null;
    }).filter((t): t is NonNullable<typeof t> => t !== null);

  const getClientInfo = (clientId?: string) => {
    if (!clientId) return null;
    return clients.find(c => c.id === clientId) || null;
  };

  const getEquipmentProgress = (eqs: typeof missions[0]['equipments']) => {
    if (!eqs || eqs.length === 0) return { total: 0, pointed: 0, percent: 0 };
    const total = eqs.length;
    const pointed = eqs.filter(e => e.checked).length;
    return { total, pointed, percent: Math.round((pointed / total) * 100) };
  };

  // ── Drag gestures ──
  const handleDragStart = (e: React.TouchEvent) => { setIsDragging(true); dragStartY.current = e.touches[0].clientY; };
  const handleDragMove = (e: React.TouchEvent) => { if (!isDragging) return; const d = e.touches[0].clientY - dragStartY.current; if (d > 0) setDragOffsetY(d); };
  const handleDragEnd = () => { setIsDragging(false); if (dragOffsetY > 140) { triggerVibrate('click'); setSelectedMission(null); } setDragOffsetY(0); };

  // ── Swipe horizontal ──
  const currentTech = technicians.find(t => t.id === user?.id);
  const activeDrawerTabs = DRAWER_TABS.filter(t => t !== 'checklist' || currentTech?.checklistEnabled);

  const handleContentTouchStart = (e: React.TouchEvent) => { swipeStartX.current = e.touches[0].clientX; swipeStartY.current = e.touches[0].clientY; };
  const handleContentTouchEnd = (e: React.TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - swipeStartX.current;
    const deltaY = e.changedTouches[0].clientY - swipeStartY.current;
    if (Math.abs(deltaX) > 70 && Math.abs(deltaY) < 50) {
      const currentIndex = activeDrawerTabs.indexOf(drawerTab);
      if (deltaX > 0 && currentIndex > 0) { setDrawerTab(activeDrawerTabs[currentIndex - 1]); triggerVibrate('click'); }
      else if (deltaX < 0 && currentIndex < activeDrawerTabs.length - 1) { setDrawerTab(activeDrawerTabs[currentIndex + 1]); triggerVibrate('click'); }
    }
  };

  // ── Filtered missions ──
  const myMissions = missions.filter(m => m.technicianIds.includes(user?.id || '')).sort((a, b) => a.start.getTime() - b.start.getTime());

  const displayedMissions = myMissions.filter(m => {
    const isHistory = m.status === 'Terminée';
    if (activeTab === 'active' && isHistory) return false;
    if (activeTab === 'history' && !isHistory) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!m.title.toLowerCase().includes(term) && !m.client.toLowerCase().includes(term) && !m.address.toLowerCase().includes(term)) return false;
    }
    const now = new Date();
    if (dateFilter === 'today') {
      if (!isSameDay(m.start, now) && !isSameDay(m.end, now)) {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const endOfDay = startOfDay + 86400000 - 1;
        if (Math.max(m.start.getTime(), startOfDay) > Math.min(m.end.getTime(), endOfDay)) return false;
      }
    } else if (dateFilter === 'week') {
      const ws = startOfWeek(now, { weekStartsOn: 1 });
      const we = endOfWeek(now, { weekStartsOn: 1 });
      if (Math.max(m.start.getTime(), ws.getTime()) > Math.min(m.end.getTime(), we.getTime())) return false;
    }
    if (activeTab === 'active' && statusFilter !== 'all' && m.status !== statusFilter) return false;
    return true;
  });

  const openMissionDetails = (mission: typeof missions[0]) => {
    triggerVibrate('click');
    setSelectedMission(mission);
    setDrawerTab('general');
  };

  // ── Stats ──
  const todayCount = myMissions.filter(m => isSameDay(m.start, new Date()) && m.status !== 'Terminée').length;
  const activeCount = myMissions.filter(m => m.status === 'En cours').length;

  return {
    // Auth
    user, signOut,
    // Data
    missions, trucks, technicians, equipmentDefs, clients, timeLogs,
    // UI State
    activeTab, setActiveTab,
    searchTerm, setSearchTerm,
    dateFilter, setDateFilter,
    statusFilter, setStatusFilter,
    selectedMission, setSelectedMission,
    drawerTab, setDrawerTab,
    scannerOpen, setScannerOpen,
    activeMissionIdForScanner, setActiveMissionIdForScanner,
    scannedItemId,
    signatureModalOpen, setSignatureModalOpen,
    localReports, savingStatus,
    timeModal, setTimeModal,
    isOnline, syncQueue,
    // Drag / Swipe
    dragOffsetY, isDragging,
    handleDragStart, handleDragMove, handleDragEnd,
    handleContentTouchStart, handleContentTouchEnd,
    // Handlers
    handleScan, handleToggle, handleStatusChange, handleTimeModalConfirm, handleTimeChange,
    handleReportChange,
    openMissionDetails,
    updateMission,
    // Helpers
    getTruckName, getColleagues, getColleaguesDetailed, getClientInfo, getEquipmentProgress,
    // Computed
    displayedMissions, todayCount, activeCount,
  };
}

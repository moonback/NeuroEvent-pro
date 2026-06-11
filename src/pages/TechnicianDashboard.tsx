import React from 'react';
import { useStore } from '../store';
import { useAuthStore } from '../store/auth';
import { 
  Calendar, 
  MapPin, 
  Truck as TruckIcon, 
  Users, 
  CheckCircle, 
  Clock, 
  LogOut, 
  Settings as SettingsIcon, 
  Check, 
  QrCode, 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  MessageSquare, 
  Navigation, 
  FileText, 
  Info, 
  ChevronRight, 
  X, 
  AlertCircle,
  AlertTriangle,
  Play,
  Timer
} from 'lucide-react';
import { format, isSameDay, startOfWeek, endOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { QRScannerModal } from '../components/QRScannerModal';
import { toast } from '../store/toast';
import TimeLogPanel from '../components/TimeLogPanel';

export default function TechnicianDashboard() {
  const user = useAuthStore(state => state.user);
  const signOut = useAuthStore(state => state.signOut);
  
  const missions = useStore(state => state.missions);
  const updateMission = useStore(state => state.updateMission);
  const toggleEquipmentCheck = useStore(state => state.toggleEquipmentCheck);
  const trucks = useStore(state => state.trucks);
  const technicians = useStore(state => state.technicians);
  const equipmentDefs = useStore(state => state.equipment);
  const clients = useStore(state => state.clients);

  const [activeTab, setActiveTab] = React.useState<'active' | 'history'>('active');
  const [scannerOpen, setScannerOpen] = React.useState(false);
  const [activeMissionIdForScanner, setActiveMissionIdForScanner] = React.useState<string | null>(null);
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = React.useState('');
  const [dateFilter, setDateFilter] = React.useState<'all' | 'today' | 'week'>('all');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'Planifiée' | 'En cours'>('all');
  
  // Detail Drawer state
  const [selectedMission, setSelectedMission] = React.useState<typeof missions[0] | null>(null);
  const [drawerTab, setDrawerTab] = React.useState<'general' | 'client' | 'team' | 'equipment' | 'report' | 'hours'>('general');
  const [scannedItemId, setScannedItemId] = React.useState<string | null>(null);

  // Local reports (saved to localStorage by mission and user id)
  const [localReports, setLocalReports] = React.useState<Record<string, string>>({});
  const [savingStatus, setSavingStatus] = React.useState<'idle' | 'saving' | 'saved'>('idle');

  // Network & Sync State
  const syncQueue = useStore(state => state.syncQueue);
  const processSyncQueue = useStore(state => state.processSyncQueue);
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  const tabsList: Array<'general' | 'client' | 'team' | 'equipment' | 'report' | 'hours'> = [
    'general', 'client', 'team', 'equipment', 'report', 'hours'
  ];

  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      processSyncQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check on mount if we have pending items
    if (navigator.onLine && syncQueue.length > 0) {
      processSyncQueue();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [processSyncQueue, syncQueue.length]);

  // Drag and Swipe Gesture states
  const [dragOffsetY, setDragOffsetY] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const dragStartY = React.useRef(0);

  const swipeStartX = React.useRef(0);
  const swipeStartY = React.useRef(0);
  const tabsList: Array<'general' | 'client' | 'team' | 'equipment' | 'report' | 'hours'> = [
    'general', 'client', 'team', 'equipment', 'report', 'hours'
  ];

  // Helper for centralized vibrations (haptic feedback)
  const triggerVibrate = (type: 'click' | 'success' | 'double' | 'error') => {
    if (!('vibrate' in navigator)) return;
    switch (type) {
      case 'click':
        navigator.vibrate(12); // Short clean click feel
        break;
      case 'success':
        navigator.vibrate(30); // Single success confirm pulse
        break;
      case 'double':
        navigator.vibrate([30, 45, 30]); // Mission status stepper action
        break;
      case 'error':
        navigator.vibrate([100, 50, 100]); // Noticeable error vibration
        break;
    }
  };

  // Load local reports on mount
  React.useEffect(() => {
    if (user?.id) {
      const key = `eventflow_reports_${user.id}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          setLocalReports(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to load local reports:', e);
        }
      }
    }
  }, [user?.id]);

  // Save report change to local storage
  const handleReportChange = (missionId: string, value: string) => {
    setSavingStatus('saving');
    const updated = { ...localReports, [missionId]: value };
    setLocalReports(updated);
    
    if (user?.id) {
      const key = `eventflow_reports_${user.id}`;
      localStorage.setItem(key, JSON.stringify(updated));
    }
    
    setTimeout(() => {
      setSavingStatus('saved');
      setTimeout(() => setSavingStatus('idle'), 1000);
    }, 500);
  };

  // Handle Scanning QR
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
    
    // Update selectedMission reference if drawer is open to sync check-list immediately
    if (selectedMission && selectedMission.id === missionId) {
      setSelectedMission(prev => {
        if (!prev) return null;
        return {
          ...prev,
          equipments: prev.equipments.map(e => 
            e.equipmentId === decodedText ? { ...e, checked: true } : e
          )
        };
      });
    }
  };

  // Toggle checklist manual pointage
  const handleToggle = (missionId: string, equipmentId: string) => {
    const mission = missions.find(m => m.id === missionId);
    const current = mission?.equipments.find(e => e.equipmentId === equipmentId)?.checked ?? false;
    const nextVal = !current;
    
    toggleEquipmentCheck(missionId, equipmentId, nextVal);
    triggerVibrate(nextVal ? 'success' : 'click');

    if (selectedMission && selectedMission.id === missionId) {
      setSelectedMission(prev => {
        if (!prev) return null;
        return {
          ...prev,
          equipments: prev.equipments.map(e => 
            e.equipmentId === equipmentId ? { ...e, checked: nextVal } : e
          )
        };
      });
    }
  };

  const getTruckName = (truckId?: string) => {
    if (!truckId) return 'Aucun camion';
    const truck = trucks.find(t => t.id === truckId);
    return truck ? `${truck.name} (${truck.plate})` : 'Camion inconnu';
  };

  const getColleagues = (missionTechIds: string[]) => {
    return missionTechIds
      .filter(id => id !== user?.id)
      .map(id => {
        const tech = technicians.find(t => t.id === id);
        return tech ? `${tech.firstName} ${tech.lastName}` : 'Inconnu';
      });
  };

  const getColleaguesDetailed = (missionTechIds: string[]) => {
    return missionTechIds
      .map(id => {
        const tech = technicians.find(t => t.id === id);
        return tech ? {
          id: tech.id,
          name: `${tech.firstName} ${tech.lastName}`,
          specialty: tech.specialty,
          color: tech.color,
          isSelf: tech.id === user?.id
        } : null;
      })
      .filter((t): t is NonNullable<typeof t> => t !== null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Planifiée': 
        return (
          <span className="flex items-center gap-1.5 text-[10px] font-extrabold text-blue-600 bg-blue-50/70 border border-blue-100 px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            <span>Planifiée</span>
          </span>
        );
      case 'En cours': 
        return (
          <span className="flex items-center gap-1.5 text-[10px] font-extrabold text-amber-600 bg-amber-50/70 border border-amber-100 px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span>En cours</span>
          </span>
        );
      case 'Terminée': 
        return (
          <span className="flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-600 bg-emerald-50/70 border border-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Terminée</span>
          </span>
        );
      default: 
        return (
          <span className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-600 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            <span>{status}</span>
          </span>
        );
    }
  };

  // Get matching client for the mission if clientId exists
  const getClientInfo = (clientId?: string) => {
    if (!clientId) return null;
    return clients.find(c => c.id === clientId) || null;
  };

  // Calculate equipment progress stats
  const getEquipmentProgress = (missionEquipments: typeof missions[0]['equipments']) => {
    if (!missionEquipments || missionEquipments.length === 0) return { total: 0, pointed: 0, percent: 0 };
    const total = missionEquipments.length;
    const pointed = missionEquipments.filter(e => e.checked).length;
    return {
      total,
      pointed,
      percent: Math.round((pointed / total) * 100)
    };
  };

  // Drag down to close gestures handlers
  const handleDragStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    dragStartY.current = e.touches[0].clientY;
  };

  const handleDragMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - dragStartY.current;
    if (deltaY > 0) {
      setDragOffsetY(deltaY);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    if (dragOffsetY > 140) {
      triggerVibrate('click');
      setSelectedMission(null);
    }
    setDragOffsetY(0);
  };

  // Swipe horizontal to switch drawer tabs
  const handleContentTouchStart = (e: React.TouchEvent) => {
    swipeStartX.current = e.touches[0].clientX;
    swipeStartY.current = e.touches[0].clientY;
  };

  const handleContentTouchEnd = (e: React.TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - swipeStartX.current;
    const deltaY = e.changedTouches[0].clientY - swipeStartY.current;

    // Must be a horizontal swipe (deltaX large, deltaY small)
    if (Math.abs(deltaX) > 70 && Math.abs(deltaY) < 50) {
      const currentIndex = tabsList.indexOf(drawerTab);
      if (deltaX > 0) {
        // Swipe Right -> previous tab
        if (currentIndex > 0) {
          setDrawerTab(tabsList[currentIndex - 1]);
          triggerVibrate('click');
        }
      } else {
        // Swipe Left -> next tab
        if (currentIndex < tabsList.length - 1) {
          setDrawerTab(tabsList[currentIndex + 1]);
          triggerVibrate('click');
        }
      }
    }
  };

  // Filter and sort missions
  const myMissions = missions
    .filter(m => m.technicianIds.includes(user?.id || ''))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const displayedMissions = myMissions.filter(m => {
    // 1. Tab Status check
    const isHistory = m.status === 'Terminée';
    if (activeTab === 'active' && isHistory) return false;
    if (activeTab === 'history' && !isHistory) return false;

    // 2. Search check
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesTitle = m.title.toLowerCase().includes(term);
      const matchesClient = m.client.toLowerCase().includes(term);
      const matchesAddress = m.address.toLowerCase().includes(term);
      if (!matchesTitle && !matchesClient && !matchesAddress) return false;
    }

    // 3. Date check
    const now = new Date();
    if (dateFilter === 'today') {
      if (!isSameDay(m.start, now) && !isSameDay(m.end, now)) {
        const startOfDayTime = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const endOfDayTime = startOfDayTime + 24 * 60 * 60 * 1000 - 1;
        const mStart = m.start.getTime();
        const mEnd = m.end.getTime();
        const overlaps = Math.max(mStart, startOfDayTime) <= Math.min(mEnd, endOfDayTime);
        if (!overlaps) return false;
      }
    } else if (dateFilter === 'week') {
      const startOfCurrentWeek = startOfWeek(now, { weekStartsOn: 1 });
      const endOfCurrentWeek = endOfWeek(now, { weekStartsOn: 1 });
      const mStart = m.start.getTime();
      const mEnd = m.end.getTime();
      const overlaps = Math.max(mStart, startOfCurrentWeek.getTime()) <= Math.min(mEnd, endOfCurrentWeek.getTime());
      if (!overlaps) return false;
    }

    // 4. Status secondary filter (only on active tab)
    if (activeTab === 'active' && statusFilter !== 'all') {
      if (m.status !== statusFilter) return false;
    }

    return true;
  });

  // Open Detailed modal/drawer
  const openMissionDetails = (mission: typeof missions[0]) => {
    triggerVibrate('click');
    setSelectedMission(mission);
    setDrawerTab('general');
  };

  const handleStatusChange = async (newStatus: 'Planifiée' | 'En cours' | 'Terminée') => {
    if (!selectedMission || selectedMission.status === newStatus) return;
    triggerVibrate('double');
    
    // Optimistic update locally
    setSelectedMission({ ...selectedMission, status: newStatus });
    
    // Actual update in store
    await updateMission(selectedMission.id, { status: newStatus });
    toast.success(`Statut mis à jour : ${newStatus}`);
  };

  const handleTimeChange = async (field: 'start' | 'end', newTimeString: string) => {
    if (!selectedMission || !newTimeString) return;
    const [hours, minutes] = newTimeString.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return;

    const newDate = new Date(selectedMission[field]);
    newDate.setHours(hours, minutes, 0, 0);

    // Optimistic update
    setSelectedMission({ ...selectedMission, [field]: newDate });

    // Store update
    await updateMission(selectedMission.id, { [field]: newDate });
    toast.success(`Heure de ${field === 'start' ? 'début' : 'fin'} mise à jour`);
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#f8fafc] pb-24 relative shadow-2xl border-x border-[#e2e8f0]">
      
      {/* Premium Sticky Glass Header */}
      <header className="bg-white/80 backdrop-blur-md px-5 py-4 border-b border-[#e2e8f0]/60 sticky top-0 z-30 shadow-xs transition-all">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-[9px] font-extrabold text-[#2563eb] uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-md">Pro Connect</span>
            {!isOnline && (
              <span className="ml-2 text-[9px] font-extrabold text-red-600 uppercase tracking-widest bg-red-50 px-2 py-0.5 rounded-md border border-red-100 animate-pulse">
                Hors Ligne
              </span>
            )}
            <h1 className="text-xl font-black text-[#0f172a] tracking-tight mt-1">Mes Missions</h1>
            {syncQueue.length > 0 ? (
              <p className="text-[11px] font-bold text-amber-600 mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                {syncQueue.length} action(s) en attente
              </p>
            ) : (
              <p className="text-[11px] text-[#64748b] mt-0.5">
                Bonjour, <span className="font-bold text-[#475569]">{user?.user_metadata?.first_name || 'Technicien'}</span>
              </p>
            )}
          </div>
          
          <div className="flex gap-2">
            <Link 
              to="/settings" 
              onClick={() => triggerVibrate('click')}
              title="Profil & Paramètres"
              className="p-2.5 bg-white hover:bg-[#f1f5f9] border border-[#e2e8f0]/80 text-[#64748b] hover:text-[#0f172a] rounded-xl transition-all cursor-pointer active:scale-95 duration-100"
            >
              <SettingsIcon className="w-4 h-4" />
            </Link>
            <button 
              onClick={() => {
                triggerVibrate('click');
                signOut();
              }}
              title="Déconnexion"
              className="p-2.5 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 rounded-xl transition-all cursor-pointer active:scale-95 duration-100"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Tab bar switcher */}
      <div className="bg-white border-b border-[#e2e8f0]/60 px-4 py-2 flex gap-4 sticky top-[73px] z-30">
        <button
          onClick={() => {
            triggerVibrate('click');
            setActiveTab('active');
            setDateFilter('all');
            setSearchTerm('');
          }}
          className={`pb-2 px-2 text-sm font-extrabold border-b-2 transition-all cursor-pointer active:scale-95 duration-100 ${
            activeTab === 'active' 
              ? 'border-[#2563eb] text-[#2563eb]' 
              : 'border-transparent text-[#64748b] hover:text-[#334155]'
          }`}
        >
          À venir & En cours
        </button>
        <button
          onClick={() => {
            triggerVibrate('click');
            setActiveTab('history');
            setDateFilter('all');
            setSearchTerm('');
          }}
          className={`pb-2 px-2 text-sm font-extrabold border-b-2 transition-all cursor-pointer active:scale-95 duration-100 ${
            activeTab === 'history' 
              ? 'border-[#2563eb] text-[#2563eb]' 
              : 'border-transparent text-[#64748b] hover:text-[#334155]'
          }`}
        >
          Historique
        </button>
      </div>

      {/* Search and Filters panel */}
      <div className="bg-white border-b border-[#e2e8f0]/60 p-4 space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
          <input
            type="text"
            placeholder="Rechercher par client, titre, lieu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm border border-[#e2e8f0]/80 rounded-xl bg-[#f8fafc] placeholder-[#94a3b8] text-[#0f172a] focus:bg-white focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition-all outline-none"
          />
          {searchTerm && (
            <button 
              onClick={() => {
                triggerVibrate('click');
                setSearchTerm('');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#0f172a] p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Date and Status filters row */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mr-1">
            <Filter className="w-3.5 h-3.5 text-[#cbd5e1]" />
            <span>Filtres:</span>
          </div>

          {/* Date pills */}
          <button
            onClick={() => { triggerVibrate('click'); setDateFilter('all'); }}
            className={`px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer active:scale-95 duration-100 ${
              dateFilter === 'all'
                ? 'bg-[#0f172a] text-white border-[#0f172a]'
                : 'bg-[#f1f5f9] text-[#475569] border-[#e2e8f0]/80 hover:bg-[#e2e8f0]'
            }`}
          >
            Tous
          </button>
          <button
            onClick={() => { triggerVibrate('click'); setDateFilter('today'); }}
            className={`px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer active:scale-95 duration-100 ${
              dateFilter === 'today'
                ? 'bg-[#0f172a] text-white border-[#0f172a]'
                : 'bg-[#f1f5f9] text-[#475569] border-[#e2e8f0]/80 hover:bg-[#e2e8f0]'
            }`}
          >
            Aujourd'hui
          </button>
          <button
            onClick={() => { triggerVibrate('click'); setDateFilter('week'); }}
            className={`px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer active:scale-95 duration-100 ${
              dateFilter === 'week'
                ? 'bg-[#0f172a] text-white border-[#0f172a]'
                : 'bg-[#f1f5f9] text-[#475569] border-[#e2e8f0]/80 hover:bg-[#e2e8f0]'
            }`}
          >
            Cette semaine
          </button>
        </div>

        {/* Status filters (only for active tab) */}
        {activeTab === 'active' && (
          <div className="flex items-center gap-2 pt-1 border-t border-[#f1f5f9]">
            <span className="text-[10px] font-bold text-[#94a3b8] uppercase">Statuts:</span>
            <button
              onClick={() => { triggerVibrate('click'); setStatusFilter('all'); }}
              className={`px-2.5 py-0.5 rounded-md text-xs font-bold transition-all cursor-pointer active:scale-95 duration-100 ${
                statusFilter === 'all'
                  ? 'bg-blue-50 text-blue-700'
                  : 'bg-transparent text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => { triggerVibrate('click'); setStatusFilter('Planifiée'); }}
              className={`px-2.5 py-0.5 rounded-md text-xs font-bold transition-all cursor-pointer active:scale-95 duration-100 ${
                statusFilter === 'Planifiée'
                  ? 'bg-blue-50 text-blue-700'
                  : 'bg-transparent text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              Planifiées
            </button>
            <button
              onClick={() => { triggerVibrate('click'); setStatusFilter('En cours'); }}
              className={`px-2.5 py-0.5 rounded-md text-xs font-bold transition-all cursor-pointer active:scale-95 duration-100 ${
                statusFilter === 'En cours'
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-transparent text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              En cours
            </button>
          </div>
        )}
      </div>

      {/* Main content area */}
      <div className="p-4 space-y-4">
        {displayedMissions.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl text-center shadow-xs border border-[#e2e8f0]/60">
            <CheckCircle className="w-12 h-12 text-[#10b981]/40 mx-auto mb-4" />
            <h3 className="text-base font-bold text-[#0f172a]">Aucune mission</h3>
            <p className="text-xs text-[#64748b] mt-1">Aucun événement ne correspond à vos filtres de recherche.</p>
            {(searchTerm || dateFilter !== 'all' || (activeTab === 'active' && statusFilter !== 'all')) && (
              <button 
                onClick={() => {
                  triggerVibrate('click');
                  setSearchTerm('');
                  setDateFilter('all');
                  setStatusFilter('all');
                }}
                className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors cursor-pointer active:scale-95 duration-100"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          displayedMissions.map(mission => {
            const colleagues = getColleagues(mission.technicianIds);
            const isToday = isSameDay(mission.start, new Date());
            const progress = getEquipmentProgress(mission.equipments);

            return (
              <div 
                key={mission.id} 
                onClick={() => openMissionDetails(mission)}
                className="bg-white rounded-2xl border border-[#e2e8f0]/60 overflow-hidden transition-all hover:shadow-xs active:scale-[0.98] duration-150 cursor-pointer relative"
              >
                {/* Horizontal colored line representation */}
                <div className="h-1.5 w-full" style={{ backgroundColor: mission.color }}></div>
                
                <div className="p-4">
                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-slate-100 text-[#64748b] uppercase tracking-wider">
                          {mission.type}
                        </span>
                        {isToday && (
                          <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-red-50 text-red-500 uppercase tracking-wider animate-pulse">
                            Aujourd'hui
                          </span>
                        )}
                      </div>
                      <h3 className="font-extrabold text-[#0f172a] text-base leading-snug mt-1.5">
                        {mission.title}
                      </h3>
                      <p className="text-xs font-semibold text-[#64748b] mt-0.5">{mission.client}</p>
                    </div>
                    {getStatusBadge(mission.status)}
                  </div>

                  {/* Card Info List */}
                  <div className="space-y-2 mb-4 pt-1">
                    <div className="flex items-center gap-2 text-xs text-[#475569]">
                      <Clock className="w-4 h-4 text-[#cbd5e1] shrink-0" />
                      <span className={isToday ? "font-bold text-[#ea580c]" : "font-medium"}>
                        {format(mission.start, 'EEEE d MMM HH:mm', { locale: fr })} - {format(mission.end, 'HH:mm')}
                      </span>
                    </div>

                    <div className="flex items-start gap-2 text-xs text-[#475569]">
                      <MapPin className="w-4 h-4 text-[#cbd5e1] shrink-0 mt-0.5" />
                      <span className="line-clamp-1 font-medium">{mission.address}</span>
                    </div>

                    {/* Progress Bar for Equipment */}
                    {mission.equipments && mission.equipments.length > 0 && (
                      <div className="bg-[#f8fafc] p-2.5 rounded-xl border border-[#e2e8f0]/40 mt-3">
                        <div className="flex justify-between text-[11px] font-bold text-[#64748b] mb-1">
                          <span>Pointage matériel</span>
                          <span className={progress.percent === 100 ? "text-emerald-600" : "text-[#475569]"}>
                            {progress.pointed}/{progress.total} ({progress.percent}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              progress.percent === 100 
                                ? 'bg-emerald-500' 
                                : progress.percent >= 50 
                                  ? 'bg-blue-500' 
                                  : 'bg-orange-400'
                            }`}
                            style={{ width: `${progress.percent}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Grid */}
                  <div className="flex gap-2 pt-3 border-t border-[#f1f5f9] justify-between items-center text-xs text-[#64748b]">
                    {/* Colleagues & Truck brief icons */}
                    <div className="flex gap-4">
                      {mission.truckId && (
                        <div className="flex items-center gap-1 font-bold">
                          <TruckIcon className="w-3.5 h-3.5 text-[#cbd5e1]" />
                          <span className="truncate max-w-[100px]">{trucks.find(t => t.id === mission.truckId)?.name || 'Camion'}</span>
                        </div>
                      )}
                      {colleagues.length > 0 && (
                        <div className="flex items-center gap-1 font-bold">
                          <Users className="w-3.5 h-3.5 text-[#cbd5e1]" />
                          <span>{colleagues.length} collègue{colleagues.length > 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 font-bold text-[#2563eb]">
                      <span>Accéder</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom spacing & version info */}
      <div className="text-center py-6 text-[10px] text-[#cbd5e1] font-mono select-none">
        EventPlanner Pro v2.4.0
      </div>

      {/* Premium Bottom Tab Navigation - Glassmorphism */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-[#e2e8f0]/60 pb-safe z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto px-4">
          <button 
            onClick={() => {
              triggerVibrate('click');
              setSelectedMission(null); 
              setActiveTab('active');
            }}
            className={`flex flex-col items-center justify-center w-full h-full cursor-pointer transition-all active:scale-95 duration-100 ${
              activeTab === 'active' && !selectedMission ? 'text-[#2563eb]' : 'text-[#64748b] hover:text-[#0f172a]'
            }`}
          >
            <Calendar className="w-5.5 h-5.5 mb-1" />
            <span className="text-[10px] font-extrabold">Missions</span>
          </button>

          <Link 
            to="/settings" 
            onClick={() => triggerVibrate('click')}
            className="flex flex-col items-center justify-center w-full h-full text-[#64748b] hover:text-[#2563eb] transition-all active:scale-95 duration-100"
          >
            <SettingsIcon className="w-5.5 h-5.5 mb-1" />
            <span className="text-[10px] font-extrabold">Mon Profil</span>
          </Link>

          <button 
            onClick={() => {
              triggerVibrate('click');
              signOut();
            }} 
className="flex flex-col items-center justify-center w-full h-full text-[#64748b] hover:text-red-500 transition-all cursor-pointer active:scale-95 duration-100"
          >
            <LogOut className="w-5.5 h-5.5 mb-1" />
            <span className="text-[10px] font-extrabold">Quitter</span>
          </button>
        </div>
      </nav>

      {/* Detailed Mission bottom sheet / Drawer */}
      {selectedMission && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-end justify-center">
          {/* Overlay click to close */}
          <div className="absolute inset-0" onClick={() => { triggerVibrate('click'); setSelectedMission(null); }}></div>
          
          {/* Bottom Sheet wrapper with touch gestures */}
          <div 
            className="bg-white rounded-t-3xl w-full max-w-md h-[90vh] flex flex-col z-10 shadow-2xl relative overflow-hidden"
            style={{ 
              transform: `translateY(${dragOffsetY}px)`,
              transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)' 
            }}
          >
            {/* Sheet Notch - Drag Target */}
            <div 
              onTouchStart={handleDragStart}
              onTouchMove={handleDragMove}
              onTouchEnd={handleDragEnd}
              className="w-full pt-3 pb-1 flex flex-col items-center cursor-grab active:cursor-grabbing shrink-0 select-none absolute top-0 left-0 right-0 z-20"
            >
              <div className="w-10 h-1 bg-white/50 rounded-full"></div>
            </div>

            {/* ── HERO HEADER ── */}
            <div className="relative shrink-0 px-5 pt-8 pb-4" style={{ backgroundColor: selectedMission.color }}>
              <div className="absolute right-0 top-0 w-32 h-32 rounded-full opacity-20 -translate-y-1/2 translate-x-1/2" style={{ background: 'rgba(255,255,255,0.4)', filter: 'blur(30px)' }}></div>

              <button 
                onClick={() => { triggerVibrate('click'); setSelectedMission(null); }}
                className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors cursor-pointer active:scale-90 backdrop-blur-sm"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 mb-2">
                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-white/20 text-white uppercase tracking-wider">{selectedMission.type}</span>
                {isSameDay(selectedMission.start, new Date()) && (
                  <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-white text-red-500 uppercase tracking-wider animate-pulse">Aujourd'hui</span>
                )}
              </div>
              <h2 className="text-lg font-black text-white leading-tight">{selectedMission.title}</h2>
              <p className="text-xs font-semibold text-white/80 mt-0.5">{selectedMission.client}</p>

              <div className="mt-3 flex flex-col gap-1">
                <div className="flex items-center gap-2 text-white/90 text-[11px] font-semibold">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>{format(selectedMission.start, 'EEEE d MMM · HH:mm', { locale: fr })} → {format(selectedMission.end, 'HH:mm')}</span>
                </div>
                <div className="flex items-center gap-2 text-white/90 text-[11px] font-semibold">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="line-clamp-1">{selectedMission.address}</span>
                </div>
              </div>

              {/* Stepper in hero */}
              <div className="mt-4 flex items-center gap-2">
                {[
                  { key: 'Planifiée', label: 'Planifiée', done: ['En cours','Terminée'].includes(selectedMission.status), active: selectedMission.status === 'Planifiée' },
                  { key: 'En cours',  label: 'En cours',  done: selectedMission.status === 'Terminée',                    active: selectedMission.status === 'En cours' },
                  { key: 'Terminée',  label: 'Terminée',  done: false,                                                    active: selectedMission.status === 'Terminée' }
                ].map((step, i, arr) => (
                  <React.Fragment key={step.key}>
                    <div 
                      className="flex flex-col items-center gap-1 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                      onClick={() => handleStatusChange(step.key as any)}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black transition-all ${
                        step.active ? 'bg-white text-slate-800 shadow-md ring-2 ring-white/40' :
                        step.done   ? 'bg-white/30 text-white' : 'bg-white/15 text-white/50'
                      }`}>
                        {step.done ? <Check className="w-3 h-3 stroke-[3]" /> : i + 1}
                      </div>
                      <span className={`text-[9px] font-bold whitespace-nowrap ${step.active || step.done ? 'text-white' : 'text-white/50'}`}>{step.label}</span>
                    </div>
                    {i < arr.length - 1 && (
                      <div className={`flex-1 h-px rounded mb-4 ${step.done || step.active ? 'bg-white/50' : 'bg-white/20'}`}></div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* ── PILL TAB BAR ── */}
            <div className="bg-white border-b border-[#e2e8f0]/60 px-3 py-2 flex gap-1 overflow-x-auto shrink-0 select-none no-scrollbar">
              {([
                { id: 'general',   label: 'Général',  icon: Info },
                { id: 'client',    label: 'Client',   icon: Phone },
                { id: 'team',      label: 'Équipe',   icon: Users },
                { id: 'equipment', label: 'Matériel', icon: QrCode },
                { id: 'hours',     label: 'Heures',   icon: Timer },
                { id: 'report',    label: 'Rapport',  icon: FileText }
              ] as const).map(tab => {
                const TabIcon = tab.icon;
                const isActive = drawerTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { triggerVibrate('click'); setDrawerTab(tab.id); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-extrabold rounded-full whitespace-nowrap cursor-pointer transition-all active:scale-95 duration-100 ${
                      isActive ? 'text-white shadow-sm' : 'text-[#64748b] hover:text-[#0f172a] hover:bg-slate-100'
                    }`}
                    style={isActive ? { backgroundColor: selectedMission.color } : {}}
                  >
                    <TabIcon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* ── SCROLLABLE CONTENT ── */}
            <div 
              onTouchStart={handleContentTouchStart}
              onTouchEnd={handleContentTouchEnd}
              className="flex-1 overflow-y-auto bg-[#f8fafc] select-none"
            >
              <div key={drawerTab} className="p-4 space-y-3 animate-fade-in">

              {/* ══ GENERAL ══ */}
              {drawerTab === 'general' && (
                <div className="space-y-3">
                  <div className="bg-white border border-[#e2e8f0]/60 rounded-2xl overflow-hidden shadow-xs">
                    <div className="px-4 py-2.5 border-b border-[#f1f5f9] flex items-center gap-2">
                      <Calendar className="w-4 h-4 shrink-0" style={{ color: selectedMission.color }} />
                      <span className="text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-wider">Planification</span>
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-[10px] font-bold text-[#94a3b8] uppercase mb-0.5">Début</div>
                          <div className="font-bold text-[#0f172a] text-sm capitalize">{format(selectedMission.start, 'EEEE d MMMM yyyy', { locale: fr })}</div>
                          <input 
                            type="time" 
                            value={format(selectedMission.start, 'HH:mm')} 
                            onChange={(e) => handleTimeChange('start', e.target.value)}
                            className="text-xs font-semibold text-[#64748b] bg-transparent border-b border-dashed border-[#cbd5e1] focus:outline-none focus:border-[#2563eb] cursor-pointer"
                          />
                        </div>
                        <div className="w-px h-10 bg-[#e2e8f0] self-center"></div>
                        <div className="text-right flex flex-col items-end">
                          <div className="text-[10px] font-bold text-[#94a3b8] uppercase mb-0.5">Fin</div>
                          <div className="font-bold text-[#0f172a] text-sm capitalize">{format(selectedMission.end, 'EEEE d MMMM yyyy', { locale: fr })}</div>
                          <input 
                            type="time" 
                            value={format(selectedMission.end, 'HH:mm')} 
                            onChange={(e) => handleTimeChange('end', e.target.value)}
                            className="text-xs font-semibold text-[#64748b] bg-transparent border-b border-dashed border-[#cbd5e1] focus:outline-none focus:border-[#2563eb] cursor-pointer text-right"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-[#e2e8f0]/60 rounded-2xl overflow-hidden shadow-xs">
                    <div className="px-4 py-2.5 border-b border-[#f1f5f9] flex items-center gap-2">
                      <MapPin className="w-4 h-4 shrink-0" style={{ color: selectedMission.color }} />
                      <span className="text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-wider">Lieu de rendez-vous</span>
                    </div>
                    <div className="p-4">
                      <p className="font-bold text-[#0f172a] text-sm leading-snug mb-3">{selectedMission.address}</p>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedMission.address)}`}
                        target="_blank" rel="noopener noreferrer"
                        onClick={() => triggerVibrate('click')}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs active:scale-95 duration-100 transition-all"
                        style={{ backgroundColor: selectedMission.color }}
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        Itinéraire Google Maps
                      </a>
                    </div>
                  </div>

                  {selectedMission.truckId && (
                    <div className="bg-white border border-[#e2e8f0]/60 rounded-2xl overflow-hidden shadow-xs">
                      <div className="px-4 py-2.5 border-b border-[#f1f5f9] flex items-center gap-2">
                        <TruckIcon className="w-4 h-4 shrink-0" style={{ color: selectedMission.color }} />
                        <span className="text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-wider">Véhicule assigné</span>
                      </div>
                      <div className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: selectedMission.color + '20' }}>
                          <TruckIcon className="w-5 h-5" style={{ color: selectedMission.color }} />
                        </div>
                        <div>
                          <div className="font-extrabold text-[#0f172a] text-sm">{getTruckName(selectedMission.truckId)}</div>
                          <div className="text-xs text-[#64748b] font-medium mt-0.5">Véhicule de la mission</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedMission.equipments && selectedMission.equipments.length > 0 && (() => {
                    const prog = getEquipmentProgress(selectedMission.equipments);
                    return (
                      <div 
                        className="p-4 rounded-2xl border flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-all shadow-xs"
                        style={{ borderColor: selectedMission.color + '40', backgroundColor: selectedMission.color + '08' }}
                        onClick={() => { triggerVibrate('click'); setDrawerTab('equipment'); }}
                      >
                        <div className="relative w-12 h-12 shrink-0">
                          <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
                            <circle cx="18" cy="18" r="15" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                            <circle cx="18" cy="18" r="15" fill="none" stroke={selectedMission.color} strokeWidth="3" strokeDasharray={`${prog.percent * 0.942} 100`} strokeLinecap="round" />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black" style={{ color: selectedMission.color }}>{prog.percent}%</span>
                        </div>
                        <div className="flex-1">
                          <div className="font-extrabold text-[#0f172a] text-sm">Pointage matériel</div>
                          <div className="text-xs text-[#64748b] font-semibold mt-0.5">{prog.pointed} / {prog.total} éléments chargés</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#94a3b8] shrink-0" />
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* ══ CLIENT ══ */}
              {drawerTab === 'client' && (
                <div className="space-y-3">
                  {(() => {
                    const client = getClientInfo(selectedMission.clientId);
                    if (!client) {
                      return (
                        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl text-center space-y-2 shadow-xs">
                          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3"><Info className="w-7 h-7 text-[#94a3b8]" /></div>
                          <h4 className="font-bold text-slate-800 text-sm">Pas de fiche client associée</h4>
                          <p className="text-xs text-[#64748b]">Ce client a été saisi manuellement lors de la planification.</p>
                          <div className="mt-3 bg-slate-50 p-3 border border-slate-100 rounded-xl text-left">
                            <span className="text-[10px] font-bold text-[#64748b] uppercase">Nom saisi</span>
                            <div className="font-bold text-slate-800 mt-0.5 text-sm">{selectedMission.client}</div>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div className="space-y-3">
                        <div className="bg-white border border-[#e2e8f0]/60 rounded-2xl overflow-hidden shadow-xs">
                          <div className="px-4 pt-4 pb-3 border-b border-[#f1f5f9] flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-base shrink-0 shadow-xs" style={{ backgroundColor: selectedMission.color }}>
                              {client.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-[9px] font-extrabold text-[#2563eb] bg-blue-50 px-2 py-0.5 rounded-md uppercase tracking-wider inline-block mb-1">Fiche Client</div>
                              <div className="font-black text-base text-slate-900 leading-tight">{client.name}</div>
                              {client.contactName && <p className="text-xs text-[#64748b] font-medium">Contact : <span className="font-bold text-[#334155]">{client.contactName}</span></p>}
                            </div>
                          </div>
                          <div className="divide-y divide-[#f1f5f9]">
                            {client.phone && (
                              <div className="px-4 py-3 flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0"><Phone className="w-4 h-4 text-blue-600" /></div>
                                <div>
                                  <div className="text-[10px] font-bold text-[#94a3b8] uppercase">Téléphone</div>
                                  <a href={`tel:${client.phone}`} onClick={() => triggerVibrate('click')} className="font-bold text-blue-600 text-sm hover:underline">{client.phone}</a>
                                </div>
                              </div>
                            )}
                            {client.email && (
                              <div className="px-4 py-3 flex items-center gap-3">
                                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center shrink-0"><Mail className="w-4 h-4 text-purple-600" /></div>
                                <div className="min-w-0">
                                  <div className="text-[10px] font-bold text-[#94a3b8] uppercase">Email</div>
                                  <a href={`mailto:${client.email}`} onClick={() => triggerVibrate('click')} className="font-bold text-purple-600 text-sm hover:underline truncate block">{client.email}</a>
                                </div>
                              </div>
                            )}
                            {client.address && (
                              <div className="px-4 py-3 flex items-center gap-3">
                                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0"><MapPin className="w-4 h-4 text-[#64748b]" /></div>
                                <div>
                                  <div className="text-[10px] font-bold text-[#94a3b8] uppercase">Adresse</div>
                                  <span className="font-semibold text-slate-700 text-sm">{client.address}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {client.phone && (
                            <>
                              <a href={`tel:${client.phone}`} onClick={() => triggerVibrate('click')}
                                className="flex flex-col items-center justify-center bg-white border border-[#e2e8f0]/60 hover:bg-blue-50/50 hover:border-blue-200 py-3.5 px-2 rounded-2xl transition-all text-[#475569] hover:text-blue-600 cursor-pointer active:scale-95 duration-100 shadow-xs gap-1.5">
                                <Phone className="w-5 h-5" /><span className="text-[10px] font-extrabold">Appeler</span>
                              </a>
                              <a href={`sms:${client.phone}`} onClick={() => triggerVibrate('click')}
                                className="flex flex-col items-center justify-center bg-white border border-[#e2e8f0]/60 hover:bg-green-50/50 hover:border-green-200 py-3.5 px-2 rounded-2xl transition-all text-[#475569] hover:text-green-600 cursor-pointer active:scale-95 duration-100 shadow-xs gap-1.5">
                                <MessageSquare className="w-5 h-5" /><span className="text-[10px] font-extrabold">SMS</span>
                              </a>
                            </>
                          )}
                          {client.email && (
                            <a href={`mailto:${client.email}?subject=Mission%20${encodeURIComponent(selectedMission.title)}`} onClick={() => triggerVibrate('click')}
                              className="flex flex-col items-center justify-center bg-white border border-[#e2e8f0]/60 hover:bg-purple-50/50 hover:border-purple-200 py-3.5 px-2 rounded-2xl transition-all text-[#475569] hover:text-purple-600 cursor-pointer active:scale-95 duration-100 shadow-xs gap-1.5">
                              <Mail className="w-5 h-5" /><span className="text-[10px] font-extrabold">E-mail</span>
                            </a>
                          )}
                        </div>
                        {client.notes && (
                          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl space-y-2 shadow-xs">
                            <h4 className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                              <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                              Consignes & Notes Client
                            </h4>
                            <p className="text-xs font-semibold text-amber-900 leading-relaxed whitespace-pre-line">{client.notes}</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* ══ TEAM ══ */}
              {drawerTab === 'team' && (
                <div className="space-y-3">
                  <div className="bg-white border border-[#e2e8f0]/60 rounded-2xl overflow-hidden shadow-xs">
                    <div className="px-4 py-3 border-b border-[#f1f5f9] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 shrink-0" style={{ color: selectedMission.color }} />
                        <span className="text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-wider">Membres de l'équipe</span>
                      </div>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: selectedMission.color }}>{selectedMission.technicianIds.length}</span>
                    </div>
                    <ul className="divide-y divide-[#f1f5f9]">
                      {getColleaguesDetailed(selectedMission.technicianIds).map(tech => (
                        <li key={tech.id} className="px-4 py-3.5 flex items-center gap-3 hover:bg-slate-50/50 transition-colors">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-black text-white border-2 border-white shadow-xs shrink-0" style={{ backgroundColor: tech.color }}>
                            {tech.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm text-[#0f172a] flex items-center gap-1.5 flex-wrap">
                              <span>{tech.name}</span>
                              {tech.isSelf && <span className="text-[9px] font-extrabold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">Vous</span>}
                            </div>
                            <p className="text-xs font-semibold text-[#64748b] truncate">{tech.specialty}</p>
                          </div>
                          <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 rounded-2xl border flex items-start gap-3" style={{ borderColor: selectedMission.color + '30', backgroundColor: selectedMission.color + '08' }}>
                    <Users className="w-4 h-4 shrink-0 mt-0.5" style={{ color: selectedMission.color }} />
                    <p className="text-[11px] leading-relaxed font-semibold" style={{ color: selectedMission.color }}>
                      Coordonnez vos actions avec vos collègues. Pensez à pointer le matériel au chargement et au déchargement.
                    </p>
                  </div>
                </div>
              )}

              {/* ══ EQUIPMENT ══ */}
              {drawerTab === 'equipment' && (
                <div className="space-y-3">
                  {(() => {
                    const prog = getEquipmentProgress(selectedMission.equipments);
                    return (
                      <div className="bg-white border border-[#e2e8f0]/60 rounded-2xl overflow-hidden shadow-xs">
                        <div className="px-4 pt-4 pb-3 space-y-2 border-b border-[#f1f5f9]">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-extrabold text-sm text-slate-900">Chargement matériel</h3>
                              <p className="text-xs text-[#64748b] mt-0.5">Scannez ou cochez les éléments requis</p>
                            </div>
                            <div className="text-right">
                              <span className="text-xl font-black" style={{ color: selectedMission.color }}>{prog.percent}%</span>
                              <div className="text-[10px] text-[#64748b] font-bold">{prog.pointed}/{prog.total}</div>
                            </div>
                          </div>
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${prog.percent}%`, backgroundColor: prog.percent === 100 ? '#10b981' : selectedMission.color }}></div>
                          </div>
                          {selectedMission.status !== 'Terminée' && (
                            <button
                              onClick={() => { triggerVibrate('click'); setActiveMissionIdForScanner(selectedMission.id); setScannerOpen(true); }}
                              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-xs cursor-pointer active:scale-98 duration-100 mt-1"
                              style={{ backgroundColor: selectedMission.color }}
                            >
                              <QrCode className="w-4 h-4" />Scanner un QR Code
                            </button>
                          )}
                        </div>
                        {selectedMission.equipments && selectedMission.equipments.length > 0 ? (
                          <ul className="divide-y divide-[#f8fafc]">
                            {selectedMission.equipments.map(me => {
                              const def = equipmentDefs.find(e => e.id === me.equipmentId);
                              const isChecked = !!me.checked;
                              const isFlashing = scannedItemId === me.equipmentId;
                              return (
                                <li 
                                  key={me.equipmentId}
                                  onClick={() => { if (selectedMission.status !== 'Terminée') handleToggle(selectedMission.id, me.equipmentId); }}
                                  className={`px-4 py-3.5 flex items-center justify-between cursor-pointer transition-all ${isChecked ? 'bg-emerald-50/30' : 'hover:bg-slate-50'} ${isFlashing ? 'bg-amber-100 ring-2 ring-amber-400 animate-pulse duration-500' : ''}`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${isChecked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 bg-white hover:border-slate-400'}`}>
                                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                    </div>
                                    <span className={`text-sm font-bold ${isChecked ? 'line-through text-slate-400' : 'text-slate-700'}`}>{def?.name || 'Matériel inconnu'}</span>
                                  </div>
                                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md shrink-0 ${isChecked ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-[#475569]'}`}>×{me.quantity}</span>
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <div className="p-8 text-center text-xs text-[#94a3b8] italic">Aucun matériel requis pour cette mission.</div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* ══ HEURES ══ */}
              {drawerTab === 'hours' && (
                <TimeLogPanel
                  missionId={selectedMission.id}
                  missionColor={selectedMission.color}
                  missionStatus={selectedMission.status}
                />
              )}

              {/* ══ REPORT ══ */}
              {drawerTab === 'report' && (
                <div className="space-y-3">
                  <div className="bg-white border border-[#e2e8f0]/60 rounded-2xl overflow-hidden shadow-xs">
                    <div className="px-4 py-3 border-b border-[#f1f5f9] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 shrink-0" style={{ color: selectedMission.color }} />
                        <span className="text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-wider">Rapport de fin de mission</span>
                      </div>
                      <span className="text-[10px] font-bold font-mono">
                        {savingStatus === 'saving' && <span className="text-amber-500">Enregistrement…</span>}
                        {savingStatus === 'saved'  && <span className="text-emerald-500">Sauvegardé ✓</span>}
                        {savingStatus === 'idle'   && <span className="text-slate-400">Brouillon local</span>}
                      </span>
                    </div>
                    <div className="p-4 space-y-3">
                      <p className="text-xs text-[#64748b] leading-relaxed">Saisissez ici vos observations, retours, anomalies ou matériels endommagés.</p>
                      <textarea
                        placeholder="Ex: Le projecteur LED #4 ne s'allume pas..."
                        value={localReports[selectedMission.id] || ''}
                        onChange={(e) => handleReportChange(selectedMission.id, e.target.value)}
                        rows={7}
                        className="w-full text-sm border border-[#e2e8f0]/80 rounded-xl p-3.5 bg-[#f8fafc] text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:border-transparent outline-none transition-all resize-none"
                        style={{ '--tw-ring-color': selectedMission.color } as React.CSSProperties}
                      ></textarea>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          Enregistré sur cet appareil uniquement
                        </span>
                        {localReports[selectedMission.id] && (
                          <button
                            onClick={() => { triggerVibrate('click'); if (window.confirm('Voulez-vous effacer le rapport local ?')) handleReportChange(selectedMission.id, ''); }}
                            className="text-red-500 hover:text-red-700 text-xs font-bold cursor-pointer"
                          >
                            Effacer
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="bg-white border border-[#e2e8f0]/60 p-4 rounded-2xl text-[11px] text-[#64748b] leading-relaxed font-semibold shadow-xs flex items-start gap-2">
                    <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#94a3b8]" />
                    <span>Les rapports sont enregistrés sur votre terminal. L'administrateur les consultera lors de l'archivage ou du débriefing technique.</span>
                  </div>
                </div>
              )}

              </div>
            </div>

            {/* Bottom Safe Area */}
            <div className="h-4 shrink-0 bg-white"></div>
          </div>
        </div>
      )}

      {/* QR Code Scanner modal */}
      {scannerOpen && (
        <QRScannerModal
          isOpen={scannerOpen}
          onClose={() => {
            triggerVibrate('click');
            setScannerOpen(false);
            setActiveMissionIdForScanner(null);
          }}
          onScan={handleScan}
        />
      )}
    </div>
  );
}

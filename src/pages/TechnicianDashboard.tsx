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
  Play
} from 'lucide-react';
import { format, isSameDay, startOfWeek, endOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { QRScannerModal } from '../components/QRScannerModal';
import { toast } from '../store/toast';

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
  const [drawerTab, setDrawerTab] = React.useState<'general' | 'client' | 'team' | 'equipment' | 'report'>('general');
  const [scannedItemId, setScannedItemId] = React.useState<string | null>(null);

  // Local reports (saved to localStorage by mission and user id)
  const [localReports, setLocalReports] = React.useState<Record<string, string>>({});
  const [savingStatus, setSavingStatus] = React.useState<'idle' | 'saving' | 'saved'>('idle');

  // Drag and Swipe Gesture states
  const [dragOffsetY, setDragOffsetY] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const dragStartY = React.useRef(0);

  const swipeStartX = React.useRef(0);
  const swipeStartY = React.useRef(0);
  const tabsList: Array<'general' | 'client' | 'team' | 'equipment' | 'report'> = [
    'general', 'client', 'team', 'equipment', 'report'
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

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#f8fafc] pb-24 relative shadow-2xl border-x border-[#e2e8f0]">
      
      {/* Premium Sticky Glass Header */}
      <header className="bg-white/80 backdrop-blur-md px-5 py-4 border-b border-[#e2e8f0]/60 sticky top-0 z-30 shadow-xs transition-all">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-[9px] font-extrabold text-[#2563eb] uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-md">Pro Connect</span>
            <h1 className="text-xl font-black text-[#0f172a] tracking-tight mt-1">Mes Missions</h1>
            <p className="text-[11px] text-[#64748b] mt-0.5">
              Bonjour, <span className="font-bold text-[#475569]">{user?.user_metadata?.first_name || 'Technicien'}</span>
            </p>
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
            className="bg-white rounded-t-3xl w-full max-w-md h-[85vh] flex flex-col z-10 shadow-2xl relative overflow-hidden"
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
              className="w-full py-4 flex flex-col items-center cursor-grab active:cursor-grabbing shrink-0 select-none"
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
            </div>
            
            {/* Drawer Header */}
            <div className="px-5 pb-3 border-b border-[#e2e8f0]/60 flex justify-between items-start shrink-0">
              <div>
                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-slate-100 text-[#64748b] uppercase tracking-wider">
                  {selectedMission.type}
                </span>
                <h2 className="text-base font-black text-[#0f172a] leading-tight mt-1">{selectedMission.title}</h2>
                <p className="text-xs font-semibold text-[#64748b]">{selectedMission.client}</p>
              </div>
              <button 
                onClick={() => { triggerVibrate('click'); setSelectedMission(null); }}
                className="p-2 text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9] rounded-full transition-colors cursor-pointer active:scale-90"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Timeline Progression (State indicator) */}
            <div className="bg-slate-50 border-b border-[#e2e8f0]/60 px-5 py-3 shrink-0">
              <div className="flex items-center justify-between max-w-xs mx-auto animate-fade-in">
                {/* Step 1: Planifiée */}
                <div className="flex flex-col items-center">
                  <div className="relative">
                    {selectedMission.status === 'Planifiée' && (
                      <span className="absolute -inset-1 rounded-full bg-blue-500/20 animate-ping"></span>
                    )}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all relative z-10 ${
                      selectedMission.status === 'Planifiée' 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                        : 'bg-emerald-500 text-white'
                    }`}>
                      {selectedMission.status === 'Planifiée' ? (
                        <Calendar className="w-4 h-4" />
                      ) : (
                        <Check className="w-4 h-4 stroke-[3]" />
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold mt-1.5 text-[#475569]">Planifiée</span>
                </div>
                
                {/* Line 1 */}
                <div className={`flex-1 h-0.5 mx-2 rounded ${
                  selectedMission.status !== 'Planifiée' ? 'bg-emerald-500' : 'bg-slate-200'
                }`}></div>

                {/* Step 2: En cours */}
                <div className="flex flex-col items-center">
                  <div className="relative">
                    {selectedMission.status === 'En cours' && (
                      <span className="absolute -inset-1 rounded-full bg-amber-500/20 animate-ping"></span>
                    )}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all relative z-10 ${
                      selectedMission.status === 'En cours'
                        ? 'bg-amber-500 text-white shadow-md shadow-amber-200'
                        : selectedMission.status === 'Terminée'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-200 text-slate-400'
                    }`}>
                      {selectedMission.status === 'Terminée' ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : (
                        <Play className={`w-3.5 h-3.5 ${selectedMission.status === 'En cours' ? 'fill-white text-white' : 'fill-slate-400 text-slate-400'}`} />
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold mt-1.5 text-[#475569]">En cours</span>
                </div>

                {/* Line 2 */}
                <div className={`flex-1 h-0.5 mx-2 rounded ${
                  selectedMission.status === 'Terminée' ? 'bg-emerald-500' : 'bg-slate-200'
                }`}></div>

                {/* Step 3: Terminée */}
                <div className="flex flex-col items-center">
                  <div className="relative">
                    {selectedMission.status === 'Terminée' && (
                      <span className="absolute -inset-1 rounded-full bg-emerald-500/20 animate-ping"></span>
                    )}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all relative z-10 ${
                      selectedMission.status === 'Terminée'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                        : 'bg-slate-200 text-slate-400'
                    }`}>
                      <CheckCircle className="w-4 h-4" />
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold mt-1.5 text-[#475569]">Terminée</span>
                </div>
              </div>

              {/* Status Update Quick Button inside Drawer */}
              <div className="mt-3 flex justify-center">
                {selectedMission.status === 'Planifiée' && (
                  <button
                    onClick={() => {
                      triggerVibrate('double');
                      updateMission(selectedMission.id, { status: 'En cours' });
                      setSelectedMission(prev => prev ? { ...prev, status: 'En cours' } : null);
                      toast.success('Mission démarrée !');
                    }}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer transition-colors active:scale-98 duration-100"
                  >
                    Démarrer la mission maintenant
                  </button>
                )}
                {selectedMission.status === 'En cours' && (
                  <button
                    onClick={() => {
                      triggerVibrate('double');
                      // Verify checklist before finishing
                      const prog = getEquipmentProgress(selectedMission.equipments);
                      if (prog.pointed < prog.total) {
                        triggerVibrate('error');
                        const ok = window.confirm(`Attention: Tout le matériel requis (${prog.pointed}/${prog.total}) n'a pas été chargé. Voulez-vous quand même terminer la mission ?`);
                        if (!ok) return;
                      }
                      updateMission(selectedMission.id, { status: 'Terminée' });
                      setSelectedMission(null);
                      toast.success('Mission terminée avec succès !');
                    }}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer transition-colors active:scale-98 duration-100"
                  >
                    Terminer et archiver la mission
                  </button>
                )}
                {selectedMission.status === 'Terminée' && (
                  <div className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 py-1 bg-emerald-50 px-3 rounded-full border border-emerald-100">
                    <CheckCircle className="w-4 h-4" />
                    <span>Cette mission est terminée et archivée.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Scrollable Tabs row */}
            <div className="bg-white border-b border-[#e2e8f0]/60 px-4 py-1.5 flex gap-1 overflow-x-auto shrink-0 select-none no-scrollbar">
              {[
                { id: 'general', label: 'Général', icon: Clock },
                { id: 'client', label: 'Client', icon: Phone },
                { id: 'team', label: 'Équipe', icon: Users },
                { id: 'equipment', label: 'Matériel', icon: QrCode },
                { id: 'report', label: 'Rapport', icon: FileText }
              ].map(tab => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { triggerVibrate('click'); setDrawerTab(tab.id as any); }}
                    className={`flex items-center gap-1 px-3 py-2 text-xs font-extrabold rounded-lg whitespace-nowrap cursor-pointer transition-all active:scale-95 duration-100 ${
                      drawerTab === tab.id 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-[#64748b] hover:text-[#0f172a] hover:bg-slate-50'
                    }`}
                  >
                    <TabIcon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Swipeable & Scrollable Drawer Content Area */}
            <div 
              onTouchStart={handleContentTouchStart}
              onTouchEnd={handleContentTouchEnd}
              className="flex-1 overflow-y-auto p-5 select-none bg-slate-50/50"
            >
              <div key={drawerTab} className="space-y-4 animate-fade-in">
              
              {/* Tab: GENERAL */}
              {drawerTab === 'general' && (
                <div className="space-y-4">
                  <div className="bg-white border border-[#e2e8f0]/60 p-4 rounded-2xl space-y-3 shadow-xs">
                    <h4 className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">Planification</h4>
                    
                    <div className="flex items-start gap-3 text-sm text-[#0f172a]">
                      <Calendar className="w-5 h-5 text-[#94a3b8] shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-xs text-[#64748b]">Dates</div>
                        <div className="font-bold text-slate-800 mt-0.5 text-xs sm:text-sm">
                          Du {format(selectedMission.start, 'EEEE d MMMM yyyy à HH:mm', { locale: fr })}
                        </div>
                        <div className="font-bold text-slate-800 text-xs sm:text-sm">
                          Au {format(selectedMission.end, 'EEEE d MMMM yyyy à HH:mm', { locale: fr })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-[#e2e8f0]/60 p-4 rounded-2xl space-y-3 shadow-xs">
                    <h4 className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">Lieu de rendez-vous</h4>
                    
                    <div className="flex items-start gap-3 text-sm text-[#0f172a]">
                      <MapPin className="w-5 h-5 text-[#94a3b8] shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-bold text-xs text-[#64748b] mb-1">Adresse complète</div>
                        <div className="font-bold text-slate-800 leading-snug text-xs sm:text-sm">{selectedMission.address}</div>
                        
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedMission.address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => triggerVibrate('click')}
                          className="mt-3 inline-flex items-center gap-2 bg-[#2563eb] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-xs active:scale-95 duration-100"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Itinéraire Google Maps</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  {selectedMission.truckId && (
                    <div className="bg-white border border-[#e2e8f0]/60 p-4 rounded-2xl space-y-3 shadow-xs">
                      <h4 className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">Logistique Véhicule</h4>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#e2e8f0]/40 text-[#475569] rounded-xl flex items-center justify-center shrink-0">
                          <TruckIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-[#64748b]">Véhicule assigné</div>
                          <div className="font-bold text-slate-800 text-xs sm:text-sm">{getTruckName(selectedMission.truckId)}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: CLIENT */}
              {drawerTab === 'client' && (
                <div className="space-y-4">
                  {(() => {
                    const client = getClientInfo(selectedMission.clientId);
                    if (!client) {
                      return (
                        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl text-center space-y-2 shadow-xs">
                          <Info className="w-8 h-8 text-[#94a3b8] mx-auto" />
                          <h4 className="font-bold text-slate-800 text-sm">Pas de fiche client associée</h4>
                          <p className="text-xs text-[#64748b]">Ce client a été saisi manuellement lors de la planification.</p>
                          <div className="mt-3 bg-slate-50 p-3 border border-slate-100 rounded-xl text-left">
                            <span className="text-[10px] font-bold text-[#64748b] uppercase">Nom saisi</span>
                            <div className="font-bold text-slate-800 mt-0.5 text-xs sm:text-sm">{selectedMission.client}</div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        {/* Client details box */}
                        <div className="bg-white border border-[#e2e8f0]/60 p-4 rounded-2xl shadow-xs space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[9px] font-extrabold text-[#2563eb] uppercase bg-blue-50 px-2 py-0.5 rounded-md">Fiche Client</span>
                              <h3 className="font-black text-base text-slate-900 mt-1.5">{client.name}</h3>
                              {client.contactName && (
                                <p className="text-xs text-[#64748b] font-medium mt-0.5">Contact : <span className="font-bold text-[#334155]">{client.contactName}</span></p>
                              )}
                            </div>
                          </div>

                          {/* Contact Info rows */}
                          <div className="space-y-2 pt-2 text-xs border-t border-[#f1f5f9]">
                            {client.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-[#94a3b8] shrink-0" />
                                <a 
                                  href={`tel:${client.phone}`} 
                                  onClick={() => triggerVibrate('click')}
                                  className="font-bold text-blue-600 hover:underline"
                                >
                                  {client.phone}
                                </a>
                              </div>
                            )}
                            {client.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-[#94a3b8] shrink-0" />
                                <a 
                                  href={`mailto:${client.email}`} 
                                  onClick={() => triggerVibrate('click')}
                                  className="font-bold text-blue-600 hover:underline truncate"
                                >
                                  {client.email}
                                </a>
                              </div>
                            )}
                            {client.address && (
                              <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-[#94a3b8] shrink-0 mt-0.5" />
                                <span className="font-semibold text-slate-700">{client.address}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Interactive contact buttons */}
                        <div className="grid grid-cols-3 gap-2">
                          {client.phone && (
                            <>
                              <a 
                                href={`tel:${client.phone}`}
                                onClick={() => triggerVibrate('click')}
                                className="flex flex-col items-center justify-center bg-white border border-[#e2e8f0]/60 hover:bg-blue-50/50 hover:border-blue-200 p-3 rounded-xl transition-all text-[#475569] hover:text-blue-600 cursor-pointer active:scale-95 duration-100 shadow-xs"
                              >
                                <Phone className="w-5 h-5 mb-1" />
                                <span className="text-[10px] font-extrabold">Appeler</span>
                              </a>
                              <a 
                                href={`sms:${client.phone}`}
                                onClick={() => triggerVibrate('click')}
                                className="flex flex-col items-center justify-center bg-white border border-[#e2e8f0]/60 hover:bg-blue-50/50 hover:border-blue-200 p-3 rounded-xl transition-all text-[#475569] hover:text-blue-600 cursor-pointer active:scale-95 duration-100 shadow-xs"
                              >
                                <MessageSquare className="w-5 h-5 mb-1" />
                                <span className="text-[10px] font-extrabold">SMS</span>
                              </a>
                            </>
                          )}
                          {client.email && (
                            <a 
                              href={`mailto:${client.email}?subject=Mission%20${encodeURIComponent(selectedMission.title)}`}
                              onClick={() => triggerVibrate('click')}
                              className="flex flex-col items-center justify-center bg-white border border-[#e2e8f0]/60 hover:bg-blue-50/50 hover:border-blue-200 p-3 rounded-xl transition-all text-[#475569] hover:text-blue-600 cursor-pointer active:scale-95 duration-100 shadow-xs"
                            >
                              <Mail className="w-5 h-5 mb-1" />
                              <span className="text-[10px] font-extrabold">E-mail</span>
                            </a>
                          )}
                        </div>

                        {/* Client specific notes */}
                        {client.notes && (
                          <div className="bg-[#fffbeb] border border-amber-200 p-4 rounded-2xl space-y-2 shadow-xs">
                            <h4 className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                              <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                              <span>Consignes & Notes Client</span>
                            </h4>
                            <p className="text-xs font-semibold text-amber-900 leading-relaxed whitespace-pre-line">{client.notes}</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Tab: TEAM */}
              {drawerTab === 'team' && (
                <div className="space-y-4">
                  <div className="bg-white border border-[#e2e8f0]/60 rounded-2xl overflow-hidden shadow-xs">
                    <div className="bg-slate-50 px-4 py-3 border-b border-[#e2e8f0]/60">
                      <h3 className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">
                        Membres de l'équipe ({selectedMission.technicianIds.length})
                      </h3>
                    </div>
                    
                    <ul className="divide-y divide-[#f1f5f9]">
                      {getColleaguesDetailed(selectedMission.technicianIds).map(tech => (
                        <li key={tech.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                          <div className="flex items-center gap-3">
                            {/* Avatar */}
                            <div 
                              className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-black text-white border-2 border-white shadow-xs shrink-0"
                              style={{ backgroundColor: tech.color }}
                            >
                              {tech.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            
                            <div>
                              <div className="font-bold text-sm text-[#0f172a] flex items-center gap-1.5">
                                <span>{tech.name}</span>
                                {tech.isSelf && (
                                  <span className="text-[9px] font-extrabold bg-blue-50 text-blue-600 px-1.5 py-0.25 rounded">Vous</span>
                                )}
                              </div>
                              <p className="text-xs font-semibold text-[#64748b]">{tech.specialty}</p>
                            </div>
                          </div>
                          
                          <div className="text-xs text-[#94a3b8] font-bold italic">
                            Disponible
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 flex items-start gap-2.5">
                    <Users className="w-4.5 h-4.5 text-[#2563eb] shrink-0 mt-0.5" />
                    <p className="text-[11px] text-blue-800 leading-relaxed font-semibold">
                      Coordonnez vos actions avec vos collègues affectés sur cette mission. Pensez à pointer le matériel au chargement et au déchargement.
                    </p>
                  </div>
                </div>
              )}

              {/* Tab: EQUIPMENT */}
              {drawerTab === 'equipment' && (
                <div className="space-y-4">
                  {/* Equipment checklist progress banner */}
                  {(() => {
                    const prog = getEquipmentProgress(selectedMission.equipments);
                    return (
                      <div className="bg-white border border-[#e2e8f0]/60 p-4 rounded-2xl shadow-xs space-y-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-extrabold text-sm text-slate-900">Chargement matériel</h3>
                            <p className="text-xs text-[#64748b] mt-0.5">Scannez ou cochez les éléments requis</p>
                          </div>
                          <span className="text-xs font-bold text-[#64748b] bg-slate-100 px-2.5 py-1 rounded-lg">
                            {prog.pointed}/{prog.total}
                          </span>
                        </div>
                        
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              prog.percent === 100 
                                ? 'bg-emerald-500' 
                                : prog.percent >= 50 
                                  ? 'bg-blue-500' 
                                  : 'bg-orange-400'
                            }`}
                            style={{ width: `${prog.percent}%` }}
                          ></div>
                        </div>

                        {selectedMission.status !== 'Terminée' && (
                          <button
                            onClick={() => {
                              triggerVibrate('click');
                              setActiveMissionIdForScanner(selectedMission.id);
                              setScannerOpen(true);
                            }}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-[#2563eb] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-98 duration-100"
                          >
                            <QrCode className="w-4 h-4" />
                            <span>Scanner un QR Code</span>
                          </button>
                        )}
                      </div>
                    );
                  })()}

                  {/* Material checklist list */}
                  <div className="bg-white border border-[#e2e8f0]/60 rounded-2xl overflow-hidden shadow-xs">
                    {selectedMission.equipments && selectedMission.equipments.length > 0 ? (
                      <ul className="divide-y divide-[#f1f5f9]">
                        {selectedMission.equipments.map(me => {
                          const def = equipmentDefs.find(e => e.id === me.equipmentId);
                          const isChecked = !!me.checked;
                          const isFlashing = scannedItemId === me.equipmentId;

                          return (
                            <li 
                              key={me.equipmentId}
                              onClick={() => {
                                if (selectedMission.status !== 'Terminée') {
                                  handleToggle(selectedMission.id, me.equipmentId);
                                }
                              }}
                              className={`p-3.5 flex items-center justify-between cursor-pointer transition-all ${
                                isChecked ? 'bg-emerald-50/10 text-[#94a3b8]' : 'hover:bg-slate-50'
                              } ${isFlashing ? 'bg-amber-100 ring-2 ring-amber-400 animate-pulse duration-500' : ''}`}
                            >
                              <div className="flex items-center gap-3">
                                {/* Large Checkbox touch target */}
                                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                  isChecked 
                                    ? 'bg-emerald-500 border-emerald-500 text-white' 
                                    : 'border-slate-300 bg-white hover:border-slate-400'
                                }`}>
                                  {isChecked && <Check className="w-4 h-4 stroke-[3]" />}
                                </div>
                                <span className={`text-xs sm:text-sm font-bold ${isChecked ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                  {def?.name || 'Matériel inconnu'}
                                </span>
                              </div>
                              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md transition-colors shrink-0 ${
                                isChecked 
                                  ? 'bg-emerald-50 text-emerald-700' 
                                  : 'bg-slate-100 text-[#475569]'
                              }`}>
                                {me.quantity} unité{me.quantity > 1 ? 's' : ''}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <div className="p-8 text-center text-xs text-[#94a3b8] italic">
                        Aucun matériel requis pour cette mission.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab: REPORT */}
              {drawerTab === 'report' && (
                <div className="space-y-4">
                  <div className="bg-white border border-[#e2e8f0]/60 p-4 rounded-2xl shadow-xs space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="font-extrabold text-sm text-slate-900">Rapport de fin de mission</h3>
                      
                      {/* Local saving status indicator */}
                      <span className="text-[10px] font-bold font-mono">
                        {savingStatus === 'saving' && <span className="text-amber-500">Enregistrement...</span>}
                        {savingStatus === 'saved' && <span className="text-emerald-500">Sauvegardé ✓</span>}
                        {savingStatus === 'idle' && <span className="text-slate-400">Sauvegarde locale active</span>}
                      </span>
                    </div>

                    <p className="text-xs text-[#64748b] leading-relaxed">
                      Saisissez ici les observations, retours, anomalies ou matériels endommagés lors de cette mission.
                    </p>

                    <textarea
                      placeholder="Ex: Le projecteur LED #4 ne s'allume pas, à vérifier à l'entrepôt. Client très satisfait, démontage rapide..."
                      value={localReports[selectedMission.id] || ''}
                      onChange={(e) => handleReportChange(selectedMission.id, e.target.value)}
                      rows={6}
                      className="w-full text-xs sm:text-sm border border-[#e2e8f0]/80 rounded-xl p-3 bg-slate-50 text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none transition-all resize-none"
                    ></textarea>

                    <div className="flex justify-between items-center pt-2">
                      <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>Enregistré sur cet appareil</span>
                      </span>
                      {localReports[selectedMission.id] && (
                        <button
                          onClick={() => {
                            triggerVibrate('click');
                            if (window.confirm('Voulez-vous effacer le rapport local ?')) {
                              handleReportChange(selectedMission.id, '');
                            }
                          }}
                          className="text-red-500 hover:text-red-700 text-xs font-bold cursor-pointer"
                        >
                          Effacer
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Summary of local storage warning */}
                  <div className="bg-white border border-[#e2e8f0]/60 p-4 rounded-xl text-[11px] text-[#64748b] leading-relaxed font-semibold shadow-xs">
                    Les rapports sont enregistrés sur votre terminal. Lorsque vous terminez la mission, l'administrateur consultera vos remarques directement lors de l'archivage ou de votre débriefing technique.
                  </div>
                </div>
              )}
            </div>
          </div>

            {/* Bottom Safe Area Padding inside drawer */}
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

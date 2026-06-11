import React, { useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import {
  QrCode, Pencil, Search, X, LayoutGrid, CalendarDays,
  Package, AlertTriangle, CheckCircle2, Layers, Maximize2, Minimize2, Upload, List
} from 'lucide-react';
import { useStore } from '../store';
import { Equipment as EquipmentType, EquipmentCategory, Mission } from '../types';
import EquipmentModal from '../components/EquipmentModal';
import MissionModal from '../components/MissionModal';
import { QRCodePrintModal } from '../components/QRCodePrintModal';
import CSVImportModal from '../components/CSVImportModal';
import EquipmentTable from '../components/EquipmentTable';
import { useIsMobile } from '../hooks/useMediaQuery';
import { useFullscreen } from '../hooks/useFullscreen';

// ── Palette couleur par catégorie ──────────────────────────────────────────
const CATEGORY_COLORS: Record<EquipmentCategory | string, { bg: string; text: string; border: string; dot: string }> = {
  Arcade:        { bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-200', dot: '#7c3aed' },
  Sonorisation:  { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',   dot: '#1d4ed8' },
  Éclairage:     { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',  dot: '#b45309' },
  Scène:         { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200',dot: '#047857' },
  Décoration:    { bg: 'bg-pink-50',    text: 'text-pink-700',    border: 'border-pink-200',   dot: '#be185d' },
  Autre:         { bg: 'bg-slate-50',   text: 'text-slate-600',   border: 'border-slate-200',  dot: '#475569' },
};

const CATEGORIES: EquipmentCategory[] = ['Arcade', 'Sonorisation', 'Éclairage', 'Scène', 'Décoration', 'Autre'];

// Calcule la quantité réservée (toutes missions confondues) pour un équipement
function computeReserved(equipmentId: string, missions: Mission[]): number {
  return missions.reduce((sum, mission) => {
    const eq = mission.equipments.find(e => e.equipmentId === equipmentId);
    return sum + (eq ? eq.quantity : 0);
  }, 0);
}

type ViewMode = 'calendar' | 'grid' | 'table';

export default function Equipment() {
  const isMobile = useIsMobile();
  const equipment = useStore(state => state.equipment);
  const missions = useStore(state => state.missions);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EquipmentType | null>(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedEqId, setSelectedEqId] = useState('');
  const [selectedEqName, setSelectedEqName] = useState('');
  const [importModalOpen, setImportModalOpen] = useState(false);

  // ── Filtres ──────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [activeCategories, setActiveCategories] = useState<Set<EquipmentCategory>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const { ref: fsRef, isFullscreen, toggle: toggleFullscreen } = useFullscreen();
  const [missionModalOpen, setMissionModalOpen] = useState(false);
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);

  const toggleCategory = (cat: EquipmentCategory) => {
    setActiveCategories(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  // ── Filtrage des équipements ─────────────────────────────────────────────
  const filteredEquipment = useMemo(() => {
    return equipment.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = activeCategories.size === 0 || activeCategories.has(item.category);
      return matchSearch && matchCat;
    });
  }, [equipment, search, activeCategories]);

  // ── Stats globales ────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    let totalItems = filteredEquipment.length;
    let overbooked = 0;
    let fullyAvailable = 0;
    filteredEquipment.forEach(item => {
      const reserved = computeReserved(item.id, missions);
      if (reserved > item.totalQuantity) overbooked++;
      else if (reserved === 0) fullyAvailable++;
    });
    return { totalItems, overbooked, fullyAvailable };
  }, [filteredEquipment, missions]);

  // ── Événements calendrier timeGrid (1 par mission filtrée) ───────────────
  const filteredEqIds = useMemo(
    () => new Set(filteredEquipment.map(e => e.id)),
    [filteredEquipment]
  );

  const calendarEvents = useMemo(() => {
    return missions
      .filter(m => m.equipments.some(eq => filteredEqIds.has(eq.equipmentId)))
      .map(m => {
        const usedEq = m.equipments
          .filter(eq => filteredEqIds.has(eq.equipmentId))
          .map(eq => {
            const item = equipment.find(e => e.id === eq.equipmentId);
            return item ? `${item.name}\u00a0\u00d7${eq.quantity}` : '';
          })
          .filter(Boolean);
        return {
          id: m.id,
          title: m.title,
          start: m.start,
          end: m.end,
          backgroundColor: m.color,
          borderColor: m.color,
          extendedProps: { missionId: m.id, eqList: usedEq },
        };
      });
  }, [missions, equipment, filteredEqIds]);

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (item: EquipmentType | undefined) => {
    if (!item) return;
    setEditing(item);
    setModalOpen(true);
  };
  const openQR = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    setSelectedEqId(id);
    setSelectedEqName(name);
    setPrintModalOpen(true);
  };

  return (
    <div ref={fsRef} className={`bg-white border border-[#e2e8f0] p-3 sm:p-6 flex flex-col relative z-0 gap-4 ${isFullscreen ? 'h-screen overflow-auto' : 'h-full'}`}>

      {/* ── En-tête ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg sm:text-xl font-bold text-[#0f172a] uppercase tracking-tight">
            Planning du Matériel
          </h2>
          <p className="text-xs text-[#64748b] font-medium">
            Allocation et disponibilité du matériel — {filteredEquipment.length} produit{filteredEquipment.length > 1 ? 's' : ''} affiché{filteredEquipment.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Toggle vue */}
          <div className="flex items-center bg-[#f1f5f9] rounded-lg p-1 gap-1">
            <button
              onClick={() => setViewMode('calendar')}
              title="Vue Calendrier"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'calendar'
                  ? 'bg-white text-[#0f172a] shadow-sm'
                  : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Calendrier</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              title="Vue Grille"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-[#0f172a] shadow-sm'
                  : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Stock</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              title="Vue Liste"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-[#0f172a] shadow-sm'
                  : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Liste</span>
            </button>
          </div>
          {/* Plein écran */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
            className="p-2 rounded-md text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9] border border-[#e2e8f0] transition-colors"
            aria-label={isFullscreen ? 'Quitter le plein écran' : 'Passer en plein écran'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setImportModalOpen(true)}
            className="flex items-center justify-center gap-2 border border-[#cbd5e1] text-[#0f172a] hover:bg-[#f8fafc] px-4 py-2 rounded-md text-sm font-medium transition-colors shrink-0 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Importer CSV
          </button>
          <button
            onClick={openCreate}
            className="flex items-center justify-center gap-2 bg-[#0f172a] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-black transition-colors shrink-0 cursor-pointer"
          >
            + Nouveau
          </button>
        </div>
      </div>

      {/* ── Barre de filtres ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Recherche */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
          <input
            type="text"
            placeholder="Rechercher un matériel…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm border border-[#e2e8f0] rounded-lg bg-[#f8fafc] focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b]">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {/* Pills catégories */}
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map(cat => {
            const c = CATEGORY_COLORS[cat];
            const isActive = activeCategories.has(cat);
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                  isActive
                    ? `${c.bg} ${c.text} ${c.border} shadow-sm`
                    : 'bg-white text-[#64748b] border-[#e2e8f0] hover:border-[#cbd5e1]'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: isActive ? c.dot : '#cbd5e1' }}
                />
                {cat}
              </button>
            );
          })}
          {activeCategories.size > 0 && (
            <button
              onClick={() => setActiveCategories(new Set())}
              className="px-2.5 py-1 rounded-full text-xs font-semibold text-[#64748b] hover:text-red-600 transition-colors"
            >
              Effacer
            </button>
          )}
        </div>
      </div>

      {/* ── Barre de statut ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 text-xs flex-wrap">
        <div className="flex items-center gap-1.5 text-[#64748b]">
          <Layers className="w-3.5 h-3.5" />
          <span><strong className="text-[#0f172a]">{stats.totalItems}</strong> produits</span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-600">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span><strong>{stats.fullyAvailable}</strong> disponibles</span>
        </div>
        {stats.overbooked > 0 && (
          <div className="flex items-center gap-1.5 text-red-600 font-semibold animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{stats.overbooked} surréservé{stats.overbooked > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* ── Contenu principal ────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0">
        {viewMode === 'calendar' ? (
          <FullCalendar
            key={`${isMobile ? 'mobile' : 'desktop'}-${search}-${[...activeCategories].join()}`}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={isMobile ? 'timeGridDay' : 'timeGridWeek'}
            headerToolbar={
              isMobile
                ? { left: 'prev,next', center: 'title', right: 'today' }
                : { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }
            }
            footerToolbar={
              isMobile
                ? { left: '', center: 'dayGridMonth,timeGridWeek,timeGridDay', right: '' }
                : undefined
            }
            events={calendarEvents}
            editable={false}
            selectable={false}
            dayMaxEvents={true}
            eventClick={(info) => {
              setSelectedMissionId(info.event.extendedProps.missionId);
              setMissionModalOpen(true);
            }}
            height="100%"
            locale="fr"
            buttonText={{
              today: "Aujourd'hui",
              month: 'Mois',
              week: 'Semaine',
              day: 'Jour',
              list: 'Liste',
            }}
            slotMinTime="06:00:00"
            slotMaxTime="24:00:00"
            allDaySlot={false}
            eventContent={(info) => (
              <div className="flex flex-col overflow-hidden text-xs px-0.5 py-0.5">
                <div className="font-semibold truncate">{info.event.title}</div>
                <div className="opacity-85 truncate text-[10px]">
                  {info.event.extendedProps.eqList.slice(0, 2).join(' · ')}
                  {info.event.extendedProps.eqList.length > 2 && ` +${info.event.extendedProps.eqList.length - 2}`}
                </div>
              </div>
            )}
          />
        ) : viewMode === 'grid' ? (
          <GridView
            equipment={filteredEquipment}
            missions={missions}
            onEdit={openEdit}
            onQR={openQR}
          />
        ) : (
          <EquipmentTable
            equipment={filteredEquipment}
            missions={missions}
            onEdit={openEdit}
            onQR={openQR}
          />
        )}
      </div>

      {/* ── Modales ──────────────────────────────────────────────────────── */}
      {modalOpen && (
        <EquipmentModal
          isOpen={modalOpen}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          equipment={editing}
        />
      )}
      {missionModalOpen && (
        <MissionModal
          isOpen={missionModalOpen}
          onClose={() => setMissionModalOpen(false)}
          missionId={selectedMissionId}
          initialDates={null}
        />
      )}
      {printModalOpen && (
        <QRCodePrintModal
          isOpen={printModalOpen}
          onClose={() => setPrintModalOpen(false)}
          equipmentId={selectedEqId}
          equipmentName={selectedEqName}
        />
      )}
      {importModalOpen && (
        <CSVImportModal
          isOpen={importModalOpen}
          onClose={() => setImportModalOpen(false)}
        />
      )}
    </div>
  );
}

// ── Sous-composant : ligne ressource du calendrier ─────────────────────────
function ResourceRow({
  arg, equipment, missions, onEdit, onQR,
}: {
  arg: any;
  equipment: EquipmentType[];
  missions: Mission[];
  onEdit: (item: EquipmentType | undefined) => void;
  onQR: (e: React.MouseEvent, id: string, name: string) => void;
}) {
  const item = equipment.find(e => e.id === arg.resource.id);
  const reserved = item ? computeReserved(item.id, missions) : 0;
  const available = item ? item.totalQuantity - reserved : 0;
  const isOverbooked = available < 0;
  const cat = item?.category ?? 'Autre';
  const colors = CATEGORY_COLORS[cat] ?? CATEGORY_COLORS['Autre'];

  return (
    <div className="flex items-center justify-between w-full pr-2 py-0.5 gap-2 min-w-0">
      <div className="flex items-center gap-2 min-w-0">
        {/* Dot catégorie */}
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: colors.dot }}
        />
        <button
          type="button"
          onClick={() => onEdit(item)}
          className="font-semibold text-[#0f172a] text-sm truncate text-left hover:text-[#2563eb] transition-colors flex items-center gap-1 group min-w-0"
          title="Modifier ce matériel"
        >
          <span className="truncate">{arg.resource.title}</span>
          <Pencil className="w-3 h-3 text-[#94a3b8] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </button>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Quantité disponible */}
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap ${
            isOverbooked
              ? 'bg-red-100 text-red-700 border border-red-200'
              : available === 0
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}
          title={`${reserved} réservé(s) · ${item?.totalQuantity ?? 0} total`}
        >
          {isOverbooked ? `−${Math.abs(available)}` : `+${available}`}/{item?.totalQuantity ?? 0}
        </span>
        {/* Bouton QR */}
        <button
          onClick={(e) => item && onQR(e, item.id, item.name)}
          className="p-1 text-[#94a3b8] hover:text-[#2563eb] hover:bg-[#eff6ff] rounded transition-colors"
          title="Générer QR Code"
        >
          <QrCode className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Sous-composant : Vue Grille (cartes produits) ─────────────────────────
function GridView({
  equipment, missions, onEdit, onQR,
}: {
  equipment: EquipmentType[];
  missions: Mission[];
  onEdit: (item: EquipmentType | undefined) => void;
  onQR: (e: React.MouseEvent, id: string, name: string) => void;
}) {
  if (equipment.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-[#94a3b8] gap-3">
        <Package className="w-12 h-12 opacity-30" />
        <p className="text-sm font-medium">Aucun matériel ne correspond à votre recherche</p>
      </div>
    );
  }

  // Grouper par catégorie
  const grouped = CATEGORIES.reduce<Record<string, EquipmentType[]>>((acc, cat) => {
    const items = equipment.filter(e => e.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {});

  return (
    <div className="h-full overflow-y-auto pr-1 space-y-6">
      {Object.entries(grouped).map(([cat, items]) => {
        const colors = CATEGORY_COLORS[cat] ?? CATEGORY_COLORS['Autre'];
        return (
          <div key={cat}>
            {/* En-tête de groupe */}
            <div className={`flex items-center gap-2 mb-3 pb-2 border-b ${colors.border}`}>
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.dot }} />
              <h3 className={`text-xs font-bold uppercase tracking-widest ${colors.text}`}>{cat}</h3>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                {items.length}
              </span>
            </div>
            {/* Grille de cartes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {items.map(item => {
                const reserved = computeReserved(item.id, missions);
                const available = item.totalQuantity - reserved;
                const isOverbooked = available < 0;
                const usedMissions = missions.filter(m =>
                  m.equipments.some(e => e.equipmentId === item.id)
                );

                return (
                  <div
                    key={item.id}
                    className={`eq-card group relative bg-white border rounded-xl p-4 flex flex-col gap-3 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${
                      isOverbooked ? 'border-red-200 shadow-red-50' : 'border-[#e2e8f0]'
                    }`}
                    onClick={() => onEdit(item)}
                  >
                    {/* Badge catégorie */}
                    <div className="flex items-start justify-between gap-2">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.dot }} />
                        {cat}
                      </span>
                      {isOverbooked && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          Surréservé
                        </span>
                      )}
                    </div>

                    {/* Nom */}
                    <div>
                      <p className="font-bold text-[#0f172a] text-sm leading-tight truncate group-hover:text-[#2563eb] transition-colors">
                        {item.name}
                      </p>
                    </div>

                    {/* Barre de disponibilité */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-semibold text-[#64748b]">
                        <span>Disponible</span>
                        <span className={isOverbooked ? 'text-red-600' : available === 0 ? 'text-amber-600' : 'text-emerald-600'}>
                          {Math.max(0, available)}/{item.totalQuantity}
                        </span>
                      </div>
                      <div className="h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isOverbooked ? 'bg-red-500' : available === 0 ? 'bg-amber-400' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, (reserved / item.totalQuantity) * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Missions actives */}
                    {usedMissions.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {usedMissions.slice(0, 3).map(m => (
                          <span
                            key={m.id}
                            className="text-[10px] font-medium px-1.5 py-0.5 rounded-md text-white truncate max-w-[90px]"
                            style={{ backgroundColor: m.color }}
                            title={m.title}
                          >
                            {m.title}
                          </span>
                        ))}
                        {usedMissions.length > 3 && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-[#f1f5f9] text-[#64748b]">
                            +{usedMissions.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1 border-t border-[#f1f5f9]">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                        className="flex items-center gap-1 text-[10px] font-semibold text-[#64748b] hover:text-[#2563eb] transition-colors"
                      >
                        <Pencil className="w-3 h-3" /> Modifier
                      </button>
                      <span className="text-[#e2e8f0]">·</span>
                      <button
                        type="button"
                        onClick={(e) => onQR(e, item.id, item.name)}
                        className="flex items-center gap-1 text-[10px] font-semibold text-[#64748b] hover:text-[#2563eb] transition-colors"
                      >
                        <QrCode className="w-3 h-3" /> QR Code
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { Search, List, Calendar, Users, Truck, Package, FileText, ChevronRight, MapPin, Wand2, Loader2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from '../store/toast';
import { MissionType, MissionStatus, MissionEquipment } from '../types';

export default function MissionList() {
  const missions = useStore((state) => state.missions);
  const trucks = useStore((state) => state.trucks);
  const technicians = useStore((state) => state.technicians);
  const addMission = useStore((state) => state.addMission);
  const fetchMissions = useStore((state) => state.fetchMissions);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Planifiée' | 'En cours' | 'Terminée'>('all');
  const [generating, setGenerating] = useState(false);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return missions
      .filter((mission) => {
        const matchesSearch = query === '' || [mission.title, mission.client, mission.address, mission.type]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(query);
        const matchesStatus = statusFilter === 'all' || mission.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => b.start.getTime() - a.start.getTime());
  }, [missions, search, statusFilter]);

  const getStatusBadge = (status: string) => {
  switch (status) {
      case 'Planifiée':
        return <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eff6ff] px-2.5 py-1 text-[10px] font-bold text-[#2563eb] uppercase tracking-wide border border-[#bfdbfe]"><span className="w-1.5 h-1.5 rounded-full bg-[#93c5fd]" />Planifiée</span>;
      case 'En cours':
        return <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fffbeb] px-2.5 py-1 text-[10px] font-bold text-[#d97706] uppercase tracking-wide border border-[#fde68a]"><span className="w-1.5 h-1.5 rounded-full bg-[#fbbf24]" />En cours</span>;
      case 'Terminée':
        return <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ecfdf5] px-2.5 py-1 text-[10px] font-bold text-[#059669] uppercase tracking-wide border border-[#a7f3d0]"><span className="w-1.5 h-1.5 rounded-full bg-[#34d399]" />Terminée</span>;
      default:
        return null;
    }
  };

  const buildJune2026Missions = () => {
    const year = 2026;
    const month = 5; // June (0-based)
    const startDay = 17;
    const eventsPerDay = 3;
    const totalEvents = 10;

    const clients = ['Paris Event', 'Lyon Show', 'Studio Lumière', 'Agence Rise', 'Dj Marno', 'BJ Festival', 'Star Prod', 'Chez Léo', 'Night Vibe', 'Le Hangar'];
    const streets = [
      '12 Rue de la République', '8 Av. Jean Jaurès', '45 Bd Victor Hugo', '2 Rue de la Paix',
      '15 Rue des Fêtes', '33 Av. de Clichy', '6 Rue Oberkampf', '19 Rue de Bretagne'
    ];
    const cities = ['Paris', 'Boulogne-Billancourt', 'Montreuil', 'Saint-Denis', 'Nanterre', 'Ivry-sur-Seine', 'Vitry-sur-Seine', 'Charenton-le-Pont'];
    const prefixes = ['Montage', 'Montage', 'Montage', 'Montage', 'Montage', 'Démontage', 'Démontage', 'Livraison', 'Événement complet'];
    const suffixes = [
      'sono + scène', 'éclairage + effets', 'showcase', 'soirée privée', 'festival',
      'production', 'tournée', 'séminaire', 'lancement', 'mariage'
    ];

    const titles = [
      'Montage scène et sono', 'Montage structure et autres équipements', 'Démontage complet',
      'Livraison camion 12T3', 'Événement complet', 'Montage light show', 'Démontage après soirée',
      'Livraison et récupération de matériel', 'Montage pour cocktail événementiel', 'Prestation complète'
    ];

    const setupDurations = [60, 90, 120, 150, 180];

    const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
    const pickUniqueIds = <T,>(arr: T[], count: number): T[] => {
      const shuffled = [...arr].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, Math.min(count, arr.length));
    };

    const startHours = [6, 7, 8, 9, 10, 11];
    const startMinutes = [0, 15, 30];
    const durations = [4, 5, 6, 7, 8];

    const generated: {
      title: string;
      type: 'Montage' | 'Démontage' | 'Livraison' | 'Événement complet';
      client: string;
      address: string;
      start: Date;
      end: Date;
      technicianIds: string[];
      truckId?: string;
      status: 'Planifiée';
      color: string;
      deliveryDate?: Date;
      pickupDate?: Date;
      setupDuration?: number;
    }[] = [];

    let created = 0;
    let dayOffset = 0;

    while (created < totalEvents) {
      const remaining = totalEvents - created;
      const eventsToday = Math.min(eventsPerDay, remaining);

      for (let i = 0; i < eventsToday; i += 1) {
        const currentDay = startDay + dayOffset;
        if (currentDay > 30) {
          return generated.sort((a, b) => a.start.getTime() - b.start.getTime());
        }

        const startHour = pick(startHours);
        const startMinute = pick(startMinutes);
        const durationHours = pick(durations);
        const setupDurationMinutes = pick(setupDurations);

        const start = new Date(year, month, currentDay, startHour, startMinute);
        const end = new Date(year, month, currentDay, startHour + durationHours, startMinute);
        const type = pick(prefixes) as MissionType;
        const client = pick(clients);
        const street = pick(streets);
        const city = pick(cities);

        // Livraison : aléatoire entre J-1 05h et J start-1h (pertinent pour l'IDF)
        const deliveryOffsetDays = Math.random() < 0.7 ? 0 : -1; // 70% même jour, 30% veille
        const deliveryDay = currentDay + deliveryOffsetDays;
        const deliveryHour = deliveryOffsetDays === 0
          ? Math.max(5, startHour - Math.floor(Math.random() * 3) - 1)
          : pick([17, 18, 19, 20, 21, 22]);
        const deliveryMinute = pick(startMinutes);
        const deliveryDate = new Date(year, month, deliveryDay, deliveryHour, deliveryMinute);

        // Reprise : aléatoire entre J end+1h et J+1 22h
        const pickupOffsetDays = Math.random() < 0.6 ? 0 : 1; // 60% même jour, 40% lendemain
        const pickupDay = currentDay + pickupOffsetDays;
        const pickupHour = pickupOffsetDays === 0
          ? Math.min(23, startHour + durationHours + Math.floor(Math.random() * 3) + 1)
          : pick([8, 9, 10, 11, 12, 13, 14]);
        const pickupMinute = pick(startMinutes);
        const pickupDate = new Date(year, month, pickupDay, pickupHour, pickupMinute);

        generated.push({
          title: `${pick(titles)} ${pick(suffixes)} #${created + 1}`,
          type,
          client,
          address: `${street}, ${city}`,
          start,
          end,
          technicianIds: pickUniqueIds(technicians, 3).map(t => t.id),
          truckId: trucks.length > 0 ? pick(trucks).id : undefined,
          status: 'Planifiée',
          color: '#2563eb',
          deliveryDate,
          pickupDate,
          setupDuration: setupDurationMinutes,
        });

        created += 1;
      }

      dayOffset += 1;
    }

    return generated.sort((a, b) => a.start.getTime() - b.start.getTime());
  }

  const handleGenerateMissions = async () => {
    try {
      setGenerating(true);
      const data = buildJune2026Missions();

      await Promise.all(
        data.map(item =>
          addMission({
            title: item.title,
            type: item.type,
            client: item.client,
            address: item.address,
            start: item.start,
            end: item.end,
            technicianIds: item.technicianIds,
            truckId: item.truckId,
            status: item.status,
            color: item.color,
            requiredSkills: [],
            equipments: [],
            deliveryDate: item.deliveryDate,
            pickupDate: item.pickupDate,
            setupDuration: item.setupDuration,
          })
        )
      );

      await fetchMissions();
      toast.success('10 missions fictives juin 2026 générées.');
    } catch (error) {
      console.error(error);
      toast.error("Impossible de générer les missions d'exemple.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 flex flex-col gap-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <List className="w-5 h-5 text-[#2563eb]" />
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-[#0f172a] uppercase tracking-tight">Liste des missions</h1>
                <p className="text-[10px] sm:text-xs text-[#64748b]">Affichage en lecture seule sans action directe sur les missions.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleGenerateMissions}
              disabled={generating}
              className="inline-flex items-center gap-2 rounded-full bg-[#0f172a] text-white px-3 py-1.5 text-[10px] sm:text-xs font-bold shadow-sm hover:bg-black active:scale-95 transition-all disabled:opacity-60"
            >
              {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
              {generating ? 'Génération...' : '10 events juin'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['all', 'Planifiée', 'En cours', 'Terminée'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`rounded-full px-3 py-1.5 text-[10px] sm:text-xs font-bold transition-colors ${statusFilter === status ? 'bg-[#2563eb] text-white shadow-sm' : 'bg-white text-[#64748b] border border-[#e2e8f0] hover:border-[#cbd5e1]'}`}
              >
                {status === 'all' ? 'Toutes' : status}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une mission..."
            className="w-full pl-9 pr-3 py-2.5 border border-[#e2e8f0] rounded-xl bg-white text-sm text-[#0f172a] placeholder-[#94a3b8] focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Mobile cards */}
      <div className="flex-1 overflow-y-auto space-y-3 md:hidden">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-[#e2e8f0] bg-white p-6 text-center text-sm text-[#64748b]">
            Aucune mission correspondant aux critères.
          </div>
        ) : (
          filtered.map((mission) => {
            const truck = trucks.find((t) => t.id === mission.truckId);
            const technicianCount = mission.technicianIds.length;
            return (
              <div
                key={mission.id}
                className="rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-[9px] font-bold text-[#94a3b8] uppercase tracking-wider mb-0.5">{mission.type}</div>
                    <h2 className="font-extrabold text-sm text-[#0f172a] leading-snug truncate">{mission.title}</h2>
                    <p className="text-[11px] text-[#64748b] truncate mt-0.5">{mission.client}</p>
                  </div>
                  {getStatusBadge(mission.status)}
                </div>

                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center gap-2 text-[11px] text-[#475569]">
                    <Calendar className="w-3.5 h-3.5 text-[#64748b] shrink-0" />
                    <span className="truncate">
                      {format(mission.start, 'dd/MM/yyyy HH:mm', { locale: fr })}–{format(mission.end, 'dd/MM/yyyy HH:mm', { locale: fr })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#475569]">
                    <MapPin className="w-3.5 h-3.5 text-[#64748b] shrink-0" />
                    <span className="truncate">{mission.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#475569]">
                    <Truck className="w-3.5 h-3.5 text-[#64748b] shrink-0" />
                    <span className="truncate">{truck ? truck.name : 'Non attribué'}</span>
                  </div>
                  {mission.deliveryDate && (
                    <div className="flex items-center gap-2 text-[11px] text-[#475569]">
                      <Calendar className="w-3.5 h-3.5 text-[#2563eb] shrink-0" />
                      <span className="truncate">Livraison : {format(mission.deliveryDate, 'dd/MM/yyyy HH:mm', { locale: fr })}</span>
                    </div>
                  )}
                  {mission.pickupDate && (
                    <div className="flex items-center gap-2 text-[11px] text-[#475569]">
                      <Calendar className="w-3.5 h-3.5 text-[#059669] shrink-0" />
                      <span className="truncate">Reprise : {format(mission.pickupDate, 'dd/MM/yyyy HH:mm', { locale: fr })}</span>
                    </div>
                  )}
                  {mission.setupDuration != null && (
                    <div className="flex items-center gap-2 text-[11px] text-[#475569]">
                      <Clock className="w-3.5 h-3.5 text-[#d97706] shrink-0" />
                      <span className="truncate">Montage : {mission.setupDuration} min</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#f1f5f9]">
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-[#475569]">
                    <Users className="w-3.5 h-3.5 text-[#64748b]" />
                    <span>{technicianCount} technicien{technicianCount > 1 ? 's' : ''}</span>
                  </div>
                  <Link
                    to={`/missions/${mission.id}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#e2e8f0] px-3 py-1 text-[11px] font-bold text-[#2563eb] hover:bg-[#eff6ff] active:scale-95 transition-all"
                  >
                    Détails
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:flex flex-1 overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-sm">
        <div className="overflow-x-auto h-full">
          <table className="min-w-full border-separate border-spacing-0">
            <thead className="bg-[#f8fafc] border-b border-[#e2e8f0]">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-[#64748b]">Mission</th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-[#64748b]">Client</th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-[#64748b]">Statut</th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-[#64748b]">Type</th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-[#64748b]">Techniciens</th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-[#64748b]">Camion</th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-[#64748b]">Période</th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-[#64748b]">Livraison</th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-[#64748b]">Reprise</th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-[#64748b]">Durée</th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-[#64748b]">Détails</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-10 text-center text-sm text-[#64748b]">Aucune mission correspondant aux critères.</td>
                </tr>
              ) : (
                filtered.map((mission) => {
                  const truck = trucks.find((t) => t.id === mission.truckId);
                  const technicianCount = mission.technicianIds.length;
                  return (
                    <tr key={mission.id} className="border-b border-[#f1f5f9] hover:bg-[#f8fafc]">
                      <td className="px-4 py-4 align-top">
                        <div className="font-semibold text-[#0f172a] truncate max-w-[220px]">{mission.title}</div>
                        <div className="text-xs text-[#64748b] truncate max-w-[220px]">{mission.address}</div>
                      </td>
                      <td className="px-4 py-4 align-top text-sm text-[#334155]">{mission.client}</td>
                      <td className="px-4 py-4 align-top text-sm">{getStatusBadge(mission.status)}</td>
                      <td className="px-4 py-4 align-top text-sm text-[#334155]">{mission.type}</td>
                      <td className="px-4 py-4 align-top text-sm text-[#334155]">{technicianCount}</td>
                      <td className="px-4 py-4 align-top text-sm text-[#334155]">{truck ? truck.name : 'Non attribué'}</td>
                      <td className="px-4 py-4 align-top text-sm text-[#334155]">
                        {format(mission.start, 'dd/MM/yyyy HH:mm', { locale: fr })}–{format(mission.end, 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </td>
                      <td className="px-4 py-4 align-top text-sm text-[#334155]">
                        {mission.deliveryDate ? format(mission.deliveryDate, 'dd/MM/yyyy HH:mm', { locale: fr }) : '—'}
                      </td>
                      <td className="px-4 py-4 align-top text-sm text-[#334155]">
                        {mission.pickupDate ? format(mission.pickupDate, 'dd/MM/yyyy HH:mm', { locale: fr }) : '—'}
                      </td>
                      <td className="px-4 py-4 align-top text-sm text-[#334155]">
                        {mission.setupDuration != null ? `${mission.setupDuration} min` : '—'}
                      </td>
                      <td className="px-4 py-4 align-top text-sm text-[#2563eb]">
                        <Link
                          to={`/missions/${mission.id}`}
                          className="inline-flex items-center gap-2 rounded-full border border-[#e2e8f0] px-3 py-1 text-xs font-semibold text-[#2563eb] hover:bg-[#eff6ff]"
                        >
                          Voir
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

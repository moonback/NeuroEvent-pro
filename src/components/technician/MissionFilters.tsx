import React, { useState } from 'react';
import { Search, X, SlidersHorizontal, Check } from 'lucide-react';
import { triggerVibrate, type MainTab, type DateFilter, type StatusFilter } from './useTechDashboard';

interface MissionFiltersProps {
  activeTab: MainTab;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  dateFilter: DateFilter;
  setDateFilter: (v: DateFilter) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (v: StatusFilter) => void;
}

export default function MissionFilters({
  activeTab,
  searchTerm,
  setSearchTerm,
  dateFilter,
  setDateFilter,
  statusFilter,
  setStatusFilter,
}: MissionFiltersProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const datePills: { id: DateFilter; label: string }[] = [
    { id: 'all', label: 'Tous les jours' },
    { id: 'today', label: "Aujourd'hui" },
    { id: 'week', label: 'Cette semaine' },
  ];

  const statusPills: { id: StatusFilter; label: string; color: string }[] = [
    { id: 'all', label: 'Tous les statuts', color: 'var(--tech-accent)' },
    { id: 'Planifiée', label: 'Planifiée', color: '#60a5fa' },
    { id: 'En cours', label: 'En cours', color: '#fbbf24' },
  ];

  const hasActiveFilters = dateFilter !== 'all' || (activeTab === 'active' && statusFilter !== 'all');

  const getActiveFilterLabels = () => {
    const labels: { type: 'date' | 'status'; label: string }[] = [];
    if (dateFilter !== 'all') {
      const found = datePills.find((p) => p.id === dateFilter);
      if (found) labels.push({ type: 'date', label: found.label });
    }
    if (activeTab === 'active' && statusFilter !== 'all') {
      const found = statusPills.find((p) => p.id === statusFilter);
      if (found) labels.push({ type: 'status', label: found.label });
    }
    return labels;
  };

  const activeLabels = getActiveFilterLabels();

  return (
    <div className="px-4 py-2 space-y-2">
      {/* Search & Filter Row */}
      <div className="flex gap-2">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--tech-text-muted)' }}
          />
          <input
            type="text"
            placeholder="Rechercher une mission..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 text-xs rounded-xl outline-none transition-all font-semibold"
            style={{
              background: 'var(--tech-card)',
              border: '1px solid var(--tech-border)',
              color: 'var(--tech-text)',
              caretColor: 'var(--tech-accent)',
            }}
          />
          {searchTerm && (
            <button
              onClick={() => {
                triggerVibrate('click');
                setSearchTerm('');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 cursor-pointer"
              style={{ color: 'var(--tech-text-muted)' }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Toggle Button */}
        <button
          onClick={() => {
            triggerVibrate('click');
            setModalOpen(true);
          }}
          className="p-2.5 rounded-xl border flex items-center justify-center relative transition-all active:scale-90"
          style={{
            background: hasActiveFilters ? 'var(--tech-accent-soft)' : 'var(--tech-card)',
            borderColor: hasActiveFilters ? 'var(--tech-accent)' : 'var(--tech-border)',
            color: hasActiveFilters ? 'var(--tech-accent)' : 'var(--tech-text-secondary)',
          }}
        >
          <SlidersHorizontal className="w-4 h-4" />
          {hasActiveFilters && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#090d16]" />
          )}
        </button>
      </div>

      {/* Active Filter Chips */}
      {activeLabels.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {activeLabels.map((item) => (
            <div
              key={item.label}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border bg-slate-900"
              style={{
                borderColor: 'var(--tech-border-strong)',
                color: 'var(--tech-text-secondary)',
              }}
            >
              <span>{item.label}</span>
              <button
                onClick={() => {
                  triggerVibrate('click');
                  if (item.type === 'date') setDateFilter('all');
                  else setStatusFilter('all');
                }}
                className="hover:text-red-400 p-0.5 cursor-pointer ml-0.5"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
          <button
            onClick={() => {
              triggerVibrate('click');
              setDateFilter('all');
              setStatusFilter('all');
            }}
            className="text-[9px] font-extrabold text-[#ef4444] ml-1 self-center hover:underline"
          >
            Effacer tout
          </button>
        </div>
      )}

      {/* Filter Bottom Sheet Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setModalOpen(false)}
          />

          {/* Sheet */}
          <div className="relative bg-[#161616] border-t border-slate-800 rounded-t-3xl w-full max-w-md shadow-2xl overflow-hidden z-10 p-5 space-y-5 animate-fade-in">
            {/* Grab Notch */}
            <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-1" />

            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Filtrer les missions</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Date filter section */}
            <div className="space-y-2">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Date</label>
              <div className="flex flex-col gap-2">
                {datePills.map((p) => {
                  const active = dateFilter === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        triggerVibrate('click');
                        setDateFilter(p.id);
                      }}
                      className="flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all text-left"
                      style={{
                        background: active ? 'var(--tech-accent-soft)' : 'var(--tech-card)',
                        color: active ? 'var(--tech-accent)' : 'var(--tech-text)',
                        border: active ? '1px solid var(--tech-accent)' : '1px solid var(--tech-border)',
                      }}
                    >
                      <span>{p.label}</span>
                      {active && <Check className="w-4 h-4" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Status filter section (only for Active tab) */}
            {activeTab === 'active' && (
              <div className="space-y-2">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Statut</label>
                <div className="flex flex-col gap-2">
                  {statusPills.map((p) => {
                    const active = statusFilter === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          triggerVibrate('click');
                          setStatusFilter(p.id);
                        }}
                        className="flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all text-left"
                        style={{
                          background: active ? 'rgba(255,255,255,0.06)' : 'var(--tech-card)',
                          color: active ? p.color : 'var(--tech-text)',
                          border: active ? `1px solid ${p.color}40` : '1px solid var(--tech-border)',
                        }}
                      >
                        <span>{p.label}</span>
                        {active && <Check className="w-4 h-4" style={{ color: p.color }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Apply button */}
            <button
              onClick={() => {
                triggerVibrate('success');
                setModalOpen(false);
              }}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-black rounded-xl uppercase tracking-wider transition-all active:scale-[0.98]"
            >
              Appliquer les filtres
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

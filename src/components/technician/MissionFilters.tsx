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
            className="w-full pl-10 pr-9 py-2.5 text-xs rounded-2xl outline-none transition-all font-semibold"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--tech-border)',
              color: 'var(--tech-text)',
              caretColor: 'var(--tech-accent)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0,229,160,0.35)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,229,160,0.08)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--tech-border)';
              e.currentTarget.style.boxShadow = 'none';
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
          className="p-2.5 rounded-2xl flex items-center justify-center relative transition-all active:scale-90"
          style={{
            background: hasActiveFilters ? 'rgba(0,229,160,0.10)' : 'rgba(255,255,255,0.03)',
            border: hasActiveFilters ? '1px solid rgba(0,229,160,0.25)' : '1px solid var(--tech-border)',
            color: hasActiveFilters ? 'var(--tech-accent)' : 'var(--tech-text-secondary)',
            boxShadow: hasActiveFilters ? '0 0 12px rgba(0,229,160,0.12)' : 'none',
          }}
        >
          <SlidersHorizontal className="w-4 h-4" />
          {hasActiveFilters && (
            <span
              className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2"
              style={{
                background: 'var(--tech-accent)',
                borderColor: '#080b12',
                boxShadow: '0 0 6px rgba(0,229,160,0.5)',
              }}
            />
          )}
        </button>
      </div>

      {/* Active Filter Chips */}
      {activeLabels.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {activeLabels.map((item) => (
            <div
              key={item.label}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold"
              style={{
                background: 'rgba(0,229,160,0.06)',
                border: '1px solid rgba(0,229,160,0.15)',
                color: 'var(--tech-accent)',
              }}
            >
              <span>{item.label}</span>
              <button
                onClick={() => {
                  triggerVibrate('click');
                  if (item.type === 'date') setDateFilter('all');
                  else setStatusFilter('all');
                }}
                className="p-0.5 cursor-pointer ml-0.5 opacity-60 hover:opacity-100 transition-opacity"
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
            className="text-[9px] font-extrabold ml-1 self-center hover:underline"
            style={{ color: 'var(--tech-danger)', opacity: 0.7 }}
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
          <div
            className="relative rounded-t-3xl w-full max-w-md shadow-2xl overflow-hidden z-10 p-5 space-y-5 tech-animate-in"
            style={{
              background: 'rgba(13,17,28,0.98)',
              backdropFilter: 'blur(24px)',
              borderTop: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            {/* Grab Notch */}
            <div
              className="w-9 h-[3px] rounded-full mx-auto mb-1"
              style={{ background: 'rgba(255,255,255,0.12)' }}
            />

            <div className="flex justify-between items-center">
              <h3
                className="text-sm font-black uppercase tracking-widest"
                style={{ color: 'var(--tech-text)' }}
              >
                Filtres
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl transition-all active:scale-90"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--tech-border)',
                  color: 'var(--tech-text-muted)',
                }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Date filter section */}
            <div className="space-y-2">
              <label
                className="block text-[9px] font-black uppercase tracking-widest"
                style={{ color: 'var(--tech-text-muted)' }}
              >
                Période
              </label>
              <div className="flex flex-col gap-1.5">
                {datePills.map((p) => {
                  const active = dateFilter === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        triggerVibrate('click');
                        setDateFilter(p.id);
                      }}
                      className="flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left"
                      style={{
                        background: active
                          ? 'linear-gradient(135deg, rgba(0,229,160,0.10) 0%, rgba(0,229,160,0.05) 100%)'
                          : 'rgba(255,255,255,0.025)',
                        color: active ? 'var(--tech-accent)' : 'var(--tech-text)',
                        border: active ? '1px solid rgba(0,229,160,0.25)' : '1px solid var(--tech-border)',
                      }}
                    >
                      <span>{p.label}</span>
                      {active && (
                        <Check
                          className="w-3.5 h-3.5"
                          style={{ color: 'var(--tech-accent)' }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Status filter section (only for Active tab) */}
            {activeTab === 'active' && (
              <div className="space-y-2">
                <label
                  className="block text-[9px] font-black uppercase tracking-widest"
                  style={{ color: 'var(--tech-text-muted)' }}
                >
                  Statut
                </label>
                <div className="flex flex-col gap-1.5">
                  {statusPills.map((p) => {
                    const active = statusFilter === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          triggerVibrate('click');
                          setStatusFilter(p.id);
                        }}
                        className="flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left"
                        style={{
                          background: active ? `${p.color}12` : 'rgba(255,255,255,0.025)',
                          color: active ? p.color : 'var(--tech-text)',
                          border: active ? `1px solid ${p.color}35` : '1px solid var(--tech-border)',
                        }}
                      >
                        <span>{p.label}</span>
                        {active && <Check className="w-3.5 h-3.5" style={{ color: p.color }} />}
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
              className="w-full py-3.5 text-black text-xs font-black rounded-2xl uppercase tracking-wider transition-all active:scale-[0.97]"
              style={{
                background: 'linear-gradient(135deg, var(--tech-accent) 0%, var(--tech-accent-dim) 100%)',
                boxShadow: '0 4px 20px rgba(0,229,160,0.25)',
              }}
            >
              Appliquer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

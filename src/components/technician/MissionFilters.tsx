import React from 'react';
import { Search, X } from 'lucide-react';
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
  activeTab, searchTerm, setSearchTerm, dateFilter, setDateFilter, statusFilter, setStatusFilter
}: MissionFiltersProps) {
  const datePills: { id: DateFilter; label: string }[] = [
    { id: 'all', label: 'Tous' },
    { id: 'today', label: "Aujourd'hui" },
    { id: 'week', label: 'Semaine' },
  ];

  const statusPills: { id: StatusFilter; label: string; color: string }[] = [
    { id: 'all', label: 'Tous', color: 'var(--tech-accent)' },
    { id: 'Planifiée', label: 'Planifiées', color: '#60a5fa' },
    { id: 'En cours', label: 'En cours', color: '#fbbf24' },
  ];

  return (
    <div className="px-4 py-3 space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--tech-text-muted)' }} />
        <input
          type="text"
          placeholder="Rechercher par client, titre, lieu..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-9 py-2.5 text-sm rounded-xl outline-none transition-all font-medium"
          style={{
            background: 'var(--tech-card)',
            border: '1px solid var(--tech-border)',
            color: 'var(--tech-text)',
            caretColor: 'var(--tech-accent)',
          }}
        />
        {searchTerm && (
          <button
            onClick={() => { triggerVibrate('click'); setSearchTerm(''); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 cursor-pointer"
            style={{ color: 'var(--tech-text-muted)' }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Date pills */}
      <div className="flex gap-2">
        {datePills.map(p => (
          <button
            key={p.id}
            onClick={() => { triggerVibrate('click'); setDateFilter(p.id); }}
            className="px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all active:scale-95"
            style={dateFilter === p.id
              ? { background: 'var(--tech-accent)', color: '#000' }
              : { background: 'var(--tech-card)', color: 'var(--tech-text-secondary)', border: '1px solid var(--tech-border)' }
            }
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Status pills (only on active tab) */}
      {activeTab === 'active' && (
        <div className="flex gap-2 pt-1" style={{ borderTop: '1px solid var(--tech-border)' }}>
          {statusPills.map(p => (
            <button
              key={p.id}
              onClick={() => { triggerVibrate('click'); setStatusFilter(p.id); }}
              className="px-3 py-1 rounded-full text-[11px] font-extrabold transition-all active:scale-95"
              style={statusFilter === p.id
                ? { background: p.color + '18', color: p.color, border: `1px solid ${p.color}30` }
                : { background: 'transparent', color: 'var(--tech-text-muted)' }
              }
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

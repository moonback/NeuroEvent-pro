import React, { useState } from 'react';
import { useStore } from '../store';
import { Client } from '../types';
import ClientModal from '../components/ClientModal';
import { Building2, Search, Pencil, Phone, Mail, MapPin, User, CalendarRange } from 'lucide-react';

export default function Clients() {
  const clients = useStore(state => state.clients);
  const missions = useStore(state => state.missions);

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);

  const filtered = clients.filter(c =>
    [c.name, c.contactName, c.email, c.phone]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const missionCount = (clientId: string) => missions.filter(m => m.clientId === clientId).length;

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (client: Client) => { setEditing(client); setModalOpen(true); };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-[#0f172a] uppercase tracking-tight">Clients</h2>
          <p className="text-xs text-[#64748b] font-medium">Annuaire des clients et historique de leurs missions</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-[#0f172a] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-black transition-colors self-start sm:self-auto">
          + Nouveau Client
        </button>
      </div>

      <div className="mb-4 relative max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
        <input
          type="text"
          placeholder="Rechercher un client..."
          aria-label="Rechercher un client"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-[#e2e8f0] rounded-lg bg-white placeholder-[#94a3b8] text-[#0f172a] focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none"
        />
      </div>

      {clients.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-[#e2e8f0] mb-4">
            <Building2 className="w-8 h-8 text-[#94a3b8]" />
          </div>
          <h3 className="text-lg font-bold text-[#0f172a]">Aucun client enregistré</h3>
          <p className="text-sm text-[#64748b] mt-1 max-w-md">
            Créez votre premier client pour pouvoir le rattacher aux missions.
            Si la liste reste vide après création, vérifiez que la migration SQL
            (table <code className="font-mono text-xs">clients</code>) a bien été appliquée dans Supabase.
          </p>
          <button onClick={openCreate} className="mt-4 bg-[#2563eb] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
            + Créer un client
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center text-sm text-[#64748b] bg-[#f8fafc] border border-[#e2e8f0] rounded-xl">
          Aucun client ne correspond à « {search} ».
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto pb-4">
          {filtered.map(client => (
            <div key={client.id} className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 shrink-0 rounded-lg bg-[#eff6ff] border border-[#bfdbfe] flex items-center justify-center text-[#2563eb] font-bold uppercase">
                    {client.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-[#0f172a] truncate">{client.name}</h3>
                    {client.contactName && (
                      <p className="text-xs text-[#64748b] flex items-center gap-1 truncate">
                        <User className="w-3 h-3 shrink-0" /> {client.contactName}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => openEdit(client)}
                  className="p-2 text-[#64748b] hover:text-[#2563eb] hover:bg-[#eff6ff] rounded-md transition-colors shrink-0"
                  title={`Modifier ${client.name}`}
                  aria-label={`Modifier ${client.name}`}
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5 text-sm text-[#334155]">
                {client.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-[#94a3b8] shrink-0" />
                    <a href={`tel:${client.phone}`} className="hover:text-[#2563eb] truncate">{client.phone}</a>
                  </div>
                )}
                {client.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-[#94a3b8] shrink-0" />
                    <a href={`mailto:${client.email}`} className="hover:text-[#2563eb] truncate">{client.email}</a>
                  </div>
                )}
                {client.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#94a3b8] shrink-0 mt-0.5" />
                    <span className="leading-snug">{client.address}</span>
                  </div>
                )}
              </div>

              {client.notes && (
                <p className="text-xs text-[#64748b] bg-[#f8fafc] border border-[#f1f5f9] rounded-lg p-2 leading-snug">{client.notes}</p>
              )}

              <div className="mt-auto pt-2 border-t border-[#f1f5f9] flex items-center gap-2 text-xs font-semibold text-[#64748b]">
                <CalendarRange className="w-3.5 h-3.5" />
                {missionCount(client.id)} mission{missionCount(client.id) > 1 ? 's' : ''} liée{missionCount(client.id) > 1 ? 's' : ''}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <ClientModal
          isOpen={modalOpen}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          client={editing}
        />
      )}
    </div>
  );
}

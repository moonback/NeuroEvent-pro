import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth';
import { toast } from '../store/toast';
import { Profile, UserRole } from '../types';
import { ShieldCheck, AlertTriangle, RefreshCw, Info } from 'lucide-react';
import { UserAvatar } from '../components/ui/UserAvatar';

export default function Users() {
  const me = useAuthStore(state => state.user);

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      setLoadError(error.message);
      setProfiles([]);
    } else {
      setLoadError(null);
      setProfiles((data || []).map((p: any) => ({
        id: p.id,
        email: p.email || '',
        firstName: p.first_name || '',
        lastName: p.last_name || '',
        role: p.role === 'Admin' ? 'Admin' : 'Technicien',
        createdAt: p.created_at,
        avatarUrl: p.avatar_url ?? null,
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const changeRole = async (id: string, role: UserRole) => {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
    if (error) {
      toast.error(`Changement de rôle : ${error.message}`);
    } else {
      toast.success('Rôle mis à jour.');
      fetchProfiles();
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-[#0f172a] uppercase tracking-tight">Utilisateurs & Rôles</h2>
          <p className="text-xs text-[#64748b] font-medium">Gestion des comptes et des permissions d'accès</p>
        </div>
        <button
          onClick={fetchProfiles}
          className="flex items-center gap-2 border border-[#e2e8f0] bg-white text-[#334155] px-4 py-2 rounded-md text-sm font-medium hover:bg-[#f8fafc] transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      <div className="mb-4 flex items-start gap-2 bg-blue-50 border border-blue-100 text-blue-800 rounded-lg p-3 text-xs leading-relaxed">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          Les comptes se créent depuis l'écran d'inscription : tout nouveau compte est <strong>Technicien</strong> par défaut.
          La promotion en <strong>Admin</strong> se fait ici, et elle est également verrouillée côté serveur
          (un utilisateur ne peut pas modifier son propre rôle).
        </span>
      </div>

      {loadError ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle className="w-10 h-10 text-amber-500 mb-3" />
          <h3 className="text-lg font-bold text-amber-900">Impossible de charger les utilisateurs</h3>
          <p className="text-sm text-amber-800 mt-1 max-w-lg">
            {loadError}
          </p>
          <p className="text-xs text-amber-700 mt-3 max-w-lg">
            Cette page nécessite la table <code className="font-mono">profiles</code> et ses politiques RLS :
            exécutez la migration <code className="font-mono">supabase/migrations/20260610000000_audit_security_and_features.sql</code> dans
            le SQL Editor de votre projet Supabase, puis actualisez.
          </p>
        </div>
      ) : loading ? (
        <div className="flex-1 flex items-center justify-center text-sm text-[#64748b]">Chargement des utilisateurs...</div>
      ) : (
        <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                  <th className="py-3 px-4 text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Utilisateur</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Email</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Rôle</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-[#64748b] uppercase tracking-wider hidden sm:table-cell">Inscrit le</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map(profile => {
                  const isSelf = profile.id === me?.id;
                  const displayName = `${profile.firstName} ${profile.lastName}`.trim() || profile.email || 'Utilisateur';
                  return (
                    <tr key={profile.id} className="border-b border-[#f1f5f9] last:border-0 hover:bg-[#f8fafc] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            src={profile.avatarUrl}
                            name={displayName}
                            size="sm"
                            shape="circle"
                            variant={profile.role === 'Admin' ? 'blue' : 'emerald'}
                          />
                          <div className="flex flex-col">
                            <span className="font-semibold text-[#0f172a]">{displayName}</span>
                            {isSelf && <span className="text-[10px] text-[#2563eb] font-bold">Vous</span>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[#334155]">{profile.email || '—'}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {profile.role === 'Admin' && <ShieldCheck className="w-4 h-4 text-[#2563eb]" />}
                          <select
                            value={profile.role}
                            disabled={isSelf}
                            onChange={(e) => changeRole(profile.id, e.target.value as UserRole)}
                            aria-label={`Rôle de ${displayName}`}
                            title={isSelf ? 'Vous ne pouvez pas modifier votre propre rôle' : undefined}
                            className="rounded-md border border-[#e2e8f0] px-2 py-1.5 text-sm bg-white focus:ring-2 focus:ring-[#2563eb] outline-none disabled:bg-[#f1f5f9] disabled:text-[#94a3b8] disabled:cursor-not-allowed"
                          >
                            <option value="Technicien">Technicien</option>
                            <option value="Admin">Admin</option>
                          </select>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[#64748b] hidden sm:table-cell">
                        {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('fr-FR') : '—'}
                      </td>
                    </tr>
                  );
                })}
                {profiles.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-[#64748b]">Aucun utilisateur trouvé.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

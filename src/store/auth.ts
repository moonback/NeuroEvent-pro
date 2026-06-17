import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { UserRole } from '../types';

interface AuthState {
  session: Session | null;
  user: User | null;
  /** Rôle résolu côté serveur (table `profiles`). null = en cours de résolution. */
  role: UserRole | null;
  loading: boolean;
  initialize: () => void;
  signOut: () => Promise<void>;
}

/**
 * Le rôle fait UNIQUEMENT autorité depuis la table `profiles`, protégée par RLS.
 * Le fallback sur `user_metadata` est intentionnellement supprimé : user_metadata
 * est modifiable par le client et ne constitue pas une source de vérité sécurisée.
 * Principe de moindre privilège :
 *   - erreur réseau / profil absent → null (accès bloqué côté UI jusqu'à résolution)
 *   - rôle inconnu dans profiles → 'Technicien'
 */
async function resolveRole(user: User | null): Promise<UserRole | null> {
  if (!user) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error) {
      // Profil introuvable ou erreur réseau : on refuse de deviner le rôle.
      console.error('[auth] Impossible de résoudre le rôle depuis profiles :', error.message);
      return null;
    }
    return (data?.role as UserRole) || 'Technicien';
  } catch (err) {
    console.error('[auth] Exception dans resolveRole :', err);
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  role: null,
  loading: true,

  initialize: () => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const role = await resolveRole(session?.user ?? null);
      set({ session, user: session?.user || null, role, loading: false });
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user || null });
      if (!session) {
        set({ role: null });
        return;
      }
      // setTimeout : ne jamais appeler supabase en await direct dans ce
      // callback (deadlock connu de supabase-js).
      setTimeout(() => {
        resolveRole(session.user).then(role => set({ role }));
      }, 0);
    });
  },

  signOut: async () => {
    await supabase.auth.signOut();
  }
}));

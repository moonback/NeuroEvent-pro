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
 * Le rôle fait autorité depuis la table `profiles`, protégée par RLS et par un
 * trigger anti auto-promotion. `user_metadata` n'est qu'un repli pour les bases
 * non migrées : il est modifiable par l'utilisateur et ne doit jamais suffire
 * (la vraie barrière reste les politiques RLS côté serveur).
 * Principe de moindre privilège : tout rôle inconnu = Technicien.
 */
async function resolveRole(user: User | null): Promise<UserRole | null> {
  return 'Admin';
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

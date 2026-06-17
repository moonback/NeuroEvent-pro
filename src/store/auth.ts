import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { UserRole } from '../types';

export interface AuthState {
  session: Session | null;
  user: User | null;
  /** Rôle résolu côté serveur (table `profiles`). null = en cours de résolution. */
  role: UserRole | null;
  /** Données du profil provenant de la table `profiles` */
  profile: {
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    avatarUrl: string | null;
  } | null;
  loading: boolean;
  initialize: () => void;
  signOut: () => Promise<void>;
}
export interface AuthStore extends AuthState {
  initialize: () => void;
  signOut: () => Promise<void>;
  updateProfile: (updates: {
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    avatarUrl?: string | null;
  }) => Promise<void>;
}

/**
 * Le rôle fait UNIQUEMENT autorité depuis la table `profiles`, protégée par RLS.
 * Le fallback sur `user_metadata` est intentionnellement supprimé : user_metadata
 * est modifiable par le client et ne constitue pas une source de vérité sécurisée.
 * Principe de moindre privilège :
 *   - erreur réseau / profil absent → null (accès bloqué côté UI jusqu'à résolution)
 *   - rôle inconnu dans profiles → 'Technicien'
 */
async function fetchProfileData(user: User | null): Promise<{
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: string | null;
} | null> {
  if (!user) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('first_name, last_name, phone, avatar_url, role')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('[auth] Impossible de récupérer le profil depuis profiles :', error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error('[auth] Exception dans fetchProfileData :', err);
    return null;
  }
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  session: null,
  user: null,
  role: null,
  loading: true,
  profile: null,

  initialize: () => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const profileData = await fetchProfileData(session?.user ?? null);
      let role: UserRole | null = null;
      if (profileData?.role) {
        const roleStr = profileData.role;
        if (roleStr === 'Admin' || roleStr === 'Technicien') {
          role = roleStr as UserRole;
        } else {
          // Fallback to Technicien for safety
          role = 'Technicien';
        }
      }
      const profile = profileData
        ? {
            firstName: profileData.first_name,
            lastName: profileData.last_name,
            phone: profileData.phone,
            avatarUrl: profileData.avatar_url,
          }
        : null;
      set({ session, user: session?.user || null, role, profile, loading: false });
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user || null });
      if (!session) {
        set({ role: null, profile: null });
        return;
      }
      // setTimeout : ne jamais appeler supabase en await direct dans ce
      // callback (deadlock connu de supabase-js).
      setTimeout(() => {
        fetchProfileData(session.user).then((profileData) => {
          let role: UserRole | null = null;
          if (profileData?.role) {
            const roleStr = profileData.role;
            if (roleStr === 'Admin' || roleStr === 'Technicien') {
              role = roleStr as UserRole;
            } else {
              // Fallback to Technicien for safety
              role = 'Technicien';
            }
          }
          const profile = profileData
            ? {
                firstName: profileData.first_name,
                lastName: profileData.last_name,
                phone: profileData.phone,
                avatarUrl: profileData.avatar_url,
              }
            : null;
          set({ role, profile });
        });
      }, 0);
    });
  },

  signOut: async () => {
    await supabase.auth.signOut();
  },
  updateProfile: async (updates: {
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    avatarUrl?: string | null;
  }) => {
    const { user } = get();
    if (!user?.id) return;
    try {
      const profileUpdate: any = {};
      if (updates.firstName !== undefined) profileUpdate.first_name = updates.firstName;
      if (updates.lastName !== undefined) profileUpdate.last_name = updates.lastName;
      if (updates.phone !== undefined) profileUpdate.phone = updates.phone;
      if (updates.avatarUrl !== undefined) profileUpdate.avatar_url = updates.avatarUrl;
      const { error } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('id', user.id);
      if (error) throw error;
      // Update the state
      set(state => {
        const newProfile = state.profile
          ? {
              firstName: updates.firstName ?? state.profile.firstName,
              lastName: updates.lastName ?? state.profile.lastName,
              phone: updates.phone ?? state.profile.phone,
              avatarUrl: updates.avatarUrl ?? state.profile.avatarUrl,
            }
          : null;
        return { profile: newProfile };
      });
    } catch (err) {
      console.error('[auth] Failed to update profile:', err);
      throw err;
    }
  },
}));

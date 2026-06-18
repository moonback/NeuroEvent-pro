import React, { useState, useEffect } from 'react';
import { useAuthStore, AuthStore } from '../store/auth';
import { useStore } from '../store';
import { supabase } from '../lib/supabase';
import {
  Save, User, Lock, ArrowLeft, Calendar, Settings as SettingsIcon,
  LogOut, Wrench, Car, Check, Plus, X,
  Shield, Award, ChevronRight, KeyRound, Star,
  Mail, Phone, BadgeCheck, Sparkles, Globe2, Bell,
  Activity, Briefcase, MapPin, Clock, AtSign,
  Camera, Trash2, Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useIsMobile } from '../hooks/useMediaQuery';
import {
  uploadAvatar,
  removeAvatar,
  persistAvatarUrl,
  pathFromPublicUrl,
} from '../lib/avatar';
import { toast } from '../store/toast';
import ConfirmModal from '../components/ui/ConfirmModal';

const SKILL_CATALOG = [
  { id: 'montage_scene',  label: 'Montage scène',      emoji: '🎭' },
  { id: 'sono',           label: 'Sonorisation',        emoji: '🔊' },
  { id: 'eclairage',      label: 'Éclairage',           emoji: '💡' },
  { id: 'video',          label: 'Vidéo / Mapping',     emoji: '📽️' },
  { id: 'rigging',        label: 'Rigging',             emoji: '⛓️' },
  { id: 'electricite',    label: 'Électricité',         emoji: '⚡' },
  { id: 'decoration',     label: 'Décoration',          emoji: '🎀' },
  { id: 'securite',       label: 'Sécurité événement',  emoji: '🦺' },
  { id: 'logistique',     label: 'Logistique',          emoji: '📦' },
  { id: 'conduite_poids', label: 'Conduite poids lourd',emoji: '🚛' },
  { id: 'nacelle',        label: 'Nacelle / PEMP',      emoji: '🏗️' },
  { id: 'coordination',   label: 'Coordination équipe', emoji: '📋' },
  { id: 'manutention',    label: 'Manutention',         emoji: '🪝' },
  { id: 'froid',          label: 'Froid / Clim.',       emoji: '❄️' },
];

const LICENSE_CATEGORIES = ['A','A1','A2','AM','B','BE','B1','C','C1','CE','C1E','D','D1','DE','D1E'];

const PREFERENCES = {
  languages: [
    { id: 'fr', label: 'Français', flag: '🇫🇷' },
    { id: 'en', label: 'English',  flag: '🇬🇧' },
  ],
  timezones: [
    { id: 'Europe/Paris',  label: 'Europe/Paris (UTC+1)' },
    { id: 'Europe/Brussels', label: 'Europe/Brussels (UTC+1)' },
    { id: 'Europe/London', label: 'Europe/London (UTC+0)' },
  ],
  notifications: [
    { id: 'missions',     label: 'Nouvelles missions',  sub: 'Quand une mission est créée', icon: Briefcase },
    { id: 'conflicts',    label: 'Conflits détectés',   sub: 'Surréservations ou erreurs',  icon: Activity },
    { id: 'updates',      label: 'Mises à jour système', sub: 'Versions et maintenance',     icon: Sparkles },
  ],
};

function BottomSheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(5px)' }}
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl z-10 flex flex-col tech-animate-slide-up"
        style={{
          background: 'rgba(13,17,28,0.99)',
          backdropFilter: 'blur(32px)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.08)',
          maxHeight: '85dvh',
        }}
      >
        <div className="pt-4 pb-1 flex justify-center shrink-0 sm:hidden">
          <div className="w-9 h-[3px] rounded-full" style={{ background: 'rgba(255,255,255,0.14)' }} />
        </div>

        <div className="px-5 py-3 flex justify-between items-start shrink-0">
          <div>
            <h3 className="text-base font-black tracking-tight" style={{ color: 'var(--tech-text)' }}>
              {title}
            </h3>
            {subtitle && (
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--tech-text-muted)' }}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl transition-all active:scale-90 mt-0.5"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <X className="w-4 h-4" style={{ color: 'var(--tech-text-muted)' }} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-2 space-y-4 no-scrollbar">
          {children}
        </div>

        {footer && (
          <div className="px-5 py-4 shrink-0" style={{ borderTop: '1px solid var(--tech-border)' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

const inputSx: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: '0.875rem',
  padding: '0.7rem 0.875rem',
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: 'var(--tech-text)',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  colorScheme: 'dark',
};

const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.style.borderColor = 'rgba(0,229,160,0.40)';
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,229,160,0.08)';
};

const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)';
  e.currentTarget.style.boxShadow = 'none';
};

function ProfileRow({
  icon,
  label,
  sub,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3.5 p-4 rounded-2xl transition-all active:scale-[0.97] text-left min-h-[60px]"
      style={{
        background: 'var(--tech-card)',
        border: '1px solid var(--tech-border)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = 'var(--tech-card-hover)';
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--tech-border-strong)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = 'var(--tech-card)';
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--tech-border)';
      }}
    >
      <div
        className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
        style={{ background: color + '14', border: `1px solid ${color}22` }}
      >
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold" style={{ color: 'var(--tech-text)' }}>{label}</div>
        <div className="text-[10px] font-semibold mt-0.5 truncate" style={{ color: 'var(--tech-text-muted)' }}>{sub}</div>
      </div>
      <ChevronRight className="w-4 h-4 shrink-0" style={{ color: 'var(--tech-text-muted)' }} />
    </button>
  );
}

export default function Settings() {
  const { user, role, profile, updateProfile, signOut } = useAuthStore(s => ({
    user: s.user,
    role: s.role,
    profile: s.profile,
    updateProfile: s.updateProfile,
    signOut: s.signOut
  }));
  const technicians = useStore((s) => s.technicians);
  const missions = useStore((s) => s.missions);
  const updateTechnician = useStore((s) => s.updateTechnician);
  const techProfile = technicians.find((t) => t.id === user?.id);
  const isMobile = useIsMobile();

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [firstName, setFirstName] = useState(profile?.firstName || '');
  const [lastName, setLastName]   = useState(profile?.lastName || '');
  const [phone, setPhone]         = useState(profile?.phone || '');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [skills, setSkills] = useState<string[]>([]);
  const [hasLicense, setHasLicense] = useState(false);
  const [licenseSince, setLicenseSince] = useState('');
  const [licenseCategories, setLicenseCategories] = useState<string[]>([]);
  const [skillsSaving, setSkillsSaving] = useState<'idle'|'saving'|'saved'>('idle');

  const [language, setLanguage] = useState('fr');
  const [timezone, setTimezone] = useState('Europe/Paris');
  const [notifications, setNotifications] = useState<string[]>(['missions', 'conflicts', 'updates']);
  const [isOnline, setIsOnline] = useState(true);
  const [profileSaving, setProfileSaving] = useState<'idle'|'saving'|'saved'>('idle');

  const [skillsModal, setSkillsModal] = useState(false);
  const [licenseModal, setLicenseModal] = useState(false);
  const [securityModal, setSecurityModal] = useState(false);
  const [prefsModal, setPrefsModal] = useState(false);
  const [confirmDeleteAvatarOpen, setConfirmDeleteAvatarOpen] = useState(false);

  const isTechnician = role !== 'Admin';

  useEffect(() => {
    if (techProfile) {
      setSkills(techProfile.skills || []);
      setHasLicense(techProfile.driverLicense?.hasLicense ?? false);
      setLicenseSince(techProfile.driverLicense?.since || '');
      setLicenseCategories(techProfile.driverLicense?.categories || []);
    }
  }, [techProfile]);

  // Charger phone depuis profiles + préférences depuis admin_preferences
  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;

    (async () => {
      // 1) Charger le phone + avatar_url depuis profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone, avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      if (!cancelled) {
        if (profile?.phone) setPhone(profile.phone);
      }

      // 2) Charger les préférences (1:1 sur user_id)
      const { data: prefs } = await supabase
        .from('admin_preferences')
        .select('language, timezone, notifications, is_online')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!cancelled && prefs) {
        if (prefs.language) setLanguage(prefs.language);
        if (prefs.timezone) setTimezone(prefs.timezone);
        if (Array.isArray(prefs.notifications)) setNotifications(prefs.notifications);
        if (typeof prefs.is_online === 'boolean') setIsOnline(prefs.is_online);
      }
    })();

    return () => { cancelled = true; };
  }, [user?.id]);

  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(null), 4000);
    return () => clearTimeout(t);
  }, [successMsg]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    const { error: authError } = await supabase.auth.updateUser({
      data: { first_name: firstName, last_name: lastName },
    });
    if (authError) {
      setErrorMsg(authError.message);
      setLoading(false);
      return;
    }
    if (user?.id) {
      // Update profiles table via auth store
      await updateProfile({ firstName, lastName, phone: phone !== (profile?.phone ?? '') ? phone : undefined });
      // If the user is a technician, also update the technicians table
      if (role === 'Technicien') {
        const { error: techError } = await supabase
          .from('technicians')
          .update({ first_name: firstName, last_name: lastName })
          .eq('id', user.id);
        if (techError) {
          setErrorMsg(techError.message);
          setLoading(false);
          return;
        }
      }
      setSuccessMsg('Profil mis à jour avec succès.');
    }
    setLoading(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrorMsg('Les mots de passe ne correspondent pas.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setErrorMsg(error.message);
    } else {
      setSuccessMsg('Mot de passe mis à jour.');
      setNewPassword('');
      setConfirmPassword('');
      setSecurityModal(false);
    }
    setLoading(false);
  };

  const handleSaveSkills = async () => {
    if (!user?.id) return;
    setSkillsSaving('saving');
    await updateTechnician(user.id, {
      skills,
      driverLicense: { hasLicense, since: licenseSince, categories: licenseCategories },
    });
    setSkillsSaving('saved');
    setTimeout(() => setSkillsSaving('idle'), 2000);
  };

  const handleSavePrefs = async () => {
    if (!user?.id) return;
    setProfileSaving('saving');
    setErrorMsg(null);

    // Upsert dans admin_preferences (1 ligne par user, RLS "own row only")
    const { error } = await supabase
      .from('admin_preferences')
      .upsert(
        {
          user_id: user.id,
          language,
          timezone,
          notifications,
          is_online: isOnline,
        },
        { onConflict: 'user_id' }
      );

    if (error) {
      setErrorMsg(`Échec de la sauvegarde : ${error.message}`);
      setProfileSaving('idle');
      return;
    }
    setProfileSaving('saved');
    setTimeout(() => setProfileSaving('idle'), 2000);
    setPrefsModal(false);
  };

  const toggleSkill = (id: string) => setSkills((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  const toggleLicenseCategory = (cat: string) => setLicenseCategories((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]);
  const toggleNotification = (id: string) => setNotifications((prev) => prev.includes(id) ? prev.filter((n) => n !== id) : [...prev, id]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset la value pour permettre de re-uploader le même fichier
    e.target.value = '';
    if (!file || !user?.id) return;

    setAvatarUploading(true);
    try {
      const oldPath = pathFromPublicUrl(profile?.avatarUrl ?? null);
      const { url } = await uploadAvatar(user.id, file, oldPath);
      await persistAvatarUrl(user.id, url);
      await updateProfile({ avatarUrl: url });
      toast.success('Photo de profil mise à jour.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de l'upload.");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user?.id || !(profile?.avatarUrl ?? null)) return;
    setConfirmDeleteAvatarOpen(true);
  };

  const confirmRemoveAvatar = async () => {
    if (!user?.id || !(profile?.avatarUrl ?? null)) return;
    setConfirmDeleteAvatarOpen(false);
    setAvatarUploading(true);
    try {
      await removeAvatar(user.id, profile?.avatarUrl ?? null);
      await updateProfile({ avatarUrl: null });
      toast.success('Photo de profil supprimée.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Échec de la suppression.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSignOut = async () => { await signOut(); };

  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '?';
  const fullName = `${firstName} ${lastName}`.trim() || user?.email || '—';
  const roleColor = isTechnician ? '#00e5a0' : '#4d9fff';
  const roleLabel = isTechnician ? 'Technicien' : 'Administrateur';

  // Stats admin calculées dynamiquement depuis le store
  const activeMissionsCount = missions.filter(m => m.status === 'En cours' || m.status === 'Planifiée').length;
  const adminStats = [
    { label: 'Missions actives',  value: activeMissionsCount, color: '#2563eb' },
    { label: 'Techniciens',       value: technicians.length, color: '#a78bfa' },
    { label: 'Alertes en cours',  value: 0, color: '#ff4d6d' },
  ];

  return (
    <div className="flex-1 overflow-auto bg-[#f8fafc]">
      <div className={`${isTechnician ? 'max-w-md' : 'max-w-5xl'} mx-auto`}>
        <div className={isTechnician ? 'p-3 sm:p-6 pb-32' : 'p-4 sm:p-6 lg:p-8 pb-12'}>

          {/* Header */}
          <div className="flex items-center gap-4 mb-5 sm:mb-6">
            {isTechnician && (
              <Link to="/" className="p-2 text-[#64748b] hover:text-[#0f172a] bg-white border border-[#e2e8f0] rounded-xl transition-colors shadow-xs">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] tracking-tight">Mon Profil</h1>
                <span
                  className="hidden sm:inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider"
                  style={{
                    background: isOnline ? 'rgba(16,185,129,0.10)' : 'rgba(100,116,139,0.10)',
                    color: isOnline ? '#059669' : '#64748b',
                    border: `1px solid ${isOnline ? 'rgba(16,185,129,0.25)' : 'rgba(100,116,139,0.25)'}`,
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: isOnline ? '#10b981' : '#94a3b8',
                      animation: isOnline ? 'tech-dot-ping 1.8s infinite' : 'none',
                    }}
                  />
                  {isOnline ? 'En ligne' : 'Hors ligne'}
                </span>
              </div>
              <p className="text-[#64748b] mt-0.5 text-xs sm:text-sm">Gérez vos informations et compétences.</p>
            </div>
            {!isTechnician && (
              <button
                type="button"
                onClick={handleSignOut}
                className="hidden sm:flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-extrabold text-[#475569] hover:text-red-500 bg-white border border-[#e2e8f0] hover:border-red-200 transition-all active:scale-95 shadow-xs"
              >
                <LogOut className="w-4 h-4" />
                <span>Déconnexion</span>
              </button>
            )}
          </div>

          {successMsg && (
            <div className="mb-4 bg-emerald-50 text-emerald-700 p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm border border-emerald-100 font-semibold flex items-center gap-2 tech-animate-in">
              <Check className="w-4 h-4 shrink-0" />{successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="mb-4 bg-red-50 text-red-500 p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm border border-red-100 font-semibold tech-animate-in">
              {errorMsg}
            </div>
          )}

          {/* ── Layout grid : 2 colonnes sur desktop, 1 sur mobile ── */}
          <div className={isTechnician ? 'space-y-4' : 'grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6'}>

            {/* ── Colonne principale : carte identité + identité ── */}
            <div className={isTechnician ? '' : 'lg:col-span-2 space-y-5 sm:space-y-6'}>

              {/* Carte identité premium */}
              <div className="bg-white rounded-2xl shadow-xs border border-[#e2e8f0] overflow-hidden">
                <div
                  className="h-24 sm:h-28 relative"
                  style={{ background: 'linear-gradient(135deg, #080b12 0%, #131926 60%, #1a2133 100%)' }}
                >
                  {/* Pattern décoratif */}
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{
                      backgroundImage:
                        'radial-gradient(circle at 20% 30%, rgba(0,229,160,0.25), transparent 50%), radial-gradient(circle at 80% 70%, rgba(77,159,255,0.25), transparent 50%)',
                    }}
                  />
                  {/* Avatar : image uploadée ou initiales, avec bouton caméra */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleAvatarChange}
                    className="hidden"
                    aria-hidden="true"
                  />
                  <div className="absolute left-5 -bottom-8 group">
                    <div
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-black border-2 sm:border-[3px] shadow-lg overflow-hidden relative"
                      style={{
                        background: 'linear-gradient(135deg, rgba(0,229,160,0.22) 0%, rgba(77,159,255,0.22) 100%)',
                        borderColor: 'rgba(0,229,160,0.40)',
                        color: 'var(--tech-accent)',
                      }}
                    >
                      {profile?.avatarUrl ? (
                        <img
                          src={profile?.avatarUrl}
                          alt={`Photo de ${fullName}`}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <span>{initials}</span>
                      )}
                      {avatarUploading && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-spin" />
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={avatarUploading}
                      aria-label="Changer la photo de profil"
                      className="absolute -bottom-1 -right-1 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#0f172a] text-white flex items-center justify-center shadow-lg ring-2 ring-white hover:bg-black transition-all active:scale-90 disabled:opacity-50"
                    >
                      <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                    {profile?.avatarUrl && !avatarUploading && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        aria-label="Supprimer la photo de profil"
                        className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md ring-2 ring-white hover:bg-red-600 transition-all active:scale-90"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="absolute right-4 top-4 flex flex-col sm:flex-row items-end sm:items-center gap-1.5 sm:gap-2">
                    <span
                      className="text-[9px] sm:text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider whitespace-nowrap"
                      style={{
                        background: roleColor + '22',
                        border: `1px solid ${roleColor}44`,
                        color: roleColor,
                      }}
                    >
                      {roleLabel}
                    </span>
                    <span className="sm:hidden text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider whitespace-nowrap bg-emerald-50 text-emerald-700 border border-emerald-200">
                      En ligne
                    </span>
                  </div>
                </div>

                <div className="pt-10 sm:pt-12 pb-5 px-5 sm:px-6">
                  <h2 className="text-base sm:text-lg font-black text-[#0f172a] truncate">{fullName}</h2>
                  <p className="text-[10px] sm:text-xs font-semibold text-[#94a3b8] mt-0.5 flex items-center gap-1.5 truncate">
                    <Mail className="w-3 h-3 shrink-0" />
                    <span className="truncate">{user?.email}</span>
                  </p>

                  <form onSubmit={handleUpdateProfile} className="mt-4 sm:mt-5 space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="settings-firstname" className="block text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-wider mb-1.5">Prénom</label>
                        <input
                          id="settings-firstname"
                          type="text"
                          autoComplete="given-name"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 sm:py-3 focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none text-sm font-semibold bg-[#f8fafc] focus:bg-white transition-all min-h-[44px]"
                        />
                      </div>
                      <div>
                        <label htmlFor="settings-lastname" className="block text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-wider mb-1.5">Nom</label>
                        <input
                          id="settings-lastname"
                          type="text"
                          autoComplete="family-name"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 sm:py-3 focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none text-sm font-semibold bg-[#f8fafc] focus:bg-white transition-all min-h-[44px]"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="settings-phone" className="block text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-wider mb-1.5">Téléphone</label>
                      <input
                        id="settings-phone"
                        type="tel"
                        autoComplete="tel"
                        placeholder="+33 6 12 34 56 78"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 sm:py-3 focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none text-sm font-semibold bg-[#f8fafc] focus:bg-white transition-all min-h-[44px]"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 bg-[#0f172a] text-white px-4 py-3 sm:py-3.5 rounded-xl text-sm font-extrabold hover:bg-black transition-colors disabled:opacity-50 active:scale-[0.98] duration-100 min-h-[44px]"
                      >
                        <Save className="w-4 h-4" /> Sauvegarder
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsOnline((v) => !v)}
                        className="flex items-center justify-center gap-2 bg-white text-[#0f172a] border border-[#e2e8f0] px-4 py-3 sm:py-3.5 rounded-xl text-sm font-extrabold hover:bg-[#f8fafc] transition-colors active:scale-[0.98] duration-100 min-h-[44px]"
                      >
                        <Activity className="w-4 h-4" style={{ color: isOnline ? '#10b981' : '#94a3b8' }} />
                        {isOnline ? 'En ligne' : 'Hors ligne'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Section Technicien : compétences, permis, sécurité */}
              {isTechnician && (
                <div className="space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-widest px-1" style={{ color: '#94a3b8' }}>
                    Compétences & Sécurité
                  </p>

                  <ProfileRow
                    icon={<Wrench className="w-4.5 h-4.5" />}
                    label="Compétences"
                    sub={skills.length > 0 ? `${skills.length} compétence${skills.length > 1 ? 's' : ''} sélectionnée${skills.length > 1 ? 's' : ''}` : 'Aucune compétence renseignée'}
                    color="#a78bfa"
                    onClick={() => setSkillsModal(true)}
                  />

                  <ProfileRow
                    icon={<Car className="w-4.5 h-4.5" />}
                    label="Permis de conduire"
                    sub={hasLicense ? (licenseCategories.length > 0 ? `Catégories : ${licenseCategories.join(', ')}` : 'Permis renseigné') : 'Non renseigné'}
                    color="#4d9fff"
                    onClick={() => setLicenseModal(true)}
                  />

                  <ProfileRow
                    icon={<Shield className="w-4.5 h-4.5" />}
                    label="Sécurité"
                    sub="Modifier votre mot de passe"
                    color="#ff4d6d"
                    onClick={() => setSecurityModal(true)}
                  />
                </div>
              )}

              {/* Section Admin : grille de cartes interactives */}
              {!isTechnician && (
                <>
                  {/* Stats rapides */}
                  <div>
                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#94a3b8] mb-2.5 px-1">
                      Aperçu activité
                    </p>
                    <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                      {adminStats.map((s) => (
                        <div
                          key={s.label}
                          className="bg-white rounded-2xl border border-[#e2e8f0] p-3 sm:p-4 shadow-xs"
                        >
                          <div
                            className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider mb-1"
                            style={{ color: s.color }}
                          >
                            {s.label}
                          </div>
                          <div className="text-xl sm:text-2xl font-black text-[#0f172a] tabular-nums">
                            {s.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#94a3b8] mb-2.5 px-1">
                      Compte & Sécurité
                    </p>
                    <div className="space-y-2">
                      <ProfileRow
                        icon={<KeyRound className="w-4.5 h-4.5" />}
                        label="Mot de passe"
                        sub="Modifier votre mot de passe"
                        color="#ff4d6d"
                        onClick={() => setSecurityModal(true)}
                      />
                      <ProfileRow
                        icon={<Bell className="w-4.5 h-4.5" />}
                        label="Notifications"
                        sub={`${notifications.length} type${notifications.length > 1 ? 's' : ''} activé${notifications.length > 1 ? 's' : ''} · ${PREFERENCES.languages.find(l => l.id === language)?.label}`}
                        color="#ffb700"
                        onClick={() => setPrefsModal(true)}
                      />
                      <ProfileRow
                        icon={<Globe2 className="w-4.5 h-4.5" />}
                        label="Langue & Fuseau"
                        sub={`${PREFERENCES.languages.find(l => l.id === language)?.flag} ${PREFERENCES.languages.find(l => l.id === language)?.label} · ${timezone.split('/')[1] || timezone}`}
                        color="#4d9fff"
                        onClick={() => setPrefsModal(true)}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* ── Sidebar admin (desktop uniquement) : identité rapide + déconnexion ── */}
            {!isTechnician && (
              <aside className="space-y-5 sm:space-y-6">
                <div className="bg-white rounded-2xl shadow-xs border border-[#e2e8f0] p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8] mb-3">
                    Rattachement
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                        <BadgeCheck className="w-4.5 h-4.5 text-blue-500" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold text-[#94a3b8] uppercase">Rôle</div>
                        <div className="text-sm font-extrabold text-[#0f172a] truncate">{roleLabel}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                        <MapPin className="w-4.5 h-4.5 text-violet-500" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold text-[#94a3b8] uppercase">Organisation</div>
                        <div className="text-sm font-extrabold text-[#0f172a] truncate">Esil-Event</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                        <Clock className="w-4.5 h-4.5 text-emerald-500" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold text-[#94a3b8] uppercase">Membre depuis</div>
                        <div className="text-sm font-extrabold text-[#0f172a] truncate">
                          {user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : '—'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                        <AtSign className="w-4.5 h-4.5 text-amber-500" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold text-[#94a3b8] uppercase">Identifiant</div>
                        <div className="text-sm font-extrabold text-[#0f172a] truncate">{user?.id?.slice(0, 8) || '—'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
                  <div
                    className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20"
                    style={{ background: 'radial-gradient(circle, #00e5a0 0%, transparent 70%)' }}
                  />
                  <Sparkles className="w-5 h-5 text-emerald-400 mb-2" />
                  <h3 className="text-sm font-black mb-1">Astuce</h3>
                  <p className="text-[11px] leading-relaxed text-slate-300">
                    Activez les notifications de conflits pour être alerté en temps réel quand une ressource est surréservée.
                  </p>
                </div>
              </aside>
            )}
          </div>

          {/* Mobile : bouton déconnexion en bas du contenu admin */}
          {!isTechnician && (
            <div className="mt-6 sm:hidden">
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 bg-white text-red-500 border border-red-100 px-4 py-3 rounded-xl text-sm font-extrabold hover:bg-red-50 transition-colors active:scale-[0.98] duration-100 min-h-[44px]"
              >
                <LogOut className="w-4 h-4" /> Déconnexion
              </button>
            </div>
          )}
        </div>

        {isTechnician && (
          <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-[#e2e8f0]/60 pb-safe z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
            <div className="flex justify-around items-center h-16 max-w-md mx-auto px-4">
              <Link to="/" className="flex flex-col items-center justify-center w-full h-full text-[#64748b] hover:text-[#0f172a] transition-all active:scale-95 duration-100">
                <Calendar className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-extrabold">Missions</span>
              </Link>
              <span className="flex flex-col items-center justify-center w-full h-full text-[#2563eb]" aria-current="page">
                <SettingsIcon className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-extrabold">Profil</span>
              </span>
              <button onClick={handleSignOut} className="flex flex-col items-center justify-center w-full h-full text-[#64748b] hover:text-red-500 transition-all active:scale-95 duration-100 cursor-pointer">
                <LogOut className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-extrabold">Quitter</span>
              </button>
            </div>
          </nav>
        )}
      </div>

      <BottomSheet
        open={skillsModal}
        onClose={() => setSkillsModal(false)}
        title="Mes compétences"
        subtitle={`${skills.length} sélectionnée${skills.length > 1 ? 's' : ''} — visible par la planification`}
        footer={
          <button
            type="button"
            onClick={async () => { await handleSaveSkills(); setSkillsModal(false); }}
            disabled={skillsSaving === 'saving'}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm text-black uppercase tracking-wider transition-all active:scale-[0.97] disabled:opacity-60 min-h-[48px]"
            style={{
              background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)',
              boxShadow: '0 4px 20px rgba(167,139,250,0.30)',
            }}
          >
            {skillsSaving === 'saving' ? (
              <span className="animate-spin w-4 h-4 border-2 border-black/30 border-t-black rounded-full" />
            ) : skillsSaving === 'saved' ? (
              <>
                <Check className="w-4 h-4" /> Sauvegardé !
              </>
            ) : (
              <>
                <Star className="w-4 h-4" /> Enregistrer mes compétences
              </>
            )}
          </button>
        }
      >
        <div className="flex flex-wrap gap-2 py-1">
          {SKILL_CATALOG.map((skill) => {
            const selected = skills.includes(skill.id);
            return (
              <button
                key={skill.id}
                type="button"
                onClick={() => toggleSkill(skill.id)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold border transition-all active:scale-95 min-h-[40px]"
                style={{
                  background: selected ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.04)',
                  border: selected ? '1px solid rgba(167,139,250,0.35)' : '1px solid rgba(255,255,255,0.08)',
                  color: selected ? '#c4b5fd' : 'var(--tech-text-muted)',
                  boxShadow: selected ? '0 0 10px rgba(167,139,250,0.12)' : 'none',
                }}
              >
                <span className="text-sm">{skill.emoji}</span>
                <span>{skill.label}</span>
                {selected && <X className="w-3 h-3 ml-0.5 opacity-60" />}
              </button>
            );
          })}
        </div>
      </BottomSheet>

      <BottomSheet
        open={licenseModal}
        onClose={() => setLicenseModal(false)}
        title="Permis de conduire"
        subtitle="Renseignez vos catégories de permis"
        footer={
          <button
            type="button"
            onClick={async () => { await handleSaveSkills(); setLicenseModal(false); }}
            disabled={skillsSaving === 'saving'}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm text-black uppercase tracking-wider transition-all active:scale-[0.97] disabled:opacity-60 min-h-[48px]"
            style={{
              background: 'linear-gradient(135deg, #4d9fff 0%, #2563eb 100%)',
              boxShadow: '0 4px 20px rgba(77,159,255,0.25)',
            }}
          >
            {skillsSaving === 'saving' ? (
              <span className="animate-spin w-4 h-4 border-2 border-black/30 border-t-black rounded-full" />
            ) : (
              <>
                <Car className="w-4 h-4" /> Enregistrer le permis
              </>
            )}
          </button>
        }
      >
        <button
          type="button"
          onClick={() => setHasLicense((v) => !v)}
          className="w-full flex items-center justify-between p-4 rounded-2xl transition-all active:scale-[0.97] min-h-[60px]"
          style={{
            background: hasLicense ? 'rgba(77,159,255,0.10)' : 'rgba(255,255,255,0.04)',
            border: hasLicense ? '1px solid rgba(77,159,255,0.25)' : '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
              style={{ background: hasLicense ? 'rgba(77,159,255,0.15)' : 'rgba(255,255,255,0.06)' }}
            >
              🪪
            </div>
            <div className="text-left">
              <div className="text-sm font-extrabold" style={{ color: 'var(--tech-text)' }}>
                {hasLicense ? "J'ai le permis de conduire" : "Pas de permis de conduire"}
              </div>
              <div className="text-[10px] font-medium mt-0.5" style={{ color: 'var(--tech-text-muted)' }}>
                {hasLicense ? 'Appuyer pour désactiver' : 'Appuyer pour activer'}
              </div>
            </div>
          </div>
          <div
            className="w-12 h-6 rounded-full relative transition-all duration-200 shrink-0"
            style={{ background: hasLicense ? 'var(--tech-blue)' : 'rgba(255,255,255,0.10)' }}
          >
            <div
              className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200"
              style={{ left: hasLicense ? '1.5rem' : '0.125rem' }}
            />
          </div>
        </button>

        {hasLicense && (
          <div className="space-y-4 tech-animate-in">
            <div>
              <label className="block text-[9px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--tech-text-muted)' }}>
                Date d&apos;obtention
              </label>
              <input
                id="license-since"
                type="date"
                value={licenseSince}
                onChange={(e) => setLicenseSince(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                style={inputSx}
                onFocus={onFocus}
                onBlur={onBlur}
              />
              {licenseSince && (
                <p className="text-[10px] mt-1.5 font-semibold" style={{ color: 'var(--tech-text-muted)' }}>
                  Obtenu il y a {Math.floor((Date.now() - new Date(licenseSince).getTime()) / (1000 * 60 * 60 * 24 * 365))} an(s)
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--tech-text-muted)' }}>
                  Catégories
                </label>
                {licenseCategories.length > 0 && (
                  <span className="text-[9px] font-black" style={{ color: 'var(--tech-blue)' }}>
                    {licenseCategories.join(' · ')}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {LICENSE_CATEGORIES.map((cat) => {
                  const selected = licenseCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleLicenseCategory(cat)}
                      className="w-11 h-11 rounded-xl text-xs font-extrabold border transition-all active:scale-95"
                      style={{
                        background: selected ? 'rgba(77,159,255,0.14)' : 'rgba(255,255,255,0.04)',
                        border: selected ? '1px solid rgba(77,159,255,0.35)' : '1px solid rgba(255,255,255,0.08)',
                        color: selected ? '#6eb5ff' : 'var(--tech-text-muted)',
                        boxShadow: selected ? '0 0 10px rgba(77,159,255,0.15)' : 'none',
                      }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] mt-2 font-medium" style={{ color: 'var(--tech-text-muted)', opacity: 0.6 }}>
                Sélectionnez toutes les catégories que vous possédez.
              </p>
            </div>
          </div>
        )}
      </BottomSheet>

      <BottomSheet
        open={securityModal}
        onClose={() => { setSecurityModal(false); setNewPassword(''); setConfirmPassword(''); setErrorMsg(null); }}
        title="Sécurité"
        subtitle="Modifiez votre mot de passe"
        footer={
          <button
            type="button"
            onClick={handleUpdatePassword}
            disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm text-white uppercase tracking-wider transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed min-h-[48px]"
            style={{
              background: 'linear-gradient(135deg, #ff4d6d 0%, #c9184a 100%)',
              boxShadow: (!newPassword || !confirmPassword || newPassword !== confirmPassword)
                ? 'none'
                : '0 4px 20px rgba(255,77,109,0.28)',
            }}
          >
            <KeyRound className="w-4 h-4" />
            Mettre à jour le mot de passe
          </button>
        }
      >
        <div className="space-y-4 py-1">
          {errorMsg && (
            <div
              className="p-3 rounded-2xl text-xs font-semibold"
              style={{
                background: 'rgba(255,77,109,0.10)',
                border: '1px solid rgba(255,77,109,0.20)',
                color: '#ff8fa0',
              }}
            >
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-[9px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--tech-text-muted)' }}>
              Nouveau mot de passe
            </label>
            <input
              id="settings-newpassword"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={inputSx}
              onFocus={onFocus}
              onBlur={onBlur}
            />
          </div>

          <div>
            <label className="block text-[9px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--tech-text-muted)' }}>
              Confirmer le mot de passe
            </label>
            <input
              id="settings-confirmpassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={inputSx}
              onFocus={onFocus}
              onBlur={onBlur}
            />
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-[10px] font-bold mt-1.5" style={{ color: '#ff8fa0' }}>
                Les mots de passe ne correspondent pas.
              </p>
            )}
          </div>

          {newPassword && (
            <div
              className="flex items-center gap-2 p-3 rounded-2xl"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--tech-border)',
              }}
            >
              <div className="flex gap-1 flex-1">
                {[1,2,3,4].map((i) => (
                  <div
                    key={i}
                    className="h-1 flex-1 rounded-full transition-all duration-300"
                    style={{
                      background: newPassword.length >= i * 3
                        ? (newPassword.length >= 10 ? 'var(--tech-accent)' : newPassword.length >= 7 ? '#ffb700' : '#ff4d6d')
                        : 'rgba(255,255,255,0.08)',
                    }}
                  />
                ))}
              </div>
              <span className="text-[9px] font-bold shrink-0" style={{ color: 'var(--tech-text-muted)' }}>
                {newPassword.length < 4 ? 'Trop court' : newPassword.length < 7 ? 'Faible' : newPassword.length < 10 ? 'Correct' : 'Fort'}
              </span>
            </div>
          )}
        </div>
      </BottomSheet>

      {/* Modal Préférences / Langue / Fuseau / Notifications */}
      <BottomSheet
        open={prefsModal}
        onClose={() => setPrefsModal(false)}
        title="Préférences"
        subtitle="Langue, fuseau horaire et notifications"
        footer={
          <button
            type="button"
            onClick={handleSavePrefs}
            disabled={profileSaving === 'saving'}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm text-white uppercase tracking-wider transition-all active:scale-[0.97] disabled:opacity-60 min-h-[48px]"
            style={{
              background: 'linear-gradient(135deg, #ffb700 0%, #f59e0b 100%)',
              boxShadow: '0 4px 20px rgba(255,183,0,0.30)',
            }}
          >
            {profileSaving === 'saving' ? (
              <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
            ) : profileSaving === 'saved' ? (
              <>
                <Check className="w-4 h-4" /> Sauvegardé !
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Enregistrer les préférences
              </>
            )}
          </button>
        }
      >
        {/* Langue */}
        <div>
          <label className="block text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--tech-text-muted)' }}>
            Langue de l'interface
          </label>
          <div className="grid grid-cols-2 gap-2">
            {PREFERENCES.languages.map((l) => {
              const selected = language === l.id;
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setLanguage(l.id)}
                  className="flex items-center gap-2.5 p-3 rounded-2xl border transition-all active:scale-95 min-h-[52px]"
                  style={{
                    background: selected ? 'rgba(77,159,255,0.10)' : 'rgba(255,255,255,0.04)',
                    border: selected ? '1px solid rgba(77,159,255,0.35)' : '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <span className="text-2xl">{l.flag}</span>
                  <div className="text-left min-w-0">
                    <div className="text-sm font-extrabold truncate" style={{ color: 'var(--tech-text)' }}>
                      {l.label}
                    </div>
                  </div>
                  {selected && <Check className="w-4 h-4 ml-auto shrink-0" style={{ color: 'var(--tech-blue)' }} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Fuseau */}
        <div>
          <label className="block text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--tech-text-muted)' }}>
            Fuseau horaire
          </label>
          <div className="space-y-1.5">
            {PREFERENCES.timezones.map((tz) => {
              const selected = timezone === tz.id;
              return (
                <button
                  key={tz.id}
                  type="button"
                  onClick={() => setTimezone(tz.id)}
                  className="w-full flex items-center justify-between p-3 rounded-2xl border transition-all active:scale-[0.98] min-h-[48px]"
                  style={{
                    background: selected ? 'rgba(77,159,255,0.10)' : 'rgba(255,255,255,0.04)',
                    border: selected ? '1px solid rgba(77,159,255,0.35)' : '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <Globe2 className="w-4 h-4" style={{ color: selected ? 'var(--tech-blue)' : 'var(--tech-text-muted)' }} />
                    <span className="text-sm font-bold" style={{ color: 'var(--tech-text)' }}>{tz.label}</span>
                  </div>
                  {selected && <Check className="w-4 h-4" style={{ color: 'var(--tech-blue)' }} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Notifications */}
        <div>
          <label className="block text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--tech-text-muted)' }}>
            Notifications
          </label>
          <div className="space-y-1.5">
            {PREFERENCES.notifications.map((n) => {
              const selected = notifications.includes(n.id);
              const Icon = n.icon;
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => toggleNotification(n.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl border transition-all active:scale-[0.98] text-left min-h-[56px]"
                  style={{
                    background: selected ? 'rgba(255,183,0,0.08)' : 'rgba(255,255,255,0.04)',
                    border: selected ? '1px solid rgba(255,183,0,0.30)' : '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: selected ? 'rgba(255,183,0,0.15)' : 'rgba(255,255,255,0.06)' }}
                  >
                    <Icon className="w-4 h-4" style={{ color: selected ? '#ffb700' : 'var(--tech-text-muted)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-extrabold" style={{ color: 'var(--tech-text)' }}>{n.label}</div>
                    <div className="text-[10px] font-semibold mt-0.5" style={{ color: 'var(--tech-text-muted)' }}>{n.sub}</div>
                  </div>
                  <div
                    className="w-10 h-5 rounded-full relative transition-all duration-200 shrink-0"
                    style={{ background: selected ? '#ffb700' : 'rgba(255,255,255,0.10)' }}
                  >
                    <div
                      className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200"
                      style={{ left: selected ? '1.25rem' : '0.125rem' }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </BottomSheet>

      <ConfirmModal
        isOpen={confirmDeleteAvatarOpen}
        title="Supprimer la photo de profil ?"
        message="Votre photo de profil sera supprimée définitivement."
        confirmLabel="Supprimer"
        variant="danger"
        onConfirm={confirmRemoveAvatar}
        onCancel={() => setConfirmDeleteAvatarOpen(false)}
      />
    </div>
  );
}

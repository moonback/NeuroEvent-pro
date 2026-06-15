import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/auth';
import { useStore } from '../store';
import { supabase } from '../lib/supabase';
import { toast } from '../store/toast';
import {
  Save, User, Lock, ArrowLeft, Calendar, Settings as SettingsIcon,
  LogOut, Wrench, Car, Check, Plus, X,
  Shield, Award, ChevronRight, KeyRound, Star
} from 'lucide-react';
import { Link } from 'react-router-dom';

// ─── Skill catalog ───────────────────────────────────────────────────────────
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

// ─── Reusable bottom-sheet modal ─────────────────────────────────────────────
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
    <div className="fixed inset-0 z-[80] flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(5px)' }}
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className="relative w-full max-w-md rounded-t-3xl z-10 flex flex-col tech-animate-slide-up"
        style={{
          background: 'rgba(13,17,28,0.99)',
          backdropFilter: 'blur(32px)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          maxHeight: '85dvh',
        }}
      >
        {/* Handle */}
        <div className="pt-4 pb-1 flex justify-center shrink-0">
          <div className="w-9 h-[3px] rounded-full" style={{ background: 'rgba(255,255,255,0.14)' }} />
        </div>

        {/* Header */}
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

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-2 space-y-4 no-scrollbar">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-5 py-4 shrink-0" style={{ borderTop: '1px solid var(--tech-border)' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shared input style ───────────────────────────────────────────────────────
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

// ─── Profile row item ─────────────────────────────────────────────────────────
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
      className="w-full flex items-center gap-3.5 p-4 rounded-2xl transition-all active:scale-[0.97] text-left"
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
        <div className="text-[10px] font-semibold mt-0.5" style={{ color: 'var(--tech-text-muted)' }}>{sub}</div>
      </div>
      <ChevronRight className="w-4 h-4 shrink-0" style={{ color: 'var(--tech-text-muted)' }} />
    </button>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function Settings() {
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const technicians = useStore((s) => s.technicians);
  const updateTechnician = useStore((s) => s.updateTechnician);
  const techProfile = technicians.find((t) => t.id === user?.id);

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Profile
  const [firstName, setFirstName] = useState(user?.user_metadata?.first_name || '');
  const [lastName, setLastName]   = useState(user?.user_metadata?.last_name  || '');

  // Password
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Skills & License
  const [skills,            setSkills]           = useState<string[]>([]);
  const [hasLicense,        setHasLicense]        = useState(false);
  const [licenseSince,      setLicenseSince]      = useState('');
  const [licenseCategories, setLicenseCategories] = useState<string[]>([]);
  const [skillsSaving,      setSkillsSaving]      = useState<'idle'|'saving'|'saved'>('idle');

  // Modal states
  const [skillsModal,   setSkillsModal]   = useState(false);
  const [licenseModal,  setLicenseModal]  = useState(false);
  const [securityModal, setSecurityModal] = useState(false);
  const [confirmClearModal, setConfirmClearModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const isTechnician = role !== 'Admin';

  useEffect(() => {
    if (techProfile) {
      setSkills(techProfile.skills || []);
      setHasLicense(techProfile.driverLicense?.hasLicense ?? false);
      setLicenseSince(techProfile.driverLicense?.since || '');
      setLicenseCategories(techProfile.driverLicense?.categories || []);
    }
  }, [techProfile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setErrorMsg(null); setSuccessMsg(null);
    const { error } = await supabase.auth.updateUser({ data: { first_name: firstName, last_name: lastName } });
    if (error) { setErrorMsg(error.message); }
    else {
      setSuccessMsg('Profil mis à jour avec succès.');
      if (user?.id) {
        await supabase.from('profiles').update({ first_name: firstName, last_name: lastName }).eq('id', user.id);
        if (role === 'Technicien')
          await supabase.from('technicians').update({ first_name: firstName, last_name: lastName }).eq('id', user.id);
      }
    }
    setLoading(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setErrorMsg('Les mots de passe ne correspondent pas.'); return; }
    if (newPassword.length < 6) { setErrorMsg('Le mot de passe doit contenir au moins 6 caractères.'); return; }
    setLoading(true); setErrorMsg(null); setSuccessMsg(null);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) { setErrorMsg(error.message); }
    else { setSuccessMsg('Mot de passe mis à jour.'); setNewPassword(''); setConfirmPassword(''); setSecurityModal(false); }
    setLoading(false);
  };

  const handleClearAllMissions = () => {
    // Open confirmation modal where admin must type CONFIRMER
    setConfirmText('');
    setConfirmClearModal(true);
  };

  const performClearAllMissions = async () => {
    if (confirmText !== 'CONFIRMER') return;
    setLoading(true); setErrorMsg(null); setSuccessMsg(null);
    try {
      // 1) Delete files from storage bucket (list then remove)
      const { data: files, error: listErr } = await supabase.storage.from('mission-photos').list('', { limit: 100000 });
      if (listErr) throw listErr;
      const paths = (files || []).map((f: any) => f.name).filter(Boolean);
      if (paths.length > 0) {
        const { error: rmErr } = await supabase.storage.from('mission-photos').remove(paths);
        if (rmErr) throw rmErr;
      }

      // 2) Delete DB rows : mission_* tables without id, then others
      // Tables de jonction (sans colonne id, clé composée)
      const junctionTables = ['mission_technicians', 'mission_equipments'];
      for (const t of junctionTables) {
        const { error: deleteErr } = await supabase.from(t).delete().not('mission_id', 'is', null);
        if (deleteErr) throw deleteErr;
      }
      
      // Tables with id column
      const idTables = ['mission_photos', 'mission_time_logs', 'missions'];
      for (const t of idTables) {
        const { data: rows, error: selectErr } = await supabase.from(t).select('id');
        if (selectErr) throw selectErr;
        const ids = (rows || []).map((r: any) => r.id);
        if (ids.length > 0) {
          const { error: deleteErr } = await supabase.from(t).delete().in('id', ids);
          if (deleteErr) throw deleteErr;
        }
      }

      toast.success('Toutes les missions, leurs données et fichiers associés ont été supprimés.');
      setConfirmClearModal(false);
      useStore.getState().initialize();
    } catch (err: any) {
      console.error('Clear all missions failed', err);
      setErrorMsg(err?.message || String(err));
      toast.error('Impossible de supprimer les missions : ' + (err?.message || String(err)));
    } finally {
      setLoading(false);
    }
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

  const toggleSkill = (id: string) =>
    setSkills((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);

  const toggleLicenseCategory = (cat: string) =>
    setLicenseCategories((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]);

  const handleSignOut = async () => { await useAuthStore.getState().signOut(); };

  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '?';

  return (
    <>
    <div className={`flex-1 overflow-auto bg-[#f8fafc] ${isTechnician ? 'p-4 pb-32' : 'p-8'}`}>
      <div className={`${isTechnician ? 'max-w-md' : 'max-w-3xl'} mx-auto space-y-4`}>

        {/* Header */}
        <div className="flex items-center gap-4 mb-2">
          {isTechnician && (
            <Link to="/" className="p-2 text-[#64748b] hover:text-[#0f172a] bg-white border border-[#e2e8f0] rounded-xl transition-colors shadow-xs">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          )}
          <div>
            <h1 className="text-2xl font-black text-[#0f172a]">Mon Profil</h1>
            <p className="text-[#64748b] mt-0.5 text-sm">Gérez vos informations et compétences.</p>
          </div>
        </div>

        {/* Feedback */}
        {successMsg && (
          <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl text-sm border border-emerald-100 font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />{successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-sm border border-red-100 font-semibold">
            {errorMsg}
          </div>
        )}

        {/* ── Avatar + identity card ── */}
        <div className="bg-white rounded-2xl shadow-xs border border-[#e2e8f0] overflow-hidden">
          {/* Avatar banner */}
          <div
            className="h-20 relative"
            style={{ background: 'linear-gradient(135deg, #080b12 0%, #131926 60%, #1a2133 100%)' }}
          >
            <div
              className="absolute left-5 -bottom-7 w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black border-2"
              style={{
                background: 'linear-gradient(135deg, rgba(0,229,160,0.18) 0%, rgba(77,159,255,0.18) 100%)',
                borderColor: 'rgba(0,229,160,0.30)',
                color: 'var(--tech-accent)',
              }}
            >
              {initials}
            </div>
            <div
              className="absolute right-4 top-4 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider"
              style={{
                background: 'rgba(0,229,160,0.15)',
                border: '1px solid rgba(0,229,160,0.25)',
                color: '#00e5a0',
              }}
            >
              {role || 'Technicien'}
            </div>
          </div>

          <div className="pt-10 pb-4 px-5">
            <p className="text-[10px] font-semibold" style={{ color: '#94a3b8' }}>{user?.email}</p>
            <form onSubmit={handleUpdateProfile} className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="settings-firstname" className="block text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-wider mb-1.5">Prénom</label>
                  <input id="settings-firstname" type="text" autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                    className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none text-sm font-semibold bg-[#f8fafc] focus:bg-white transition-all" />
                </div>
                <div>
                  <label htmlFor="settings-lastname" className="block text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-wider mb-1.5">Nom</label>
                  <input id="settings-lastname" type="text" autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)}
                    className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none text-sm font-semibold bg-[#f8fafc] focus:bg-white transition-all" />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[#0f172a] text-white px-4 py-3 rounded-xl text-sm font-extrabold hover:bg-black transition-colors disabled:opacity-50 active:scale-[0.98] duration-100">
                <Save className="w-4 h-4" /> Sauvegarder le profil
              </button>
            </form>
          </div>
        </div>

        {/* ── Quick action rows (technicians only) ── */}
        {isTechnician && (
          <div className="space-y-2">
            <p className="text-[9px] font-black uppercase tracking-widest px-1" style={{ color: '#94a3b8' }}>
              Compétences &amp; Sécurité
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
              sub={hasLicense
                ? (licenseCategories.length > 0 ? `Catégories : ${licenseCategories.join(', ')}` : 'Permis renseigné')
                : 'Non renseigné'}
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

        {/* Password card (admin only, inline) */}
        {!isTechnician && (
          <div className="bg-white rounded-2xl shadow-xs border border-[#e2e8f0] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#f1f5f9] flex items-center gap-3">
              <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center">
                <Lock className="w-5 h-5 text-orange-500" />
              </div>
              <h2 className="text-sm font-extrabold text-[#0f172a]">Sécurité</h2>
            </div>
            <form onSubmit={handleUpdatePassword} className="p-5 space-y-4">
              <div>
                <label htmlFor="settings-newpassword" className="block text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-wider mb-1.5">Nouveau mot de passe</label>
                <input id="settings-newpassword" type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none text-sm bg-[#f8fafc] focus:bg-white transition-all" />
              </div>
              <div>
                <label htmlFor="settings-confirmpassword" className="block text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-wider mb-1.5">Confirmer le mot de passe</label>
                <input id="settings-confirmpassword" type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none text-sm bg-[#f8fafc] focus:bg-white transition-all" />
              </div>
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-500 font-semibold">Les mots de passe ne correspondent pas.</p>
              )}
              <button type="submit" disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                className="w-full flex items-center justify-center gap-2 bg-[#f8fafc] text-[#0f172a] border border-[#e2e8f0] px-4 py-3 rounded-xl text-sm font-extrabold hover:bg-[#f1f5f9] transition-colors disabled:opacity-50 active:scale-[0.98] duration-100">
                <Lock className="w-4 h-4" /> Mettre à jour le mot de passe
              </button>
            </form>
          </div>
        )}

            {/* Admin — Effacer toutes les missions */}
            {!isTechnician && (
              <div className="bg-white rounded-2xl shadow-xs border border-[#e2e8f0] overflow-hidden mt-4">
                <div className="px-5 py-4 border-b border-[#f1f5f9] flex items-center gap-3">
                  <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                  </div>
                  <h2 className="text-sm font-extrabold text-[#0f172a]">DANGER — Effacer les missions</h2>
                </div>
                <div className="p-5">
                  <p className="text-sm text-[#64748b]">Supprime toutes les missions et les données associées (photos, créneaux, affectations).</p>
                  <div className="mt-4 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleClearAllMissions}
                      disabled={loading}
                      className="px-4 py-3 bg-red-600 text-white rounded-xl text-sm font-extrabold hover:bg-red-700 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      Effacer toutes les missions
                    </button>
                    <button
                      type="button"
                      onClick={() => { navigator.clipboard?.writeText('DELETE ALL MISSIONS'); toast.info('Copié dans le presse-papiers'); }}
                      className="px-3 py-2 border border-[#e2e8f0] rounded-xl text-sm text-[#64748b] hover:bg-[#f8fafc]"
                    >
                      Copier l'alerte
                    </button>
                  </div>
                </div>
              </div>
            )}
      </div>

      {/* Mobile bottom nav (hidden – handled by TechBottomNav in dashboard) */}
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

    {/* ════════════════════════════════════════════════════════════
        MODAL — Compétences
    ════════════════════════════════════════════════════════════ */}
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
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm text-black uppercase tracking-wider transition-all active:scale-[0.97] disabled:opacity-60"
          style={{
            background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)',
            boxShadow: '0 4px 20px rgba(167,139,250,0.30)',
          }}
        >
          {skillsSaving === 'saving' ? (
            <span className="animate-spin w-4 h-4 border-2 border-black/30 border-t-black rounded-full" />
          ) : skillsSaving === 'saved' ? (
            <><Check className="w-4 h-4" /> Sauvegardé !</>
          ) : (
            <><Star className="w-4 h-4" /> Enregistrer mes compétences</>
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
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold border transition-all active:scale-95"
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

    {/* ════════════════════════════════════════════════════════════
        MODAL — Permis de conduire
    ════════════════════════════════════════════════════════════ */}
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
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm text-black uppercase tracking-wider transition-all active:scale-[0.97] disabled:opacity-60"
          style={{
            background: 'linear-gradient(135deg, #4d9fff 0%, #2563eb 100%)',
            boxShadow: '0 4px 20px rgba(77,159,255,0.25)',
          }}
        >
          {skillsSaving === 'saving' ? (
            <span className="animate-spin w-4 h-4 border-2 border-black/30 border-t-black rounded-full" />
          ) : (
            <><Car className="w-4 h-4" /> Enregistrer le permis</>
          )}
        </button>
      }
    >
      {/* Toggle has license */}
      <button
        type="button"
        onClick={() => setHasLicense((v) => !v)}
        className="w-full flex items-center justify-between p-4 rounded-2xl transition-all active:scale-[0.97]"
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
        {/* Toggle pill */}
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

      {/* License details */}
      {hasLicense && (
        <div className="space-y-4 tech-animate-in">
          {/* Since when */}
          <div>
            <label className="block text-[9px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--tech-text-muted)' }}>
              Date d'obtention
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

          {/* Categories */}
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

    {/* ════════════════════════════════════════════════════════════
        MODAL — Sécurité (mot de passe)
    ════════════════════════════════════════════════════════════ */}
    <BottomSheet
      open={securityModal}
      onClose={() => { setSecurityModal(false); setNewPassword(''); setConfirmPassword(''); setErrorMsg(null); }}
      title="Sécurité"
      subtitle="Modifiez votre mot de passe"
      footer={
        <button
          type="button"
          onClick={handleUpdatePassword as any}
          disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm text-white uppercase tracking-wider transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
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

        {/* Password strength hint */}
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

    {/* Confirmation modal pour suppression massive */}
    <BottomSheet
      open={confirmClearModal}
      onClose={() => { setConfirmClearModal(false); setConfirmText(''); }}
      title="CONFIRMER la suppression"
      subtitle="Tapez CONFIRMER pour valider la suppression de toutes les missions et fichiers associés"
      footer={
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setConfirmClearModal(false); setConfirmText(''); }}
            className="px-4 py-3 bg-white border border-[#e2e8f0] rounded-2xl text-sm text-[#64748b]"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={performClearAllMissions}
            disabled={confirmText !== 'CONFIRMER' || loading}
            className="px-4 py-3 bg-red-600 text-white rounded-2xl text-sm font-extrabold disabled:opacity-50"
          >
            Supprimer définitivement
          </button>
        </div>
      }
    >
      <div className="py-1">
        <p className="text-sm text-[#94a3b8] mb-3">Cette opération est irréversible. Les fichiers stockés dans le bucket <strong>mission-photos</strong> seront également supprimés.</p>
        <input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="Tapez CONFIRMER"
          className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2 bg-[#f8fafc] text-sm"
        />
      </div>
    </BottomSheet>
    </>
  );
}

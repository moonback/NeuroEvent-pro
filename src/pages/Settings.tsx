import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/auth';
import { useStore } from '../store';
import { supabase } from '../lib/supabase';
import {
  Save, User, Lock, ArrowLeft, Calendar, Settings as SettingsIcon,
  LogOut, Wrench, Car, Check, Plus, X, ChevronDown, ChevronUp,
  Shield, Award
} from 'lucide-react';
import { Link } from 'react-router-dom';

// ─── Skill catalog ──────────────────────────────────────────────────────────
const SKILL_CATALOG = [
  { id: 'montage_scene',     label: 'Montage scène',     emoji: '🎭' },
  { id: 'sono',              label: 'Sonorisation',       emoji: '🔊' },
  { id: 'eclairage',         label: 'Éclairage',          emoji: '💡' },
  { id: 'video',             label: 'Vidéo / Mapping',    emoji: '📽️' },
  { id: 'rigging',           label: 'Rigging',            emoji: '⛓️' },
  { id: 'electricite',       label: 'Électricité',        emoji: '⚡' },
  { id: 'decoration',        label: 'Décoration',         emoji: '🎀' },
  { id: 'securite',          label: 'Sécurité événement', emoji: '🦺' },
  { id: 'logistique',        label: 'Logistique',         emoji: '📦' },
  { id: 'conduite_poids',    label: 'Conduite poids lourd', emoji: '🚛' },
  { id: 'nacelle',           label: 'Nacelle / PEMP',    emoji: '🏗️' },
  { id: 'coordination',      label: 'Coordination équipe', emoji: '📋' },
  { id: 'manutention',       label: 'Manutention',        emoji: '🪝' },
  { id: 'froid',             label: 'Froid / Clim.',      emoji: '❄️' },
];

const LICENSE_CATEGORIES = ['A', 'A1', 'A2', 'AM', 'B', 'BE', 'B1', 'C', 'C1', 'CE', 'C1E', 'D', 'D1', 'DE', 'D1E'];

// ─── Component ──────────────────────────────────────────────────────────────
export default function Settings() {
  const user = useAuthStore(state => state.user);
  const role = useAuthStore(state => state.role);
  const technicians = useStore(state => state.technicians);
  const updateTechnician = useStore(state => state.updateTechnician);
  const techProfile = technicians.find(t => t.id === user?.id);

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // User Profile State
  const [firstName, setFirstName] = useState(user?.user_metadata?.first_name || '');
  const [lastName, setLastName] = useState(user?.user_metadata?.last_name || '');

  // Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Skills & License (local only)
  const [skills, setSkills] = useState<string[]>([]);
  const [hasLicense, setHasLicense] = useState(false);
  const [licenseSince, setLicenseSince] = useState('');
  const [licenseCategories, setLicenseCategories] = useState<string[]>([]);
  const [skillsSaving, setSkillsSaving] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [showAllSkills, setShowAllSkills] = useState(false);

  const isTechnician = role !== 'Admin';

  // Load from store on mount or when techProfile changes
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
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const { error } = await supabase.auth.updateUser({
      data: { first_name: firstName, last_name: lastName }
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setSuccessMsg('Profil mis à jour avec succès.');
      if (user?.id) {
        await supabase.from('profiles').update({ first_name: firstName, last_name: lastName }).eq('id', user.id);
        if (role === 'Technicien') {
          await supabase.from('technicians').update({ first_name: firstName, last_name: lastName }).eq('id', user.id);
        }
      }
    }
    setLoading(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setErrorMsg('Les mots de passe ne correspondent pas.'); return; }
    if (newPassword.length < 6) { setErrorMsg('Le mot de passe doit contenir au moins 6 caractères.'); return; }
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) { setErrorMsg(error.message); }
    else { setSuccessMsg('Mot de passe mis à jour avec succès.'); setNewPassword(''); setConfirmPassword(''); }
    setLoading(false);
  };

  const handleSaveSkills = async () => {
    if (!user?.id) return;
    setSkillsSaving('saving');
    
    await updateTechnician(user.id, {
      skills,
      driverLicense: { hasLicense, since: licenseSince, categories: licenseCategories }
    });
    
    setSkillsSaving('saved');
    setTimeout(() => setSkillsSaving('idle'), 2000);
  };

  const toggleSkill = (id: string) => {
    setSkills(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const toggleLicenseCategory = (cat: string) => {
    setLicenseCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const handleSignOut = async () => { await useAuthStore.getState().signOut(); };

  const visibleSkills = showAllSkills ? SKILL_CATALOG : SKILL_CATALOG.slice(0, 8);

  return (
    <div className={`flex-1 overflow-auto bg-[#f8fafc] ${isTechnician ? 'p-4 pb-28' : 'p-8'}`}>
      <div className={`${isTechnician ? 'max-w-md' : 'max-w-3xl'} mx-auto space-y-5`}>

        {/* Header */}
        <div className="flex items-center gap-4">
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

        {/* Feedback messages */}
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

        {/* ── Profile card ── */}
        <div className="bg-white rounded-2xl shadow-xs border border-[#e2e8f0] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#f1f5f9] flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 text-[#2563eb]" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-[#0f172a]">Profil Utilisateur</h2>
              <p className="text-[10px] text-[#64748b] font-medium">{user?.email}</p>
            </div>
            <div className="ml-auto">
              <span className="text-[10px] font-extrabold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">
                {role || 'Technicien'}
              </span>
            </div>
          </div>
          <form onSubmit={handleUpdateProfile} className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="settings-firstname" className="block text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-wider mb-1.5">Prénom</label>
                <input
                  id="settings-firstname"
                  type="text"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none text-sm font-semibold bg-[#f8fafc] focus:bg-white transition-all"
                />
              </div>
              <div>
                <label htmlFor="settings-lastname" className="block text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-wider mb-1.5">Nom</label>
                <input
                  id="settings-lastname"
                  type="text"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none text-sm font-semibold bg-[#f8fafc] focus:bg-white transition-all"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#0f172a] text-white px-4 py-3 rounded-xl text-sm font-extrabold hover:bg-black transition-colors disabled:opacity-50 active:scale-[0.98] duration-100"
            >
              <Save className="w-4 h-4" />
              Sauvegarder le profil
            </button>
          </form>
        </div>

        {/* ── Skills & License (technicians only) ── */}
        {isTechnician && (
          <div className="bg-white rounded-2xl shadow-xs border border-[#e2e8f0] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#f1f5f9] flex items-center gap-3">
              <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center">
                <Award className="w-5 h-5 text-violet-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-extrabold text-[#0f172a]">Compétences & Permis</h2>
                <p className="text-[10px] text-[#64748b] font-medium">Visible par l'équipe planification</p>
              </div>
              {skillsSaving === 'saving' && (
                <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1">
                  Enregistrement...
                </span>
              )}
              {skillsSaving === 'saved' && (
                <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Sauvegardé
                </span>
              )}
            </div>

            <div className="p-5 space-y-6">
              {/* ── Skills picker ── */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-violet-500" />
                    <span className="text-xs font-extrabold text-[#0f172a]">Mes compétences</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#94a3b8]">{skills.length} sélectionnée{skills.length > 1 ? 's' : ''}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {visibleSkills.map(skill => {
                    const selected = skills.includes(skill.id);
                    return (
                      <button
                        key={skill.id}
                        type="button"
                        onClick={() => toggleSkill(skill.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all active:scale-95 duration-100 ${
                          selected
                            ? 'bg-violet-600 text-white border-violet-600 shadow-sm shadow-violet-200'
                            : 'bg-[#f8fafc] text-[#64748b] border-[#e2e8f0] hover:border-violet-300 hover:text-violet-600'
                        }`}
                      >
                        <span className="text-sm">{skill.emoji}</span>
                        <span>{skill.label}</span>
                        {selected && <X className="w-3 h-3 ml-0.5 opacity-70" />}
                      </button>
                    );
                  })}
                </div>

                {SKILL_CATALOG.length > 8 && (
                  <button
                    type="button"
                    onClick={() => setShowAllSkills(v => !v)}
                    className="mt-3 flex items-center gap-1 text-[11px] font-bold text-[#64748b] hover:text-violet-600 transition-colors"
                  >
                    {showAllSkills ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {showAllSkills ? 'Voir moins' : `Voir ${SKILL_CATALOG.length - 8} de plus`}
                  </button>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-[#f1f5f9]"></div>

              {/* ── Driver license ── */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Car className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-extrabold text-[#0f172a]">Permis de conduire</span>
                </div>

                {/* Toggle */}
                <button
                  type="button"
                  onClick={() => setHasLicense(v => !v)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    hasLicense
                      ? 'bg-blue-50 border-blue-200 text-blue-800'
                      : 'bg-[#f8fafc] border-[#e2e8f0] text-[#64748b]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${hasLicense ? 'bg-blue-100' : 'bg-slate-100'}`}>
                      🪪
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-extrabold">
                        {hasLicense ? 'J\'ai le permis de conduire' : 'Pas de permis de conduire'}
                      </div>
                      <div className="text-[10px] font-medium mt-0.5 opacity-70">
                        {hasLicense ? 'Cliquer pour désactiver' : 'Cliquer pour activer'}
                      </div>
                    </div>
                  </div>
                  <div className={`w-12 h-6 rounded-full transition-all relative ${hasLicense ? 'bg-blue-500' : 'bg-slate-200'}`}>
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200 ${hasLicense ? 'left-6' : 'left-0.5'}`}></div>
                  </div>
                </button>

                {/* License details (shown when hasLicense = true) */}
                {hasLicense && (
                  <div className="mt-3 space-y-3 animate-fade-in">
                    {/* Since when */}
                    <div className="bg-[#f8fafc] rounded-xl border border-[#e2e8f0] p-4">
                      <label htmlFor="license-since" className="block text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-wider mb-2">
                        Obtenu le
                      </label>
                      <input
                        id="license-since"
                        type="date"
                        value={licenseSince}
                        onChange={e => setLicenseSince(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        className="w-full bg-white border border-[#e2e8f0] rounded-xl px-3 py-2.5 text-sm font-semibold text-[#0f172a] focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all"
                      />
                      {licenseSince && (
                        <p className="text-[10px] text-[#64748b] font-medium mt-1.5">
                          Obtenu il y a {Math.floor((Date.now() - new Date(licenseSince).getTime()) / (1000 * 60 * 60 * 24 * 365))} an(s)
                        </p>
                      )}
                    </div>

                    {/* Categories */}
                    <div className="bg-[#f8fafc] rounded-xl border border-[#e2e8f0] p-4">
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-wider">
                          Catégories
                        </label>
                        {licenseCategories.length > 0 && (
                          <span className="text-[10px] font-bold text-blue-600">{licenseCategories.join(', ')}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {LICENSE_CATEGORIES.map(cat => {
                          const selected = licenseCategories.includes(cat);
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => toggleLicenseCategory(cat)}
                              className={`w-10 h-10 rounded-xl text-xs font-extrabold border transition-all active:scale-95 duration-100 ${
                                selected
                                  ? 'bg-blue-500 text-white border-blue-500 shadow-sm shadow-blue-200'
                                  : 'bg-white text-[#64748b] border-[#e2e8f0] hover:border-blue-300 hover:text-blue-600'
                              }`}
                            >
                              {cat}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[10px] text-[#94a3b8] mt-2 font-medium">
                        Sélectionnez toutes les catégories que vous possédez
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Save button */}
              <button
                type="button"
                onClick={handleSaveSkills}
                className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-3 rounded-xl text-sm font-extrabold transition-colors active:scale-[0.98] duration-100 shadow-sm shadow-violet-200"
              >
                <Shield className="w-4 h-4" />
                Sauvegarder mes compétences
              </button>
            </div>
          </div>
        )}

        {/* ── Password card ── */}
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
              <input
                id="settings-newpassword"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none text-sm bg-[#f8fafc] focus:bg-white transition-all"
              />
            </div>
            <div>
              <label htmlFor="settings-confirmpassword" className="block text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-wider mb-1.5">Confirmer le mot de passe</label>
              <input
                id="settings-confirmpassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none text-sm bg-[#f8fafc] focus:bg-white transition-all"
              />
            </div>
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500 font-semibold">Les mots de passe ne correspondent pas.</p>
            )}
            <button
              type="submit"
              disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
              className="w-full flex items-center justify-center gap-2 bg-[#f8fafc] text-[#0f172a] border border-[#e2e8f0] px-4 py-3 rounded-xl text-sm font-extrabold hover:bg-[#f1f5f9] transition-colors disabled:opacity-50 active:scale-[0.98] duration-100"
            >
              <Lock className="w-4 h-4" />
              Mettre à jour le mot de passe
            </button>
          </form>
        </div>

        {/* Bottom spacing */}
        {!isTechnician && <div className="h-4"></div>}
      </div>

      {/* Mobile bottom nav (technicians only) */}
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
  );
}

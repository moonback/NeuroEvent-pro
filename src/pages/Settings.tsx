import React, { useState } from 'react';
import { useAuthStore } from '../store/auth';
import { supabase } from '../lib/supabase';
import { Save, User, Lock, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Settings() {
  const user = useAuthStore(state => state.user);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // User Profile State
  const [firstName, setFirstName] = useState(user?.user_metadata?.first_name || '');
  const [lastName, setLastName] = useState(user?.user_metadata?.last_name || '');
  
  // Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const { error } = await supabase.auth.updateUser({
      data: {
        first_name: firstName,
        last_name: lastName,
      }
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setSuccessMsg('Profil mis à jour avec succès.');
      // Update profile in database if needed
      if (user?.id) {
        await supabase.from('profiles').update({
          first_name: firstName,
          last_name: lastName
        }).eq('id', user.id);
        
        if (user.user_metadata?.role === 'Technicien') {
          await supabase.from('technicians').update({
            first_name: firstName,
            last_name: lastName
          }).eq('id', user.id);
        }
      }
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

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setSuccessMsg('Mot de passe mis à jour avec succès.');
      setNewPassword('');
      setConfirmPassword('');
    }
    
    setLoading(false);
  };

  return (
    <div className="flex-1 overflow-auto bg-[#f8fafc] p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          {user?.user_metadata?.role === 'Technicien' && (
            <Link to="/" className="p-2 text-[#64748b] hover:text-[#0f172a] bg-white border border-[#e2e8f0] rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          )}
          <div>
            <h1 className="text-2xl font-bold text-[#0f172a]">Paramètres</h1>
            <p className="text-[#64748b] mt-1">Gérez vos informations personnelles et préférences.</p>
          </div>
        </div>

        {successMsg && (
          <div className="bg-emerald-50 text-emerald-600 p-4 rounded-lg text-sm border border-emerald-100 font-medium">
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-50 text-red-500 p-4 rounded-lg text-sm border border-red-100 font-medium">
            {errorMsg}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-[#e2e8f0] overflow-hidden">
          <div className="p-6 border-b border-[#e2e8f0]">
            <div className="flex items-center gap-3 mb-4">
              <User className="w-5 h-5 text-[#2563eb]" />
              <h2 className="text-lg font-bold text-[#0f172a]">Profil Utilisateur</h2>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-bold text-[#64748b] uppercase tracking-wider mb-2">Email</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full rounded-md border border-[#e2e8f0] px-3 py-2 bg-[#f1f5f9] text-[#64748b] text-sm cursor-not-allowed"
                />
                <p className="text-xs text-[#94a3b8] mt-1">L'adresse email ne peut pas être modifiée.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#64748b] uppercase tracking-wider mb-2">Prénom</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full rounded-md border border-[#e2e8f0] px-3 py-2 focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#64748b] uppercase tracking-wider mb-2">Nom</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full rounded-md border border-[#e2e8f0] px-3 py-2 focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none text-sm"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-[#64748b] uppercase tracking-wider mb-2">Rôle</label>
                <div className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-md border border-blue-100">
                  {user?.user_metadata?.role || 'Technicien'}
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 bg-[#0f172a] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-black transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>Sauvegarder le profil</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-[#e2e8f0] overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-5 h-5 text-[#ea580c]" />
              <h2 className="text-lg font-bold text-[#0f172a]">Sécurité</h2>
            </div>
            
            <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-bold text-[#64748b] uppercase tracking-wider mb-2">Nouveau mot de passe</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-md border border-[#e2e8f0] px-3 py-2 focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#64748b] uppercase tracking-wider mb-2">Confirmer le mot de passe</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-md border border-[#e2e8f0] px-3 py-2 focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none text-sm"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading || !newPassword || !confirmPassword}
                  className="flex items-center gap-2 bg-white text-[#0f172a] border border-[#e2e8f0] px-4 py-2 rounded-md text-sm font-bold hover:bg-[#f8fafc] transition-colors disabled:opacity-50"
                >
                  <Lock className="w-4 h-4" />
                  <span>Mettre à jour le mot de passe</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

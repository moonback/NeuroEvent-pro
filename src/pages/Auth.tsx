import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar } from 'lucide-react';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            // Sécurité : toute inscription publique est Technicien.
            // La promotion Admin se fait depuis la page Utilisateurs (ou SQL).
            role: 'Technicien'
          }
        }
      });
      if (error) {
        setError(error.message);
      } else {
        if (data.user) {
          // Repli pour les bases non migrées : le trigger handle_new_user
          // crée déjà ces lignes côté serveur après migration.
          await supabase.from('profiles').insert({
            id: data.user.id,
            email: data.user.email ?? email,
            first_name: firstName,
            last_name: lastName,
            role: 'Technicien'
          });

          await supabase.from('technicians').insert({
            id: data.user.id,
            first_name: firstName,
            last_name: lastName,
            specialty: 'Général',
            color: '#3b82f6'
          });
        }
        setMessage("Inscription réussie. Veuillez vérifier votre boîte mail.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#fdfdfd] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="w-16 h-16 bg-[#0f172a] rounded-xl flex items-center justify-center mb-6 shadow-sm">
          <Calendar className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-center text-3xl font-bold tracking-tight text-[#0f172a]">EventFlow Planning</h2>
        <p className="mt-2 text-center text-sm text-[#64748b] font-medium uppercase tracking-wider">
          {isSignUp ? 'Création de compte' : 'Connexion au portail'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-[#e2e8f0] sm:rounded-xl sm:px-10">
          <form className="space-y-6" onSubmit={handleAuth}>
            {error && (
              <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm border border-red-100">
                {error}
              </div>
            )}
            {message && (
              <div className="bg-emerald-50 text-emerald-600 p-3 rounded-md text-sm border border-emerald-100">
                {message}
              </div>
            )}
            
            {isSignUp && (
              <>
                <div>
                  <label htmlFor="auth-firstname" className="block text-[10px] font-bold text-[#64748b] tracking-wider uppercase mb-1">Prénom</label>
                  <div className="mt-1">
                    <input
                      id="auth-firstname"
                      type="text"
                      required
                      autoComplete="given-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full rounded-md border border-[#e2e8f0] px-3 py-2 focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none bg-[#f8fafc] text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="auth-lastname" className="block text-[10px] font-bold text-[#64748b] tracking-wider uppercase mb-1">Nom</label>
                  <div className="mt-1">
                    <input
                      id="auth-lastname"
                      type="text"
                      required
                      autoComplete="family-name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full rounded-md border border-[#e2e8f0] px-3 py-2 focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none bg-[#f8fafc] text-sm"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label htmlFor="auth-email" className="block text-[10px] font-bold text-[#64748b] tracking-wider uppercase mb-1">Email</label>
              <div className="mt-1">
                <input
                  id="auth-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-[#e2e8f0] px-3 py-2 focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none bg-[#f8fafc] text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="auth-password" className="block text-[10px] font-bold text-[#64748b] tracking-wider uppercase mb-1">Mot de passe</label>
              <div className="mt-1">
                <input
                  id="auth-password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-[#e2e8f0] px-3 py-2 focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none bg-[#f8fafc] text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-[#0f172a] hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 transition-colors"
              >
                {loading ? 'Chargement...' : (isSignUp ? "S'inscrire" : 'Se connecter')}
              </button>
            </div>
            
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => { setIsSignUp(!isSignUp); setError(null); setMessage(null); }}
                className="text-xs font-semibold text-[#2563eb] hover:text-blue-700"
              >
                {isSignUp ? 'Déjà un compte ? Se connecter' : "Pas encore de compte ? S'inscrire"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

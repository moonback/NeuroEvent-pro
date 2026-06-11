/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import Auth from './pages/Auth';
import Toaster from './components/ui/Toaster';
import { useAuthStore } from './store/auth';
import { useStore } from './store';

// Code-splitting par route : FullCalendar, Recharts et html5-qrcode ne sont
// téléchargés que lorsque la page correspondante est réellement ouverte.
const Planning = lazy(() => import('./pages/Planning'));
const Technicians = lazy(() => import('./pages/Technicians'));
const Trucks = lazy(() => import('./pages/Trucks'));
const Equipment = lazy(() => import('./pages/Equipment'));
const Clients = lazy(() => import('./pages/Clients'));
const Users = lazy(() => import('./pages/Users'));
const TechnicianDashboard = lazy(() => import('./pages/TechnicianDashboard'));
const Settings = lazy(() => import('./pages/Settings'));
const MissionBriefs = lazy(() => import('./pages/MissionBriefs'));
const Stats = lazy(() => import('./pages/Stats'));

function FullScreenLoader() {
  return <div className="h-screen w-screen flex items-center justify-center bg-[#fdfdfd] text-sm text-[#64748b]">Chargement...</div>;
}

function PageLoader() {
  return (
    <div className="h-full w-full flex items-center justify-center py-20 text-sm text-[#64748b]">
      Chargement de la page...
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const session = useAuthStore(state => state.session);
  const loading = useAuthStore(state => state.loading);

  if (loading) return <FullScreenLoader />;
  if (!session) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

export default function App() {
  const initAuth = useAuthStore(state => state.initialize);
  const initDb = useStore(state => state.initialize);
  const session = useAuthStore(state => state.session);
  const role = useAuthStore(state => state.role);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (session) {
      initDb();
    }
  }, [session, initDb]);

  // Le rôle est résolu côté serveur (table profiles) : on attend sa résolution
  // pour ne jamais afficher la mauvaise interface, même une fraction de seconde.
  if (session && role === null) return <FullScreenLoader />;

  const isAdmin = role === 'Admin';

  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={session ? <Navigate to="/" replace /> : <Auth />} />

          {isAdmin ? (
            <>
              <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Planning />} />
                <Route path="technicians" element={<Technicians />} />
                <Route path="trucks" element={<Trucks />} />
                <Route path="equipment" element={<Equipment />} />
                <Route path="clients" element={<Clients />} />
                <Route path="users" element={<Users />} />
                <Route path="fiches" element={<MissionBriefs />} />
                <Route path="stats" element={<Stats />} />
                <Route path="settings" element={<Settings />} />
              </Route>
              {/* Catch-all : aucune URL ne doit aboutir à une page blanche */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          ) : (
            <>
              <Route path="/" element={<ProtectedRoute><TechnicianDashboard /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              {/* Tout chemin admin tenté par un technicien est redirigé vers son tableau de bord */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
      </Suspense>
      <Toaster />
    </Router>
  );
}

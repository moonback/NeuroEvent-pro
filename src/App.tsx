/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import Auth from './pages/Auth';
import { useAuthStore } from './store/auth';
import { useStore } from './store';

// Code-splitting par route : FullCalendar et Recharts ne sont téléchargés
// que lorsque la page correspondante est réellement ouverte.
const Planning = lazy(() => import('./pages/Planning'));
const Technicians = lazy(() => import('./pages/Technicians'));
const Trucks = lazy(() => import('./pages/Trucks'));
const Equipment = lazy(() => import('./pages/Equipment'));
const TechnicianDashboard = lazy(() => import('./pages/TechnicianDashboard'));
const Settings = lazy(() => import('./pages/Settings'));
const MissionBriefs = lazy(() => import('./pages/MissionBriefs'));
const Stats = lazy(() => import('./pages/Stats'));

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

  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-[#fdfdfd]">Chargement...</div>;
  if (!session) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

export default function App() {
  const initAuth = useAuthStore(state => state.initialize);
  const initDb = useStore(state => state.initialize);
  const session = useAuthStore(state => state.session);
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (session) {
      initDb();
    }
  }, [session, initDb]);

  const isTechnician = user?.user_metadata?.role === 'Technicien';

  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<Auth />} />
        
        {isTechnician ? (
          <>
            <Route path="/" element={<ProtectedRoute><TechnicianDashboard /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            {/* Tout chemin admin tenté par un technicien est redirigé vers son tableau de bord */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          <>
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Planning />} />
              <Route path="technicians" element={<Technicians />} />
              <Route path="trucks" element={<Trucks />} />
              <Route path="equipment" element={<Equipment />} />
              <Route path="fiches" element={<MissionBriefs />} />
              <Route path="stats" element={<Stats />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            {/* Catch-all : aucune URL ne doit aboutir à une page blanche */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
      </Suspense>
    </Router>
  );
}

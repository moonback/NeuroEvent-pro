/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import Planning from './pages/Planning';
import Technicians from './pages/Technicians';
import Trucks from './pages/Trucks';
import Equipment from './pages/Equipment';
import Auth from './pages/Auth';
import TechnicianDashboard from './pages/TechnicianDashboard';
import Settings from './pages/Settings';
import { useAuthStore } from './store/auth';
import { useStore } from './store';

import MissionBriefs from './pages/MissionBriefs';
import Stats from './pages/Stats';

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
      <Routes>
        <Route path="/login" element={<Auth />} />
        
        {isTechnician ? (
          <>
            <Route path="/" element={<ProtectedRoute><TechnicianDashboard /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          </>
        ) : (
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Planning />} />
            <Route path="technicians" element={<Technicians />} />
            <Route path="trucks" element={<Trucks />} />
            <Route path="equipment" element={<Equipment />} />
            <Route path="fiches" element={<MissionBriefs />} />
            <Route path="stats" element={<Stats />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        )}
      </Routes>
    </Router>
  );
}

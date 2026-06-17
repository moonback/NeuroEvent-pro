import React from 'react';
import { useTechDashboard, triggerVibrate } from '../components/technician/useTechDashboard';
import TechHeader from '../components/technician/TechHeader';
import TechBottomNav from '../components/technician/TechBottomNav';
import MissionCard from '../components/technician/MissionCard';
import MissionFilters from '../components/technician/MissionFilters';
import MissionDrawer from '../components/technician/MissionDrawer';
import { TimeModal } from '../components/technician/TimeModal';
import PullToRefreshIndicator from '../components/technician/PullToRefreshIndicator';
import { usePullToRefresh } from '../hooks/useSwipeGestures';

// Existing components
import { QRScannerModal } from '../components/QRScannerModal';
import SignaturePad from '../components/SignaturePad';
import TechnicianMyHours from '../components/TechnicianMyHours';
import TechnicianUnavailabilities from '../components/TechnicianUnavailabilities';
import Settings from './Settings';

import { useStore } from '../store';
import { toast } from '../store/toast';
import { Calendar } from 'lucide-react';
import { isSameDay } from 'date-fns';

export default function TechnicianDashboard() {
  const tech = useTechDashboard();

  // ── Pull-to-refresh (scroll body/window) ────────────────────────────
  // On ne binde pas le `bind()` sur un élément React — la page scrolle
  // directement le body, donc on attache les listeners natifs sur window.
  const pullToRefresh = usePullToRefresh({
    threshold: 60,
    maxPull: 100,
    resistance: 0.4,
    onRefresh: async () => {
      triggerVibrate('success');
      try {
        await tech.initialize();
        toast.success('Données actualisées');
      } catch (err) {
        console.error(err);
        toast.error("Erreur lors de l'actualisation");
      }
    },
  });

  // Branchement des listeners natifs sur window (le body scrolle, pas un conteneur).
  React.useEffect(() => {
    const { onTouchStart, onTouchMove, onTouchEnd } = pullToRefresh.bind();
    const opts = { passive: true } as AddEventListenerOptions;
    window.addEventListener('touchstart', onTouchStart, opts);
    window.addEventListener('touchmove', onTouchMove, opts);
    window.addEventListener('touchend', onTouchEnd, opts);
    return () => {
      window.removeEventListener('touchstart', onTouchStart, opts);
      window.removeEventListener('touchmove', onTouchMove, opts);
      window.removeEventListener('touchend', onTouchEnd, opts);
    };
  }, [pullToRefresh]);

  const currentTech = tech.technicians.find((t) => t.id === tech.user?.id);
  const userName = currentTech
    ? currentTech.firstName
    : tech.user?.user_metadata?.first_name || '';

  const todayMissions = React.useMemo(
    () =>
      tech.missions
        .filter((m) => m.technicianIds.includes(tech.user?.id || '') && isSameDay(m.start, new Date()))
        .sort((a, b) => a.start.getTime() - b.start.getTime()),
    [tech.missions, tech.user?.id]
  );
  const todayPendingMissions = React.useMemo(
    () => todayMissions.filter((m) => m.status !== 'Terminée'),
    [todayMissions]
  );
  const canEndDay = todayMissions.length > 0 && todayPendingMissions.length === 0;
  const todayDayLog = tech.dayLogs.find(
    (d: any) => d.technicianId === tech.user?.id && isSameDay(new Date(d.date), new Date())
  );
  const isDayEnded = !!todayDayLog;

  // Missions du technician connecté
  const myMissionsLocal = React.useMemo(
    () =>
      tech.missions
        .filter((m) => m.technicianIds.includes(tech.user?.id || ''))
        .sort((a, b) => a.start.getTime() - b.start.getTime()),
    [tech.missions, tech.user?.id]
  );

  // Verrouillage : la première mission "En cours" bloque toute navigation.
  const lockedMissionResolved = React.useMemo(
    () => myMissionsLocal.find((m) => m.status === 'En cours') ?? null,
    [myMissionsLocal]
  );

  // Auto-open : si une mission est en cours, on force son ouverture.
  React.useEffect(() => {
    if (
      lockedMissionResolved &&
      (!tech.selectedMission || tech.selectedMission.id !== lockedMissionResolved.id)
    ) {
      tech.setSelectedMission(lockedMissionResolved);
      tech.setDrawerTab('general');
    }
  }, [lockedMissionResolved, tech.selectedMission, tech]);

  // Wrapper sécurisé : bloque le changement d'onglet si une mission est en cours.
  const safeSetActiveTab = React.useCallback(
    (tab: typeof tech.activeTab) => {
      if (lockedMissionResolved && tab !== 'active' && tab !== 'history') {
        triggerVibrate('error');
        toast.error('Terminez d\'abord votre mission en cours pour changer d\'onglet.');
        return;
      }
      tech.setActiveTab(tab);
    },
    [lockedMissionResolved, tech]
  );

  // Lock global : true si une mission est en cours (drawer forcé ouvert).
  const isLocked = !!lockedMissionResolved;

  return (
    <div className="tech-dark min-h-screen bg-black text-[#f0f4ff] font-sans pb-24 overflow-x-hidden">
      {/* Header */}
      <TechHeader
        userName={userName}
        isOnline={tech.isOnline}
        syncCount={tech.syncQueue.length}
        todayCount={tech.todayCount}
        activeCount={tech.activeCount}
        onSettingsClick={() => safeSetActiveTab('profil')}
      />

      {/* Main Tab Routing */}
      {tech.activeTab === 'active' && !isLocked ? (
        <div className="max-w-md mx-auto px-4 pt-2 pb-6">
          <div
            className="tech-card p-3 rounded-3xl"
            style={{
              background: isDayEnded
                ? 'rgba(0,229,160,0.06)'
                : 'rgba(255,255,255,0.025)',
              border: '1px solid var(--tech-border)',
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className="text-[10px] uppercase tracking-[0.25em] font-black"
                  style={{ color: 'var(--tech-text-muted)' }}
                >
                  {isDayEnded ? "Aujourd'hui terminé" : 'Travail du jour'}
                </p>
                <p
                  className="text-sm font-black mt-0.5"
                  style={{ color: 'var(--tech-text)' }}
                >
                  {isDayEnded
                    ? 'Journée terminée'
                    : `${todayPendingMissions.length} mission(s) restante(s)`}
                </p>
              </div>
              {!isDayEnded && canEndDay && (
                <button
                  onClick={() => {
                    triggerVibrate('success');
                    tech.openDayEndModal();
                  }}
                  className="px-3 py-2 rounded-2xl text-[10px] font-black uppercase tracking-wide transition-all active:scale-95"
                  style={{ background: 'var(--tech-accent)', color: '#000' }}
                >
                  Terminer
                </button>
              )}
              {isDayEnded && todayDayLog && (
                <span
                  className="text-xs font-black tabular-nums px-2.5 py-2 rounded-2xl"
                  style={{
                    background: 'rgba(0,229,160,0.12)',
                    color: 'var(--tech-accent)',
                    border: '1px solid rgba(0,229,160,0.18)',
                  }}
                >
                  {Math.floor(todayDayLog.totalMinutes / 60)}h{String(todayDayLog.totalMinutes % 60).padStart(2, '0')}
                </span>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {tech.activeTab === 'mes_heures' ? (
        <div className="max-w-md mx-auto tech-animate-in pt-5">
          <div className="px-4 mb-4">
            <h1 className="text-xl font-black tracking-tight" style={{ color: 'var(--tech-text)' }}>
              Mes Heures
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--tech-text-muted)' }}>
              Historique complet de vos missions.
            </p>
          </div>
          <TechnicianMyHours />
        </div>
      ) : tech.activeTab === 'disponibilites' ? (
        <div className="max-w-md mx-auto tech-animate-in pt-5">
          <div className="px-4 mb-4">
            <h1 className="text-xl font-black tracking-tight" style={{ color: 'var(--tech-text)' }}>
              Mes Absences
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--tech-text-muted)' }}>
              Déclarez vos indisponibilités.
            </p>
          </div>
          <TechnicianUnavailabilities />
        </div>
      ) : tech.activeTab === 'profil' ? (
        <div className="tech-animate-in">
          <Settings />
        </div>
      ) : (
        <div className="max-w-md mx-auto space-y-3 pt-3 pb-6">
          {/* Pull-to-refresh indicator (piloté par usePullToRefresh) */}
          <PullToRefreshIndicator
            pullDistance={pullToRefresh.pullDistance}
            threshold={60}
            isRefreshing={pullToRefresh.isRefreshing}
          />

          {/* Filters */}
          <MissionFilters
            activeTab={tech.activeTab}
            searchTerm={tech.searchTerm}
            setSearchTerm={tech.setSearchTerm}
            dateFilter={tech.dateFilter}
            setDateFilter={tech.setDateFilter}
            statusFilter={tech.statusFilter}
            setStatusFilter={tech.setStatusFilter}
          />

          {/* Missions List */}
          <div className="px-4 space-y-2.5">
            {tech.displayedMissions.length === 0 ? (
              <div
                className="tech-card py-14 px-6 text-center tech-animate-in"
              >
                {/* Animated empty state icon */}
                <div
                  className="w-14 h-14 rounded-3xl flex items-center justify-center mx-auto mb-4 tech-animate-float"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
                    border: '1px solid var(--tech-border)',
                  }}
                >
                  <Calendar className="w-6 h-6" style={{ color: 'var(--tech-text-muted)' }} />
                </div>
                <h3
                  className="font-extrabold text-sm tracking-tight"
                  style={{ color: 'var(--tech-text-secondary)' }}
                >
                  Aucune mission trouvée
                </h3>
                <p
                  className="text-xs mt-1.5 max-w-[220px] mx-auto leading-relaxed"
                  style={{ color: 'var(--tech-text-muted)' }}
                >
                  Ajustez vos filtres ou contactez votre administrateur.
                </p>
              </div>
            ) : (
              tech.displayedMissions.map((mission, idx) => (
                <div
                  key={mission.id}
                  className="tech-animate-in"
                  style={{ animationDelay: `${idx * 45}ms` }}
                >
                  <MissionCard
                    mission={mission}
                    truckName={tech.getTruckName(mission.truckId)}
                    colleagueCount={tech.getColleagues(mission.technicianIds).length}
                    onClick={() => tech.openMissionDetails(mission)}
                    onQuickAction={(status) => tech.handleStatusChange(mission, status)}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Bottom Nav bar — bloque la navigation si une mission est en cours */}
      <TechBottomNav
        activeTab={tech.activeTab}
        setActiveTab={safeSetActiveTab}
        hasSelectedMission={!!tech.selectedMission}
        clearSelection={() => {
          if (isLocked) {
            triggerVibrate('error');
            toast.error('Terminez d\'abord votre mission en cours.');
            return;
          }
          tech.setSelectedMission(null);
        }}
        onSignOut={tech.signOut}
        isLocked={isLocked}
      />

      {/* Mission details bottom sheet drawer */}
      {tech.selectedMission && (
        <MissionDrawer
          mission={tech.selectedMission}
          drawerTab={tech.drawerTab}
          setDrawerTab={tech.setDrawerTab}
          dragOffsetY={tech.dragOffsetY}
          isDragging={tech.isDragging}
          handleDragStart={tech.handleDragStart}
          handleDragMove={tech.handleDragMove}
          handleDragEnd={tech.handleDragEnd}
          onClose={() => tech.setSelectedMission(null)}
          onStatusChange={tech.handleStatusChange}
          getColleaguesDetailed={tech.getColleaguesDetailed}
          getTruckName={tech.getTruckName}
          getClientInfo={tech.getClientInfo}
          getEquipmentProgress={tech.getEquipmentProgress}
          equipmentDefs={tech.equipmentDefs}
          savingStatus={tech.savingStatus}
          localReports={tech.localReports}
          handleReportChange={tech.handleReportChange}
          photoUploading={tech.photoUploading}
          handlePhotoUpload={tech.handlePhotoUpload}
          handlePhotoDelete={tech.handlePhotoDelete}
          openScanner={() => {
            tech.setActiveMissionIdForScanner(tech.selectedMission!.id);
            tech.setScannerOpen(true);
            toast.info('Scanner QR activé. Scannez le matériel.');
          }}
          handleToggle={tech.handleToggle}
          scannedItemId={tech.scannedItemId}
          handleTimeChange={tech.handleTimeChange}
          onOpenSignature={() => tech.setSignatureModalOpen(true)}
          handleContentTouchStart={tech.handleContentTouchStart}
          handleContentTouchEnd={tech.handleContentTouchEnd}
          onEndDay={() => tech.openDayEndModal()}
        />
      )}

      {/* Time picker modal */}
      {tech.timeModal && (
        <TimeModal
          timeModal={tech.timeModal}
          selectedMission={tech.selectedMission}
          onClose={() => tech.setTimeModal(null)}
          onConfirm={tech.handleTimeModalConfirm}
          setTimeModal={tech.setTimeModal}
        />
      )}

      {/* QR Code Scanner modal */}
      {tech.scannerOpen && (
        <QRScannerModal
          isOpen={tech.scannerOpen}
          onClose={() => {
            tech.setScannerOpen(false);
            tech.setActiveMissionIdForScanner(null);
          }}
          onScan={tech.handleScan}
          equipmentDefs={tech.equipmentDefs}
          missionName={tech.selectedMission?.title}
        />
      )}

      {/* Signature Modal indisponible dans ce build : bloc retiré temporairement */}

      {tech.signatureModalOpen && (
        <SignaturePad
          missionId={tech.selectedMission!.id}
          onSave={(url) => {
            const missionId = tech.selectedMission!.id;
            tech.setSelectedMission((prev) => (prev ? { ...prev, signatureUrl: url } : prev));
            useStore.getState().updateMission(missionId, { signatureUrl: url }).catch(console.error);
            toast.success('Signature enregistrée');
            tech.setSignatureModalOpen(false);
          }}
          onClose={() => tech.setSignatureModalOpen(false)}
        />
      )}
    </div>
  );
}

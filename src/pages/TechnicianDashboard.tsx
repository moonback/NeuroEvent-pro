import React from 'react';
import { useTechDashboard, triggerVibrate } from '../components/technician/useTechDashboard';
import TechHeader from '../components/technician/TechHeader';
import TechBottomNav from '../components/technician/TechBottomNav';
import MissionCard from '../components/technician/MissionCard';
import MissionFilters from '../components/technician/MissionFilters';
import MissionDrawer from '../components/technician/MissionDrawer';
import { TimeModal } from '../components/technician/TimeModal';

// Existing components
import { QRScannerModal } from '../components/QRScannerModal';
import SignaturePad from '../components/SignaturePad';
import TechnicianMyHours from '../components/TechnicianMyHours';
import TechnicianUnavailabilities from '../components/TechnicianUnavailabilities';
import Settings from './Settings';

import { toast } from '../store/toast';
import { Calendar, Sparkles } from 'lucide-react';

export default function TechnicianDashboard() {
  const tech = useTechDashboard();
  const nextMission = tech.activeTab === 'active'
    ? tech.displayedMissions.find((mission) => mission.status !== 'Terminée')
    : null;

  // Gestes & Micro-interactions
  const [pullDistance, setPullDistance] = React.useState(0);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const touchStartRef = React.useRef({ x: 0, y: 0 });
  const isAtTopRef = React.useRef(true);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    isAtTopRef.current = window.scrollY === 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isRefreshing) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    if (isAtTopRef.current && deltaY > 0 && Math.abs(deltaY) > Math.abs(deltaX)) {
      const distance = Math.min(80, Math.pow(deltaY, 0.85));
      setPullDistance(distance);
      if (e.cancelable) {
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = async (e: React.TouchEvent) => {
    if (isRefreshing) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    if (pullDistance > 55) {
      setIsRefreshing(true);
      setPullDistance(60);
      triggerVibrate('success');
      try {
        await tech.initialize();
        toast.success('Données actualisées');
      } catch (err) {
        console.error(err);
        toast.error("Erreur lors de l'actualisation");
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }

    if (Math.abs(deltaY) < 50 && Math.abs(deltaX) > 100) {
      const filters: ('all' | 'today' | 'week')[] = ['all', 'today', 'week'];
      const currentIndex = filters.indexOf(tech.dateFilter);
      if (deltaX < -100) {
        if (currentIndex < filters.length - 1) {
          const nextFilter = filters[currentIndex + 1];
          tech.setDateFilter(nextFilter);
          triggerVibrate('click');
          toast.success(
            `Filtre : ${
              nextFilter === 'today'
                ? "Aujourd'hui"
                : nextFilter === 'week'
                ? 'Cette semaine'
                : 'Tous les jours'
            }`
          );
        }
      } else if (deltaX > 100) {
        if (currentIndex > 0) {
          const nextFilter = filters[currentIndex - 1];
          tech.setDateFilter(nextFilter);
          triggerVibrate('click');
          toast.success(
            `Filtre : ${
              nextFilter === 'today'
                ? "Aujourd'hui"
                : nextFilter === 'week'
                ? 'Cette semaine'
                : 'Tous les jours'
            }`
          );
        }
      }
    }
  };

  const currentTech = tech.technicians.find((t) => t.id === tech.user?.id);
  const userName = currentTech
    ? currentTech.firstName
    : tech.user?.user_metadata?.first_name || '';

  return (
    <div className="tech-dark min-h-screen bg-black text-[#f0f4ff] font-sans pb-24 overflow-x-hidden">
      {/* Header */}
      <TechHeader
        userName={userName}
        isOnline={tech.isOnline}
        syncCount={tech.syncQueue.length}
        todayCount={tech.todayCount}
        activeCount={tech.activeCount}
        onSettingsClick={() => tech.setActiveTab('profil')}
      />

      {/* Main Tab Routing */}
      {nextMission && tech.activeTab === 'active' && (
        <div className="max-w-md mx-auto px-4 pt-3">
          <div
            className="tech-card p-4 mb-3 rounded-3xl overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%)',
              border: '1px solid rgba(0,229,160,0.08)',
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] font-black mb-2" style={{ color: 'var(--tech-text-muted)' }}>
                  Prochaine mission
                </p>
                <h2 className="text-base font-black leading-tight" style={{ color: 'var(--tech-text)' }}>
                  {nextMission.title}
                </h2>
                <p className="text-[11px] mt-2 text-[var(--tech-text-secondary)]">
                  {nextMission.client} · {nextMission.status}
                </p>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <button
                  onClick={() => tech.openMissionDetails(nextMission)}
                  className="px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-wide transition-all active:scale-95"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    color: 'var(--tech-text)',
                    border: '1px solid rgba(255,255,255,0.10)',
                  }}
                >
                  Voir
                </button>
                {nextMission.status !== 'Terminée' && (
                  <button
                    onClick={() => tech.handleStatusChange(nextMission, nextMission.status === 'Planifiée' ? 'En cours' : 'Terminée')}
                    className="px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-wide transition-all active:scale-95"
                    style={{
                      background: nextMission.status === 'Planifiée' ? nextMission.color : 'var(--tech-accent)',
                      color: '#fff',
                    }}
                  >
                    {nextMission.status === 'Planifiée' ? 'Démarrer' : 'Terminer'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
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
        <div 
          className="max-w-md mx-auto space-y-3 pt-3 pb-6"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Pull-to-refresh indicator */}
          <div 
            style={{ 
              height: `${pullDistance}px`, 
              opacity: pullDistance > 0 ? 1 : 0,
              transition: isRefreshing ? 'height 0.2s, opacity 0.2s' : 'none'
            }}
            className="w-full flex items-center justify-center overflow-hidden bg-black/20 border-b border-[rgba(0,229,160,0.05)] rounded-2xl relative"
          >
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[var(--tech-accent)]">
              <Sparkles 
                className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} 
                style={{ 
                  transform: isRefreshing ? 'none' : `rotate(${pullDistance * 4.5}deg)`,
                  transition: isRefreshing ? 'none' : 'transform 0.05s' 
                }}
              />
              <span>{isRefreshing ? 'Synchronisation...' : pullDistance > 55 ? 'Relâchez' : 'Tirer pour actualiser'}</span>
            </div>
          </div>
          {/* Segmented picker */}
          <div className="px-4">
            <div
              className="flex p-1 rounded-2xl"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--tech-border)',
              }}
            >
              {[
                { id: 'active' as const, label: 'Missions' },
                { id: 'history' as const, label: 'Historique' },
              ].map((tab) => {
                const isActive = tech.activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      triggerVibrate('click');
                      tech.setActiveTab(tab.id);
                    }}
                    className="flex-1 py-1.5 text-[10px] font-black rounded-xl transition-all duration-200"
                    style={{
                      background: isActive
                        ? 'linear-gradient(135deg, rgba(0,229,160,0.12) 0%, rgba(0,229,160,0.06) 100%)'
                        : 'transparent',
                      color: isActive ? 'var(--tech-accent)' : 'var(--tech-text-muted)',
                      border: isActive ? '1px solid rgba(0,229,160,0.15)' : '1px solid transparent',
                      boxShadow: isActive ? '0 2px 8px rgba(0,229,160,0.08)' : 'none',
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

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

      {/* Bottom Nav bar */}
      <TechBottomNav
        activeTab={tech.activeTab}
        setActiveTab={tech.setActiveTab}
        hasSelectedMission={!!tech.selectedMission}
        clearSelection={() => tech.setSelectedMission(null)}
        onSignOut={tech.signOut}
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
          }}
          handleToggle={tech.handleToggle}
          scannedItemId={tech.scannedItemId}
          handleTimeChange={tech.handleTimeChange}
          onOpenSignature={() => tech.setSignatureModalOpen(true)}
          handleContentTouchStart={tech.handleContentTouchStart}
          handleContentTouchEnd={tech.handleContentTouchEnd}
        />
      )}

      {/* Time picker modal */}
      {tech.timeModal && tech.selectedMission && (
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
        />
      )}

      {/* Signature Modal */}
      {tech.signatureModalOpen && tech.selectedMission && (
        <SignaturePad
          missionId={tech.selectedMission.id}
          onSave={async (url) => {
            await tech.updateMission(tech.selectedMission!.id, { signatureUrl: url });
            tech.setSelectedMission({ ...tech.selectedMission!, signatureUrl: url });
            tech.setSignatureModalOpen(false);
            toast.success('Signature enregistrée avec succès');
          }}
          onClose={() => tech.setSignatureModalOpen(false)}
        />
      )}
    </div>
  );
}

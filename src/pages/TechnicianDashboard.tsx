import React from 'react';
import { useTechDashboard } from '../components/technician/useTechDashboard';
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
import { Calendar } from 'lucide-react';

export default function TechnicianDashboard() {
  const tech = useTechDashboard();

  const currentTech = tech.technicians.find(t => t.id === tech.user?.id);
  const userName = currentTech ? currentTech.firstName : (tech.user?.user_metadata?.first_name || '');

  return (
    <div className="tech-dark min-h-screen bg-[#090d16] text-[#f8fafc] font-sans pb-24 overflow-x-hidden">
      {/* Header */}
      <TechHeader
        userName={userName}
        isOnline={tech.isOnline}
        syncCount={tech.syncQueue.length}
        todayCount={tech.todayCount}
        activeCount={tech.activeCount}
      />

      {/* Main Tab Routing */}
      {tech.activeTab === 'mes_heures' ? (
        <div className="px-4 py-6 max-w-md mx-auto animate-fade-in">
          <div className="tech-card p-4">
            <h2 className="text-lg font-black mb-4">Mes Heures de Travail</h2>
            <TechnicianMyHours />
          </div>
        </div>
      ) : tech.activeTab === 'disponibilites' ? (
        <div className="px-4 py-6 max-w-md mx-auto animate-fade-in">
          <div className="tech-card p-4">
            <h2 className="text-lg font-black mb-4">Mes Indisponibilités</h2>
            <TechnicianUnavailabilities />
          </div>
        </div>
      ) : tech.activeTab === 'profil' ? (
        <div className="animate-fade-in">
          <Settings />
        </div>
      ) : (
        <div className="max-w-md mx-auto space-y-4 pt-2 pb-6">
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
          <div className="px-4 space-y-4">
            {tech.displayedMissions.length === 0 ? (
              <div className="tech-card py-12 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-6 h-6 text-slate-500" />
                </div>
                <h3 className="font-extrabold text-sm text-slate-300">Aucune mission trouvée</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-[240px] mx-auto">
                  Ajustez vos filtres ou contactez votre administrateur si besoin.
                </p>
              </div>
            ) : (
              tech.displayedMissions.map((mission, idx) => (
                <div
                  key={mission.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <MissionCard
                    mission={mission}
                    truckName={tech.getTruckName(mission.truckId)}
                    colleagueCount={tech.getColleagues(mission.technicianIds).length}
                    onClick={() => tech.openMissionDetails(mission)}
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

      {/* Time picker modal (for status changes) */}
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
            toast.success("Signature enregistrée avec succès");
          }}
          onClose={() => tech.setSignatureModalOpen(false)}
        />
      )}
    </div>
  );
}

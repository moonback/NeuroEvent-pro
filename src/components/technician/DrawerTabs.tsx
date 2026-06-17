import React from 'react';
import { type DrawerTab } from './useTechDashboard';

// Import de nos onglets décomposés
import GeneralTab from './tabs/GeneralTab';
import ClientTab from './tabs/ClientTab';
import TeamTab from './tabs/TeamTab';
import EquipmentTab from './tabs/EquipmentTab';
import ReportTab from './tabs/ReportTab';
import HoursTab from './tabs/HoursTab';
import PhotosTab from './tabs/PhotosTab';
import ChecklistTab from './tabs/ChecklistTab';

interface DrawerTabsProps {
  mission: any;
  drawerTab: DrawerTab;
  setDrawerTab: (t: DrawerTab) => void;
  getTruckName: (id?: string) => string;
  getColleaguesDetailed: (ids: string[]) => { id: string; name: string; specialty: string; color: string; isSelf: boolean }[];
  getClientInfo: (id?: string) => any;
  getEquipmentProgress: (eqs: any[]) => { total: number; pointed: number; percent: number };
  equipmentDefs: { id: string; name: string }[];
  handleTimeChange: (field: 'start' | 'end', time: string) => void;
  handleToggle: (missionId: string, equipmentId: string) => void;
  onStatusChange: (mission: any, s: 'Planifiée' | 'En cours' | 'Terminée') => void;
  openScanner: () => void;
  onOpenSignature: () => void;
  scannedItemId: string | null;
  localReports: Record<string, string>;
  savingStatus: 'idle' | 'saving' | 'saved';
  handleReportChange: (missionId: string, value: string) => void;
  photoUploading: { missionId: string; type: 'before' | 'after' } | null;
  handlePhotoUpload: (missionId: string, type: 'before' | 'after', file: File) => Promise<void>;
  handlePhotoDelete: (missionId: string, photoId: string) => void;
  isLocked: boolean;
}

export default function DrawerTabs(props: DrawerTabsProps) {
  const { mission, drawerTab } = props;

  switch (drawerTab) {
    case 'general':
      return (
        <GeneralTab
          mission={mission}
          getTruckName={props.getTruckName}
          getEquipmentProgress={props.getEquipmentProgress}
          setDrawerTab={props.setDrawerTab}
          handleTimeChange={props.handleTimeChange}
          onStatusChange={props.onStatusChange}
          isLocked={props.isLocked}
        />
      );
    case 'client':
      return <ClientTab mission={mission} getClientInfo={props.getClientInfo} />;
    case 'team':
      return <TeamTab mission={mission} getColleaguesDetailed={props.getColleaguesDetailed} />;
    case 'equipment':
      return (
        <EquipmentTab
          mission={mission}
          getEquipmentProgress={props.getEquipmentProgress}
          equipmentDefs={props.equipmentDefs}
          handleToggle={props.handleToggle}
          openScanner={props.openScanner}
          scannedItemId={props.scannedItemId}
        />
      );
    case 'photos':
      return (
        <PhotosTab
          mission={mission}
          photoUploading={props.photoUploading}
          handlePhotoUpload={props.handlePhotoUpload}
          handlePhotoDelete={props.handlePhotoDelete}
        />
      );
    case 'hours':
      return <HoursTab mission={mission} />;
    case 'checklist':
      return <ChecklistTab mission={mission} />;
    case 'report':
      return (
        <ReportTab
          mission={mission}
          localReports={props.localReports}
          savingStatus={props.savingStatus}
          handleReportChange={props.handleReportChange}
          photoUploading={props.photoUploading}
          handlePhotoUpload={props.handlePhotoUpload}
          handlePhotoDelete={props.handlePhotoDelete}
        />
      );
    default:
      return null;
  }
}

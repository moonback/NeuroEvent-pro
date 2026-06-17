import React from 'react';
import TimeLogPanel from '../../TimeLogPanel';

interface HoursTabProps {
  mission: any;
}

export default function HoursTab({ mission }: HoursTabProps) {
  return (
    <TimeLogPanel
      missionId={mission.id}
      missionColor={mission.color}
      missionStatus={mission.status}
    />
  );
}

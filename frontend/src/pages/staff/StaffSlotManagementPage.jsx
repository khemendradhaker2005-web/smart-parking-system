import React, { useState } from 'react';
import SlotGrid from '../../components/staff/SlotGrid';

export default function StaffSlotManagementPage({ locations = [] }) {
  const [selectedLocationId, setSelectedLocationId] = useState(locations[0]?.id || 1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Visual Parking Slot Management
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Interactive real-time visual grid of all parking bays across floors, sections, and statuses
        </p>
      </div>

      <SlotGrid
        locationId={selectedLocationId}
        locations={locations}
        onLocationChange={(newId) => setSelectedLocationId(newId)}
      />
    </div>
  );
}

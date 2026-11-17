import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { api } from '../../services/api';
import SlotDetailModal from './SlotDetailModal';
import { Grid3X3, Filter, RefreshCw, Car, Wrench, Shield, CheckCircle2 } from 'lucide-react';

export default function SlotGrid({ locationId, locations = [], onLocationChange }) {
  const { socket } = useSocket();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Filters
  const [sectionFilter, setSectionFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchSlots = async () => {
    if (!locationId) return;
    setLoading(true);
    try {
      const res = await api.getSlotGrid({ locationId });
      if (res.success) {
        setSlots(res.slots || []);
      }
    } catch (err) {
      console.error('Failed to load slot grid:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [locationId]);

  // Real-time slot update listener via Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleSlotUpdate = (data) => {
      if (String(data.locationId) === String(locationId)) {
        setSlots((prev) =>
          prev.map((s) => (s.id === data.slot?.id ? { ...s, status: data.slot.status } : s))
        );
      }
    };

    socket.on('slot_updated', handleSlotUpdate);
    return () => {
      socket.off('slot_updated', handleSlotUpdate);
    };
  }, [socket, locationId]);

  // Sections list for filter
  const sections = ['ALL', ...new Set(slots.map((s) => s.section).filter(Boolean))];

  // Filtered slots
  const filteredSlots = slots.filter((slot) => {
    if (sectionFilter !== 'ALL' && slot.section !== sectionFilter) return false;
    if (statusFilter !== 'ALL' && slot.status !== statusFilter) return false;
    return true;
  });

  // Slot status counters
  const counts = {
    available: slots.filter((s) => s.status === 'available').length,
    occupied: slots.filter((s) => s.status === 'occupied').length,
    reserved: slots.filter((s) => s.status === 'reserved').length,
    maintenance: slots.filter((s) => s.status === 'maintenance').length,
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Legend Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Grid3X3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Visual Slot Layout</h3>
              <p className="text-xs text-slate-500">
                Total {slots.length} Slots • Live Grid Monitoring
              </p>
            </div>
          </div>

          {/* Location Switcher */}
          {locations.length > 0 && onLocationChange && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Location:</span>
              <select
                value={locationId}
                onChange={(e) => onLocationChange(e.target.value)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>

              <button
                onClick={fetchSlots}
                disabled={loading}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                title="Refresh Grid"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          )}
        </div>

        {/* Status Legend Pills */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100 text-xs">
          <button
            onClick={() => setStatusFilter(statusFilter === 'available' ? 'ALL' : 'available')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-2 transition border ${
              statusFilter === 'available'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Available ({counts.available})</span>
          </button>

          <button
            onClick={() => setStatusFilter(statusFilter === 'occupied' ? 'ALL' : 'occupied')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-2 transition border ${
              statusFilter === 'occupied'
                ? 'bg-rose-600 text-white border-rose-600'
                : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Occupied ({counts.occupied})</span>
          </button>

          <button
            onClick={() => setStatusFilter(statusFilter === 'reserved' ? 'ALL' : 'reserved')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-2 transition border ${
              statusFilter === 'reserved'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Reserved ({counts.reserved})</span>
          </button>

          <button
            onClick={() => setStatusFilter(statusFilter === 'maintenance' ? 'ALL' : 'maintenance')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-2 transition border ${
              statusFilter === 'maintenance'
                ? 'bg-slate-700 text-white border-slate-700'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            <span>Maintenance ({counts.maintenance})</span>
          </button>

          {/* Section Filter Pills */}
          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Section:</span>
            {sections.map((sec) => (
              <button
                key={sec}
                onClick={() => setSectionFilter(sec)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  sectionFilter === sec
                    ? 'bg-purple-100 text-purple-800 border border-purple-300'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {sec}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Visual Slot Grid Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
        {filteredSlots.map((slot) => {
          const isAvail = slot.status === 'available';
          const isOcc = slot.status === 'occupied';
          const isRes = slot.status === 'reserved';
          const isMaint = slot.status === 'maintenance';

          return (
            <button
              key={slot.id}
              onClick={() => setSelectedSlot(slot)}
              className={`p-4 rounded-2xl border text-left transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between h-32 group relative overflow-hidden ${
                isAvail
                  ? 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-400'
                  : isOcc
                  ? 'bg-rose-50/40 border-rose-200 hover:border-rose-400'
                  : isRes
                  ? 'bg-amber-50/40 border-amber-200 hover:border-amber-400'
                  : 'bg-slate-100 border-slate-300 hover:border-slate-400'
              }`}
            >
              {/* Top Slot Code & Status Dot */}
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-sm text-slate-900 group-hover:text-purple-700 transition">
                  {slot.slot_number}
                </span>
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isAvail
                      ? 'bg-emerald-500 ring-2 ring-emerald-200'
                      : isOcc
                      ? 'bg-rose-500 ring-2 ring-rose-200 animate-pulse'
                      : isRes
                      ? 'bg-amber-500 ring-2 ring-amber-200'
                      : 'bg-slate-400'
                  }`}
                />
              </div>

              {/* Vehicle / Status Info */}
              <div>
                {isOcc ? (
                  <div>
                    <span className="text-[10px] font-mono font-black text-rose-700 block truncate">
                      {slot.vehicle_number}
                    </span>
                    <span className="text-[10px] text-slate-500 truncate block">
                      {slot.customer_name || 'Parked'}
                    </span>
                  </div>
                ) : isRes ? (
                  <div>
                    <span className="text-[10px] font-mono font-bold text-amber-700 block truncate">
                      {slot.booking_code}
                    </span>
                    <span className="text-[10px] text-amber-600 block">Reserved</span>
                  </div>
                ) : isMaint ? (
                  <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                    <Wrench className="w-3 h-3" />
                    Maintenance
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                    Available
                  </span>
                )}
              </div>

              {/* Floor / Section Label */}
              <div className="text-[10px] text-slate-400 font-medium flex items-center justify-between border-t border-slate-200/50 pt-1 mt-1">
                <span>Sec {slot.section || 'A'}</span>
                <span>{slot.slot_type || 'Standard'}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Modal on Slot Click */}
      {selectedSlot && (
        <SlotDetailModal
          slot={selectedSlot}
          onClose={() => setSelectedSlot(null)}
          onStatusUpdated={fetchSlots}
        />
      )}
    </div>
  );
}

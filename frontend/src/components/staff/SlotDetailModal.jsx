import React, { useState } from 'react';
import { api } from '../../services/api';
import {
  X,
  Car,
  Clock,
  Phone,
  User,
  Shield,
  Wrench,
  CheckCircle2,
  Calendar,
  AlertCircle,
} from 'lucide-react';

export default function SlotDetailModal({ slot, onClose, onStatusUpdated }) {
  if (!slot) return null;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isMaintenance = slot.status === 'maintenance';
  const isOccupied = slot.status === 'occupied';

  const toggleMaintenance = async () => {
    setLoading(true);
    setError(null);
    try {
      const newStatus = isMaintenance ? 'available' : 'maintenance';
      const res = await api.updateSlotStatus(slot.id, {
        status: newStatus,
        reason: isMaintenance ? 'Maintenance completed' : 'Routine maintenance/inspection',
      });
      if (res.success) {
        if (onStatusUpdated) onStatusUpdated();
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to update slot status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                slot.status === 'available'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                  : slot.status === 'occupied'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                  : slot.status === 'reserved'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                  : 'bg-slate-500/20 text-slate-300 border border-slate-400/30'
              }`}
            >
              {slot.status}
            </span>
            <span className="text-xs text-slate-400">• {slot.floor_level || 'Ground Floor'}</span>
          </div>

          <h3 className="text-2xl font-black font-mono tracking-tight text-white">
            Slot {slot.slot_number}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Section: {slot.section || 'A'} • Type: {slot.slot_type || 'Standard'}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {isOccupied ? (
            /* Active Occupant Details */
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-slate-400" />
                  Vehicle Number:
                </span>
                <span className="font-mono font-black text-sm text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {slot.vehicle_number}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Customer Name:
                </span>
                <span className="font-semibold text-slate-800">{slot.customer_name || 'Guest'}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  Mobile Number:
                </span>
                <span className="font-mono text-slate-700">{slot.customer_mobile || 'N/A'}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Entry Time:
                </span>
                <span className="font-medium text-slate-800">
                  {slot.entry_time
                    ? new Date(slot.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Session ID:</span>
                <span className="font-mono text-slate-600">{slot.session_code || 'N/A'}</span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500">Status:</span>
                <span className="font-bold text-rose-600 uppercase tracking-wider text-[11px]">
                  {slot.session_status || 'Occupied / Active'}
                </span>
              </div>
            </div>
          ) : slot.status === 'reserved' ? (
            /* Reserved details */
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-amber-800 font-semibold">Pre-Booking Code:</span>
                <span className="font-mono font-bold text-amber-900">{slot.booking_code}</span>
              </div>
              <div className="flex justify-between items-center text-amber-700">
                <span>Vehicle:</span>
                <span className="font-mono font-bold">{slot.vehicle_number || 'Pre-booked'}</span>
              </div>
              <div className="flex justify-between items-center text-amber-700">
                <span>Expected Entry:</span>
                <span>{slot.expected_entry_time ? new Date(slot.expected_entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Soon'}</span>
              </div>
            </div>
          ) : (
            /* Available or Maintenance */
            <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-200/80">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-2 ${
                  isMaintenance ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-600'
                }`}
              >
                {isMaintenance ? <Wrench className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
              </div>
              <p className="font-bold text-sm text-slate-900">
                {isMaintenance ? 'Slot Under Maintenance' : 'Slot Currently Available'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {isMaintenance
                  ? 'Vehicle parking is restricted until maintenance finishes.'
                  : 'Ready to be automatically or manually assigned to incoming vehicles.'}
              </p>
            </div>
          )}

          {/* Maintenance toggle (only if not occupied) */}
          {!isOccupied && (
            <div className="pt-2">
              <button
                type="button"
                disabled={loading}
                onClick={toggleMaintenance}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border ${
                  isMaintenance
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>{isMaintenance ? 'Mark as Available' : 'Set to Maintenance'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

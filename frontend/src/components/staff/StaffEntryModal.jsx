import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  X,
  Car,
  Search,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Shield,
  ArrowRight,
  User,
  Phone,
} from 'lucide-react';

export default function StaffEntryModal({ locations = [], defaultLocationId, onClose, onSuccess }) {
  const [locationId, setLocationId] = useState(defaultLocationId || locations[0]?.id || 1);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [bookingCode, setBookingCode] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [vehicleType, setVehicleType] = useState('Four Wheeler / Car');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!vehicleNumber.trim()) {
      setError('Vehicle Registration Number is strictly required.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        vehicle_number: vehicleNumber.trim().toUpperCase().replace(/\s+/g, ''),
        location_id: parseInt(locationId, 10),
        booking_code: bookingCode.trim() || undefined,
        customer_mobile: customerMobile.trim() || undefined,
        customer_name: customerName.trim() || undefined,
        vehicle_type: vehicleType,
      };

      const res = await api.recordVehicleEntry(payload);
      if (res.success) {
        setSuccessData(res);
        if (onSuccess) onSuccess(res.session);
      }
    } catch (err) {
      setError(err.message || 'Failed to record vehicle entry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <span className="text-[10px] uppercase font-bold tracking-wider text-purple-300">
            Gate Management Console
          </span>
          <h3 className="text-xl font-extrabold tracking-tight mt-0.5">
            Record Vehicle Entry / Check-In
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            Handles both pre-booked customers and instant walk-in arrivals.
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successData ? (
            /* Success confirmation */
            <div className="space-y-5 text-center">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-lg font-bold text-slate-900">Vehicle Entry Approved!</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Slot marked occupied & customer received live entry notification.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-left space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Assigned Slot:</span>
                  <span className="font-mono font-extrabold text-base text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded border border-purple-200">
                    {successData.session?.slot_number}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Vehicle Number:</span>
                  <span className="font-mono font-bold text-slate-900">{successData.session?.vehicle_number}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Session Code:</span>
                  <span className="font-mono text-slate-700">{successData.session?.session_code}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Entry Time:</span>
                  <span className="text-slate-800 font-medium">
                    {new Date(successData.session?.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200 text-xs text-emerald-800 text-left">
                <p className="font-semibold">Notification Broadcast:</p>
                <p className="mt-0.5 italic">"{successData.welcomeNotification}"</p>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
              >
                Close & Return to Console
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Parking Location */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Parking Location
                </label>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.available_slots} slots available)
                    </option>
                  ))}
                </select>
              </div>

              {/* Pre-Booking Code Search (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Pre-Booking ID / Code (If already reserved)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. BK-202611-123456"
                    value={bookingCode}
                    onChange={(e) => setBookingCode(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                </div>
              </div>

              {/* Vehicle Registration Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Vehicle Registration Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. KA01AB1234 or DL03XY9999"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-extrabold uppercase tracking-wider focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  required
                />
              </div>

              {/* Vehicle Type */}
              <div className="grid grid-cols-3 gap-2">
                {['Four Wheeler / Car', 'SUV', 'EV / Electric'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setVehicleType(type)}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border transition text-center truncate ${
                      vehicleType === type
                        ? 'bg-purple-50 text-purple-700 border-purple-300 font-bold'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* Customer Mobile & Name (For Walk-ins) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Customer Mobile (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="10-digit number"
                    maxLength={10}
                    value={customerMobile}
                    onChange={(e) => setCustomerMobile(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Customer Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Guest Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-lg shadow-purple-500/25 transition flex items-center justify-center gap-1.5"
                >
                  {loading ? 'Verifying & Checking In...' : 'Verify Entry & Allocate Slot'}
                  {!loading && <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

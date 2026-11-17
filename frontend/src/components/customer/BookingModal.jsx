import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { QRCodeSVG } from 'qrcode.react';
import {
  X,
  Car,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  MapPin,
  ShieldCheck,
  ArrowRight,
  Plus,
} from 'lucide-react';

export default function BookingModal({ location, onClose, onBookingSuccess }) {
  const { user, primaryVehicle, vehicles, refreshProfile } = useAuth();

  const [selectedVehicleNumber, setSelectedVehicleNumber] = useState(
    primaryVehicle?.vehicle_number || (vehicles[0]?.vehicle_number || '')
  );
  const [customVehicle, setCustomVehicle] = useState('');
  const [useCustomVehicle, setUseCustomVehicle] = useState(false);

  const [durationHours, setDurationHours] = useState(2);
  const [expectedEntryTime, setExpectedEntryTime] = useState(
    new Date(Date.now() + 10 * 60 * 1000).toISOString().slice(0, 16) // 10 mins from now
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Billing calculation: MAX(1, CEILING(duration)) * 20
  const billedHours = Math.max(1, Math.ceil(parseFloat(durationHours || 1)));
  const estimatedCharges = billedHours * (location?.price_per_hour || 20);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const vehicleNum = useCustomVehicle ? customVehicle.trim() : selectedVehicleNumber;
    if (!vehicleNum) {
      setError('Please select or enter your vehicle registration number.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        location_id: location.id,
        vehicle_number: vehicleNum,
        duration_hours: parseFloat(durationHours),
        expected_entry_time: new Date(expectedEntryTime).toISOString(),
      };

      const res = await api.createBooking(payload);
      if (res.success) {
        setConfirmedBooking(res.booking);
        if (onBookingSuccess) onBookingSuccess(res.booking);
        refreshProfile();
      }
    } catch (err) {
      setError(err.message || 'Failed to complete booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-600 to-indigo-700 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <span className="text-[10px] uppercase font-bold tracking-wider text-brand-200">
            Smart Slot Reservation
          </span>
          <h3 className="text-xl font-extrabold tracking-tight mt-0.5">
            {confirmedBooking ? 'Booking Confirmed!' : `Book Slot at ${location?.name}`}
          </h3>
          <p className="text-xs text-brand-100 flex items-center gap-1.5 mt-1">
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate">{location?.address}</span>
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {confirmedBooking ? (
            /* Booking Confirmation View */
            <div className="space-y-5 text-center">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-lg font-bold text-slate-900">Slot Successfully Reserved!</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Show your Booking Code or QR to parking staff upon arrival.
                </p>
              </div>

              {/* QR Code Pass */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block mx-auto">
                <QRCodeSVG
                  value={confirmedBooking.booking_code}
                  size={150}
                  level="M"
                  includeMargin={true}
                />
                <p className="font-mono font-bold text-sm text-slate-800 mt-2 tracking-wider">
                  {confirmedBooking.booking_code}
                </p>
              </div>

              {/* Slot & Booking Summary */}
              <div className="bg-slate-50 rounded-2xl p-4 text-left space-y-2 border border-slate-100 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Allocated Parking Slot:</span>
                  <span className="font-mono font-extrabold text-sm text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded border border-brand-200">
                    {confirmedBooking.slot_number}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Vehicle Number:</span>
                  <span className="font-mono font-bold text-slate-900">{confirmedBooking.vehicle_number}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Expected Entry:</span>
                  <span className="text-slate-800 font-medium">
                    {new Date(confirmedBooking.expected_entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Estimated Charges:</span>
                  <span className="font-mono font-bold text-emerald-600 text-sm">
                    ₹{confirmedBooking.estimated_amount}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          ) : (
            /* Booking Input Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Vehicle Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Vehicle Registration Number
                </label>

                {!useCustomVehicle && vehicles.length > 0 ? (
                  <div className="space-y-2">
                    <select
                      value={selectedVehicleNumber}
                      onChange={(e) => setSelectedVehicleNumber(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-semibold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    >
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.vehicle_number}>
                          {v.vehicle_number} ({v.make_model || v.vehicle_type})
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => setUseCustomVehicle(true)}
                      className="text-xs text-brand-600 hover:text-brand-800 font-medium flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Use a different vehicle
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      placeholder="e.g. KA01AB1234"
                      value={customVehicle}
                      onChange={(e) => setCustomVehicle(e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono uppercase tracking-wider font-semibold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      required
                    />
                    {vehicles.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setUseCustomVehicle(false)}
                        className="text-xs text-slate-500 hover:text-slate-800 mt-1"
                      >
                        ← Choose from registered vehicles
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Expected Entry Time */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Expected Entry Time
                </label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    value={expectedEntryTime}
                    onChange={(e) => setExpectedEntryTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Duration Slider / Select */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Expected Duration
                  </label>
                  <span className="text-xs font-bold text-brand-600 font-mono">
                    {durationHours} {durationHours === 1 ? 'Hour' : 'Hours'}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 5].map((hrs) => (
                    <button
                      key={hrs}
                      type="button"
                      onClick={() => setDurationHours(hrs)}
                      className={`py-2 rounded-xl text-xs font-bold transition border ${
                        durationHours === hrs
                          ? 'bg-brand-50 text-brand-700 border-brand-300 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {hrs} hr{hrs > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Estimated Charges Calculation Box */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Rate:</span>
                  <span>₹{location?.price_per_hour || 20} / hour</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Duration:</span>
                  <span>{billedHours} billed hour(s)</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center font-bold text-slate-900 text-sm">
                  <span>Estimated Charges:</span>
                  <span className="text-emerald-600 font-mono text-base">₹{estimatedCharges.toFixed(2)}</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  * Charges are calculated at actual exit time. Partial hours count as full hours.
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex gap-3">
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
                  className="flex-1 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition flex items-center justify-center gap-1.5"
                >
                  {loading ? 'Allocating Slot...' : 'Confirm & Reserve Slot'}
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

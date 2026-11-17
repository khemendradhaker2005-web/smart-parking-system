import React from 'react';
import { X, MapPin, Star, Clock, Shield, CheckCircle, AlertTriangle, ArrowRight, Phone } from 'lucide-react';
import ParkingMap from '../map/ParkingMap';

export default function ParkingDetailsModal({ location, onClose, onBookNow }) {
  if (!location) return null;

  const isAvailable = location.available_slots > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header with image/gradient */}
        <div className="relative h-44 bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white p-6 flex flex-col justify-end">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition backdrop-blur-sm"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-500/30 text-brand-300 border border-brand-400/40 backdrop-blur-sm">
              {location.availability_status || 'Available'}
            </span>
            <div className="flex items-center gap-1 bg-amber-500/20 px-2 py-0.5 rounded-full text-xs font-bold text-amber-300 border border-amber-400/30">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{location.rating || 4.8}</span>
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white leading-tight">
            {location.name}
          </h2>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Address & Contact */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-brand-600 shrink-0" />
                <span className="text-slate-700 font-medium">{location.address}</span>
              </p>
              {location.distance_km !== null && (
                <p className="text-xs text-brand-600 font-semibold mt-1 pl-5">
                  Distance: {location.distance_km} km from current location
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs bg-slate-100 px-3 py-1.5 rounded-xl font-medium text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                {location.operating_hours || '24/7 Open'}
              </span>
              <a
                href={`tel:${location.contact_number || '+919876543210'}`}
                className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl font-medium text-slate-700 flex items-center gap-1.5 transition"
              >
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                Contact
              </a>
            </div>
          </div>

          {/* Slots Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Slots</span>
              <p className="text-xl font-extrabold text-slate-900 font-mono mt-0.5">{location.total_slots}</p>
            </div>
            <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-100 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Available</span>
              <p className="text-xl font-extrabold text-emerald-700 font-mono mt-0.5">{location.available_slots}</p>
            </div>
            <div className="bg-rose-50 p-3.5 rounded-2xl border border-rose-100 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Occupied</span>
              <p className="text-xl font-extrabold text-rose-700 font-mono mt-0.5">{location.occupied_slots || 0}</p>
            </div>
            <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-100 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Reserved</span>
              <p className="text-xl font-extrabold text-amber-700 font-mono mt-0.5">{location.reserved_slots || 0}</p>
            </div>
          </div>

          {/* Pricing Policy Box */}
          <div className="bg-gradient-to-r from-brand-50 to-indigo-50/60 p-4 rounded-2xl border border-brand-100">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-sm text-brand-950">Parking Rates & Billing Policy</h4>
              <span className="text-lg font-extrabold text-brand-600 font-mono">₹{location.price_per_hour || 20}/hour</span>
            </div>
            <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
              <li>Minimum mandatory charge: ₹20 (covers up to 1st hour).</li>
              <li>Partial hours are billed as full hours (e.g. 1h 15m = 2 hours = ₹40).</li>
              <li>Formula: Total = MAX(1, CEILING(Duration in Hours)) × ₹20.</li>
            </ul>
          </div>

          {/* Interactive Map Preview */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">Location Map</h4>
            <div className="h-48 rounded-2xl overflow-hidden border border-slate-200">
              <ParkingMap
                locations={[location]}
                selectedLocation={location}
                height="100%"
              />
            </div>
          </div>

          {/* Amenities */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2.5">Available Amenities</h4>
            <div className="flex flex-wrap gap-2">
              {(location.amenities || []).map((amenity, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-medium flex items-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  {amenity}
                </span>
              ))}
            </div>
          </div>

          {/* Parking Rules */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2.5">Parking Premises Rules</h4>
            <div className="space-y-1.5">
              {(location.rules || []).map((rule, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                  <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer with Book Button */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Rate</span>
            <div className="text-lg font-extrabold text-slate-900 font-mono">
              ₹{location.price_per_hour || 20} <span className="text-xs font-normal text-slate-500">/ hr</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200/60 transition"
            >
              Close
            </button>
            <button
              onClick={() => onBookNow(location)}
              disabled={!isAvailable}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                isAvailable
                  ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-500/25'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span>Book Slot Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

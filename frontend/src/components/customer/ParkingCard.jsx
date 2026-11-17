import React from 'react';
import { MapPin, Star, Clock, Shield, Car, ArrowRight } from 'lucide-react';

export default function ParkingCard({ location, onSelect, onBook }) {
  const isAvailable = location.available_slots > 0;
  const isLow = location.available_slots > 0 && location.available_slots <= 4;

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
      <div>
        {/* Top Badges & Rating */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
              isLow
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : isAvailable
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-rose-100 text-rose-800 border border-rose-200'
            }`}
          >
            {location.availability_status || (isAvailable ? 'Available' : 'Full')}
          </span>

          <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60 text-xs font-bold text-amber-700">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{Number(location.rating || 4.8).toFixed(1)}</span>
          </div>
        </div>

        {/* Location Title & Address */}
        <h3 className="font-bold text-base text-slate-900 group-hover:text-brand-600 transition leading-snug">
          {location.name}
        </h3>

        <p className="text-xs text-slate-500 mt-1.5 flex items-start gap-1.5 line-clamp-2">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
          <span>{location.address}</span>
        </p>

        {/* Distance & Hours */}
        <div className="mt-3 flex items-center gap-3 text-xs text-slate-600 font-medium">
          {location.distance_km !== null && (
            <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-lg text-slate-700">
              📍 {location.distance_km} km away
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            {location.operating_hours || '24/7'}
          </span>
        </div>

        {/* Slots Metric Counter Bar */}
        <div className="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-100">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-500 font-medium">Available Slots</span>
            <span className="font-mono font-bold text-slate-900">
              <span className="text-brand-600 text-sm">{location.available_slots}</span> / {location.total_slots}
            </span>
          </div>

          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
            <div
              className="bg-brand-600 h-full transition-all duration-300"
              style={{
                width: `${Math.min(100, ((location.total_slots - location.available_slots) / (location.total_slots || 1)) * 100)}%`,
              }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
            <span>Occupied: {location.occupied_slots || 0}</span>
            <span>Reserved: {location.reserved_slots || 0}</span>
          </div>
        </div>
      </div>

      {/* Pricing & Actions */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Rate</span>
          <div className="text-base font-extrabold text-slate-900 leading-tight">
            ₹{location.price_per_hour || 20} <span className="text-xs font-medium text-slate-500">/ hr</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelect(location)}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition"
          >
            Details
          </button>
          <button
            onClick={() => onBook(location)}
            disabled={!isAvailable}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              isAvailable
                ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-500/20'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span>Book Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

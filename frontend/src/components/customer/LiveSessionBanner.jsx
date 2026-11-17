import React, { useState, useEffect } from 'react';
import { Car, MapPin, Clock, ShieldCheck, CreditCard, Sparkles, AlertCircle } from 'lucide-react';

export default function LiveSessionBanner({ session, onPayNow }) {
  if (!session) return null;

  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Live timer counting up from entry_time
  useEffect(() => {
    const entryTimeMs = new Date(session.entry_time).getTime();

    const updateTimer = () => {
      const now = session.exit_time ? new Date(session.exit_time).getTime() : Date.now();
      const elapsed = Math.max(0, Math.floor((now - entryTimeMs) / 1000));
      setElapsedSeconds(elapsed);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [session.entry_time, session.exit_time]);

  // Format seconds to H:M:S
  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;
  const timerFormatted = `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;

  // Dynamic calculated price so customer can see it live
  const billedHours = Math.max(1, Math.ceil(elapsedSeconds / 3600));
  const currentCharges = billedHours * 20;

  const isPendingPayment = session.status === 'payment_pending';

  return (
    <div
      className={`relative overflow-hidden rounded-3xl p-6 sm:p-7 border shadow-xl transition-all duration-300 ${
        isPendingPayment
          ? 'bg-gradient-to-br from-amber-500 via-orange-600 to-rose-700 text-white border-amber-300 ring-4 ring-amber-500/20'
          : 'bg-gradient-to-br from-brand-600 via-indigo-700 to-slate-900 text-white border-brand-400/30'
      }`}
    >
      {/* Background Decorative Rings */}
      <div className="absolute -right-12 -top-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute right-1/3 -bottom-16 w-48 h-48 bg-brand-400/10 rounded-full blur-xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        {/* Left Side: Welcome Banner & Vehicle/Slot Details */}
        <div className="space-y-3 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 text-white backdrop-blur-md flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              {isPendingPayment ? 'Vehicle Exited • Payment Required' : 'Currently Parked & Active'}
            </span>

            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-black/20 text-white/90">
              {session.session_code}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
            Welcome to {session.parking_name}!
          </h2>

          <p className="text-xs sm:text-sm text-white/80 flex items-center gap-2">
            <MapPin className="w-4 h-4 shrink-0 text-white/70" />
            <span>{session.parking_address}</span>
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <div className="bg-white/15 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/20">
              <span className="text-[10px] uppercase font-bold text-white/70 block">Registered Vehicle</span>
              <span className="font-mono font-black text-sm text-white">{session.vehicle_number}</span>
            </div>

            <div className="bg-white/15 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/20">
              <span className="text-[10px] uppercase font-bold text-white/70 block">Assigned Slot</span>
              <span className="font-mono font-black text-base text-amber-300">{session.slot_number}</span>
            </div>

            <div className="bg-white/15 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/20">
              <span className="text-[10px] uppercase font-bold text-white/70 block">Actual Entry Time</span>
              <span className="font-mono text-xs font-bold text-white">
                {new Date(session.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Live Timer & Payment Action */}
        <div className="w-full lg:w-auto bg-black/25 backdrop-blur-md p-5 rounded-3xl border border-white/20 flex flex-col items-center text-center space-y-3 min-w-[240px]">
          <div>
            <span className="text-[11px] uppercase font-bold text-white/70 tracking-wider flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Parking Duration
            </span>
            <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white mt-1">
              {timerFormatted}
            </div>
          </div>

          <div className="w-full border-t border-white/15 pt-2 flex items-center justify-between text-xs">
            <span className="text-white/80">Estimated Bill:</span>
            <span className="text-lg font-black font-mono text-emerald-300">₹{currentCharges}</span>
          </div>

          {isPendingPayment ? (
            <button
              onClick={() => onPayNow(session)}
              className="w-full py-3 px-5 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-extrabold text-xs shadow-lg transition flex items-center justify-center gap-2 group animate-pulse"
            >
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Scan QR & Pay Now</span>
            </button>
          ) : (
            <div className="w-full text-center text-[11px] text-white/70 bg-white/10 py-1.5 px-3 rounded-xl">
              Pay when vehicle exits at gate
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

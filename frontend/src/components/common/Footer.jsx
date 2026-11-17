import React from 'react';
import { Car, ShieldCheck, Heart, Radio } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-20 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Car className="w-4 h-4" />
            </div>
            <div>
              <span className="font-black text-sm tracking-tight text-slate-900">
                Park<span className="text-brand-600">Smart</span>
              </span>
              <p className="text-[11px] text-slate-400">
                Intelligent Full-Stack Parking Management System
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium">
            <span>24/7 Gate Support: +91 98765 43210</span>
            <span>•</span>
            <span>Transparent Rate: ₹20 / Hour</span>
            <span>•</span>
            <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              Verified UPI Payments
            </span>
          </div>

          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} ParkSmart Technologies Inc.
          </p>
        </div>
      </div>
    </footer>
  );
}

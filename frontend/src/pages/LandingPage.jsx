import React from 'react';
import {
  Car,
  Shield,
  MapPin,
  Clock,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Smartphone,
  BarChart3,
  QrCode,
  Users,
} from 'lucide-react';
import ParkingMap from '../components/map/ParkingMap';

export default function LandingPage({ onNavigate, locations = [] }) {
  return (
    <div className="space-y-16 py-8 sm:py-12">
      {/* Hero Section */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold uppercase tracking-wider shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Generation Smart Parking Management</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight">
          Intelligent Urban Parking with <span className="bg-gradient-to-r from-brand-600 to-indigo-600 bg-clip-text text-transparent">Real-Time Precision</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
          Discover available parking slots in real time, reserve seamlessly with instant slot allocation, experience automated gate check-ins, and enjoy contactless UPI exit payments.
        </p>

        {/* Two Clearly Separated Portal Action Cards per requirements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto pt-6 text-left">
          {/* Customer Portal Card */}
          <div className="bg-gradient-to-br from-white to-blue-50/60 p-6 sm:p-7 rounded-3xl border-2 border-brand-200 shadow-xl shadow-brand-500/5 hover:border-brand-500 transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Car className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">For Drivers & Commuters</span>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">Customer Portal</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Search nearby parking locations with real-time slot counters, reserve your slot in advance, track live parking duration, and pay via UPI QR codes.
              </p>
            </div>

            <div className="pt-6 flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={() => onNavigate('customer-login')}
                className="flex-1 py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/25 transition text-center flex items-center justify-center gap-1.5"
              >
                <span>Customer Login</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onNavigate('customer-register')}
                className="py-3 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs transition text-center"
              >
                New User? Register
              </button>
            </div>
          </div>

          {/* Staff Portal Card */}
          <div className="bg-gradient-to-br from-white to-purple-50/60 p-6 sm:p-7 rounded-3xl border-2 border-purple-200 shadow-xl shadow-purple-500/5 hover:border-purple-500 transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">For Operators & Gate Security</span>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">Staff Operations Portal</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Authorized gate console for recording walk-in or booked vehicle entries, interactive visual slot grid monitoring, payment clearance, and audit logs.
              </p>
            </div>

            <div className="pt-6">
              <button
                onClick={() => onNavigate('staff-login')}
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
              >
                <Shield className="w-4 h-4 text-purple-400" />
                <span>Authorized Staff Login</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Engineered for Modern Parking Infrastructure
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Eliminate congestion and manual tokens with digital-first automated operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-brand-600 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-base text-slate-900">Live GPS Discovery & Booking</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Real-time slot availability counts with exact distance calculation, interactive Leaflet maps, and atomic race-condition-free reservations.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-base text-slate-900">Dynamic UPI QR Code Billing</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Standard ₹20/hr transparent rate formula: Max(1, Ceiling(Duration)) × ₹20. Generates verified UPI QR code on exit with official e-receipts.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-base text-slate-900">Visual Grid & Real-time Analytics</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Color-coded slot status grid (Available, Occupied, Reserved, Maintenance) updating instantly via Socket.IO alongside Recharts analytics.
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Rule Card per requirements */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white rounded-3xl p-7 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-xs uppercase font-bold text-brand-300 tracking-wider">Transparent Pricing</span>
            <h3 className="text-2xl font-black">Standard Rate: ₹20 / Hour</h3>
            <p className="text-xs text-slate-300 max-w-md">
              Minimum mandatory charge is ₹20. Partial hours count as full hours. (e.g. 20 mins = ₹20, 1 hr 20 mins = ₹40, 2 hrs 10 mins = ₹60).
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20 text-center shrink-0">
            <span className="text-xs text-white/70 block">Minimum Fee</span>
            <span className="text-3xl font-black font-mono text-emerald-400">₹20.00</span>
          </div>
        </div>
      </div>

      {/* Interactive Map Section Preview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Live Parking Locations</h3>
            <p className="text-xs text-slate-500">Explore locations and available slots across Bangalore tech corridors</p>
          </div>
          <button
            onClick={() => onNavigate('customer-login')}
            className="text-xs font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1"
          >
            <span>Explore All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <ParkingMap
          locations={locations}
          height="380px"
          onSelectLocation={() => onNavigate('customer-login')}
        />
      </div>
    </div>
  );
}

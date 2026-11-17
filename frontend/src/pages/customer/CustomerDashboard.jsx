import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { api } from '../../services/api';
import LiveSessionBanner from '../../components/customer/LiveSessionBanner';
import CustomerPaymentModal from '../../components/customer/CustomerPaymentModal';
import {
  Car,
  MapPin,
  Calendar,
  Clock,
  ArrowRight,
  Sparkles,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Bell,
  XCircle,
} from 'lucide-react';

export default function CustomerDashboard({ onNavigate }) {
  const { user, primaryVehicle } = useAuth();
  const { socket } = useSocket();

  const [activeSession, setActiveSession] = useState(null);
  const [confirmedBookings, setConfirmedBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentSession, setPaymentSession] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const res = await api.getCustomerDashboard();
      if (res.success) {
        setActiveSession(res.activeSession);
        setConfirmedBookings(res.confirmedBookings || []);
        setNotifications(res.notifications || []);
      }
    } catch (err) {
      console.error('Failed to load customer dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Listen to live socket events (vehicle entry, exit, payment)
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchDashboardData();
    };

    socket.on('notification', handleUpdate);
    socket.on('vehicle_entered', handleUpdate);
    socket.on('vehicle_exited', handleUpdate);
    socket.on('payment_completed', handleUpdate);

    return () => {
      socket.off('notification', handleUpdate);
      socket.off('vehicle_entered', handleUpdate);
      socket.off('vehicle_exited', handleUpdate);
      socket.off('payment_completed', handleUpdate);
    };
  }, [socket]);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking? The slot will be released.')) return;
    try {
      const res = await api.cancelBooking(bookingId, { reason: 'Customer cancelled from dashboard' });
      if (res.success) {
        fetchDashboardData();
      }
    } catch (err) {
      alert(err.message || 'Failed to cancel booking');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Hi, {user?.full_name || 'Driver'}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Registered Vehicle:{' '}
            <span className="font-mono font-bold text-slate-800">
              {primaryVehicle?.vehicle_number || 'No Vehicle Added'}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('discovery')}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition flex items-center gap-1.5"
          >
            <MapPin className="w-4 h-4" />
            <span>Find & Book Parking</span>
          </button>
        </div>
      </div>

      {/* 1. Live Active Session Banner (Requirement 3.D) */}
      {activeSession ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Live Active Session
            </h3>
            <span className="text-xs text-brand-600 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Precision Tracking
            </span>
          </div>

          <LiveSessionBanner
            session={activeSession}
            onPayNow={(sess) => setPaymentSession(sess)}
          />
        </div>
      ) : (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 p-6 rounded-3xl border border-brand-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-600 flex items-center justify-center shrink-0">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">No Active Vehicle Parked</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Reserve your slot ahead of time or navigate directly to any of our 4 smart parking hubs.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('discovery')}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-brand-700 border border-brand-200 font-bold text-xs shadow-sm transition shrink-0"
          >
            Browse Available Slots →
          </button>
        </div>
      )}

      {/* 2. Upcoming / Confirmed Bookings Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900">
            Upcoming Bookings ({confirmedBookings.length})
          </h3>
          <button
            onClick={() => onNavigate('bookings')}
            className="text-xs font-bold text-brand-600 hover:text-brand-800"
          >
            View All →
          </button>
        </div>

        {confirmedBookings.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200/80 text-slate-400 text-xs">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
            <p>No active upcoming reservations. Ready to book your next spot?</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {confirmedBookings.map((b) => (
              <div
                key={b.id}
                className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[11px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                      {b.booking_code}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm mt-1">{b.parking_name}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{b.parking_address}</span>
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Allocated Slot
                    </span>
                    <span className="font-mono font-black text-base text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                      {b.slot_number}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Vehicle</span>
                    <span className="font-mono font-bold text-slate-800">{b.vehicle_number}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Expected Entry</span>
                    <span className="font-medium text-slate-700">
                      {new Date(b.expected_entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Est. Amount</span>
                    <span className="font-mono font-bold text-emerald-600">₹{b.estimated_amount}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Awaiting Entry Scan
                  </span>

                  <button
                    onClick={() => handleCancelBooking(b.id)}
                    className="text-xs text-rose-600 hover:text-rose-800 font-semibold transition"
                  >
                    Cancel Booking
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <button
          onClick={() => onNavigate('discovery')}
          className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition text-left group flex items-start gap-4"
        >
          <div className="w-10 h-10 rounded-2xl bg-blue-100 text-brand-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900 group-hover:text-brand-600 transition">
              Find & Reserve Parking
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Search nearby spots, view map markers & live availability
            </p>
          </div>
        </button>

        <button
          onClick={() => onNavigate('analytics')}
          className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition text-left group flex items-start gap-4"
        >
          <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900 group-hover:text-purple-600 transition">
              My Parking Analytics
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Inspect total parking visits, monthly spend charts, and records
            </p>
          </div>
        </button>

        <button
          onClick={() => onNavigate('profile')}
          className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition text-left group flex items-start gap-4"
        >
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900 group-hover:text-emerald-600 transition">
              Manage Vehicles
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Add new vehicle RC numbers or change primary car
            </p>
          </div>
        </button>
      </div>

      {/* Customer Payment Modal if triggered */}
      {paymentSession && (
        <CustomerPaymentModal
          session={paymentSession}
          onClose={() => setPaymentSession(null)}
          onPaymentComplete={() => {
            fetchDashboardData();
          }}
        />
      )}
    </div>
  );
}

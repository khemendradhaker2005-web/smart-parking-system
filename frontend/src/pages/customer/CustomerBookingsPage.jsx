import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { QRCodeSVG } from 'qrcode.react';
import {
  Calendar,
  Clock,
  Car,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  QrCode,
} from 'lucide-react';

export default function CustomerBookingsPage({ onNavigate }) {
  const [dashboardData, setDashboardData] = useState({ confirmedBookings: [] });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' or 'past'
  const [qrModalBooking, setQrModalBooking] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashRes, anaRes] = await Promise.all([
        api.getCustomerDashboard(),
        api.getCustomerAnalytics(),
      ]);

      if (dashRes.success) {
        setDashboardData(dashRes);
      }
      if (anaRes.success) {
        setHistory(anaRes.history || []);
      }
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking? The slot will be returned to the pool.')) return;
    try {
      const res = await api.cancelBooking(bookingId, { reason: 'Customer requested cancellation' });
      if (res.success) {
        fetchData();
      }
    } catch (err) {
      alert(err.message || 'Failed to cancel booking');
    }
  };

  const upcomingBookings = dashboardData.confirmedBookings || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            My Parking Bookings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your slot reservations, QR passes, and cancellation requests
          </p>
        </div>

        <button
          onClick={() => onNavigate('discovery')}
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Calendar className="w-4 h-4" />
          <span>New Reservation</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`py-3 px-6 text-xs font-bold border-b-2 transition ${
            activeTab === 'upcoming'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Active Reservations ({upcomingBookings.length})
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`py-3 px-6 text-xs font-bold border-b-2 transition ${
            activeTab === 'past'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Past Parking Sessions ({history.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'upcoming' ? (
        upcomingBookings.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 space-y-3">
            <Calendar className="w-10 h-10 mx-auto opacity-40 text-slate-400" />
            <h3 className="text-sm font-bold text-slate-800">No Active Reservations</h3>
            <p className="text-xs max-w-sm mx-auto">
              You do not have any upcoming bookings. Search nearby parking hubs to reserve an available slot.
            </p>
            <button
              onClick={() => onNavigate('discovery')}
              className="mt-2 px-4 py-2 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 transition"
            >
              Discover Parking Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {upcomingBookings.map((b) => (
              <div
                key={b.id}
                className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded border border-brand-200">
                      {b.booking_code}
                    </span>
                    <h3 className="font-extrabold text-base text-slate-900 mt-1.5">{b.parking_name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{b.parking_address}</span>
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Allocated Slot
                    </span>
                    <span className="font-mono font-black text-lg text-brand-600 bg-brand-50 px-3 py-1 rounded-xl border border-brand-200 block mt-0.5">
                      {b.slot_number}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Vehicle</span>
                    <span className="font-mono font-bold text-slate-900">{b.vehicle_number}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Expected Entry</span>
                    <span className="font-medium text-slate-800">
                      {new Date(b.expected_entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Est. Charges</span>
                    <span className="font-mono font-bold text-emerald-600">₹{b.estimated_amount}</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <button
                    onClick={() => setQrModalBooking(b)}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs flex items-center gap-1.5 transition"
                  >
                    <QrCode className="w-4 h-4 text-slate-600" />
                    <span>View QR Pass</span>
                  </button>

                  <button
                    onClick={() => handleCancel(b.id)}
                    className="text-xs font-bold text-rose-600 hover:text-rose-800 transition"
                  >
                    Cancel Reservation
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Past Sessions History */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-4">Session Code</th>
                  <th className="p-4">Location & Slot</th>
                  <th className="p-4">Vehicle</th>
                  <th className="p-4">Entry Time</th>
                  <th className="p-4">Exit Time</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4">Charges</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      No completed parking sessions yet.
                    </td>
                  </tr>
                ) : (
                  history.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 transition">
                      <td className="p-4 font-mono font-bold text-slate-900">{row.session_code}</td>
                      <td className="p-4">
                        <p className="font-semibold text-slate-800">{row.parking_name}</p>
                        <span className="font-mono text-[10px] text-brand-600">Slot {row.slot_number}</span>
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-800">{row.vehicle_number}</td>
                      <td className="p-4 text-slate-600">
                        {new Date(row.entry_time).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-4 text-slate-600">
                        {row.exit_time
                          ? new Date(row.exit_time).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : 'In Progress'}
                      </td>
                      <td className="p-4 font-semibold text-slate-700">
                        {row.duration_minutes ? `${Math.floor(row.duration_minutes / 60)}h ${row.duration_minutes % 60}m` : 'N/A'}
                      </td>
                      <td className="p-4 font-mono font-bold text-emerald-600">₹{row.total_amount || 0}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* QR Code Pass Modal */}
      {qrModalBooking && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 p-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setQrModalBooking(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
            >
              <XCircle className="w-5 h-5" />
            </button>

            <span className="text-[10px] uppercase font-bold text-brand-600 tracking-wider">
              Fast Gate Check-In Pass
            </span>
            <h3 className="text-lg font-bold text-slate-900">{qrModalBooking.parking_name}</h3>

            <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-md inline-block mx-auto">
              <QRCodeSVG
                value={qrModalBooking.booking_code}
                size={180}
                level="M"
                includeMargin={true}
              />
              <p className="font-mono font-black text-sm text-slate-900 mt-2">
                {qrModalBooking.booking_code}
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-left space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Slot Allocated:</span>
                <span className="font-mono font-bold text-brand-600">{qrModalBooking.slot_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Vehicle:</span>
                <span className="font-mono font-bold">{qrModalBooking.vehicle_number}</span>
              </div>
            </div>

            <button
              onClick={() => setQrModalBooking(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { api } from '../../services/api';
import StaffEntryModal from '../../components/staff/StaffEntryModal';
import StaffExitModal from '../../components/staff/StaffExitModal';
import {
  Car,
  Grid3X3,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Clock,
  ArrowRight,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';

export default function StaffDashboard({ onNavigate, locations = [] }) {
  const { socket } = useSocket();

  const [stats, setStats] = useState(null);
  const [activeVehicles, setActiveVehicles] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState(locations[0]?.id || 1);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [exitSession, setExitSession] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, vehiclesRes] = await Promise.all([
        api.getStaffDashboardStats({ locationId: selectedLocationId }),
        api.getActiveVehicles({ locationId: selectedLocationId }),
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (vehiclesRes.success) setActiveVehicles(vehiclesRes.vehicles || []);
    } catch (err) {
      console.error('Failed to load staff dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedLocationId]);

  // Real-time socket events
  useEffect(() => {
    if (!socket) return;

    const handleRefresh = () => {
      fetchData();
    };

    socket.on('vehicle_entered', handleRefresh);
    socket.on('vehicle_exited', handleRefresh);
    socket.on('payment_completed', handleRefresh);
    socket.on('slot_updated', handleRefresh);

    return () => {
      socket.off('vehicle_entered', handleRefresh);
      socket.off('vehicle_exited', handleRefresh);
      socket.off('payment_completed', handleRefresh);
      socket.off('slot_updated', handleRefresh);
    };
  }, [socket, selectedLocationId]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
              Shift Console
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Operational Gate Supervisor
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Staff Operations Dashboard
          </h1>
        </div>

        {/* Location Dropdown & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedLocationId}
            onChange={(e) => setSelectedLocationId(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
          >
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowEntryModal(true)}
            className="px-4 py-2.5 rounded-xl bg-purple-800 hover:bg-purple-900 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Record Vehicle Entry</span>
          </button>

          <button
            onClick={() => onNavigate('slots')}
            className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs shadow-sm transition flex items-center gap-1.5"
          >
            <Grid3X3 className="w-4 h-4 text-purple-700" />
            <span>Visual Grid</span>
          </button>
        </div>
      </div>

      {/* 8 Primary KPIs per Prompt Requirement 4 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* 1. Total Slots */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">Total Slots</span>
          <p className="text-xl font-black text-slate-900 font-mono mt-1">{stats?.totalSlots || 0}</p>
          <span className="text-[10px] text-slate-500">Capacity</span>
        </div>

        {/* 2. Available Slots */}
        <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200/80 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-emerald-700 block truncate">Available</span>
          <p className="text-xl font-black text-emerald-700 font-mono mt-1">{stats?.availableSlots || 0}</p>
          <span className="text-[10px] text-emerald-600 font-medium">Free Now</span>
        </div>

        {/* 3. Occupied Slots */}
        <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-200/80 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-rose-700 block truncate">Occupied</span>
          <p className="text-xl font-black text-rose-700 font-mono mt-1">{stats?.occupiedSlots || 0}</p>
          <span className="text-[10px] text-rose-600 font-medium">Parked</span>
        </div>

        {/* 4. Active Vehicles */}
        <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-200/80 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-purple-700 block truncate">Active Vehicles</span>
          <p className="text-xl font-black text-purple-700 font-mono mt-1">{stats?.activeVehicles || 0}</p>
          <span className="text-[10px] text-purple-600 font-medium">Inside Premise</span>
        </div>

        {/* 5. Today's Entries */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">Today's Entries</span>
          <p className="text-xl font-black text-slate-900 font-mono mt-1">{stats?.todayEntries || 0}</p>
          <span className="text-[10px] text-emerald-600">Gate In</span>
        </div>

        {/* 6. Today's Exits */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">Today's Exits</span>
          <p className="text-xl font-black text-slate-900 font-mono mt-1">{stats?.todayExits || 0}</p>
          <span className="text-[10px] text-blue-600">Gate Out</span>
        </div>

        {/* 7. Pending Payments */}
        <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200/80 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-amber-700 block truncate">Pending Payments</span>
          <p className="text-xl font-black text-amber-700 font-mono mt-1">{stats?.pendingPayments || 0}</p>
          <span className="text-[10px] text-amber-600 font-medium">At Exit Kiosk</span>
        </div>

        {/* 8. Today's Revenue */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">Today's Revenue</span>
          <p className="text-xl font-black text-emerald-600 font-mono mt-1">₹{stats?.todayRevenue || 0}</p>
          <span className="text-[10px] text-slate-400">Paid In Full</span>
        </div>
      </div>

      {/* Currently Parked Vehicles Table (Live Action) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">
              Currently Parked Vehicles ({activeVehicles.length})
            </h3>
            <p className="text-xs text-slate-500">
              Live vehicles parked in bays awaiting checkout
            </p>
          </div>

          <button
            onClick={() => onNavigate('entry-exit')}
            className="text-xs font-bold text-purple-700 hover:text-purple-900"
          >
            Gate Check-Out Console →
          </button>
        </div>

        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-y border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-6">Vehicle RC</th>
                <th className="py-3 px-6">Assigned Slot</th>
                <th className="py-3 px-6">Customer / Mobile</th>
                <th className="py-3 px-6">Entry Time</th>
                <th className="py-3 px-6">Duration So Far</th>
                <th className="py-3 px-6">Current Bill</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Gate Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeVehicles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No vehicles currently parked at this location.
                  </td>
                </tr>
              ) : (
                activeVehicles.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-6 font-mono font-black text-sm text-slate-900">
                      {row.vehicle_number}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="font-mono font-extrabold text-xs text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        {row.slot_number}
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      <p className="font-semibold text-slate-800">{row.customer_name || 'Guest'}</p>
                      <p className="font-mono text-[10px] text-slate-500">{row.customer_mobile || 'Walk-in'}</p>
                    </td>
                    <td className="py-3.5 px-6 text-slate-600 font-mono">
                      {new Date(row.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-slate-800">
                      {row.live_duration_formatted}
                    </td>
                    <td className="py-3.5 px-6 font-mono font-bold text-emerald-600">
                      ₹{row.current_charges}
                    </td>
                    <td className="py-3.5 px-6">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          row.status === 'payment_pending'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {row.status === 'payment_pending' ? 'Payment Due' : 'Parked'}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => setExitSession(row)}
                        className="py-1.5 px-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs transition inline-flex items-center gap-1 shadow-sm"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Mark as Exited</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Entry Modal */}
      {showEntryModal && (
        <StaffEntryModal
          locations={locations}
          defaultLocationId={selectedLocationId}
          onClose={() => setShowEntryModal(false)}
          onSuccess={() => {
            fetchData();
          }}
        />
      )}

      {/* Exit Modal */}
      {exitSession && (
        <StaffExitModal
          session={exitSession}
          onClose={() => setExitSession(null)}
          onExitComplete={() => {
            fetchData();
          }}
        />
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import StaffExitModal from '../../components/staff/StaffExitModal';
import {
  Car,
  LogOut,
  Search,
  CheckCircle2,
  AlertCircle,
  Plus,
  Clock,
  Shield,
  CreditCard,
  QrCode,
  ArrowRight,
  Filter,
} from 'lucide-react';

export default function StaffEntryExitPage({ locations = [] }) {
  const [activeTab, setActiveTab] = useState('exit'); // 'entry' or 'exit'

  // Location selector
  const [selectedLocationId, setSelectedLocationId] = useState(locations[0]?.id || 1);

  // Active Parked Vehicles List for Exit Search
  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Entry Form State
  const [entryForm, setEntryForm] = useState({
    vehicle_number: '',
    customer_mobile: '',
    customer_name: '',
    vehicle_type: 'Four Wheeler / Car',
    booking_code: '',
  });
  const [entryLoading, setEntryLoading] = useState(false);
  const [entryError, setEntryError] = useState(null);
  const [entrySuccess, setEntrySuccess] = useState(null);

  // Exit Modal State
  const [exitSession, setExitSession] = useState(null);

  const fetchActiveVehicles = async () => {
    setLoading(true);
    try {
      const res = await api.getActiveVehicles({
        locationId: selectedLocationId,
        search: search.trim() || undefined,
      });
      if (res.success) {
        setVehicles(res.vehicles || []);
      }
    } catch (err) {
      console.error('Failed to load active vehicles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveVehicles();
  }, [selectedLocationId, search]);

  const handleEntrySubmit = async (e) => {
    e.preventDefault();
    setEntryError(null);
    setEntrySuccess(null);

    if (!entryForm.vehicle_number.trim()) {
      setEntryError('Vehicle registration number is required.');
      return;
    }

    setEntryLoading(true);
    try {
      const res = await api.recordVehicleEntry({
        ...entryForm,
        vehicle_number: entryForm.vehicle_number.trim().toUpperCase().replace(/\s+/g, ''),
        location_id: parseInt(selectedLocationId, 10),
      });

      if (res.success) {
        setEntrySuccess(res);
        setEntryForm({
          vehicle_number: '',
          customer_mobile: '',
          customer_name: '',
          vehicle_type: 'Four Wheeler / Car',
          booking_code: '',
        });
        fetchActiveVehicles();
      }
    } catch (err) {
      setEntryError(err.message || 'Failed to record vehicle entry.');
    } finally {
      setEntryLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Gate Entry & Exit Console
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Physical gate access management, automated slot allocation, and departure checkout
          </p>
        </div>

        {/* Location Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Gate Location:</span>
          <select
            value={selectedLocationId}
            onChange={(e) => setSelectedLocationId(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
          >
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('exit')}
          className={`py-3 px-6 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'exit'
              ? 'border-purple-700 text-purple-800'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <LogOut className="w-4 h-4" />
          <span>Vehicle Exit & Checkout ({vehicles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('entry')}
          className={`py-3 px-6 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'entry'
              ? 'border-purple-700 text-purple-800'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Vehicle Check-In / Entry Form</span>
        </button>
      </div>

      {/* TAB 1: EXIT MANAGEMENT */}
      {activeTab === 'exit' && (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="relative">
              <input
                type="text"
                placeholder="Search active vehicle by RC number, customer name, mobile, slot number, or booking ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          {/* Vehicles List */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-4">Vehicle Number</th>
                    <th className="p-4">Assigned Slot</th>
                    <th className="p-4">Customer Details</th>
                    <th className="p-4">Entry Time</th>
                    <th className="p-4">Duration Ticked</th>
                    <th className="p-4">Billed Charges (₹20/hr)</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Gate Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vehicles.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        No active parked vehicles matching your search criteria.
                      </td>
                    </tr>
                  ) : (
                    vehicles.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50 transition">
                        <td className="p-4 font-mono font-black text-sm text-slate-900">
                          {row.vehicle_number}
                        </td>
                        <td className="p-4">
                          <span className="font-mono font-extrabold text-xs text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                            {row.slot_number}
                          </span>
                        </td>
                        <td className="p-4">
                          <p className="font-semibold text-slate-800">{row.customer_name || 'Guest'}</p>
                          <p className="font-mono text-[10px] text-slate-500">{row.customer_mobile || 'Walk-in'}</p>
                        </td>
                        <td className="p-4 text-slate-600 font-mono">
                          {new Date(row.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-4 font-bold text-slate-800">
                          {row.live_duration_formatted}
                        </td>
                        <td className="p-4 font-mono font-bold text-emerald-600 text-sm">
                          ₹{row.current_charges}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              row.status === 'payment_pending'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {row.status === 'payment_pending' ? 'Payment Due' : 'Parked'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => setExitSession(row)}
                            className="py-1.5 px-3.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs transition inline-flex items-center gap-1.5 shadow-sm"
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
        </div>
      )}

      {/* TAB 2: ENTRY MANAGEMENT FORM */}
      {activeTab === 'entry' && (
        <div className="max-w-xl mx-auto bg-white p-7 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Vehicle Check-In Form</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Verify pre-booked slot or automatically allocate an open bay for walk-in arrivals
            </p>
          </div>

          {entryError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{entryError}</span>
            </div>
          )}

          {entrySuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Entry Approved & Slot Allocated!</span>
              </div>
              <p>
                Vehicle <strong>{entrySuccess.session?.vehicle_number}</strong> assigned to slot{' '}
                <strong className="font-mono text-purple-800">{entrySuccess.session?.slot_number}</strong>.
              </p>
              <p className="text-[11px] text-emerald-700 italic">
                Notification broadcast to customer in real-time via Socket.IO.
              </p>
            </div>
          )}

          <form onSubmit={handleEntrySubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Vehicle Registration Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. KA01AB1234"
                value={entryForm.vehicle_number}
                onChange={(e) => setEntryForm({ ...entryForm, vehicle_number: e.target.value.toUpperCase() })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-extrabold uppercase focus:ring-2 focus:ring-purple-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Booking ID / Reservation Code (If Pre-Booked)
              </label>
              <input
                type="text"
                placeholder="e.g. BK-202611-123456"
                value={entryForm.booking_code}
                onChange={(e) => setEntryForm({ ...entryForm, booking_code: e.target.value.toUpperCase() })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Customer Mobile (Optional)
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="10-digit number"
                  value={entryForm.customer_mobile}
                  onChange={(e) => setEntryForm({ ...entryForm, customer_mobile: e.target.value })}
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
                  value={entryForm.customer_name}
                  onChange={(e) => setEntryForm({ ...entryForm, customer_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Vehicle Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Four Wheeler / Car', 'SUV', 'EV / Electric'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setEntryForm({ ...entryForm, vehicle_type: type })}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border transition text-center truncate ${
                      entryForm.vehicle_type === type
                        ? 'bg-purple-50 text-purple-700 border-purple-300 font-bold'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={entryLoading}
                className="w-full py-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-lg shadow-purple-500/25 transition flex items-center justify-center gap-2"
              >
                <span>{entryLoading ? 'Allocating Bay...' : 'Confirm Entry & Lift Barrier'}</span>
                {!entryLoading && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Exit Modal if triggered */}
      {exitSession && (
        <StaffExitModal
          session={exitSession}
          onClose={() => setExitSession(null)}
          onExitComplete={() => {
            fetchActiveVehicles();
          }}
        />
      )}
    </div>
  );
}

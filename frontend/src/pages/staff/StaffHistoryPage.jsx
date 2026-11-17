import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  History,
  Search,
  Filter,
  Car,
  MapPin,
  Clock,
  CreditCard,
  Receipt,
  FileSpreadsheet,
} from 'lucide-react';
import ReceiptModal from '../../components/common/ReceiptModal';

export default function StaffHistoryPage({ locations = [] }) {
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.getParkingHistory({
        search: search.trim() || undefined,
        locationId: selectedLocationId || undefined,
        status: selectedStatus || undefined,
      });
      if (res.success) {
        setHistory(res.history || []);
      }
    } catch (err) {
      console.error('Failed to load parking history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [search, selectedLocationId, selectedStatus]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Immutable Parking Audit History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Complete historical log of all vehicle sessions, timestamps, fees, and receipts (never purged)
          </p>
        </div>

        <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200 self-start sm:self-auto">
          {history.length} Sessions Retained
        </span>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="Search by vehicle number, customer name, mobile, or slot number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        </div>

        <select
          value={selectedLocationId}
          onChange={(e) => setSelectedLocationId(e.target.value)}
          className="px-3.5 py-2.5 rounded-2xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 w-full md:w-auto"
        >
          <option value="">All Locations</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name}
            </option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3.5 py-2.5 rounded-2xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 w-full md:w-auto"
        >
          <option value="">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="active">Active</option>
          <option value="payment_pending">Payment Pending</option>
        </select>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-4">Session Code</th>
                <th className="p-4">Vehicle Number</th>
                <th className="p-4">Location & Slot</th>
                <th className="p-4">Customer Details</th>
                <th className="p-4">Entry Time</th>
                <th className="p-4">Exit Time</th>
                <th className="p-4">Duration</th>
                <th className="p-4">Total Fee</th>
                <th className="p-4">Payment Method</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-400">
                    No parking sessions found matching your filters.
                  </td>
                </tr>
              ) : (
                history.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition">
                    <td className="p-4 font-mono font-bold text-slate-900">{row.session_code}</td>
                    <td className="p-4 font-mono font-black text-sm text-slate-800">{row.vehicle_number}</td>
                    <td className="p-4">
                      <p className="font-semibold text-slate-800">{row.parking_name}</p>
                      <span className="font-mono text-[10px] text-purple-700 font-bold">Slot {row.slot_number}</span>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-slate-800">{row.customer_name || 'Guest'}</p>
                      <p className="font-mono text-[10px] text-slate-500">{row.customer_mobile || 'Walk-in'}</p>
                    </td>
                    <td className="p-4 text-slate-600 font-mono">
                      {new Date(row.entry_time).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-4 text-slate-600 font-mono">
                      {row.exit_time
                        ? new Date(row.exit_time).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : 'Currently Parked'}
                    </td>
                    <td className="p-4 font-semibold text-slate-800">
                      {row.duration_minutes ? `${Math.floor(row.duration_minutes / 60)}h ${row.duration_minutes % 60}m` : 'In Progress'}
                    </td>
                    <td className="p-4 font-mono font-bold text-emerald-600">
                      ₹{Number(row.total_amount || 0).toFixed(2)}
                    </td>
                    <td className="p-4 font-medium text-slate-700">{row.payment_method || 'N/A'}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          row.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : row.status === 'payment_pending'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {row.status === 'completed' ? (
                        <button
                          onClick={() =>
                            setSelectedReceipt({
                              receiptNumber: row.receipt_number || `RCP-${row.session_code}`,
                              transactionId: row.transaction_id || `TXN-${row.id}`,
                              vehicleNumber: row.vehicle_number,
                              parkingName: row.parking_name,
                              slotNumber: row.slot_number,
                              entryTime: row.entry_time,
                              exitTime: row.exit_time,
                              durationFormatted: `${Math.floor((row.duration_minutes || 0) / 60)}h ${(row.duration_minutes || 0) % 60}m`,
                              amount: row.total_amount,
                              paymentMethod: row.payment_method || 'Cash / Gate',
                              paidAt: row.exit_time,
                            })
                          }
                          className="p-1 text-slate-500 hover:text-purple-700 transition"
                          title="View Receipt"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedReceipt && (
        <ReceiptModal
          receipt={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
}

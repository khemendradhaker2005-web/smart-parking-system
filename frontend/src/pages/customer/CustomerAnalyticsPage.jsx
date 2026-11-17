import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CreditCard,
  MapPin,
  Calendar,
  ShieldCheck,
  Receipt,
} from 'lucide-react';
import ReceiptModal from '../../components/common/ReceiptModal';

export default function CustomerAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    api.getCustomerAnalytics()
      .then((res) => {
        if (res.success) {
          setAnalytics(res.analytics);
          setHistory(res.history || []);
        }
      })
      .catch((err) => console.error('Failed to load customer analytics:', err))
      .finally(() => setLoading(false));
  }, []);

  const monthlyData = analytics?.monthlyExpenses || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold uppercase tracking-wider mb-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Private Personal Records</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Personal Parking Analytics & Expenses
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Detailed metrics of your parking activity, expenses, and digital receipts
        </p>
      </div>

      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Visits */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
              Total Parking Visits
            </span>
            <p className="text-2xl font-black text-slate-900 font-mono mt-1">
              {analytics?.totalVisits || 0}
            </p>
            <span className="text-[11px] text-emerald-600 font-semibold">Completed Sessions</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-brand-600 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Total Spent */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
              Total Amount Spent
            </span>
            <p className="text-2xl font-black text-emerald-600 font-mono mt-1">
              ₹{Number(analytics?.totalSpent || 0).toFixed(2)}
            </p>
            <span className="text-[11px] text-slate-400">All-time Parking Fees</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        {/* Total Hours */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
              Total Parking Hours
            </span>
            <p className="text-2xl font-black text-purple-600 font-mono mt-1">
              {analytics?.totalHours || 0} <span className="text-xs text-slate-400">hrs</span>
            </p>
            <span className="text-[11px] text-slate-400">Cumulative Duration</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Top Location */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
              Top Used Hub
            </span>
            <p className="text-sm font-extrabold text-slate-900 mt-1 line-clamp-1">
              {analytics?.mostFrequentLocation || 'N/A'}
            </p>
            <span className="text-[11px] text-brand-600 font-semibold">Primary Preference</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <MapPin className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Recharts Monthly Expenses Chart */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Monthly Parking Expenses (₹)</h3>
            <p className="text-xs text-slate-500">Track month-over-month expenditure trends</p>
          </div>
          <span className="text-xs font-bold font-mono text-brand-600 bg-brand-50 px-2.5 py-1 rounded-xl border border-brand-200">
            Rate: ₹20 / hr
          </span>
        </div>

        <div className="h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `₹${val}`} />
              <Tooltip
                formatter={(val) => [`₹${val}`, 'Amount Spent']}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
              />
              <Area type="monotone" dataKey="amount" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAmount)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Parking Visit History Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Personal Parking Visit History</h3>
            <p className="text-xs text-slate-500">Complete immutable record of all completed sessions</p>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {history.length} Sessions Logged
          </span>
        </div>

        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-y border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-6">Session Code</th>
                <th className="py-3 px-6">Parking Location & Slot</th>
                <th className="py-3 px-6">Vehicle</th>
                <th className="py-3 px-6">Entry Time</th>
                <th className="py-3 px-6">Exit Time</th>
                <th className="py-3 px-6">Duration</th>
                <th className="py-3 px-6">Amount</th>
                <th className="py-3 px-6 text-right">E-Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No visit history available yet.
                  </td>
                </tr>
              ) : (
                history.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-6 font-mono font-bold text-slate-900">{row.session_code}</td>
                    <td className="py-3.5 px-6">
                      <p className="font-semibold text-slate-800">{row.parking_name}</p>
                      <span className="font-mono text-[10px] text-brand-600">Slot {row.slot_number}</span>
                    </td>
                    <td className="py-3.5 px-6 font-mono font-bold text-slate-800">{row.vehicle_number}</td>
                    <td className="py-3.5 px-6 text-slate-600">
                      {new Date(row.entry_time).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-6 text-slate-600">
                      {row.exit_time
                        ? new Date(row.exit_time).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : 'Active'}
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-slate-700">
                      {row.duration_minutes ? `${Math.floor(row.duration_minutes / 60)}h ${row.duration_minutes % 60}m` : 'N/A'}
                    </td>
                    <td className="py-3.5 px-6 font-mono font-bold text-emerald-600">
                      ₹{Number(row.total_amount || 0).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-6 text-right">
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
                              paymentMethod: row.payment_method || 'UPI',
                              paidAt: row.exit_time || row.entry_time,
                            })
                          }
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] inline-flex items-center gap-1 transition"
                        >
                          <Receipt className="w-3.5 h-3.5 text-slate-500" />
                          <span>Receipt</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-amber-600 font-medium">In Session</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Modal if clicked */}
      {selectedReceipt && (
        <ReceiptModal
          receipt={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
}

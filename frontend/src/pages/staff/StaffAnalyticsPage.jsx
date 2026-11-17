import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Car,
  DollarSign,
  Grid3X3,
  Flame,
  Snowflake,
} from 'lucide-react';

export default function StaffAnalyticsPage({ locations = [] }) {
  const [analytics, setAnalytics] = useState(null);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getStaffAnalytics({ locationId: selectedLocationId || undefined })
      .then((res) => {
        if (res.success) setAnalytics(res.analytics);
      })
      .catch((err) => console.error('Failed to load staff analytics:', err))
      .finally(() => setLoading(false));
  }, [selectedLocationId]);

  const dailyTrends = analytics?.dailyTrends || [];
  const mostOccupied = analytics?.mostOccupiedSlots || [];
  const leastOccupied = analytics?.leastOccupiedSlots || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Slot Usage & Revenue Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Bay utilization density, hourly flow, daily entry/exit metrics, and revenue velocity
          </p>
        </div>

        {/* Location Filter */}
        <select
          value={selectedLocationId}
          onChange={(e) => setSelectedLocationId(e.target.value)}
          className="px-3.5 py-2.5 rounded-2xl border border-slate-300 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
        >
          <option value="">All Locations Combined</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name}
            </option>
          ))}
        </select>
      </div>

      {/* Top 3 High-Level Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
              Total Parking Sessions
            </span>
            <p className="text-2xl font-black text-slate-900 font-mono mt-1">
              {analytics?.totalSessions || 0}
            </p>
            <span className="text-[11px] text-purple-700 font-semibold">Turnover Velocity</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center">
            <Car className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
              Average Parking Duration
            </span>
            <p className="text-2xl font-black text-blue-600 font-mono mt-1">
              {analytics?.avgDurationFormatted || '0m'}
            </p>
            <span className="text-[11px] text-slate-400">Per Parked Vehicle</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
              Total Revenue Generated
            </span>
            <p className="text-2xl font-black text-emerald-600 font-mono mt-1">
              ₹{Number(analytics?.totalRevenue || 0).toFixed(2)}
            </p>
            <span className="text-[11px] text-emerald-600 font-semibold">Real-Time Collections</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Daily Vehicle Entries vs Exits Chart (Recharts) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">
              Daily Vehicle Flow: Entries vs Exits
            </h3>
            <p className="text-xs text-slate-500">7-day traffic volume comparison</p>
          </div>
          <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-xl border border-purple-200">
            Past 7 Days
          </span>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyTrends} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Line type="monotone" dataKey="entries" name="Vehicle Entries" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="exits" name="Vehicle Exits" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Most & Least Frequently Occupied Slots (Requirement 4.F) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Most Occupied Slots */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                Most Frequently Occupied Slots
              </h3>
              <p className="text-[11px] text-slate-500">Highest vehicle turnover bays</p>
            </div>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mostOccupied} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                <XAxis type="number" stroke="#94a3b8" fontSize={10} />
                <YAxis dataKey="slot_number" type="category" stroke="#94a3b8" fontSize={11} width={45} />
                <Tooltip
                  formatter={(val) => [`${val} times`, 'Occupied Count']}
                  contentStyle={{ borderRadius: '12px', fontSize: '11px' }}
                />
                <Bar dataKey="usage_count" fill="#e11d48" radius={[0, 6, 6, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Least Occupied Slots */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Snowflake className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                Least Frequently Occupied Slots
              </h3>
              <p className="text-[11px] text-slate-500">Underutilized parking bays</p>
            </div>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leastOccupied} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                <XAxis type="number" stroke="#94a3b8" fontSize={10} />
                <YAxis dataKey="slot_number" type="category" stroke="#94a3b8" fontSize={11} width={45} />
                <Tooltip
                  formatter={(val) => [`${val} times`, 'Occupied Count']}
                  contentStyle={{ borderRadius: '12px', fontSize: '11px' }}
                />
                <Bar dataKey="usage_count" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Daily Revenue Velocity */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">
              Daily Revenue Trend (₹)
            </h3>
            <p className="text-xs text-slate-500">7-day gross parking collections</p>
          </div>
        </div>

        <div className="h-60 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyTrends} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `₹${v}`} />
              <Tooltip
                formatter={(val) => [`₹${val}`, 'Daily Revenue']}
                contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
              />
              <Bar dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

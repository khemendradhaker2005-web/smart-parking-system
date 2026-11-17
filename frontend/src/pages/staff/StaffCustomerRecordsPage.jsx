import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  Users,
  Search,
  Phone,
  Mail,
  Car,
  Calendar,
  CreditCard,
  UserCheck,
} from 'lucide-react';

export default function StaffCustomerRecordsPage() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.getCustomerRecords({ search: search.trim() || undefined });
      if (res.success) {
        setCustomers(res.customers || []);
      }
    } catch (err) {
      console.error('Failed to load customer records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Customer Directory & Records
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Registered customer accounts, verified vehicles, lifetime parking sessions, and spending
        </p>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by customer name, mobile number, or email address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-4">Customer Name</th>
                <th className="p-4">Mobile Number</th>
                <th className="p-4">Email Address</th>
                <th className="p-4">Registered Vehicles</th>
                <th className="p-4">Total Completed Sessions</th>
                <th className="p-4">Lifetime Spend</th>
                <th className="p-4">Registered Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No customer records found.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center">
                          {c.full_name?.charAt(0) || 'C'}
                        </div>
                        <span className="font-bold text-slate-900">{c.full_name}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-800">{c.mobile}</td>
                    <td className="p-4 text-slate-600">{c.email}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-0.5 rounded-lg text-slate-700 font-semibold">
                        <Car className="w-3.5 h-3.5 text-slate-400" />
                        {c.vehicles_count} vehicle(s)
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-800">{c.total_sessions} visits</td>
                    <td className="p-4 font-mono font-bold text-emerald-600">
                      ₹{Number(c.lifetime_spent || 0).toFixed(2)}
                    </td>
                    <td className="p-4 text-slate-500">
                      {new Date(c.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

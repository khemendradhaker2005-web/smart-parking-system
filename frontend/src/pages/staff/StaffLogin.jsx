import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, Lock, Phone, ArrowRight, AlertCircle, Sparkles, KeyRound } from 'lucide-react';

export default function StaffLogin({ onNavigate, onSuccess }) {
  const { login, loading } = useAuth();
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      setError('Please enter a valid 10-digit staff mobile number.');
      return;
    }

    if (!password) {
      setError('Staff authorization password is required.');
      return;
    }

    const res = await login(cleanMobile, password, 'staff');
    if (!res.success) {
      setError(res.message || 'Staff authentication failed. Check credentials.');
    } else {
      if (onSuccess) onSuccess();
    }
  };

  const handleAutofill = (staffType) => {
    if (staffType === 'supervisor') {
      setMobile('9876543210');
      setPassword('Password@123');
    } else {
      setMobile('9876543211');
      setPassword('Password@123');
    }
    setError(null);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-tr from-slate-900 via-purple-950 to-slate-900 text-white p-7 text-center relative">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-sm border border-white/20">
            <Shield className="w-6 h-6 text-purple-400" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">
            Authorized Personnel Only
          </span>
          <h2 className="text-2xl font-black tracking-tight mt-0.5">Staff Portal Login</h2>
          <p className="text-xs text-slate-300 mt-1">
            Access gate operations, slot management, and live vehicle sessions
          </p>
        </div>

        {/* Form Body */}
        <div className="p-7 space-y-5">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Demo Staff Quick Select Buttons */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Pre-Seeded Authorized Staff Accounts:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleAutofill('supervisor')}
                className="p-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-left transition"
              >
                <span className="font-bold text-xs text-purple-900 block truncate">Rajesh Sharma</span>
                <span className="text-[10px] text-purple-600 font-mono">Shift Supervisor</span>
              </button>
              <button
                type="button"
                onClick={() => handleAutofill('operator')}
                className="p-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-left transition"
              >
                <span className="font-bold text-xs text-purple-900 block truncate">Pooja Verma</span>
                <span className="text-[10px] text-purple-600 font-mono">Gate Operator</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Staff Mobile Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="Assigned 10-digit number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  required
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Security Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Enter staff password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  required
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-purple-800 hover:bg-purple-900 text-white font-bold text-xs shadow-lg shadow-purple-500/25 transition flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                <span>{loading ? 'Verifying Staff Access...' : 'Authorize & Enter Console'}</span>
              </button>
            </div>
          </form>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center text-[11px] text-slate-500">
            Public staff registration is restricted. Contact system administration for account creation.
          </div>
        </div>
      </div>
    </div>
  );
}

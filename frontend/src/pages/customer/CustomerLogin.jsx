import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Car, Lock, Phone, ArrowRight, AlertCircle, Sparkles, UserCheck } from 'lucide-react';

export default function CustomerLogin({ onNavigate, onSuccess }) {
  const { login, loading } = useAuth();
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!password) {
      setError('Password is required.');
      return;
    }

    const res = await login(cleanMobile, password, 'customer');
    if (!res.success) {
      setError(res.message || 'Login failed. Please verify credentials.');
    } else {
      if (onSuccess) onSuccess();
    }
  };

  const handleDemoAutofill = () => {
    setMobile('9123456780');
    setPassword('Password@123');
    setError(null);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-tr from-brand-600 to-indigo-700 text-white p-7 text-center relative">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
            <Car className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">Customer Login</h2>
          <p className="text-xs text-brand-100 mt-1">
            Access your parking reservations, active sessions, and receipts
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

          {/* Demo Credentials Pill */}
          <button
            type="button"
            onClick={handleDemoAutofill}
            className="w-full py-2.5 px-3 rounded-2xl bg-brand-50 border border-brand-200 text-brand-800 text-xs font-semibold hover:bg-brand-100 transition flex items-center justify-between group"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-brand-600" />
              <span>Click for Demo Customer (Arun Kumar)</span>
            </span>
            <span className="text-[11px] font-mono text-brand-600 group-hover:underline">
              Autofill →
            </span>
          </button>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Registered Mobile Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  required
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  required
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In to Customer Portal'}</span>
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </form>

          <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-600">
            Don't have an account yet?{' '}
            <button
              onClick={() => onNavigate('customer-register')}
              className="font-bold text-brand-600 hover:text-brand-800 transition"
            >
              Register here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

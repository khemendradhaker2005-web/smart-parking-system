import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Car,
  Lock,
  Phone,
  Mail,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

export default function CustomerRegister({ onNavigate, onSuccess }) {
  const { registerCustomer, loading } = useAuth();

  const [formData, setFormData] = useState({
    full_name: '',
    mobile: '',
    email: '',
    vehicle_number: '',
    vehicle_type: 'Four Wheeler / Car',
    make_model: '',
    password: '',
    confirm_password: '',
  });

  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate fields
    if (!formData.full_name.trim()) {
      setError('Full Name is required.');
      return;
    }

    const cleanMobile = formData.mobile.replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      setError('Mobile Number must be a valid 10-digit phone number.');
      return;
    }

    if (!formData.email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }

    if (!formData.vehicle_number.trim()) {
      setError('Vehicle Registration Number (RC) is required.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters in length.');
      return;
    }

    if (formData.password !== formData.confirm_password) {
      setError('Password and Confirm Password do not match.');
      return;
    }

    const res = await registerCustomer({
      ...formData,
      mobile: cleanMobile,
      vehicle_number: formData.vehicle_number.trim().toUpperCase().replace(/\s+/g, ''),
    });

    if (!res.success) {
      setError(res.message || 'Registration failed.');
    } else {
      if (onSuccess) onSuccess();
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-tr from-brand-600 to-indigo-700 text-white p-6 sm:p-7 text-center">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
            <Car className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">Customer Registration</h2>
          <p className="text-xs text-brand-100 mt-1">
            One-time registration for seamless parking reservations and contactless gate access
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-7 space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="full_name"
                  placeholder="e.g. Arun Kumar"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  required
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            {/* Mobile & Email Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    maxLength={10}
                    name="mobile"
                    placeholder="10-digit number"
                    value={formData.mobile}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    required
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    placeholder="name@domain.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    required
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>
            </div>

            {/* Vehicle Details */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Primary Vehicle Information
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Vehicle RC Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="vehicle_number"
                    placeholder="e.g. KA01AB1234"
                    value={formData.vehicle_number}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono font-bold uppercase tracking-wider focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Make / Model (Optional)
                  </label>
                  <input
                    type="text"
                    name="make_model"
                    placeholder="e.g. Honda City White"
                    value={formData.make_model}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Password & Confirm Password Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    name="password"
                    placeholder="Min 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    required
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    name="confirm_password"
                    placeholder="Re-enter password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    required
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Creating Account...' : 'Complete Customer Registration'}</span>
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </form>

          <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-600">
            Already registered?{' '}
            <button
              onClick={() => onNavigate('customer-login')}
              className="font-bold text-brand-600 hover:text-brand-800 transition"
            >
              Sign In here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

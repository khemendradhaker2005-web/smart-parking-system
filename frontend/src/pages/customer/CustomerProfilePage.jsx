import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  User,
  Phone,
  Mail,
  Car,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Star,
} from 'lucide-react';

export default function CustomerProfilePage() {
  const { user, vehicles, refreshProfile } = useAuth();

  const [newVehicleNumber, setNewVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('Four Wheeler / Car');
  const [makeModel, setMakeModel] = useState('');
  const [setAsPrimary, setSetAsPrimary] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!newVehicleNumber.trim()) {
      setError('Vehicle Registration Number is required.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.addVehicle({
        vehicle_number: newVehicleNumber.trim().toUpperCase().replace(/\s+/g, ''),
        vehicle_type: vehicleType,
        make_model: makeModel.trim(),
        set_as_primary: setAsPrimary,
      });

      if (res.success) {
        setSuccess('New vehicle registered successfully!');
        setNewVehicleNumber('');
        setMakeModel('');
        refreshProfile();
      }
    } catch (err) {
      setError(err.message || 'Failed to add vehicle.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVehicle = async (vehicleId) => {
    if (!window.confirm('Are you sure you want to remove this vehicle?')) return;
    try {
      await api.deleteVehicle(vehicleId);
      refreshProfile();
    } catch (err) {
      alert(err.message || 'Failed to remove vehicle');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Customer Profile & Vehicles
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your account details and registered vehicle registration numbers
        </p>
      </div>

      {/* Account Info Box */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-lg">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900">{user?.full_name}</h3>
            <span className="text-xs text-brand-600 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Verified Customer Account
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            <span className="text-slate-400 font-bold uppercase text-[10px] block">Mobile Number</span>
            <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">{user?.mobile}</span>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            <span className="text-slate-400 font-bold uppercase text-[10px] block">Email Address</span>
            <span className="font-semibold text-slate-900 text-sm mt-0.5 block">{user?.email}</span>
          </div>
        </div>
      </div>

      {/* Registered Vehicles List */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
        <div>
          <h3 className="font-extrabold text-base text-slate-900">Registered Vehicles ({vehicles.length})</h3>
          <p className="text-xs text-slate-500">
            Vehicles available for instantaneous one-click slot booking and barrier entry
          </p>
        </div>

        <div className="space-y-3">
          {vehicles.map((v) => (
            <div
              key={v.id}
              className={`p-4 rounded-2xl border flex items-center justify-between transition ${
                v.is_primary
                  ? 'bg-brand-50/40 border-brand-200'
                  : 'bg-slate-50 border-slate-200/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    v.is_primary ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm text-slate-900">
                      {v.vehicle_number}
                    </span>
                    {v.is_primary ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-100 text-brand-700 border border-brand-200 flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 fill-brand-600" />
                        Primary
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {v.make_model || v.vehicle_type}
                  </p>
                </div>
              </div>

              {!v.is_primary && (
                <button
                  onClick={() => handleDeleteVehicle(v.id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="Remove Vehicle"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add New Vehicle Form */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
            Register Another Vehicle
          </h4>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleAddVehicle} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Vehicle RC Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. KA05XY8888"
                  value={newVehicleNumber}
                  onChange={(e) => setNewVehicleNumber(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Make / Model
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tata Nexon EV"
                  value={makeModel}
                  onChange={(e) => setMakeModel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="makePrimary"
                checked={setAsPrimary}
                onChange={(e) => setSetAsPrimary(e.target.checked)}
                className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
              />
              <label htmlFor="makePrimary" className="text-xs text-slate-600 font-medium">
                Set as my default primary vehicle for fast booking
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="py-2.5 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>{loading ? 'Adding...' : 'Add Vehicle'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

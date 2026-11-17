import React, { useState } from 'react';
import { api } from '../../services/api';
import { QRCodeSVG } from 'qrcode.react';
import ReceiptModal from '../common/ReceiptModal';
import {
  X,
  Car,
  Clock,
  CreditCard,
  QrCode,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Banknote,
  Smartphone,
  ChevronDown,
} from 'lucide-react';

export default function StaffExitModal({ session, onClose, onExitComplete }) {
  if (!session) return null;

  const [activeTab, setActiveTab] = useState('payment'); // 'payment' or 'override'
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [overrideReason, setOverrideReason] = useState('');
  const [waiveAmount, setWaiveAmount] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [receipt, setReceipt] = useState(null);

  // Billing calculation
  const amount = session.current_charges || session.total_amount || 20.0;
  const vpa = 'smartparking@icici';
  const upiUrl = `upi://pay?pa=${vpa}&pn=SmartParking&am=${amount.toFixed(2)}&cu=INR&tn=Gate_Exit_${session.session_code}`;

  const handleCollectPayment = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.verifyPayment({
        session_id: session.id,
        payment_method: paymentMethod,
        notes: `Collected at Gate by Staff via ${paymentMethod}`,
      });

      if (res.success) {
        setReceipt(res.receipt);
        if (onExitComplete) onExitComplete(res.receipt);
      }
    } catch (err) {
      setError(err.message || 'Failed to verify payment and release slot.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualOverride = async () => {
    if (!overrideReason.trim()) {
      setError('A comprehensive reason for manual override is strictly required for audit logs.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.manualOverrideExit({
        session_id: session.id,
        reason: overrideReason.trim(),
        waived_amount: waiveAmount,
      });

      if (res.success) {
        if (onExitComplete) onExitComplete();
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to process manual override.');
    } finally {
      setLoading(false);
    }
  };

  if (receipt) {
    return (
      <ReceiptModal
        receipt={receipt}
        onClose={() => {
          setReceipt(null);
          onClose();
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <span className="text-[10px] uppercase font-bold tracking-wider text-purple-300">
            Gate Checkout & Slot Release
          </span>
          <h3 className="text-xl font-extrabold tracking-tight mt-0.5">
            Vehicle Exit Processing
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            Session: <span className="font-mono font-bold text-white">{session.session_code}</span>
          </p>
        </div>

        {/* Tab switcher: Normal Checkout vs Manual Override */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={() => setActiveTab('payment')}
            className={`flex-1 py-3 text-xs font-bold border-b-2 transition ${
              activeTab === 'payment'
                ? 'border-purple-600 text-purple-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Gate Payment Collection
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('override')}
            className={`flex-1 py-3 text-xs font-bold border-b-2 transition flex items-center justify-center gap-1.5 ${
              activeTab === 'override'
                ? 'border-amber-500 text-amber-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            Manual Override / Dispute
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Session Overview Box */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Vehicle Number:</span>
              <span className="font-mono font-extrabold text-sm text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                {session.vehicle_number}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Customer Name / Mobile:</span>
              <span className="font-semibold text-slate-800">
                {session.customer_name || 'Guest'} {session.customer_mobile ? `(${session.customer_mobile})` : ''}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Slot Occupied:</span>
              <span className="font-mono font-bold text-purple-700">{session.slot_number}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Entry Time:</span>
              <span className="font-mono text-slate-700">
                {new Date(session.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Total Duration:</span>
              <span className="font-bold text-slate-900">
                {session.live_duration_formatted || `${session.duration_minutes || 0} mins`}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center font-bold text-slate-900 text-sm">
              <span>Payable Amount (₹20/hr):</span>
              <span className="text-xl font-black text-purple-700 font-mono">
                ₹{Number(amount).toFixed(2)}
              </span>
            </div>
          </div>

          {activeTab === 'payment' ? (
            /* Gate Payment Flow */
            <div className="space-y-4">
              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Collection Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Cash', label: 'Cash at Gate', icon: Banknote },
                    { id: 'UPI', label: 'UPI QR Scan', icon: Smartphone },
                    { id: 'Card', label: 'Card POS', icon: CreditCard },
                  ].map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id)}
                        className={`py-2.5 px-3 rounded-2xl text-xs font-bold border transition flex flex-col items-center gap-1 ${
                          paymentMethod === m.id
                            ? 'bg-purple-50 text-purple-700 border-purple-400 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* UPI QR Display if UPI selected */}
              {paymentMethod === 'UPI' && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
                  <div className="p-2 bg-white rounded-xl border border-slate-200 inline-block shadow-sm">
                    <QRCodeSVG value={upiUrl} size={130} level="M" />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Show QR to customer or scan at exit kiosk
                  </p>
                </div>
              )}

              {/* Confirm Button */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleCollectPayment}
                  className="flex-1 py-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-lg shadow-purple-500/25 transition flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{loading ? 'Processing...' : `Confirm Payment & Release Slot`}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Manual Override View */
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-800">
                <p className="font-bold flex items-center gap-1 mb-1">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  Audit Logged Operation
                </p>
                <p>
                  Every manual override is permanently recorded in the system audit trail with your staff ID and timestamp.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Reason for Manual Exit Override <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. System glitch / Emergency medical departure / Billing dispute verified by supervisor"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="waiveFee"
                  checked={waiveAmount}
                  onChange={(e) => setWaiveAmount(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <label htmlFor="waiveFee" className="text-xs text-slate-700 font-medium">
                  Waive fee (Record as ₹0.00 authorized exception)
                </label>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleManualOverride}
                  className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-lg shadow-amber-500/25 transition"
                >
                  {loading ? 'Logging Override...' : 'Execute Manual Override'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../../services/api';
import ReceiptModal from '../common/ReceiptModal';
import {
  X,
  CreditCard,
  QrCode,
  ShieldCheck,
  Clock,
  Car,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';

export default function CustomerPaymentModal({ session, onClose, onPaymentComplete }) {
  if (!session) return null;

  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [receipt, setReceipt] = useState(null);

  const amount = session.calculated_amount || session.total_amount || 20.0;
  const vpa = 'smartparking@icici';
  const upiUrl = `upi://pay?pa=${vpa}&pn=SmartParking&am=${amount.toFixed(2)}&cu=INR&tn=Parking_${session.session_code}`;

  const copyVpa = () => {
    navigator.clipboard.writeText(vpa);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerifyPayment = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.processPayment({
        session_id: session.id,
        payment_method: paymentMethod,
        transaction_id: `UPI-ONLINE-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      });

      if (res.success) {
        setReceipt(res.receipt);
        if (onPaymentComplete) onPaymentComplete(res.receipt);
      }
    } catch (err) {
      setError(err.message || 'Payment verification failed. Please try again.');
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
        <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <span className="text-[10px] uppercase font-bold tracking-wider text-brand-300">
            Checkout & E-Payment
          </span>
          <h3 className="text-xl font-extrabold tracking-tight mt-0.5">
            Parking Exit Fee Payment
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            Scan UPI QR Code to complete checkout and release slot.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Session Breakdown Details */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-slate-400" />
                Vehicle Number:
              </span>
              <span className="font-mono font-bold text-slate-900">{session.vehicle_number}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Location & Slot:
              </span>
              <span className="font-semibold text-slate-800">
                {session.parking_name} ({session.slot_number})
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Duration Ticked:
              </span>
              <span className="font-bold text-slate-900">
                {session.current_duration_formatted || `${session.duration_minutes || 0} mins`}
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-500">
              <span>Billing Rate:</span>
              <span>₹20 per hour (partial hours charged full)</span>
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-between items-center font-bold text-slate-900 text-sm">
              <span>Total Payable Amount:</span>
              <span className="text-xl font-black text-brand-600 font-mono">
                ₹{Number(amount).toFixed(2)}
              </span>
            </div>
          </div>

          {/* UPI Dynamic QR Code Box */}
          <div className="p-5 bg-gradient-to-b from-slate-50 to-white rounded-3xl border border-slate-200 text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <QrCode className="w-4 h-4 text-brand-600" />
              <span>Dynamic UPI QR Code</span>
            </div>

            <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-md inline-block mx-auto">
              {session.payment_qr?.qrDataUrl ? (
                <img
                  src={session.payment_qr.qrDataUrl}
                  alt="UPI QR Code"
                  className="w-48 h-48 mx-auto"
                />
              ) : (
                <QRCodeSVG
                  value={upiUrl}
                  size={192}
                  level="M"
                  includeMargin={true}
                />
              )}
            </div>

            <div className="flex items-center justify-center gap-2 text-xs">
              <span className="text-slate-500">UPI VPA:</span>
              <span className="font-mono font-bold text-slate-800">{vpa}</span>
              <button
                type="button"
                onClick={copyVpa}
                className="p-1 text-slate-400 hover:text-brand-600 transition"
                title="Copy UPI ID"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <p className="text-[11px] text-slate-400">
              Compatible with Google Pay, PhonePe, Paytm, BHIM, or any UPI banking app.
            </p>
          </div>

          {/* Payment Simulation Notice per requirements */}
          <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200/80 text-[11px] text-amber-800 space-y-1">
            <p className="font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              Demo Payment Verification Mode
            </p>
            <p className="text-amber-700">
              In this live sandbox demonstration, clicking below simulates real-time gateway webhook confirmation, updates database records to completed, and generates an official digital tax receipt.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
            >
              Pay Later at Gate
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleVerifyPayment}
              className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 transition flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>{loading ? 'Verifying Payment...' : `Verify & Pay ₹${Number(amount).toFixed(2)}`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

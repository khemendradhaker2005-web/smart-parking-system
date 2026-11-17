import React from 'react';
import { CheckCircle2, Printer, X, ShieldCheck, MapPin, Car, Clock, CreditCard } from 'lucide-react';

export default function ReceiptModal({ receipt, onClose }) {
  if (!receipt) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-6 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full bg-white/20 hover:bg-white/30 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>

          <h3 className="text-xl font-extrabold tracking-tight">Payment Verified!</h3>
          <p className="text-emerald-100 text-sm mt-1">Thank you for using Smart Parking!</p>
        </div>

        {/* Printable Receipt Body */}
        <div className="p-6 space-y-5" id="printable-receipt">
          <div className="flex justify-between items-center border-b border-dashed border-slate-200 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Receipt No</span>
              <p className="font-mono font-bold text-xs text-slate-800">{receipt.receiptNumber}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Date & Time</span>
              <p className="font-mono text-xs text-slate-700">
                {new Date(receipt.paidAt || Date.now()).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          {/* Details Table */}
          <div className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-100">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-slate-400" />
                Vehicle Number
              </span>
              <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                {receipt.vehicleNumber}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Parking Location
              </span>
              <span className="font-semibold text-slate-900 text-right max-w-[180px] truncate">
                {receipt.parkingName || 'ParkSmart Plaza'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Allocated Slot</span>
              <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {receipt.slotNumber}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Total Duration
              </span>
              <span className="font-semibold text-slate-900">
                {receipt.durationFormatted || `${receipt.durationMinutes || 0} mins`}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Billing Rule</span>
              <span className="text-slate-600">
                {receipt.billedHours || 1} hr(s) @ ₹{receipt.hourlyRate || 20}/hr
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                Payment Method
              </span>
              <span className="font-medium text-slate-900">
                {receipt.paymentMethod || 'UPI (Verified)'}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm">Total Paid</span>
              <span className="text-xl font-extrabold text-emerald-600 font-mono">
                ₹{Number(receipt.amount).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Digital E-Receipt • Verified by ParkSmart Engine</span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => window.print()}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-medium text-xs hover:bg-slate-50 transition flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ShieldCheck, 
  Smartphone, 
  Copy, 
  Check, 
  ArrowRight,
  ExternalLink,
  X
} from 'lucide-react';
import { buildUpiUri, generateQrDataUrl, formatCurrency } from '../../lib/upi';
import { useStore } from '../../context/StoreContext';
import { api } from '../../lib/api';
import confetti from 'canvas-confetti';

export default function UpiPaymentModal({ 
  isOpen, 
  onClose, 
  order, 
  onPaymentSuccess 
}) {
  const { settings } = useStore();
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [upiUri, setUpiUri] = useState('');

  const merchantUpiId = settings.merchantUpiId || 'smartkirana@okhdfcbank';
  const merchantName = settings.merchantName || 'Smart Kirana Store';
  const payableAmount = order?.bill?.total || 0;

  useEffect(() => {
    if (!order) return;

    const uri = buildUpiUri({
      vpa: merchantUpiId,
      name: merchantName,
      amount: payableAmount,
      orderId: order.id,
      note: `Smart Kirana Order ${order.id}`
    });
    setUpiUri(uri);

    generateQrDataUrl(uri).then(dataUrl => {
      setQrDataUrl(dataUrl);
    });
  }, [order, merchantUpiId, merchantName, payableAmount]);

  if (!isOpen || !order) return null;

  const handleCopyVpa = () => {
    navigator.clipboard.writeText(merchantUpiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simulated Test Bank Verification (via secure backend verification endpoint)
  const handleSimulatePayment = async () => {
    setIsVerifying(true);
    const res = await api.verifyTestPayment(order.id);
    setIsVerifying(false);

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // confetti fallback
    }

    const ref = res.paymentRef || `UPI-SIM-${Math.floor(100000 + Math.random() * 900000)}`;
    onPaymentSuccess(order.id, ref);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[95vh] overflow-y-auto shadow-elevated border border-slate-100 p-5 sm:p-7 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-kirana-50 text-kirana-700 flex items-center justify-center font-bold">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">Scan & Pay via UPI</h3>
              <p className="text-xs text-slate-500">Order Ref: <span className="font-mono font-bold text-slate-800">{order.id}</span></p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Payable Amount Highlight */}
        <div className="my-4 p-4 rounded-2xl bg-gradient-to-r from-kirana-600 to-kirana-700 text-white text-center shadow-md">
          <span className="text-xs uppercase tracking-wider font-semibold opacity-90 block">
            Exact Amount to Pay
          </span>
          <span className="text-3xl font-black tracking-tight mt-0.5 block">
            {formatCurrency(payableAmount)}
          </span>
          <span className="text-[11px] opacity-80 mt-1 block">
            Payee: {merchantName} ({merchantUpiId})
          </span>
        </div>

        {/* QR Code Container */}
        <div className="text-center my-4">
          <div className="qr-container border border-slate-100 shadow-md">
            {qrDataUrl ? (
              <img 
                src={qrDataUrl} 
                alt="UPI Payment QR Code" 
                className="w-56 h-56 mx-auto rounded-xl"
              />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center bg-slate-50 text-slate-400 text-xs">
                Generating QR Code...
              </div>
            )}
          </div>

          {/* Supported Apps Badges */}
          <div className="mt-3 flex items-center justify-center gap-1.5 flex-wrap text-[10px] font-bold text-slate-600">
            <span className="bg-slate-100 px-2 py-0.5 rounded-md">Google Pay</span>
            <span className="bg-slate-100 px-2 py-0.5 rounded-md">PhonePe</span>
            <span className="bg-slate-100 px-2 py-0.5 rounded-md">Paytm</span>
            <span className="bg-slate-100 px-2 py-0.5 rounded-md">BHIM</span>
            <span className="bg-slate-100 px-2 py-0.5 rounded-md">Cred</span>
          </div>
        </div>

        {/* Mobile Deep Link (for users opening on phone) */}
        <div className="my-3">
          <a
            href={upiUri}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <Smartphone className="w-4 h-4" />
            <span>Open in Installed UPI App</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </a>
        </div>

        {/* Merchant VPA copy field */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs my-3">
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Store UPI ID (VPA)</span>
            <span className="font-mono font-bold text-slate-800">{merchantUpiId}</span>
          </div>
          <button
            onClick={handleCopyVpa}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold text-xs transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-kirana-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Security & Verification Guidelines Banner */}
        <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/70 text-xs text-amber-900 space-y-1.5 my-3">
          <div className="flex items-center gap-2 font-bold text-amber-950">
            <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Safe & Verified Payments Policy</span>
          </div>
          <p className="text-[11px] leading-relaxed text-amber-800">
            Never share your UPI PIN with anyone. Smart Kirana will never request your PIN or send payment requests via call.
          </p>
          <p className="text-[11px] text-amber-700 font-medium border-t border-amber-200/60 pt-1">
            <strong>For Live Production:</strong> Orders are verified server-side with gateway webhooks (e.g. Razorpay/Cashfree).
          </p>
        </div>

        {/* Test Simulator Action */}
        <div className="pt-2">
          <button
            onClick={handleSimulatePayment}
            disabled={isVerifying}
            className="w-full py-3.5 bg-kirana-600 hover:bg-kirana-700 active:scale-[0.99] text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-elevated flex items-center justify-center gap-2 transition-all disabled:opacity-60"
          >
            {isVerifying ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Verifying payment with bank...</span>
              </div>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-amber-300" />
                <span>Simulate Bank UPI Approval (Demo Mode)</span>
              </>
            )}
          </button>
          <p className="text-center text-[10px] text-slate-400 mt-2">
            Clicking above verifies test payment and launches live order tracking.
          </p>
        </div>

      </div>
    </div>
  );
}

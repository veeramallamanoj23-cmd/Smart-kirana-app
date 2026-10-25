import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, Key, ShieldCheck, X, CheckCircle2, ArrowRight, AlertCircle, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AuthModal({ isOpen, onClose, onAdminSuccess }) {
  const { customer, requestOtp, verifyOtp, logoutCustomer, isAdmin, loginAdmin, logoutAdmin } = useAuth();
  
  const [activeTab, setActiveTab] = useState('customer'); // 'customer' or 'admin'
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [adminError, setAdminError] = useState('');
  
  // Real OTP State
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [devOtp, setDevOtp] = useState('');

  // Cooldown countdown timer
  useEffect(() => {
    let timer = null;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  if (!isOpen) return null;

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setOtpError('');
    setIsSubmitting(true);

    const res = await requestOtp(phone);
    setIsSubmitting(false);

    if (res.success) {
      setOtpSent(true);
      setMaskedPhone(res.maskedPhone || phone);
      setCooldown(res.cooldownSeconds || 60);
      if (res.devOtp) {
        setDevOtp(res.devOtp);
      }
    } else {
      setOtpError(res.message || 'Failed to send OTP.');
      if (res.cooldownRemaining) {
        setCooldown(res.cooldownRemaining);
      }
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setOtpError('');
    setIsSubmitting(true);

    const res = await verifyOtp(phone, otpCode, name);
    setIsSubmitting(false);

    if (res.success) {
      setOtpSent(false);
      setOtpCode('');
      setDevOtp('');
      onClose();
    } else {
      setOtpError(res.message || 'Invalid OTP entered.');
    }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setAdminError('');
    setIsSubmitting(true);

    const result = await loginAdmin(adminEmail, adminPass);
    setIsSubmitting(false);

    if (result.success) {
      onClose();
      if (onAdminSuccess) onAdminSuccess();
    } else {
      setAdminError(result.message || 'Invalid admin credentials');
    }
  };

  const handleFillDemoAdmin = () => {
    setAdminEmail('admin@smartkirana.store');
    setAdminPass('kirana2026admin');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-elevated border border-slate-100 p-6 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-kirana-100 text-kirana-700 flex items-center justify-center font-bold">
              {activeTab === 'customer' ? <User className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {activeTab === 'customer' ? 'Customer Account' : 'Store Admin Portal'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {activeTab === 'customer' ? 'Secure mobile OTP login' : 'Authorized store management only'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex bg-slate-100 p-1 rounded-2xl my-4 text-xs font-semibold">
          <button
            onClick={() => {
              setActiveTab('customer');
              setOtpError('');
            }}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeTab === 'customer' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Customer Login
          </button>
          <button
            onClick={() => {
              setActiveTab('admin');
              setAdminError('');
            }}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeTab === 'admin' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Admin Sign In
          </button>
        </div>

        {activeTab === 'customer' ? (
          <div>
            {customer?.isLoggedIn ? (
              <div className="py-2 text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-kirana-100 text-kirana-700 flex items-center justify-center text-2xl font-bold">
                  {customer.name ? customer.name.charAt(0).toUpperCase() : 'C'}
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-lg">{customer.name || 'Smart Kirana Shopper'}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">+91 {customer.phone}</p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex gap-2">
                  <button
                    onClick={onClose}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                  >
                    Continue Shopping
                  </button>
                  <button
                    onClick={() => {
                      logoutCustomer();
                      onClose();
                    }}
                    className="py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : !otpSent ? (
              /* Step 1: Phone Input & Send OTP */
              <form onSubmit={handleRequestOtp} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full mt-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-kirana-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Mobile Number (10 digits)</label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="9876543210"
                      className="w-full pl-12 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-kirana-500 font-medium"
                    />
                  </div>
                </div>

                {otpError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{otpError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || phone.length < 10}
                  className="w-full mt-4 py-3 bg-kirana-600 hover:bg-kirana-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <span>{isSubmitting ? 'Sending...' : 'Send OTP via SMS'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              /* Step 2: Real OTP Verification */
              <form onSubmit={handleVerifyOtp} className="space-y-3.5">
                <div className="p-3 bg-kirana-50 border border-kirana-200 rounded-xl text-xs text-kirana-900">
                  <p className="font-semibold">
                    Verification code generated for <strong>+91 {maskedPhone}</strong>
                  </p>
                  <p className="text-[11px] text-kirana-700 mt-0.5">
                    Enter the 6-digit cryptographic security code. Valid for 5 minutes.
                  </p>
                </div>

                {devOtp && (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-950 shadow-sm animate-in fade-in duration-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5 text-amber-900">
                        <ShieldCheck className="w-4 h-4 text-amber-600" />
                        Demo Mode / No Carrier Gateway Key
                      </span>
                      <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                        Dev Preview
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      Physical cellular SMS requires a telecom SMS provider API key (Fast2SMS or Twilio). For instant testing, your server-generated cryptographic OTP is:
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="font-mono text-xl font-black tracking-widest text-slate-900 bg-white px-3 py-1 rounded-xl border border-amber-300 shadow-inner">
                        {devOtp}
                      </span>
                      <button
                        type="button"
                        onClick={() => setOtpCode(devOtp)}
                        className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                      >
                        Auto-fill OTP
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-700">Enter 6-Digit OTP</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className="w-full mt-1 px-3.5 py-3 text-base text-center tracking-widest bg-slate-50 border border-slate-200 rounded-xl font-mono font-black focus:bg-white focus:ring-2 focus:ring-kirana-500"
                  />
                </div>

                {otpError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{otpError}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtpError('');
                      setDevOtp('');
                    }}
                    className="text-slate-500 hover:text-slate-700 underline"
                  >
                    Change Number
                  </button>

                  {cooldown > 0 ? (
                    <span className="text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5" /> Resend in {cooldown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRequestOtp}
                      className="text-kirana-600 font-bold hover:underline"
                    >
                      Resend Code
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || otpCode.length !== 6}
                  className="w-full mt-3 py-3 bg-kirana-600 hover:bg-kirana-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <span>{isSubmitting ? 'Verifying...' : 'Verify & Continue'}</span>
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        ) : (
          /* Admin Login Form */
          <div>
            {isAdmin ? (
              <div className="py-3 text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">Store Administrator Active</h4>
                  <p className="text-xs text-slate-500 mt-1">Authenticated with secure PBKDF2 credentials.</p>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      onClose();
                      if (onAdminSuccess) onAdminSuccess();
                    }}
                    className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-sm"
                  >
                    Go to Admin Dashboard
                  </button>
                  <button
                    onClick={logoutAdmin}
                    className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                  >
                    Logout Admin
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAdminSubmit} className="space-y-3.5">
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/60 text-xs text-amber-900">
                  <p className="font-bold">Store Admin Access:</p>
                  <p className="font-mono text-[11px] text-amber-800 mt-1">
                    Email: admin@smartkirana.store<br />
                    Password: kirana2026admin
                  </p>
                  <button
                    type="button"
                    onClick={handleFillDemoAdmin}
                    className="mt-2 text-[11px] text-amber-700 underline font-bold hover:text-amber-900"
                  >
                    Click to Auto-fill Demo Credentials
                  </button>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Admin Email</label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={e => setAdminEmail(e.target.value)}
                    placeholder="admin@smartkirana.store"
                    className="w-full mt-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Password</label>
                  <input
                    type="password"
                    required
                    value={adminPass}
                    onChange={e => setAdminPass(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full mt-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {adminError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{adminError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-4 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isSubmitting ? 'Verifying Credentials...' : 'Authenticate as Administrator'}</span>
                </button>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

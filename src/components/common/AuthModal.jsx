import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, Key, ShieldCheck, X, CheckCircle2, ArrowRight, AlertCircle, Clock, MessageCircle, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AuthModal({ isOpen, onClose, onAdminSuccess, promptMessage }) {
  const { customer, requestOtp, verifyOtp, logoutCustomer, isAdmin, loginAdmin, logoutAdmin } = useAuth();
  
  const [activeTab, setActiveTab] = useState('customer'); // 'customer' or 'admin'
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('91');
  const [name, setName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [adminError, setAdminError] = useState('');
  
  // Real OTP State
  const [otpSent, setOtpSent] = useState(false);
  const [otpChannel, setOtpChannel] = useState('whatsapp'); // 'whatsapp' or 'sms'
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleRequestOtp = async (channelToUse = 'whatsapp') => {
    setOtpError('');
    setIsSubmitting(true);
    setOtpChannel(channelToUse);

    const res = await requestOtp(phone, channelToUse, countryCode);
    setIsSubmitting(false);

    if (res.success) {
      setOtpSent(true);
      setMaskedPhone(res.maskedPhone || phone);
      setCooldown(res.cooldownSeconds || 60);
    } else {
      setOtpError(res.message || `Failed to send OTP via ${channelToUse === 'whatsapp' ? 'WhatsApp' : 'SMS'}.`);
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
      onClose();
    } else {
      setOtpError(res.message || 'Invalid or expired OTP code entered.');
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
              <div>
                {promptMessage && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200/90 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-950 mb-3.5 animate-in fade-in">
                    <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black flex-shrink-0 text-sm shadow-xs">
                      ⚡
                    </div>
                    <div>
                      <p className="font-extrabold text-emerald-950 leading-tight">Instant Mobile Login</p>
                      <p className="text-[11px] text-emerald-800 leading-snug mt-0.5">{promptMessage}</p>
                    </div>
                  </div>
                )}
                <form onSubmit={(e) => { e.preventDefault(); handleRequestOtp(otpChannel); }} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Full Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Priya Sharma"
                      className="w-full mt-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-kirana-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">Mobile Number & Country Code</label>
                    <div className="flex gap-2 mt-1">
                      <select
                        value={countryCode}
                        onChange={e => setCountryCode(e.target.value)}
                        className="px-2.5 py-2.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-kirana-500 text-slate-800"
                      >
                        <option value="91">🇮🇳 +91</option>
                        <option value="1">🇺🇸 +1</option>
                        <option value="44">🇬🇧 +44</option>
                        <option value="971">🇦🇪 +971</option>
                        <option value="65">🇸🇬 +65</option>
                        <option value="61">🇦🇺 +61</option>
                      </select>

                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={phone}
                        onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="9876543210"
                        className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-kirana-500 font-medium"
                      />
                    </div>
                  </div>

                  {otpError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{otpError}</span>
                    </div>
                  )}

                  {/* Channel Selection Buttons */}
                  <div className="pt-2 space-y-2.5">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">
                      Choose Your OTP Channel
                    </p>

                    <button
                      type="button"
                      disabled={isSubmitting || phone.length < 10}
                      onClick={() => handleRequestOtp('whatsapp')}
                      className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2.5 group"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-200 fill-emerald-200" />
                      <span>{isSubmitting && otpChannel === 'whatsapp' ? 'Sending via WhatsApp...' : 'Receive OTP via WhatsApp'}</span>
                      <span className="text-[10px] bg-emerald-500/80 px-2 py-0.5 rounded-full font-semibold">Fast</span>
                    </button>

                    <button
                      type="button"
                      disabled={isSubmitting || phone.length < 10}
                      onClick={() => handleRequestOtp('sms')}
                      className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 active:scale-[0.99] disabled:opacity-50 text-slate-800 font-bold text-xs sm:text-sm rounded-2xl border border-slate-200 transition-all flex items-center justify-center gap-2.5"
                    >
                      <MessageSquare className="w-4 h-4 text-slate-600" />
                      <span>{isSubmitting && otpChannel === 'sms' ? 'Sending via SMS...' : 'Receive OTP via SMS'}</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* Step 2: Real OTP Verification */
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="p-3.5 bg-kirana-50 border border-kirana-200 rounded-2xl text-xs text-kirana-950">
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                      {otpChannel === 'whatsapp' ? (
                        <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-600 inline" />
                      ) : (
                        <MessageSquare className="w-4 h-4 text-kirana-600 inline" />
                      )}
                      Sent via {otpChannel === 'whatsapp' ? 'WhatsApp' : 'Cellular SMS'}
                    </span>
                    <span className="font-mono text-slate-900">+91 {maskedPhone}</span>
                  </div>
                  <p className="text-[11px] text-kirana-800 mt-1">
                    Enter the 6-digit cryptographic security code delivered to your phone. Code expires in 5 minutes.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Enter 6-Digit Verification Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className="w-full mt-1 px-3.5 py-3 text-lg text-center tracking-widest bg-slate-50 border border-slate-200 rounded-2xl font-mono font-black focus:bg-white focus:ring-2 focus:ring-kirana-500"
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
                      setOtpCode('');
                    }}
                    className="text-slate-500 hover:text-slate-800 underline font-medium"
                  >
                    Change Number
                  </button>

                  {cooldown > 0 ? (
                    <span className="text-slate-400 flex items-center gap-1 font-mono font-medium">
                      <Clock className="w-3.5 h-3.5" /> Resend in {cooldown}s
                    </span>
                  ) : (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleRequestOtp('whatsapp')}
                        className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
                      >
                        WhatsApp
                      </button>
                      <span className="text-slate-300">•</span>
                      <button
                        type="button"
                        onClick={() => handleRequestOtp('sms')}
                        className="text-kirana-700 font-bold hover:underline flex items-center gap-1"
                      >
                        SMS
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || otpCode.length !== 6}
                  className="w-full mt-3 py-3.5 bg-kirana-600 hover:bg-kirana-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <span>{isSubmitting ? 'Verifying Code...' : 'Verify OTP & Continue'}</span>
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
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <ShieldCheck className="w-4 h-4 text-kirana-600" />
                    <span>Store Management Portal</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Sign in with authorized administrator credentials to manage catalog pricing, live orders, and dispatch operations.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Admin Email or Store Phone</label>
                  <input
                    type="text"
                    required
                    value={adminEmail}
                    onChange={e => setAdminEmail(e.target.value)}
                    placeholder="admin@smartkirana.store or 9392398990"
                    className="w-full mt-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Store administrator accounts are created and provisioned exclusively by authorized store managers.
                  </p>
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

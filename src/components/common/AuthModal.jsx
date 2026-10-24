import React, { useState } from 'react';
import { User, Phone, Mail, Key, ShieldCheck, X, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth, ADMIN_CREDENTIALS } from '../../context/AuthContext';

export default function AuthModal({ isOpen, onClose, onAdminSuccess }) {
  const { customer, loginCustomer, logoutCustomer, isAdmin, loginAdmin, logoutAdmin } = useAuth();
  
  const [activeTab, setActiveTab] = useState('customer'); // 'customer' or 'admin'
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [adminError, setAdminError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  if (!isOpen) return null;

  const handleCustomerSubmit = (e) => {
    e.preventDefault();
    if (!otpSent) {
      if (phone.length < 10) {
        alert('Please enter a valid 10-digit mobile number');
        return;
      }
      setOtpSent(true);
    } else {
      // Complete mock OTP login
      loginCustomer({
        name: name.trim() || 'Valued Customer',
        phone: phone.trim(),
        email: `${phone}@smartkirana.customer`
      });
      setOtpSent(false);
      onClose();
    }
  };

  const handleAdminSubmit = (e) => {
    e.preventDefault();
    const result = loginAdmin(adminEmail, adminPass);
    if (result.success) {
      setAdminError('');
      onClose();
      if (onAdminSuccess) onAdminSuccess();
    } else {
      setAdminError(result.message);
    }
  };

  const handleFillDemoAdmin = () => {
    setAdminEmail(ADMIN_CREDENTIALS.email);
    setAdminPass(ADMIN_CREDENTIALS.password);
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
                {activeTab === 'customer' ? 'Manage orders & delivery addresses' : 'Store inventory & order management'}
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
            onClick={() => setActiveTab('customer')}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeTab === 'customer' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Customer Login
          </button>
          <button
            onClick={() => setActiveTab('admin')}
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
                  <p className="text-xs text-slate-400">{customer.email}</p>
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
            ) : (
              <form onSubmit={handleCustomerSubmit} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700">Your Full Name</label>
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

                {otpSent && (
                  <div className="p-3 bg-kirana-50 border border-kirana-200 rounded-xl space-y-2">
                    <p className="text-[11px] text-kirana-800 font-medium">
                      Demo OTP sent! Enter <strong>1234</strong> to verify:
                    </p>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={e => setOtpCode(e.target.value)}
                      placeholder="Enter OTP (e.g. 1234)"
                      className="w-full px-3 py-2 text-xs bg-white border border-kirana-300 rounded-lg font-mono text-center tracking-widest text-kirana-950 font-bold"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full mt-4 py-3 bg-kirana-600 hover:bg-kirana-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <span>{otpSent ? 'Verify & Continue' : 'Send OTP to Login'}</span>
                  <ArrowRight className="w-4 h-4" />
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
                  <p className="text-xs text-slate-500 mt-1">You have full inventory and order control access.</p>
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
                  <p className="font-bold">Admin Credentials for Demo:</p>
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
                  <p className="text-xs font-semibold text-rose-600">{adminError}</p>
                )}

                <button
                  type="submit"
                  className="w-full mt-4 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Enter Store Admin Dashboard</span>
                </button>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

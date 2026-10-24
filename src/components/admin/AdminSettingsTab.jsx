import React, { useState } from 'react';
import { 
  Store, 
  MapPin, 
  Plus, 
  Trash2, 
  Clock, 
  QrCode, 
  Database, 
  Save, 
  Check, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { isSupabaseConfigured } from '../../lib/supabase';

export default function AdminSettingsTab() {
  const { settings, updateSettings, toggleStoreStatus, addPincode, removePincode } = useStore();

  const [form, setForm] = useState({
    storeName: settings.storeName || 'Smart Kirana',
    tagline: settings.tagline || '',
    phone: settings.phone || '',
    whatsapp: settings.whatsapp || '',
    email: settings.email || '',
    storeAddress: settings.storeAddress || '',
    operatingHours: settings.operatingHours || '7:00 AM - 11:00 PM',
    deliveryFee: settings.deliveryFee || 25,
    freeDeliveryThreshold: settings.freeDeliveryThreshold || 199,
    handlingFee: settings.handlingFee || 4,
    merchantUpiId: settings.merchantUpiId || 'smartkirana@okhdfcbank',
    merchantName: settings.merchantName || 'Smart Kirana Store'
  });

  const [newPin, setNewPin] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  const handleSaveGeneral = (e) => {
    e.preventDefault();
    updateSettings({
      ...form,
      deliveryFee: Number(form.deliveryFee),
      freeDeliveryThreshold: Number(form.freeDeliveryThreshold),
      handlingFee: Number(form.handlingFee)
    });
    setSaveMessage('Store configuration updated successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleAddPin = (e) => {
    e.preventDefault();
    if (newPin.trim().length === 6) {
      addPincode(newPin.trim());
      setNewPin('');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Store Status Toggle Banner */}
      <div className={`p-5 rounded-3xl border flex items-center justify-between gap-4 ${
        settings.isOpen ? 'bg-kirana-50/80 border-kirana-200' : 'bg-rose-50/80 border-rose-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
            settings.isOpen ? 'bg-kirana-600 text-white' : 'bg-rose-600 text-white'
          }`}>
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
              Store Status: {settings.isOpen ? 'OPEN FOR ORDERS' : 'STORE CLOSED'}
            </h4>
            <p className="text-xs text-slate-500">
              {settings.isOpen ? 'Customers can add items to basket and place orders.' : 'Store is paused. Customers cannot checkout.'}
            </p>
          </div>
        </div>

        <button
          onClick={toggleStoreStatus}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shadow-sm ${
            settings.isOpen 
              ? 'bg-rose-600 hover:bg-rose-700 text-white' 
              : 'bg-kirana-600 hover:bg-kirana-700 text-white'
          }`}
        >
          {settings.isOpen ? 'Close Store' : 'Open Store'}
        </button>
      </div>

      {saveMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSaveGeneral} className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-7 shadow-sm space-y-6">
        
        <div>
          <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-3">
            Store Profile & Timings
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700">Store Name</label>
              <input
                type="text"
                required
                value={form.storeName}
                onChange={e => setForm({ ...form, storeName: e.target.value })}
                className="w-full mt-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-kirana-500 font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Operating Hours</label>
              <input
                type="text"
                value={form.operatingHours}
                onChange={e => setForm({ ...form, operatingHours: e.target.value })}
                placeholder="7:00 AM - 11:00 PM"
                className="w-full mt-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-kirana-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Phone / WhatsApp Hotline</label>
              <input
                type="text"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full mt-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-kirana-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Support Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full mt-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-kirana-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700">Store Physical Address</label>
              <input
                type="text"
                value={form.storeAddress}
                onChange={e => setForm({ ...form, storeAddress: e.target.value })}
                className="w-full mt-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-kirana-500"
              />
            </div>
          </div>
        </div>

        {/* Delivery Fees & Free Delivery Threshold */}
        <div className="pt-4 border-t border-slate-100">
          <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-3">
            Delivery Fees & Thresholds
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700">Standard Delivery Fee (₹)</label>
              <input
                type="number"
                min="0"
                value={form.deliveryFee}
                onChange={e => setForm({ ...form, deliveryFee: e.target.value })}
                className="w-full mt-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-kirana-500 font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Free Delivery Threshold (₹)</label>
              <input
                type="number"
                min="0"
                value={form.freeDeliveryThreshold}
                onChange={e => setForm({ ...form, freeDeliveryThreshold: e.target.value })}
                className="w-full mt-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-kirana-500 font-bold text-kirana-700"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Packaging & Handling Fee (₹)</label>
              <input
                type="number"
                min="0"
                value={form.handlingFee}
                onChange={e => setForm({ ...form, handlingFee: e.target.value })}
                className="w-full mt-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-kirana-500"
              />
            </div>
          </div>
        </div>

        {/* Merchant UPI Details */}
        <div className="pt-4 border-t border-slate-100">
          <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <QrCode className="w-4 h-4 text-kirana-600" /> Merchant UPI Payment Configuration
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700">Payee UPI VPA (ID)</label>
              <input
                type="text"
                required
                value={form.merchantUpiId}
                onChange={e => setForm({ ...form, merchantUpiId: e.target.value })}
                placeholder="e.g. smartkirana@okhdfcbank"
                className="w-full mt-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-kirana-500 font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Payee Merchant Name</label>
              <input
                type="text"
                required
                value={form.merchantName}
                onChange={e => setForm({ ...form, merchantName: e.target.value })}
                placeholder="e.g. Smart Kirana Store"
                className="w-full mt-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-kirana-500"
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="pt-3">
          <button
            type="submit"
            className="px-6 py-2.5 bg-kirana-600 hover:bg-kirana-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Store Configuration</span>
          </button>
        </div>

      </form>

      {/* Serviceable Pincodes Manager */}
      <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-7 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-kirana-600" /> Express Delivery Pincodes ({settings.serviceablePincodes.length})
            </h4>
            <p className="text-xs text-slate-500">Only customers with these PIN codes can order express delivery</p>
          </div>
        </div>

        {/* Add PIN Form */}
        <form onSubmit={handleAddPin} className="flex gap-2 max-w-sm">
          <input
            type="text"
            maxLength={6}
            value={newPin}
            onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
            placeholder="Enter 6-digit PIN"
            className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-kirana-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add PIN</span>
          </button>
        </form>

        {/* Existing Pincode Badges */}
        <div className="flex flex-wrap gap-2 pt-2">
          {settings.serviceablePincodes.map(pin => (
            <div
              key={pin}
              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 text-xs font-mono font-bold text-slate-800"
            >
              <span>{pin}</span>
              <button
                type="button"
                onClick={() => removePincode(pin)}
                className="text-slate-400 hover:text-rose-600 transition-colors"
                title={`Remove ${pin}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Backend & Supabase Cloud Status Card */}
      <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-7 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-kirana-600" />
          <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
            Backend Database Integration
          </h4>
        </div>
        
        <div className={`p-4 rounded-2xl border ${
          isSupabaseConfigured ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-800'
        }`}>
          <div className="flex items-start gap-2.5 text-xs">
            <ShieldCheck className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isSupabaseConfigured ? 'text-emerald-600' : 'text-slate-500'}`} />
            <div>
              <span className="font-bold">
                {isSupabaseConfigured ? 'Connected to Supabase PostgreSQL Database' : 'Running on Resilient Local-First Engine (Active)'}
              </span>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                {isSupabaseConfigured 
                  ? 'All products, inventory changes, and customer orders are securely synchronized with your Supabase cloud backend.'
                  : 'All changes are automatically saved and persisted in browser storage. To connect your team\'s live Supabase project, set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file and run supabase_schema.sql.'}
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

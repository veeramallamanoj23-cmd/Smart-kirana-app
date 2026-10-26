import React, { useState, useEffect } from 'react';
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
  AlertCircle,
  Users,
  Key,
  Lock,
  UserPlus,
  Edit2,
  X,
  Globe
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { isSupabaseConfigured } from '../../lib/supabase';
import { api } from '../../lib/api';

export default function AdminSettingsTab() {
  const { 
    settings, 
    updateSettings, 
    toggleStoreStatus, 
    addPincode, 
    removePincode,
    addDeliveryArea,
    updateDeliveryArea,
    deleteDeliveryArea,
    toggleDeliveryArea
  } = useStore();

  const [form, setForm] = useState({
    storeName: settings.storeName || 'Smart Kirana',
    tagline: settings.tagline || '',
    phone: settings.phone || '',
    whatsapp: settings.whatsapp || '',
    email: settings.email || '',
    storeAddress: settings.storeAddress || '',
    storeLat: settings.storeLat !== undefined ? settings.storeLat : 12.9352,
    storeLng: settings.storeLng !== undefined ? settings.storeLng : 77.6245,
    maxDeliveryRadiusKm: settings.maxDeliveryRadiusKm !== undefined ? settings.maxDeliveryRadiusKm : 10.0,
    operatingHours: settings.operatingHours || '7:00 AM - 11:00 PM',
    deliveryFee: settings.deliveryFee || 25,
    freeDeliveryThreshold: settings.freeDeliveryThreshold || 199,
    handlingFee: settings.handlingFee || 4,
    merchantUpiId: settings.merchantUpiId || 'smartkirana@okhdfcbank',
    merchantName: settings.merchantName || 'Smart Kirana Store'
  });

  const [newPin, setNewPin] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  // Delivery Areas Management State
  const [showAddArea, setShowAddArea] = useState(false);
  const [areaForm, setAreaForm] = useState({ name: '', description: '', pincodesStr: '', isActive: true });
  const [editingAreaId, setEditingAreaId] = useState(null);
  const [editAreaForm, setEditAreaForm] = useState({ name: '', description: '', pincodesStr: '', isActive: true });
  const [areaNewPin, setAreaNewPin] = useState({});

  const handleCreateArea = (e) => {
    e.preventDefault();
    if (!areaForm.name.trim()) return;
    const pins = areaForm.pincodesStr.split(/[\s,]+/).map(p => p.trim()).filter(p => p.length === 6);
    addDeliveryArea({
      name: areaForm.name,
      description: areaForm.description,
      pincodes: pins,
      isActive: areaForm.isActive
    });
    setAreaForm({ name: '', description: '', pincodesStr: '', isActive: true });
    setShowAddArea(false);
    setSaveMessage('New delivery zone created successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleStartEditArea = (area) => {
    setEditingAreaId(area.id);
    setEditAreaForm({
      name: area.name,
      description: area.description || '',
      pincodesStr: (area.pincodes || []).join(', '),
      isActive: area.isActive !== false
    });
  };

  const handleSaveEditArea = (e, areaId) => {
    e.preventDefault();
    const pins = editAreaForm.pincodesStr.split(/[\s,]+/).map(p => p.trim()).filter(p => p.length === 6);
    updateDeliveryArea(areaId, {
      name: editAreaForm.name,
      description: editAreaForm.description,
      pincodes: pins,
      isActive: editAreaForm.isActive
    });
    setEditingAreaId(null);
    setSaveMessage('Delivery zone updated!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleAddPinToArea = (areaId, pinToAdd) => {
    const clean = String(pinToAdd || '').trim();
    if (clean.length !== 6) return;
    const area = (settings.deliveryAreas || []).find(a => a.id === areaId);
    if (!area) return;
    if (!area.pincodes.includes(clean)) {
      updateDeliveryArea(areaId, { pincodes: [...area.pincodes, clean] });
    }
    setAreaNewPin(prev => ({ ...prev, [areaId]: '' }));
  };

  const handleRemovePinFromArea = (areaId, pinToRemove) => {
    const area = (settings.deliveryAreas || []).find(a => a.id === areaId);
    if (!area) return;
    updateDeliveryArea(areaId, { pincodes: area.pincodes.filter(p => p !== pinToRemove) });
  };

  const handleSaveGeneral = (e) => {
    e.preventDefault();
    updateSettings({
      ...form,
      storeLat: parseFloat(form.storeLat) || 12.9352,
      storeLng: parseFloat(form.storeLng) || 77.6245,
      maxDeliveryRadiusKm: parseFloat(form.maxDeliveryRadiusKm) || 10.0,
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

  // Admin Staff Management State (Only Created By Admin)
  const [staffList, setStaffList] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'staff_admin',
    password: ''
  });
  const [staffError, setStaffError] = useState('');
  const [staffSuccess, setStaffSuccess] = useState('');

  // Password Change State
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');

  const loadStaff = async () => {
    setStaffLoading(true);
    const res = await api.adminGetStaff();
    setStaffLoading(false);
    if (res.success && res.staff) {
      setStaffList(res.staff);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setStaffError('');
    setStaffSuccess('');

    const res = await api.adminCreateStaff(staffForm);
    if (res.success) {
      setStaffSuccess(`Administrator account created for ${res.admin.email}!`);
      setStaffForm({ name: '', email: '', phone: '', role: 'staff_admin', password: '' });
      loadStaff();
      setTimeout(() => setStaffSuccess(''), 4000);
    } else {
      setStaffError(res.message || 'Failed to create admin account.');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordMsg('Password must be at least 6 characters.');
      return;
    }
    const res = await api.adminChangePassword(newPassword);
    if (res.success) {
      setPasswordMsg('Admin password updated successfully!');
      setNewPassword('');
      setTimeout(() => setPasswordMsg(''), 3000);
    } else {
      setPasswordMsg(res.message || 'Could not update password.');
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
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Store Physical Address (Clickable for Customers)</label>
                {form.storeAddress && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(form.storeAddress)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold text-kirana-600 hover:text-kirana-700 hover:underline flex items-center gap-1"
                  >
                    <span>Test in Google Maps</span>
                    <span>↗</span>
                  </a>
                )}
              </div>
              <input
                type="text"
                value={form.storeAddress}
                onChange={e => setForm({ ...form, storeAddress: e.target.value })}
                placeholder="e.g. Shop #14, Main Market Road, Bangalore 560034"
                className="w-full mt-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-kirana-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                This address is clickable in the footer and location selector, opening Google Maps for customer navigation.
              </p>
            </div>

            {/* Store Geolocation & Radius Settings */}
            <div>
              <label className="text-xs font-bold text-slate-700">Store Latitude (Delivery Center)</label>
              <input
                type="number"
                step="0.0001"
                value={form.storeLat}
                onChange={e => setForm({ ...form, storeLat: e.target.value })}
                className="w-full mt-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-kirana-500"
              />
              <span className="text-[10px] text-slate-400">Default: 12.9352 (Koramangala Hub)</span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Store Longitude (Delivery Center)</label>
              <input
                type="number"
                step="0.0001"
                value={form.storeLng}
                onChange={e => setForm({ ...form, storeLng: e.target.value })}
                className="w-full mt-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-kirana-500"
              />
              <span className="text-[10px] text-slate-400">Default: 77.6245 (Koramangala Hub)</span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Strict Delivery Radius (km)</label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="50"
                value={form.maxDeliveryRadiusKm}
                onChange={e => setForm({ ...form, maxDeliveryRadiusKm: e.target.value })}
                className="w-full mt-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-kirana-700 focus:bg-white focus:ring-2 focus:ring-kirana-500"
              />
              <span className="text-[10px] text-slate-400">Enforced by backend Haversine engine (10.0 km)</span>
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

      {/* Dynamic Delivery Areas & Geofenced PIN Codes Manager */}
      <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-7 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-4 h-4 text-kirana-600" />
              Active Delivery Areas & Geofenced Zones
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure neighborhood delivery corridors and their assigned 6-digit PIN codes.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddArea(!showAddArea)}
            className="px-4 py-2 bg-kirana-600 hover:bg-kirana-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Delivery Area</span>
          </button>
        </div>

        {/* 10 km Geofence Enforcement Note */}
        <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-xs text-amber-950 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold text-amber-900">Backend Geodesic 10 km Rule Active: </span>
            <span className="text-amber-800 text-[11px]">
              Listing a PIN code or area here defines it as an authorized delivery corridor. The server automatically checks that the customer address is within <strong>{settings.maxDeliveryRadiusKm || 10.0} km</strong> of your shop before accepting checkout.
            </span>
          </div>
        </div>

        {/* Add Delivery Area Form */}
        {showAddArea && (
          <form onSubmit={handleCreateArea} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <h5 className="font-extrabold text-slate-900 text-xs">Create New Delivery Area</h5>
              <button
                type="button"
                onClick={() => setShowAddArea(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Area / Neighborhood Name *</label>
                <input
                  type="text"
                  required
                  value={areaForm.name}
                  onChange={e => setAreaForm({ ...areaForm, name: e.target.value })}
                  placeholder="e.g. Indiranagar & Domlur"
                  className="w-full mt-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-kirana-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Description / Dispatch SLA</label>
                <input
                  type="text"
                  value={areaForm.description}
                  onChange={e => setAreaForm({ ...areaForm, description: e.target.value })}
                  placeholder="e.g. 15-minute express dispatch zone"
                  className="w-full mt-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-kirana-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700">PIN Codes (separated by commas)</label>
                <input
                  type="text"
                  value={areaForm.pincodesStr}
                  onChange={e => setAreaForm({ ...areaForm, pincodesStr: e.target.value })}
                  placeholder="e.g. 560008, 560038"
                  className="w-full mt-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-kirana-500"
                />
                <span className="text-[10px] text-slate-400">Enter 6-digit Indian PIN codes</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddArea(false)}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-kirana-600 hover:bg-kirana-700 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Save Area
              </button>
            </div>
          </form>
        )}

        {/* Existing Delivery Areas List */}
        <div className="space-y-3">
          {(settings.deliveryAreas || []).length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No delivery areas configured yet. Click "+ Add Delivery Area" above.
            </div>
          ) : (
            (settings.deliveryAreas || []).map(area => (
              <div 
                key={area.id}
                className={`p-4 rounded-2xl border transition-all ${
                  area.isActive ? 'bg-white border-slate-200/90 shadow-xs' : 'bg-slate-50/70 border-slate-200 opacity-75'
                }`}
              >
                {editingAreaId === area.id ? (
                  /* Edit Form */
                  <form onSubmit={(e) => handleSaveEditArea(e, area.id)} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-700">Area Name</label>
                        <input
                          type="text"
                          required
                          value={editAreaForm.name}
                          onChange={e => setEditAreaForm({ ...editAreaForm, name: e.target.value })}
                          className="w-full mt-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700">Description</label>
                        <input
                          type="text"
                          value={editAreaForm.description}
                          onChange={e => setEditAreaForm({ ...editAreaForm, description: e.target.value })}
                          className="w-full mt-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs font-bold text-slate-700">PIN Codes (comma-separated)</label>
                        <input
                          type="text"
                          value={editAreaForm.pincodesStr}
                          onChange={e => setEditAreaForm({ ...editAreaForm, pincodesStr: e.target.value })}
                          className="w-full mt-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-mono"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingAreaId(null)}
                        className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-kirana-600 text-white font-bold text-xs rounded-xl"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                ) : (
                  /* View Mode */
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-start sm:items-center gap-2">
                        <MapPin className={`w-4 h-4 flex-shrink-0 mt-0.5 sm:mt-0 ${area.isActive ? 'text-kirana-600' : 'text-slate-400'}`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-extrabold text-slate-900 text-sm">{area.name}</h5>
                            <button
                              type="button"
                              onClick={() => toggleDeliveryArea(area.id)}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                                area.isActive 
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                                  : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                              }`}
                            >
                              {area.isActive ? '● Active' : '○ Deactivated'}
                            </button>
                          </div>
                          {area.description && (
                            <p className="text-[11px] text-slate-500 mt-0.5">{area.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleStartEditArea(area)}
                          className="p-1.5 text-slate-500 hover:text-kirana-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Area"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete delivery area "${area.name}"?`)) {
                              deleteDeliveryArea(area.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Area"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* PIN Codes Chips & Quick Add */}
                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-500">Serviceable PINs:</span>
                      {(area.pincodes || []).map(pin => (
                        <span 
                          key={pin}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-mono font-bold text-slate-800"
                        >
                          <span>{pin}</span>
                          <button
                            type="button"
                            onClick={() => handleRemovePinFromArea(area.id, pin)}
                            className="text-slate-400 hover:text-rose-600"
                            title={`Remove PIN ${pin}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}

                      {/* Quick Add PIN inside Area */}
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          maxLength={6}
                          value={areaNewPin[area.id] || ''}
                          onChange={e => setAreaNewPin({ ...areaNewPin, [area.id]: e.target.value.replace(/\D/g, '') })}
                          placeholder="6-digit PIN"
                          className="w-24 px-2 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white focus:ring-1 focus:ring-kirana-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddPinToArea(area.id, areaNewPin[area.id])}
                          className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Store Administrators & Staff Accounts (Admin-Only RBAC) */}
      <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-7 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-kirana-600" />
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Authorized Store Administrators
              </h4>
              <p className="text-xs text-slate-500">
                Created and managed exclusively by store administrators. Regular shoppers cannot register as admin.
              </p>
            </div>
          </div>
          <span className="text-[10px] bg-slate-900 text-white font-bold px-2.5 py-1 rounded-full uppercase tracking-wider self-start sm:self-auto">
            RBAC Protected
          </span>
        </div>

        {/* Existing Admin Accounts Table */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-700 block">Active Store Administrator Accounts:</span>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-100 rounded-2xl overflow-hidden">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Email / Login ID</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffList.length > 0 ? (
                  staffList.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-bold text-slate-900">{st.name}</td>
                      <td className="p-3 font-mono text-slate-700">{st.email}</td>
                      <td className="p-3 font-mono text-slate-600">{st.phone || '+91 9392398990'}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          {st.role}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Active
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-400">
                      Loading administrator accounts...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create New Admin Account Form */}
        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-kirana-600" />
            <h5 className="font-bold text-xs text-slate-900">Provision New Administrator Account</h5>
          </div>

          {staffSuccess && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{staffSuccess}</span>
            </div>
          )}

          {staffError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{staffError}</span>
            </div>
          )}

          <form onSubmit={handleCreateStaff} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-[11px] font-bold text-slate-600">Full Name</label>
              <input
                type="text"
                required
                value={staffForm.name}
                onChange={e => setStaffForm({ ...staffForm, name: e.target.value })}
                placeholder="e.g. Ramesh Kumar"
                className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600">Admin Email Address *</label>
              <input
                type="email"
                required
                value={staffForm.email}
                onChange={e => setStaffForm({ ...staffForm, email: e.target.value })}
                placeholder="e.g. manager@smartkirana.store"
                className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600">Mobile Phone</label>
              <input
                type="tel"
                maxLength={10}
                value={staffForm.phone}
                onChange={e => setStaffForm({ ...staffForm, phone: e.target.value.replace(/\D/g, '') })}
                placeholder="e.g. 9392398990"
                className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600">Password (Min 6 Characters) *</label>
              <input
                type="password"
                required
                minLength={6}
                value={staffForm.password}
                onChange={e => setStaffForm({ ...staffForm, password: e.target.value })}
                placeholder="••••••••••••"
                className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-xl"
              />
            </div>

            <div className="sm:col-span-2 pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Administrator Account</span>
              </button>
            </div>
          </form>
        </div>

        {/* Change Current Admin Password */}
        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-kirana-600" />
            <h5 className="font-bold text-xs text-slate-900">Change Admin Password</h5>
          </div>

          {passwordMsg && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{passwordMsg}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="flex flex-col sm:flex-row gap-3">
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Enter new strong password"
              className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-kirana-600 hover:bg-kirana-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
            >
              Update Password
            </button>
          </form>
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

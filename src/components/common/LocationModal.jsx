import React, { useState } from 'react';
import { MapPin, Check, Plus, AlertCircle, X, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';

export default function LocationModal({ isOpen, onClose }) {
  const { customer, selectedAddress, setSelectedAddress, addAddress } = useAuth();
  const { settings, isPincodeServiceable } = useStore();

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [formData, setFormData] = useState({
    title: 'Home',
    fullName: customer?.name || '',
    phone: customer?.phone || '',
    flat: '',
    street: '',
    landmark: '',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560102',
    isDefault: false
  });
  const [pinError, setPinError] = useState('');

  if (!isOpen) return null;

  const handlePincodeChange = (e) => {
    const pin = e.target.value.replace(/\D/g, '').slice(0, 6);
    setFormData(prev => ({ ...prev, pincode: pin }));
    if (pin.length === 6) {
      if (!isPincodeServiceable(pin)) {
        setPinError(`Sorry! PIN ${pin} is outside our current express delivery radius.`);
      } else {
        setPinError('');
      }
    } else {
      setPinError('');
    }
  };

  const handleSaveAddress = (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone || !formData.flat || !formData.pincode) {
      alert('Please fill out all required address fields.');
      return;
    }

    if (!isPincodeServiceable(formData.pincode)) {
      setPinError(`Cannot deliver to PIN ${formData.pincode}. Please choose a serviceable address.`);
      return;
    }

    addAddress(formData);
    setIsAddingNew(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-elevated border border-slate-100 p-5 sm:p-6 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-kirana-50 rounded-xl text-kirana-600">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">Select Delivery Location</h3>
              <p className="text-xs text-slate-500">Fast delivery from our nearest fulfillment hub</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Serviceable Pincodes Notice */}
        <div className="my-4 p-3 bg-amber-50 rounded-2xl border border-amber-200/60 text-xs text-amber-900">
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Active Delivery Areas: </span>
              {settings.serviceableAreas.join(', ')}
              <div className="mt-1 text-[11px] font-mono text-amber-700">
                Serviceable PINs: {settings.serviceablePincodes.join(', ')}
              </div>
            </div>
          </div>
        </div>

        {!isAddingNew ? (
          <div>
            {/* Saved Addresses List */}
            <div className="space-y-2.5 my-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Your Saved Addresses</p>
              
              {customer?.addresses && customer.addresses.length > 0 ? (
                customer.addresses.map((addr) => {
                  const isServiceable = isPincodeServiceable(addr.pincode);
                  const isSelected = selectedAddress?.id === addr.id;

                  return (
                    <div
                      key={addr.id}
                      onClick={() => {
                        setSelectedAddress(addr);
                        onClose();
                      }}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                        isSelected 
                          ? 'border-kirana-600 bg-kirana-50/50 shadow-sm' 
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-xl mt-0.5 ${isSelected ? 'bg-kirana-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-800">{addr.title}</span>
                            {addr.isDefault && (
                              <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded">
                                Default
                              </span>
                            )}
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              isServiceable ? 'bg-kirana-100 text-kirana-800' : 'bg-rose-100 text-rose-700'
                            }`}>
                              {isServiceable ? '⚡ 15 Mins' : 'Out of range'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1">{addr.flat}, {addr.street}</p>
                          <p className="text-xs text-slate-500">{addr.city} - {addr.pincode} • Phone: {addr.phone}</p>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-kirana-600 text-white flex items-center justify-center flex-shrink-0">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No saved addresses found. Add an address below.
                </div>
              )}
            </div>

            {/* Add New Address Button */}
            <button
              onClick={() => setIsAddingNew(true)}
              className="w-full mt-3 py-3 border-2 border-dashed border-kirana-400 hover:border-kirana-600 bg-kirana-50/40 hover:bg-kirana-50 text-kirana-700 font-bold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Delivery Address</span>
            </button>
          </div>
        ) : (
          /* New Address Form */
          <form onSubmit={handleSaveAddress} className="space-y-3.5 my-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Add New Address</span>
              <button 
                type="button" 
                onClick={() => setIsAddingNew(false)}
                className="text-xs text-kirana-600 font-semibold hover:underline"
              >
                Back to saved
              </button>
            </div>

            {/* Address Tag */}
            <div className="flex gap-2">
              {['Home', 'Office', 'Other'].map(type => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setFormData(prev => ({ ...prev, title: type }))}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                    formData.title === type ? 'bg-kirana-600 text-white border-kirana-600' : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-bold text-slate-600">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-kirana-500"
                  placeholder="e.g. Rahul Sharma"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600">Phone Number *</label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-kirana-500"
                  placeholder="10 digit number"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600">Flat / House No. / Building *</label>
              <input
                type="text"
                required
                value={formData.flat}
                onChange={e => setFormData({ ...formData, flat: e.target.value })}
                className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-kirana-500"
                placeholder="e.g. Flat 302, Green Meadows Apartment"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600">Street / Area / Sector *</label>
              <input
                type="text"
                required
                value={formData.street}
                onChange={e => setFormData({ ...formData, street: e.target.value })}
                className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-kirana-500"
                placeholder="e.g. 19th Main Road, Sector 2, HSR Layout"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-bold text-slate-600">Landmark (Optional)</label>
                <input
                  type="text"
                  value={formData.landmark}
                  onChange={e => setFormData({ ...formData, landmark: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-kirana-500"
                  placeholder="e.g. Near Water Tank"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600">PIN Code *</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={formData.pincode}
                  onChange={handlePincodeChange}
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-kirana-500 font-mono"
                  placeholder="6 digit PIN (e.g. 560102)"
                />
              </div>
            </div>

            {pinError && (
              <div className="p-2.5 bg-rose-50 text-rose-700 rounded-xl text-xs flex items-center gap-2 border border-rose-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full mt-4 py-3 bg-kirana-600 hover:bg-kirana-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md transition-all"
            >
              Save Address & Set as Delivery Location
            </button>
          </form>
        )}

      </div>
    </div>
  );
}

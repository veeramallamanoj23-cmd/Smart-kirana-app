import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_STORE_SETTINGS } from '../data/initialStoreSettings';
import { storage } from '../lib/storage';

const StoreContext = createContext();

export function StoreProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    return storage.get('store_settings', INITIAL_STORE_SETTINGS);
  });

  useEffect(() => {
    storage.set('store_settings', settings);
  }, [settings]);

  // Update whole settings or a subset
  const updateSettings = (newSettings) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings
    }));
  };

  // Toggle store open/closed
  const toggleStoreStatus = () => {
    setSettings(prev => ({ ...prev, isOpen: !prev.isOpen }));
  };

  // Check if a PIN code is serviceable
  const isPincodeServiceable = (pincode) => {
    if (!pincode) return false;
    const cleanPin = pincode.toString().trim();
    return settings.serviceablePincodes.includes(cleanPin);
  };

  // Add/remove serviceable pincodes
  const addPincode = (pin) => {
    const clean = pin.trim();
    if (clean && !settings.serviceablePincodes.includes(clean)) {
      setSettings(prev => ({
        ...prev,
        serviceablePincodes: [...prev.serviceablePincodes, clean]
      }));
    }
  };

  const removePincode = (pin) => {
    setSettings(prev => ({
      ...prev,
      serviceablePincodes: prev.serviceablePincodes.filter(p => p !== pin)
    }));
  };

  return (
    <StoreContext.Provider value={{
      settings,
      updateSettings,
      toggleStoreStatus,
      isPincodeServiceable,
      addPincode,
      removePincode
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a StoreProvider');
  return context;
}

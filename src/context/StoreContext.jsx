import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_STORE_SETTINGS } from '../data/initialStoreSettings';
import { storage } from '../lib/storage';
import { api } from '../lib/api';

const StoreContext = createContext();

export function StoreProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    return storage.get('store_settings', INITIAL_STORE_SETTINGS);
  });

  // Sync settings with server database on mount
  useEffect(() => {
    async function fetchServerSettings() {
      try {
        const res = await api.adminGetSettings();
        if (res && res.success && res.settings) {
          setSettings(prev => ({
            ...prev,
            ...res.settings
          }));
        }
      } catch (err) {
        // Fall back to cached local storage
      }
    }
    fetchServerSettings();
  }, []);

  useEffect(() => {
    storage.set('store_settings', settings);
  }, [settings]);

  // Update whole settings or a subset
  const updateSettings = async (newSettings) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings
    }));

    try {
      await api.adminUpdateSettings(newSettings);
    } catch (err) {
      console.warn('Failed to persist settings to server database:', err.message);
    }
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
    const updatedPins = settings.serviceablePincodes.filter(p => p !== pin);
    setSettings(prev => ({
      ...prev,
      serviceablePincodes: updatedPins
    }));
    updateSettings({
      ...settings,
      serviceablePincodes: updatedPins
    });
  };

  // Dynamic Delivery Areas Management (Admin Configurable)
  const addDeliveryArea = (newArea) => {
    const areaId = `area-${Date.now()}`;
    const cleanedPincodes = (newArea.pincodes || []).map(p => p.trim()).filter(Boolean);
    const areaObj = {
      id: areaId,
      name: (newArea.name || 'New Delivery Zone').trim(),
      pincodes: cleanedPincodes,
      isActive: newArea.isActive !== false,
      description: newArea.description || ''
    };

    const currentAreas = settings.deliveryAreas || [];
    const updatedAreas = [...currentAreas, areaObj];
    const allPincodes = Array.from(new Set(
      updatedAreas.filter(a => a.isActive).flatMap(a => a.pincodes)
    ));
    const allAreaNames = updatedAreas.filter(a => a.isActive).map(a => a.name);

    updateSettings({
      deliveryAreas: updatedAreas,
      serviceableAreas: allAreaNames,
      serviceablePincodes: allPincodes
    });
  };

  const updateDeliveryArea = (id, updatedFields) => {
    const currentAreas = settings.deliveryAreas || [];
    const updatedAreas = currentAreas.map(a => {
      if (a.id !== id) return a;
      return {
        ...a,
        ...updatedFields,
        pincodes: updatedFields.pincodes ? updatedFields.pincodes.map(p => p.trim()).filter(Boolean) : a.pincodes
      };
    });

    const allPincodes = Array.from(new Set(
      updatedAreas.filter(a => a.isActive).flatMap(a => a.pincodes)
    ));
    const allAreaNames = updatedAreas.filter(a => a.isActive).map(a => a.name);

    updateSettings({
      deliveryAreas: updatedAreas,
      serviceableAreas: allAreaNames,
      serviceablePincodes: allPincodes
    });
  };

  const deleteDeliveryArea = (id) => {
    const currentAreas = settings.deliveryAreas || [];
    const updatedAreas = currentAreas.filter(a => a.id !== id);
    const allPincodes = Array.from(new Set(
      updatedAreas.filter(a => a.isActive).flatMap(a => a.pincodes)
    ));
    const allAreaNames = updatedAreas.filter(a => a.isActive).map(a => a.name);

    updateSettings({
      deliveryAreas: updatedAreas,
      serviceableAreas: allAreaNames,
      serviceablePincodes: allPincodes
    });
  };

  const toggleDeliveryArea = (id) => {
    const currentAreas = settings.deliveryAreas || [];
    const target = currentAreas.find(a => a.id === id);
    if (!target) return;
    updateDeliveryArea(id, { isActive: !target.isActive });
  };

  return (
    <StoreContext.Provider value={{
      settings,
      updateSettings,
      toggleStoreStatus,
      isPincodeServiceable,
      addPincode,
      removePincode,
      addDeliveryArea,
      updateDeliveryArea,
      deleteDeliveryArea,
      toggleDeliveryArea
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

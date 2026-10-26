import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../lib/storage';
import { api } from '../lib/api';

const AuthContext = createContext();

const GUEST_CUSTOMER = {
  id: null,
  name: '',
  phone: '',
  email: '',
  isLoggedIn: false,
  addresses: []
};

export function AuthProvider({ children }) {
  const [customer, setCustomer] = useState(() => {
    const saved = storage.get('customer', GUEST_CUSTOMER);
    // Purge legacy mock account if stored in localStorage
    if (saved && (saved.id === 'cust_default' || saved.name === 'Rohan Sharma')) {
      storage.set('customer', GUEST_CUSTOMER);
      return GUEST_CUSTOMER;
    }
    return saved || GUEST_CUSTOMER;
  });

  const [isAdmin, setIsAdmin] = useState(() => {
    const role = localStorage.getItem('smart_kirana_user_role');
    const token = localStorage.getItem('smart_kirana_auth_token');
    return Boolean(token && role === 'admin');
  });

  const [selectedAddress, setSelectedAddress] = useState(() => {
    const saved = storage.get('selectedAddress', null);
    if (saved) return saved;
    const def = customer?.addresses?.find(a => a.isDefault);
    return def || customer?.addresses?.[0] || null;
  });

  useEffect(() => {
    storage.set('customer', customer);
  }, [customer]);

  useEffect(() => {
    storage.set('selectedAddress', selectedAddress);
  }, [selectedAddress]);

  // Request real cryptographic OTP via SMS or WhatsApp
  const requestOtp = async (phone, channel = 'sms', countryCode = '91') => {
    const res = await api.requestOtp(phone, channel, countryCode);
    return res;
  };

  // Verify OTP against server
  const verifyOtp = async (phone, enteredOtp, name) => {
    const res = await api.verifyOtp(phone, enteredOtp, name);
    if (res.success && res.token) {
      localStorage.setItem('smart_kirana_auth_token', res.token);
      localStorage.setItem('smart_kirana_user_role', 'customer');

      const updated = {
        ...customer,
        id: res.customer.id,
        name: res.customer.name,
        phone: res.customer.phone,
        email: `${res.customer.phone}@smartkirana.customer`,
        isLoggedIn: true
      };
      setCustomer(updated);
    }
    return res;
  };

  const logoutCustomer = () => {
    localStorage.removeItem('smart_kirana_auth_token');
    localStorage.removeItem('smart_kirana_user_role');
    setCustomer({
      id: `cust_${Date.now()}`,
      name: '',
      phone: '',
      email: '',
      isLoggedIn: false,
      addresses: []
    });
    setSelectedAddress(null);
  };

  const addAddress = (newAddr) => {
    const addressWithId = {
      ...newAddr,
      id: `addr-${Date.now()}`,
      isDefault: customer.addresses.length === 0 || newAddr.isDefault
    };

    let updatedList = [...customer.addresses];
    if (addressWithId.isDefault) {
      updatedList = updatedList.map(a => ({ ...a, isDefault: false }));
    }
    updatedList.push(addressWithId);

    setCustomer(prev => ({
      ...prev,
      addresses: updatedList
    }));

    if (addressWithId.isDefault || !selectedAddress) {
      setSelectedAddress(addressWithId);
    }

    return addressWithId;
  };

  const removeAddress = (addressId) => {
    const updatedList = customer.addresses.filter(a => a.id !== addressId);
    setCustomer(prev => ({
      ...prev,
      addresses: updatedList
    }));
    if (selectedAddress?.id === addressId) {
      setSelectedAddress(updatedList[0] || null);
    }
  };

  // Authenticate Admin against server PBKDF2 hash
  const loginAdmin = async (email, password) => {
    const res = await api.adminLogin(email, password);
    if (res.success && res.token) {
      localStorage.setItem('smart_kirana_auth_token', res.token);
      localStorage.setItem('smart_kirana_user_role', 'admin');
      setIsAdmin(true);
      return { success: true };
    }
    return { success: false, message: res.message || 'Invalid admin credentials' };
  };

  const logoutAdmin = () => {
    localStorage.removeItem('smart_kirana_auth_token');
    localStorage.removeItem('smart_kirana_user_role');
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{
      customer,
      isAdmin,
      selectedAddress,
      setSelectedAddress,
      requestOtp,
      verifyOtp,
      logoutCustomer,
      addAddress,
      removeAddress,
      loginAdmin,
      logoutAdmin
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../lib/storage';
import { api } from '../lib/api';

const AuthContext = createContext();

const DEFAULT_CUSTOMER = {
  id: 'cust_default',
  name: 'Rohan Sharma',
  phone: '9876543210',
  email: 'rohan.sharma@example.com',
  isLoggedIn: true,
  addresses: [
    {
      id: 'addr-1',
      title: 'Home',
      fullName: 'Rohan Sharma',
      phone: '9876543210',
      flat: 'Flat 402, Sunshine Heights',
      street: '14th Main, 4th Sector, HSR Layout',
      landmark: 'Near BDA Complex',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560102',
      isDefault: true
    },
    {
      id: 'addr-2',
      title: 'Office',
      fullName: 'Rohan Sharma',
      phone: '9876543210',
      flat: '3rd Floor, Tech Park Wing B',
      street: 'Koramangala 5th Block',
      landmark: 'Opposite Jyoti Nivas College',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560034',
      isDefault: false
    }
  ]
};

export function AuthProvider({ children }) {
  const [customer, setCustomer] = useState(() => {
    return storage.get('customer', DEFAULT_CUSTOMER);
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

  // Request real cryptographic OTP
  const requestOtp = async (phone) => {
    const res = await api.requestOtp(phone);
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

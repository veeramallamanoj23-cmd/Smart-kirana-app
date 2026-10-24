import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../lib/storage';

const AuthContext = createContext();

export const ADMIN_CREDENTIALS = {
  email: 'admin@smartkirana.store',
  password: 'kirana2026admin'
};

const DEFAULT_CUSTOMER = {
  id: 'cust-guest-1',
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
    return storage.get('isAdmin', false);
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
    storage.set('isAdmin', isAdmin);
  }, [isAdmin]);

  useEffect(() => {
    storage.set('selectedAddress', selectedAddress);
  }, [selectedAddress]);

  const loginCustomer = (details) => {
    const updated = {
      ...customer,
      ...details,
      isLoggedIn: true
    };
    setCustomer(updated);
    return true;
  };

  const logoutCustomer = () => {
    setCustomer({
      id: `cust-${Date.now()}`,
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

  const loginAdmin = (email, password) => {
    if (email.trim().toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase() && 
        password === ADMIN_CREDENTIALS.password) {
      setIsAdmin(true);
      return { success: true };
    }
    return { success: false, message: 'Invalid admin credentials' };
  };

  const logoutAdmin = () => {
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{
      customer,
      isAdmin,
      selectedAddress,
      setSelectedAddress,
      loginCustomer,
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

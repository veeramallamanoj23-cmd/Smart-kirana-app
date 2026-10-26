import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../lib/storage';
import { useStore } from './StoreContext';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export function CartProvider({ children }) {
  const { settings } = useStore();
  const { customer } = useAuth();

  const [cartItems, setCartItems] = useState(() => {
    return storage.get('cart', []);
  });
  
  const [appliedCoupon, setAppliedCoupon] = useState(() => {
    return storage.get('applied_coupon', null);
  });

  const [notification, setNotification] = useState(null);
  const [authPrompt, setAuthPrompt] = useState(null);

  useEffect(() => {
    storage.set('cart', cartItems);
  }, [cartItems]);

  useEffect(() => {
    storage.set('applied_coupon', appliedCoupon);
  }, [appliedCoupon]);

  // Show a momentary notification
  const showNotification = (message, type = 'info') => {
    setNotification({ id: Date.now(), message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3200);
  };

  // Add item or increment
  const addToCart = (product, quantityToAdd = 1) => {
    if (!product.isAvailable || product.stock <= 0) {
      showNotification(`${product.name} is currently out of stock`, 'warning');
      return false;
    }

    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      
      if (existing) {
        const newQty = existing.quantity + quantityToAdd;
        if (newQty > product.stock) {
          showNotification(`Only ${product.stock} units available in stock for ${product.name}`, 'warning');
          return prev;
        }
        showNotification(`Increased quantity for ${product.name}`, 'success');
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: newQty } : item
        );
      } else {
        if (quantityToAdd > product.stock) {
          showNotification(`Only ${product.stock} units available in stock`, 'warning');
          return prev;
        }
        showNotification(`Added ${product.name} to cart`, 'success');
        return [...prev, { ...product, quantity: quantityToAdd }];
      }
    });

    // Prompt unauthenticated user to log in with mobile OTP (Blinkit style), keeping the cart intact
    if (!customer?.isLoggedIn) {
      setAuthPrompt({
        isOpen: true,
        message: `Enter your mobile number to continue ordering ${product.name}. Your cart items remain saved!`
      });
    }

    return true;
  };

  // Update item quantity
  const updateQuantity = (productId, newQuantity, maxStock) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    if (maxStock !== undefined && newQuantity > maxStock) {
      showNotification(`Maximum available stock is ${maxStock} units`, 'warning');
      return;
    }

    setCartItems(prev =>
      prev.map(item =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  // Remove single item
  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(item => item.id !== productId));
    showNotification('Item removed from cart', 'info');
  };

  // Clear cart
  const clearCart = () => {
    setCartItems([]);
    setAppliedCoupon(null);
  };

  // Total items count
  const totalItemsCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Subtotal (Sum of selling price * quantity)
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  // Total MRP
  const totalMrp = cartItems.reduce((acc, item) => acc + ((item.mrp || item.price) * item.quantity), 0);

  // MRP Savings
  const mrpSavings = Math.max(0, totalMrp - subtotal);

  // Delivery fee logic
  const isFreeDelivery = subtotal >= (settings?.freeDeliveryThreshold || 199) || (appliedCoupon?.freeDelivery && subtotal >= (appliedCoupon?.minOrder || 0));
  const deliveryFee = cartItems.length === 0 ? 0 : (isFreeDelivery ? 0 : (settings?.deliveryFee || 25));

  // Handling fee
  const handlingFee = cartItems.length === 0 ? 0 : (settings?.handlingFee || 4);

  // Coupon discount calculation
  let couponDiscount = 0;
  if (appliedCoupon && subtotal >= (appliedCoupon.minOrder || 0)) {
    if (appliedCoupon.discount) {
      couponDiscount = appliedCoupon.discount;
    } else if (appliedCoupon.discountPercent) {
      const calculated = (subtotal * appliedCoupon.discountPercent) / 100;
      couponDiscount = Math.min(calculated, appliedCoupon.maxDiscount || calculated);
    }
  }

  // Total savings
  const totalSavings = mrpSavings + couponDiscount + (cartItems.length > 0 && isFreeDelivery ? (settings?.deliveryFee || 25) : 0);

  // Final payable total
  const finalPayable = Math.max(0, subtotal + deliveryFee + handlingFee - couponDiscount);

  // Apply Coupon
  const applyCoupon = (code) => {
    const clean = code.trim().toUpperCase();
    const found = settings.coupons?.find(c => c.code === clean);

    if (!found) {
      showNotification('Invalid coupon code. Try WELCOME50 or KIRANA10', 'error');
      return { success: false, message: 'Invalid coupon code' };
    }

    if (subtotal < (found.minOrder || 0)) {
      showNotification(`Minimum cart value of ₹${found.minOrder} required for ${clean}`, 'warning');
      return { success: false, message: `Minimum cart value of ₹${found.minOrder} required` };
    }

    setAppliedCoupon(found);
    showNotification(`Coupon ${clean} applied successfully!`, 'success');
    return { success: true };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    showNotification('Coupon removed', 'info');
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      totalItemsCount,
      subtotal,
      totalMrp,
      mrpSavings,
      deliveryFee,
      handlingFee,
      isFreeDelivery,
      appliedCoupon,
      applyCoupon,
      removeCoupon,
      couponDiscount,
      totalSavings,
      finalPayable,
      notification,
      showNotification,
      authPrompt,
      setAuthPrompt,
      closeAuthPrompt: () => setAuthPrompt(null)
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}

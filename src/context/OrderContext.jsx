import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../lib/storage';
import { useProducts } from './ProductContext';

const OrderContext = createContext();

export const ORDER_STATUSES = {
  PLACED: 'placed',
  PAYMENT_PENDING: 'payment_pending',
  PAYMENT_CONFIRMED: 'payment_confirmed',
  ACCEPTED: 'accepted',
  PREPARING: 'preparing',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

const INITIAL_SAMPLE_ORDERS = [
  {
    id: 'SK-90812',
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25 mins ago
    customer: {
      name: 'Pooja Verma',
      phone: '9845012345',
      email: 'pooja.verma@example.com'
    },
    address: {
      flat: 'Flat 304, Green Palms Apt',
      street: '17th Cross, HSR Sector 4',
      landmark: 'Near Club House',
      city: 'Bangalore',
      pincode: '560102'
    },
    items: [
      { id: 'dry-1', name: 'Amul Taaza Homogenised Toned Milk', brand: 'Amul', size: '1 L Tetra', price: 74, quantity: 2, image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80' },
      { id: 'dry-4', name: 'Fresh Farm Brown Eggs (Pack of 6)', brand: 'Farm Fresh', size: '6 Pcs', price: 65, quantity: 1, image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=600&q=80' },
      { id: 'dry-5', name: 'Modern 100% Whole Wheat Bread Loaf', brand: 'Modern', size: '400 g', price: 45, quantity: 1, image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80' }
    ],
    bill: {
      subtotal: 258,
      deliveryFee: 0,
      handlingFee: 4,
      discount: 0,
      total: 262
    },
    paymentMethod: 'upi_qr',
    paymentStatus: 'paid', // verified
    paymentRef: 'UPI-HDFC-99824',
    orderStatus: ORDER_STATUSES.OUT_FOR_DELIVERY,
    deliverySlot: 'Express (15-25 mins)',
    estimatedDeliveryTime: 'Arriving in ~8 mins',
    instructions: 'Please do not ring bell, leave at doorstep'
  },
  {
    id: 'SK-88104',
    createdAt: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
    customer: {
      name: 'Amit Patel',
      phone: '9820098200',
      email: 'amit.patel@example.com'
    },
    address: {
      flat: 'House #42, 5th Cross',
      street: 'Koramangala 4th Block',
      landmark: 'Near Sony World Signal',
      city: 'Bangalore',
      pincode: '560034'
    },
    items: [
      { id: 'snk-1', name: "Lay's India's Magic Masala Potato Chips", brand: "Lay's", size: '50 g', price: 20, quantity: 3, image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=600&q=80' },
      { id: 'bev-1', name: 'Coca-Cola Soft Drink Bottle', brand: 'Coca-Cola', size: '750 ml', price: 40, quantity: 2, image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80' },
      { id: 'choc-1', name: 'Cadbury Dairy Milk Silk Chocolate Bar', brand: 'Cadbury', size: '150 g', price: 175, quantity: 1, image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=600&q=80' }
    ],
    bill: {
      subtotal: 315,
      deliveryFee: 0,
      handlingFee: 4,
      discount: 0,
      total: 319
    },
    paymentMethod: 'upi_qr',
    paymentStatus: 'paid',
    paymentRef: 'UPI-ICICI-81102',
    orderStatus: ORDER_STATUSES.DELIVERED,
    deliverySlot: 'Express (15-25 mins)',
    deliveredAt: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
    instructions: 'Call when outside building gate'
  }
];

export function OrderProvider({ children }) {
  const { deductStockForOrder, restoreStockForOrder } = useProducts();
  const [orders, setOrders] = useState(() => {
    return storage.get('orders', INITIAL_SAMPLE_ORDERS);
  });

  const [activeTrackingId, setActiveTrackingId] = useState(() => {
    return storage.get('activeTrackingId', 'SK-90812');
  });

  useEffect(() => {
    storage.set('orders', orders);
  }, [orders]);

  useEffect(() => {
    storage.set('activeTrackingId', activeTrackingId);
  }, [activeTrackingId]);

  // Create order
  const createOrder = (orderData) => {
    const orderNumber = `SK-${Math.floor(10000 + Math.random() * 90000)}`;
    const newOrder = {
      id: orderNumber,
      createdAt: new Date().toISOString(),
      orderStatus: ORDER_STATUSES.PLACED,
      paymentStatus: orderData.paymentMethod === 'cod' ? 'pending' : (orderData.paymentStatus || 'pending'),
      ...orderData
    };

    // Deduct stock from inventory
    deductStockForOrder(newOrder.items);

    setOrders(prev => [newOrder, ...prev]);
    setActiveTrackingId(orderNumber);
    return newOrder;
  };

  // Update order status (Admin or workflow)
  const updateOrderStatus = (orderId, newStatus, note = '') => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        const updated = {
          ...order,
          orderStatus: newStatus,
          lastUpdated: new Date().toISOString()
        };
        if (newStatus === ORDER_STATUSES.DELIVERED) {
          updated.deliveredAt = new Date().toISOString();
        }
        if (note) {
          updated.adminNote = note;
        }
        return updated;
      }
      return order;
    }));
  };

  // Verify payment status
  const verifyPayment = (orderId, isPaid = true, paymentRef = '') => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          paymentStatus: isPaid ? 'paid' : 'failed',
          paymentRef: paymentRef || (isPaid ? `UPI-TEST-${Math.floor(100000 + Math.random() * 900000)}` : null),
          orderStatus: isPaid && order.orderStatus === ORDER_STATUSES.PLACED ? ORDER_STATUSES.ACCEPTED : order.orderStatus
        };
      }
      return order;
    }));
  };

  // Cancel order
  const cancelOrder = (orderId, reason = 'Cancelled by customer') => {
    const target = orders.find(o => o.id === orderId);
    if (target && target.orderStatus !== ORDER_STATUSES.CANCELLED && target.orderStatus !== ORDER_STATUSES.DELIVERED) {
      restoreStockForOrder(target.items);
      setOrders(prev => prev.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            orderStatus: ORDER_STATUSES.CANCELLED,
            cancellationReason: reason,
            cancelledAt: new Date().toISOString()
          };
        }
        return o;
      }));
    }
  };

  // Find order by ID
  const getOrderById = (id) => {
    return orders.find(o => o.id === id) || null;
  };

  return (
    <OrderContext.Provider value={{
      orders,
      activeTrackingId,
      setActiveTrackingId,
      createOrder,
      updateOrderStatus,
      verifyPayment,
      cancelOrder,
      getOrderById
    }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (!context) throw new Error('useOrders must be used within an OrderProvider');
  return context;
}

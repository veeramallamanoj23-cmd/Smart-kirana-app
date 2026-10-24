export const INITIAL_STORE_SETTINGS = {
  storeName: 'Smart Kirana',
  tagline: 'Superfast Online Grocery & General Store',
  phone: '+91 98765 43210',
  whatsapp: '+91 98765 43210',
  email: 'care@smartkirana.store',
  storeAddress: 'Shop #14, Main Market Road, Near Gandhi Chowk, Bangalore 560034',
  operatingHours: '7:00 AM - 11:00 PM',
  isOpen: true,
  deliveryFee: 25,
  freeDeliveryThreshold: 199,
  handlingFee: 4,
  estimatedDeliveryTime: '15-25 Mins',
  merchantUpiId: 'smartkirana@okhdfcbank',
  merchantName: 'Smart Kirana Store',
  serviceablePincodes: ['560001', '560034', '560102', '560068', '560095', '110001', '400001', '500001'],
  serviceableAreas: [
    'Koramangala (Blocks 1-8)',
    'HSR Layout (Sectors 1-7)',
    'BTM Layout (Stages 1 & 2)',
    'Indiranagar & Domlur',
    'Jayanagar 4th Block',
    'Bellandur & Green Glen'
  ],
  coupons: [
    { code: 'WELCOME50', discount: 50, minOrder: 250, description: '₹50 flat off on your first order above ₹250' },
    { code: 'KIRANA10', discountPercent: 10, maxDiscount: 75, minOrder: 399, description: '10% off up to ₹75 on orders above ₹399' },
    { code: 'FREEDEL', freeDelivery: true, minOrder: 149, description: 'Free delivery on orders above ₹149' }
  ]
};

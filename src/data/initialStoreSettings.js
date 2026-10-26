export const INITIAL_STORE_SETTINGS = {
  storeName: 'Smart Kirana',
  tagline: 'Superfast Online Grocery & General Store',
  phone: '+91 9392398990',
  whatsapp: '+91 9392398990',
  email: 'care@smartkirana.store',
  storeAddress: 'Shop #14, Main Market Road, Near Gandhi Chowk, Bangalore 560034',
  storeLat: 12.9352,
  storeLng: 77.6245,
  maxDeliveryRadiusKm: 10.0,
  operatingHours: '7:00 AM - 11:00 PM',
  isOpen: true,
  deliveryFee: 25,
  freeDeliveryThreshold: 199,
  handlingFee: 4,
  estimatedDeliveryTime: '15-25 Mins',
  merchantUpiId: '9392398990@okaxis',
  merchantName: 'Smart Kirana Store',
  serviceablePincodes: ['560034', '560095', '560102', '560068', '560001'],
  deliveryAreas: [
    {
      id: 'area-koramangala',
      name: 'Koramangala & Ejipura',
      pincodes: ['560034', '560095'],
      isActive: true,
      description: '15-minute express dispatch zone'
    },
    {
      id: 'area-hsr-btm',
      name: 'HSR Layout & BTM Ring Road',
      pincodes: ['560102', '560068'],
      isActive: true,
      description: 'South Bangalore residential corridor'
    },
    {
      id: 'area-cbd-central',
      name: 'Bangalore CBD & MG Road',
      pincodes: ['560001'],
      isActive: true,
      description: 'Central urban corridor'
    }
  ],
  serviceableAreas: [
    'Koramangala & Ejipura',
    'HSR Layout & BTM Ring Road',
    'Bangalore CBD & MG Road'
  ],
  coupons: [
    { code: 'WELCOME50', discount: 50, minOrder: 250, description: '₹50 flat off on your first order above ₹250' },
    { code: 'KIRANA10', discountPercent: 10, maxDiscount: 75, minOrder: 399, description: '10% off up to ₹75 on orders above ₹399' },
    { code: 'FREEDEL', freeDelivery: true, minOrder: 149, description: 'Free delivery on orders above ₹149' }
  ]
};

import React, { useState } from 'react';
import { 
  ArrowLeft, 
  MapPin, 
  ShieldCheck, 
  AlertCircle, 
  Truck, 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  Lock,
  Phone,
  User,
  Tag,
  ArrowRight
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { useOrders } from '../../context/OrderContext';
import { formatCurrency } from '../../lib/upi';
import UpiPaymentModal from './UpiPaymentModal';

export default function CheckoutPage({ onBackToShopping, onOrderComplete }) {
  const { 
    cartItems, 
    subtotal, 
    deliveryFee, 
    handlingFee, 
    couponDiscount, 
    finalPayable, 
    appliedCoupon,
    clearCart 
  } = useCart();

  const { customer, selectedAddress, setSelectedAddress, addAddress } = useAuth();
  const { settings, isPincodeServiceable } = useStore();
  const { createOrder, verifyPayment } = useOrders();

  // Form State
  const [formData, setFormData] = useState({
    name: customer?.name || 'Rohan Sharma',
    phone: customer?.phone || '9876543210',
    flat: selectedAddress?.flat || 'Flat 402, Sunshine Heights',
    street: selectedAddress?.street || '14th Main, 4th Sector, HSR Layout',
    landmark: selectedAddress?.landmark || 'Near BDA Complex',
    city: 'Bangalore',
    pincode: selectedAddress?.pincode || '560102',
    instructions: 'Please ring bell once and leave bag at door',
    deliverySlot: 'Express (15-25 Mins)',
    paymentMethod: 'upi_qr' // 'upi_qr' or 'cod'
  });

  const [pincodeError, setPincodeError] = useState('');
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate PIN code on change
  const handlePincodeChange = (e) => {
    const pin = e.target.value.replace(/\D/g, '').slice(0, 6);
    setFormData(prev => ({ ...prev, pincode: pin }));

    if (pin.length === 6) {
      if (!isPincodeServiceable(pin)) {
        setPincodeError(`PIN ${pin} is outside our current express delivery area. Active PINs: ${settings.serviceablePincodes.join(', ')}`);
      } else {
        setPincodeError('');
      }
    } else {
      setPincodeError('');
    }
  };

  const isCurrentPinValid = isPincodeServiceable(formData.pincode);

  const handleSubmitOrder = (e) => {
    e.preventDefault();

    if (!formData.name.trim() || formData.phone.length < 10) {
      alert('Please provide your full name and valid 10-digit mobile number');
      return;
    }

    if (!isCurrentPinValid) {
      setPincodeError(`PIN ${formData.pincode} is not serviceable by Smart Kirana.`);
      return;
    }

    setIsSubmitting(true);

    const orderPayload = {
      customer: {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: customer?.email || `${formData.phone}@smartkirana.customer`
      },
      address: {
        flat: formData.flat,
        street: formData.street,
        landmark: formData.landmark,
        city: formData.city,
        pincode: formData.pincode
      },
      items: cartItems.map(item => ({
        id: item.id,
        name: item.name,
        brand: item.brand,
        size: item.size,
        price: item.price,
        quantity: item.quantity,
        image: item.image
      })),
      bill: {
        subtotal,
        deliveryFee,
        handlingFee,
        discount: couponDiscount,
        total: finalPayable
      },
      paymentMethod: formData.paymentMethod,
      paymentStatus: formData.paymentMethod === 'cod' ? 'pending' : 'pending',
      deliverySlot: formData.deliverySlot,
      instructions: formData.instructions
    };

    const newOrder = createOrder(orderPayload);
    setCreatedOrder(newOrder);

    if (formData.paymentMethod === 'upi_qr') {
      setIsSubmitting(false);
      setShowUpiModal(true);
    } else {
      // Cash on Delivery
      setTimeout(() => {
        setIsSubmitting(false);
        clearCart();
        onOrderComplete(newOrder.id);
      }, 800);
    }
  };

  const handlePaymentSuccess = (orderId, paymentRef) => {
    verifyPayment(orderId, true, paymentRef);
    setShowUpiModal(false);
    clearCart();
    onOrderComplete(orderId);
  };

  if (cartItems.length === 0 && !createdOrder) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <h2 className="text-xl font-extrabold text-slate-800">Your basket is empty</h2>
        <p className="text-xs text-slate-500 mt-2">Add items to proceed to checkout.</p>
        <button
          onClick={onBackToShopping}
          className="mt-6 px-6 py-2.5 bg-kirana-600 hover:bg-kirana-700 text-white font-bold text-xs rounded-2xl shadow-md transition-all"
        >
          Return to Store
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Top Navigation */}
      <button
        onClick={onBackToShopping}
        className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-kirana-700 transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to shopping</span>
      </button>

      <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Checkout & Delivery
          </h1>
          <p className="text-xs text-slate-500">Express delivery directly to your door</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-kirana-700 font-bold bg-kirana-50 px-3 py-1.5 rounded-xl border border-kirana-200">
          <Lock className="w-3.5 h-3.5" />
          <span>256-bit Secure Checkout</span>
        </div>
      </div>

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        
        {/* Left Column: Customer details & Delivery Address */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* 1. Contact Information */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <User className="w-4 h-4 text-kirana-600" />
              <span>1. Customer Information</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Rohan Sharma"
                  className="w-full mt-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-kirana-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600">Mobile Number *</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                    placeholder="9876543210"
                    className="w-full pl-12 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-kirana-500 font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Delivery Address & PIN Code Verification */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <MapPin className="w-4 h-4 text-kirana-600" />
                <span>2. Delivery Address</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isCurrentPinValid ? 'bg-kirana-100 text-kirana-800' : 'bg-red-100 text-red-800'}`}>
                {isCurrentPinValid ? '✓ In Service Area' : '⚠ Out of Service Area'}
              </span>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600">Flat / House No. / Apartment *</label>
              <input
                type="text"
                required
                value={formData.flat}
                onChange={e => setFormData({ ...formData, flat: e.target.value })}
                placeholder="e.g. Flat 402, Sunshine Heights"
                className="w-full mt-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-kirana-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600">Street / Colony / Sector *</label>
              <input
                type="text"
                required
                value={formData.street}
                onChange={e => setFormData({ ...formData, street: e.target.value })}
                placeholder="e.g. 14th Main, 4th Sector, HSR Layout"
                className="w-full mt-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-kirana-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600">Landmark (Optional)</label>
                <input
                  type="text"
                  value={formData.landmark}
                  onChange={e => setFormData({ ...formData, landmark: e.target.value })}
                  placeholder="e.g. Near BDA Complex"
                  className="w-full mt-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-kirana-500"
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
                  placeholder="e.g. 560102"
                  className="w-full mt-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-kirana-500 font-mono font-bold"
                />
              </div>
            </div>

            {pincodeError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{pincodeError}</span>
              </div>
            )}

            <div>
              <label className="text-[11px] font-bold text-slate-600">Delivery Instructions</label>
              <input
                type="text"
                value={formData.instructions}
                onChange={e => setFormData({ ...formData, instructions: e.target.value })}
                placeholder="e.g. Leave with security guard, don't ring bell"
                className="w-full mt-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-kirana-500"
              />
            </div>
          </div>

          {/* 3. Delivery Speed Slot */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Truck className="w-4 h-4 text-kirana-600" />
              <span>3. Delivery Window</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                { slot: 'Express (15-25 Mins)', tag: 'Fastest ⚡', desc: 'Nearest rider dispatched' },
                { slot: 'Evening (6:00 - 8:00 PM)', tag: 'Convenient', desc: 'Deliver after work' },
                { slot: 'Tomorrow Morning (7:00 - 9:00 AM)', tag: 'Morning Fresh', desc: 'Fresh milk & bread' }
              ].map(opt => (
                <div
                  key={opt.slot}
                  onClick={() => setFormData({ ...formData, deliverySlot: opt.slot })}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                    formData.deliverySlot === opt.slot
                      ? 'border-kirana-600 bg-kirana-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <span className="text-[10px] font-bold text-kirana-700 bg-kirana-100 px-1.5 py-0.2 rounded">
                    {opt.tag}
                  </span>
                  <p className="font-bold text-xs text-slate-800 mt-1">{opt.slot}</p>
                  <p className="text-[10px] text-slate-500">{opt.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Payment Method Selection */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <CreditCard className="w-4 h-4 text-kirana-600" />
              <span>4. Choose Payment Method</span>
            </div>

            <div className="space-y-2.5">
              
              {/* Option 1: UPI QR Code (Recommended) */}
              <label 
                className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  formData.paymentMethod === 'upi_qr'
                    ? 'border-kirana-600 bg-kirana-50/60 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="upi_qr"
                  checked={formData.paymentMethod === 'upi_qr'}
                  onChange={() => setFormData({ ...formData, paymentMethod: 'upi_qr' })}
                  className="mt-1 text-kirana-600 focus:ring-kirana-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                      UPI QR Code (Recommended)
                    </span>
                    <span className="text-[10px] font-bold bg-amber-400 text-slate-900 px-2 py-0.2 rounded-full">
                      Zero Contact
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Scan with Google Pay, PhonePe, Paytm, BHIM, Cred or bank app.
                  </p>
                </div>
              </label>

              {/* Option 2: Cash on Delivery */}
              <label 
                className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  formData.paymentMethod === 'cod'
                    ? 'border-kirana-600 bg-kirana-50/60 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={formData.paymentMethod === 'cod'}
                  onChange={() => setFormData({ ...formData, paymentMethod: 'cod' })}
                  className="mt-1 text-kirana-600 focus:ring-kirana-500"
                />
                <div>
                  <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                    Cash / UPI on Delivery
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Pay in cash or scan rider's QR code when order arrives.
                  </p>
                </div>
              </label>

            </div>
          </div>

        </div>

        {/* Right Column: Order Summary & Checkout Action */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4 sticky top-24">
            
            <h3 className="font-extrabold text-slate-900 text-base pb-3 border-b border-slate-100">
              Order Summary ({cartItems.length} items)
            </h3>

            {/* Compact items list */}
            <div className="max-h-56 overflow-y-auto space-y-2.5 pr-1 divide-y divide-slate-50">
              {cartItems.map(item => (
                <div key={item.id} className="pt-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-9 h-9 object-cover rounded-lg border border-slate-100 flex-shrink-0" 
                    />
                    <div className="truncate">
                      <p className="font-semibold text-slate-800 truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-400">{item.quantity} × {formatCurrency(item.price)}</p>
                    </div>
                  </div>
                  <span className="font-bold text-slate-900 whitespace-nowrap">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Bill Details */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Delivery Partner Fee</span>
                <span>{deliveryFee === 0 ? <span className="text-kirana-700 font-bold">FREE</span> : formatCurrency(deliveryFee)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Handling Fee</span>
                <span>{formatCurrency(handlingFee)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-kirana-700 font-semibold">
                  <span>Coupon ({appliedCoupon?.code})</span>
                  <span>-{formatCurrency(couponDiscount)}</span>
                </div>
              )}

              <div className="pt-2.5 border-t border-slate-200 flex justify-between font-black text-sm text-slate-900">
                <span>Grand Total</span>
                <span className="text-base text-kirana-700">{formatCurrency(finalPayable)}</span>
              </div>
            </div>

            {/* Security note */}
            <div className="p-2.5 bg-slate-50 rounded-xl text-[11px] text-slate-500 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-kirana-600 flex-shrink-0" />
              <span>Full refund if items are damaged or missing</span>
            </div>

            {/* Place Order CTA Button */}
            <button
              type="submit"
              disabled={isSubmitting || !isCurrentPinValid}
              className="w-full py-3.5 bg-kirana-600 hover:bg-kirana-700 active:scale-[0.99] disabled:opacity-50 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-elevated transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>Processing Order...</span>
              ) : (
                <>
                  <span>
                    {formData.paymentMethod === 'upi_qr' 
                      ? `Proceed to UPI Payment (${formatCurrency(finalPayable)})` 
                      : `Place Cash on Delivery Order (${formatCurrency(finalPayable)})`}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </div>
        </div>

      </form>

      {/* UPI QR Payment Modal */}
      {showUpiModal && createdOrder && (
        <UpiPaymentModal
          isOpen={showUpiModal}
          onClose={() => setShowUpiModal(false)}
          order={createdOrder}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}

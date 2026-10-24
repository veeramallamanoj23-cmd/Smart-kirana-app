import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingCart, 
  Zap, 
  Tag, 
  ArrowRight, 
  ShieldCheck, 
  Check, 
  AlertCircle,
  Truck
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../lib/upi';

export default function CartDrawer({ isOpen, onClose, onProceedToCheckout }) {
  const { 
    cartItems, 
    updateQuantity, 
    removeFromCart, 
    clearCart,
    subtotal, 
    totalMrp, 
    deliveryFee, 
    handlingFee, 
    isFreeDelivery,
    appliedCoupon, 
    applyCoupon, 
    removeCoupon, 
    couponDiscount, 
    totalSavings, 
    finalPayable 
  } = useCart();

  const { settings } = useStore();
  const { selectedAddress } = useAuth();
  const [couponInput, setCouponInput] = useState('');

  if (!isOpen) return null;

  const freeDeliveryThreshold = settings.freeDeliveryThreshold || 199;
  const amountNeededForFreeDelivery = Math.max(0, freeDeliveryThreshold - subtotal);
  const freeDeliveryProgress = Math.min(100, (subtotal / freeDeliveryThreshold) * 100);

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (!couponInput) return;
    const res = applyCoupon(couponInput);
    if (res.success) {
      setCouponInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-white z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-kirana-50 text-kirana-700 flex items-center justify-center font-bold">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Your Kirana Basket</h3>
                <p className="text-[11px] text-slate-500">
                  {cartItems.length} unique item{cartItems.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {cartItems.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                  title="Clear basket"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Delivery location & Free Delivery Meter */}
          {cartItems.length > 0 && (
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-100">
              <div className="flex items-center justify-between text-xs mb-2">
                <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                  <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>Delivering in 15-25 Mins</span>
                </div>
                <span className="text-[11px] text-slate-500">
                  to {selectedAddress?.street ? `${selectedAddress.street.slice(0, 20)}...` : 'your location'}
                </span>
              </div>

              {/* Free delivery status bar */}
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1 font-semibold">
                  {isFreeDelivery ? (
                    <span className="text-kirana-700 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Yay! You unlocked FREE Delivery
                    </span>
                  ) : (
                    <span className="text-slate-600">
                      Add <strong className="text-kirana-700">{formatCurrency(amountNeededForFreeDelivery)}</strong> more for FREE delivery
                    </span>
                  )}
                  <span className="text-slate-400 font-mono text-[10px]">{Math.round(freeDeliveryProgress)}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-kirana-600 rounded-full transition-all duration-300" 
                    style={{ width: `${freeDeliveryProgress}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Scrollable Items Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
            {cartItems.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-kirana-50 text-kirana-600 flex items-center justify-center mb-4">
                  <ShoppingCart className="w-10 h-10 stroke-[1.5]" />
                </div>
                <h4 className="font-extrabold text-slate-800 text-lg">Your cart is empty</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Browse fresh groceries, snacks, cool drinks, and daily staples to start filling your basket.
                </p>
                <button
                  onClick={onClose}
                  className="mt-6 px-6 py-2.5 bg-kirana-600 hover:bg-kirana-700 text-white font-bold text-xs rounded-2xl shadow-md transition-all"
                >
                  Browse Store Catalog
                </button>
              </div>
            ) : (
              cartItems.map((item) => {
                const isMax = item.quantity >= item.stock;

                return (
                  <div 
                    key={item.id}
                    className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-3"
                  >
                    {/* Item Thumbnail */}
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-14 h-14 object-cover rounded-xl border border-slate-100 flex-shrink-0"
                    />

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-xs text-slate-900 truncate">{item.name}</h5>
                      <p className="text-[10px] text-slate-500">{item.brand} • {item.size}</p>
                      
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="text-xs font-black text-slate-900">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                        {item.mrp > item.price && (
                          <span className="text-[10px] text-slate-400 line-through">
                            {formatCurrency(item.mrp * item.quantity)}
                          </span>
                        )}
                      </div>

                      {isMax && (
                        <span className="text-[9px] font-bold text-amber-600 block mt-0.5">
                          Max available stock reached
                        </span>
                      )}
                    </div>

                    {/* Quantity Stepper */}
                    <div className="flex items-center bg-kirana-600 text-white rounded-xl shadow-sm overflow-hidden flex-shrink-0">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1, item.stock)}
                        className="p-1.5 hover:bg-kirana-700 transition-colors"
                        title="Reduce"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2 font-black text-xs select-none min-w-[20px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1, item.stock)}
                        disabled={isMax}
                        className="p-1.5 hover:bg-kirana-700 disabled:opacity-40 transition-colors"
                        title="Increase"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}

            {/* Bill Summary Section */}
            {cartItems.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
                
                {/* Coupon Code Section */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-kirana-600" /> Apply Coupon
                    </span>
                    {appliedCoupon && (
                      <button 
                        onClick={removeCoupon} 
                        className="text-[11px] text-rose-600 font-bold hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {appliedCoupon ? (
                    <div className="p-2 bg-kirana-100/60 rounded-xl border border-kirana-200 text-xs text-kirana-900 flex items-center justify-between">
                      <div>
                        <span className="font-mono font-bold">{appliedCoupon.code}</span>
                        <p className="text-[10px] text-kirana-700">{appliedCoupon.description}</p>
                      </div>
                      <span className="font-extrabold text-kirana-700">
                        -{formatCurrency(couponDiscount)}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <form onSubmit={handleApplyCoupon} className="flex gap-1.5">
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          placeholder="e.g. WELCOME50"
                          className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl uppercase font-mono font-bold focus:outline-none focus:ring-2 focus:ring-kirana-500"
                        />
                        <button
                          type="submit"
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors"
                        >
                          Apply
                        </button>
                      </form>

                      {/* Coupon Quick Chips */}
                      <div className="flex gap-1.5 mt-2 overflow-x-auto no-scrollbar">
                        {settings.coupons?.map(c => (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => applyCoupon(c.code)}
                            className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-white border border-dashed border-amber-400 hover:bg-amber-50 text-slate-700 whitespace-nowrap"
                          >
                            {c.code}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Itemized Bill Breakdown */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Items Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>Delivery Partner Fee</span>
                    <span>
                      {isFreeDelivery ? (
                        <span className="text-kirana-700 font-bold uppercase text-[10px] bg-kirana-100 px-1.5 py-0.2 rounded">
                          FREE
                        </span>
                      ) : (
                        formatCurrency(deliveryFee)
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>Handling & Packaging</span>
                    <span>{formatCurrency(handlingFee)}</span>
                  </div>

                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-kirana-700 font-semibold">
                      <span>Coupon Discount</span>
                      <span>-{formatCurrency(couponDiscount)}</span>
                    </div>
                  )}

                  {/* Savings Banner */}
                  {totalSavings > 0 && (
                    <div className="py-1.5 px-2 bg-emerald-100/70 rounded-xl text-[11px] font-bold text-emerald-900 flex items-center justify-between">
                      <span>Total Savings on this order</span>
                      <span>{formatCurrency(totalSavings)}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200 flex justify-between font-extrabold text-sm text-slate-900">
                    <span>Final Payable Total</span>
                    <span className="text-base text-kirana-700">{formatCurrency(finalPayable)}</span>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Bottom Fixed Checkout Button */}
          {cartItems.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-white shadow-soft">
              <button
                onClick={() => {
                  onClose();
                  onProceedToCheckout();
                }}
                className="w-full py-3.5 px-4 bg-kirana-600 hover:bg-kirana-700 active:scale-[0.99] text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-elevated flex items-center justify-between transition-all"
              >
                <div className="text-left leading-tight">
                  <span className="text-xs opacity-90 block font-medium">Payable Amount</span>
                  <span>{formatCurrency(finalPayable)}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-kirana-700 px-3 py-1.5 rounded-xl font-bold text-xs sm:text-sm">
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { 
  X, 
  Star, 
  Zap, 
  ShieldCheck, 
  RotateCcw, 
  Truck, 
  Plus, 
  Minus, 
  Sparkles,
  PackageCheck
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../lib/upi';

export default function ProductDetailModal({ product, onClose }) {
  const { cartItems, addToCart, updateQuantity } = useCart();

  if (!product) return null;

  const cartEntry = cartItems.find(item => item.id === product.id);
  const currentQuantity = cartEntry ? cartEntry.quantity : 0;

  const discountPercent = product.mrp > product.price 
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100) 
    : 0;

  const isOutOfStock = !product.isAvailable || product.stock <= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-elevated border border-slate-100 p-5 sm:p-7 animate-in zoom-in-95 duration-150">
        
        {/* Close Button */}
        <div className="flex justify-end">
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 mt-1">
          
          {/* Image preview */}
          <div className="relative aspect-square rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center">
            {discountPercent > 0 && (
              <div className="absolute top-3 left-3 z-10 bg-amber-500 text-slate-950 font-black text-xs px-2.5 py-1 rounded-xl shadow-sm">
                {discountPercent}% OFF
              </div>
            )}
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80';
              }}
            />
          </div>

          {/* Details */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-kirana-700 bg-kirana-50 px-2 py-0.5 rounded-md">
                  {product.brand}
                </span>
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  {product.size}
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug mt-1">
                {product.name}
              </h2>

              {/* Rating & reviews */}
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-lg text-xs">
                  <Star className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                  <span>{product.rating || '4.8'}</span>
                </div>
                <span className="text-xs text-slate-400">({product.reviewsCount || 60} verified ratings)</span>
              </div>

              {/* Price section */}
              <div className="my-3.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900">{formatCurrency(product.price)}</span>
                  {product.mrp > product.price && (
                    <span className="text-sm text-slate-400 line-through">{formatCurrency(product.mrp)}</span>
                  )}
                  {discountPercent > 0 && (
                    <span className="text-xs font-bold text-amber-600">Save {formatCurrency(product.mrp - product.price)}</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Inclusive of all taxes</p>
              </div>

              {/* Description */}
              <div className="my-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Product Details</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{product.description}</p>
              </div>

              {/* Key Assurance Badges */}
              <div className="grid grid-cols-2 gap-2 my-4 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50">
                  <Zap className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span>15-25 Mins Express Delivery</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50">
                  <ShieldCheck className="w-4 h-4 text-kirana-600 flex-shrink-0" />
                  <span>100% Genuine Brand Item</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50">
                  <PackageCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>Available Units: {product.stock}</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50">
                  <RotateCcw className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <span>Instant Return at Doorstep</span>
                </div>
              </div>
            </div>

            {/* Bottom Add Action */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs text-slate-500 block">Total Amount:</span>
                <span className="text-lg font-black text-slate-900">
                  {formatCurrency(product.price * (currentQuantity > 0 ? currentQuantity : 1))}
                </span>
              </div>

              <div>
                {isOutOfStock ? (
                  <button
                    disabled
                    className="px-6 py-2.5 rounded-2xl bg-slate-100 text-slate-400 font-bold text-xs cursor-not-allowed"
                  >
                    Currently Out of Stock
                  </button>
                ) : currentQuantity === 0 ? (
                  <button
                    onClick={() => addToCart(product, 1)}
                    className="px-6 py-2.5 rounded-2xl bg-kirana-600 hover:bg-kirana-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
                  >
                    Add to Cart
                  </button>
                ) : (
                  <div className="flex items-center bg-kirana-600 text-white rounded-2xl shadow-md overflow-hidden">
                    <button
                      onClick={() => updateQuantity(product.id, currentQuantity - 1, product.stock)}
                      className="p-2 sm:p-2.5 hover:bg-kirana-700 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-3 font-black text-sm select-none min-w-[28px] text-center">
                      {currentQuantity}
                    </span>
                    <button
                      onClick={() => addToCart(product, 1)}
                      disabled={currentQuantity >= product.stock}
                      className="p-2 sm:p-2.5 hover:bg-kirana-700 disabled:opacity-40 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

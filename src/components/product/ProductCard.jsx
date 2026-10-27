import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, Star, Zap, Clock, AlertTriangle } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../lib/upi';

export default function ProductCard({ product, onOpenDetail }) {
  const { cartItems, addToCart, updateQuantity } = useCart();

  const cartEntry = cartItems.find(item => item.id === product.id);
  const currentQuantity = cartEntry ? cartEntry.quantity : 0;

  const discountPercent = product.mrp > product.price 
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100) 
    : 0;

  const isOutOfStock = !product.isAvailable || product.stock <= 0;
  const isLowStock = !isOutOfStock && product.stock <= 4;

  const handleAdd = (e) => {
    e.stopPropagation();
    addToCart(product, 1);
  };

  const handleIncrement = (e) => {
    e.stopPropagation();
    addToCart(product, 1);
  };

  const handleDecrement = (e) => {
    e.stopPropagation();
    updateQuantity(product.id, currentQuantity - 1, product.stock);
  };

  return (
    <motion.div 
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={() => onOpenDetail && onOpenDetail(product)}
      className="group relative bg-white rounded-3xl border border-slate-100 hover:border-[#16803D]/30 p-3 sm:p-3.5 flex flex-col justify-between transition-all duration-200 hover:shadow-card-hover cursor-pointer"
    >
      {/* Top Image & Badge Container */}
      <div className="relative aspect-square w-full rounded-2xl bg-[#FAFAF5] overflow-hidden mb-2.5 flex items-center justify-center">
        
        {/* Delivery Time Pill */}
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-lg text-[10px] font-bold text-[#202820] shadow-sm border border-slate-100">
          <Zap className="w-3 h-3 text-[#FF9F43] fill-[#FF9F43]" />
          <span>{product.deliveryTime || '15 mins'}</span>
        </div>

        {/* Discount Badge */}
        {discountPercent > 0 && (
          <div className="absolute top-2 right-2 z-10 bg-[#FF9F43] text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-lg shadow-sm">
            {discountPercent}% OFF
          </div>
        )}

        {/* Product Image with Fallback */}
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80';
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Low Stock / Out of Stock Banner */}
        {isOutOfStock ? (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-rose-600 text-white font-extrabold text-xs px-3 py-1 rounded-full shadow-md uppercase tracking-wider">
              Out of Stock
            </span>
          </div>
        ) : isLowStock ? (
          <div className="absolute bottom-2 left-2 right-2 bg-[#FF9F43]/95 text-slate-950 font-bold text-[10px] py-0.5 px-2 rounded-md text-center shadow-sm">
            ⚡ Only {product.stock} units left!
          </div>
        ) : null}
      </div>

      {/* Product Information */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          {/* Brand & Size */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-0.5">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">{product.brand}</span>
            <span className="font-semibold bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 text-[10px]">{product.size}</span>
          </div>

          {/* Product Name */}
          <h4 className="font-bold text-[#202820] text-xs sm:text-sm line-clamp-2 leading-snug group-hover:text-[#16803D] transition-colors">
            {product.name}
          </h4>

          {/* Star Rating */}
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500">
            <div className="flex items-center gap-0.5 bg-[#DDF7E5] text-[#16803D] font-bold px-1.5 py-0.5 rounded">
              <Star className="w-3 h-3 fill-[#16803D] text-[#16803D]" />
              <span>{product.rating || '4.8'}</span>
            </div>
            <span className="text-[10px] text-slate-400">({product.reviewsCount || 45})</span>
          </div>
        </div>

        {/* Price & Add to Cart Action Row */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
          
          {/* Pricing */}
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm sm:text-base font-extrabold text-[#202820]">
                {formatCurrency(product.price)}
              </span>
              {product.mrp > product.price && (
                <span className="text-[11px] text-slate-400 line-through">
                  {formatCurrency(product.mrp)}
                </span>
              )}
            </div>
            {product.mrp > product.price && (
              <span className="text-[10px] font-bold text-[#16803D] block">
                Save {formatCurrency(product.mrp - product.price)}
              </span>
            )}
          </div>

          {/* Action Button: ADD or Quantity Stepper */}
          <div>
            {isOutOfStock ? (
              <button
                disabled
                className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs cursor-not-allowed"
              >
                Sold Out
              </button>
            ) : currentQuantity === 0 ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAdd}
                className="px-4 sm:px-5 py-1.5 sm:py-2 rounded-xl bg-[#DDF7E5] hover:bg-[#16803D] text-[#16803D] hover:text-white font-extrabold text-xs sm:text-sm border border-[#16803D]/25 hover:border-[#16803D] transition-all shadow-sm"
              >
                ADD
              </motion.button>
            ) : (
              <div 
                onClick={(e) => e.stopPropagation()}
                className="flex items-center bg-[#16803D] text-white rounded-xl shadow-sm overflow-hidden"
              >
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleDecrement}
                  className="p-1.5 sm:p-2 hover:bg-[#146c34] active:bg-[#0f5127] transition-colors"
                  title="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </motion.button>
                <span className="px-2 font-black text-xs sm:text-sm select-none min-w-[20px] text-center">
                  {currentQuantity}
                </span>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleIncrement}
                  disabled={currentQuantity >= product.stock}
                  className="p-1.5 sm:p-2 hover:bg-[#146c34] active:bg-[#0f5127] disabled:opacity-40 disabled:hover:bg-[#16803D] transition-colors"
                  title="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </motion.button>
              </div>
            )}
          </div>

        </div>

      </div>
    </motion.div>
  );
}

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, Clock, Sparkles, ArrowRight } from 'lucide-react';
import ProductCard from '../product/ProductCard';

export default function DealsSection({ products, onOpenDetail, onSelectCategory }) {
  // Deal products (filtered by isDeal or discount > 15%)
  const dealProducts = products.filter(p => p.isDeal || ((p.mrp - p.price) / p.mrp) >= 0.15).slice(0, 6);

  // Countdown timer for "Today's Deals"
  const [timeLeft, setTimeLeft] = useState({ hours: 5, minutes: 42, seconds: 18 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (dealProducts.length === 0) return null;

  return (
    <motion.section 
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="my-6 sm:my-8 bg-gradient-to-br from-[#FFF3E6] via-white to-[#DDF7E5]/30 p-4 sm:p-6 rounded-3xl border border-[#FF9F43]/25 shadow-soft"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#FF9F43] text-slate-950 flex items-center justify-center font-bold shadow-md shadow-[#FF9F43]/20">
            <Flame className="w-5 h-5 fill-slate-950 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-extrabold text-[#202820] tracking-tight">
                Today's Lightning Deals
              </h3>
              <span className="text-[10px] font-black uppercase bg-[#FF9F43] text-slate-950 px-2.5 py-0.5 rounded-full shadow-sm">
                Up to 25% OFF
              </span>
            </div>
            <p className="text-xs text-slate-500">Handpicked everyday staples at special discounted prices</p>
          </div>
        </div>

        {/* Live Countdown Timer */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-[#FF9F43]/30 shadow-sm text-xs">
          <Clock className="w-4 h-4 text-[#EA580C]" />
          <span className="font-semibold text-slate-600">Ends in:</span>
          <div className="flex items-center gap-1 font-mono font-bold text-[#EA580C]">
            <span className="bg-[#FFF3E6] px-1.5 py-0.5 rounded text-[#EA580C]">{String(timeLeft.hours).padStart(2, '0')}h</span>
            <span>:</span>
            <span className="bg-[#FFF3E6] px-1.5 py-0.5 rounded text-[#EA580C]">{String(timeLeft.minutes).padStart(2, '0')}m</span>
            <span>:</span>
            <span className="bg-[#FFF3E6] px-1.5 py-0.5 rounded text-[#EA580C]">{String(timeLeft.seconds).padStart(2, '0')}s</span>
          </div>
        </div>
      </div>

      {/* Grid of deal products */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {dealProducts.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            onOpenDetail={onOpenDetail}
          />
        ))}
      </div>
    </motion.section>
  );
}

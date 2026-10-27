import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Tag, Zap, ShieldCheck, Sparkles, Clock, Leaf } from 'lucide-react';

const BANNERS = [
  {
    id: 1,
    tag: '⚡ 15-25 MINS EXPRESS DELIVERY',
    tagBg: 'bg-accent-500 text-white',
    title: 'Fresh Groceries, Delivered to Your Doorstep.',
    subtitle: 'Handpicked farm-fresh vegetables, sweet fruits, pure dairy & daily household essentials at authentic local kirana prices.',
    ctaText: 'Shop Now',
    couponCode: 'WELCOME50',
    couponText: 'Use code WELCOME50 for ₹50 OFF',
    categoryTarget: null, // View all / scroll to catalog
    bgGradient: 'from-[#145a27] via-[#16803D] to-[#0f4d22]',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
    imageAlt: 'Fresh grocery basket with vegetables, fruits and staples'
  },
  {
    id: 2,
    tag: '🥦 FARM FRESH HARVEST',
    tagBg: 'bg-[#DDF7E5] text-[#16803D]',
    title: 'Farm Fresh Vegetables & Sweet Fruits',
    subtitle: 'Crisp tomatoes, onions, seasonal greens & orchard-fresh fruits directly sourced from trusted local growers.',
    ctaText: 'Explore Fresh Produce',
    couponCode: 'FRESH15',
    couponText: '15% OFF on Farm Fresh Produce',
    categoryTarget: 'fresh-vegetables',
    bgGradient: 'from-[#1b4332] via-[#2d6a4f] to-[#145a27]',
    image: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=800&q=80',
    imageAlt: 'Fresh farm vegetables and fruits'
  },
  {
    id: 3,
    tag: '🥛 MORNING 6 AM TO NIGHT 11 PM',
    tagBg: 'bg-amber-400 text-slate-900',
    title: 'Pure Dairy, Breakfast & Daily Staples',
    subtitle: 'Fresh pouch milk, paneer, brown bread, farm eggs & premium cooking oils delivered before your morning tea is ready.',
    ctaText: 'Shop Morning Essentials',
    couponCode: 'FREEDEL',
    couponText: 'Free Delivery on Orders Above ₹149',
    categoryTarget: 'dairy-essentials',
    bgGradient: 'from-[#0f5127] via-[#16803D] to-[#d97706]',
    image: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&w=800&q=80',
    imageAlt: 'Daily dairy essentials and groceries'
  }
];

export default function HeroBanner({ onSelectCategory, onShopNow }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % BANNERS.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const banner = BANNERS[currentIndex];

  const handleCtaClick = () => {
    if (banner.categoryTarget && onSelectCategory) {
      onSelectCategory(banner.categoryTarget);
    } else if (onShopNow) {
      onShopNow();
    } else {
      const catalogEl = document.getElementById('catalog-section');
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl shadow-soft my-4 sm:my-6 border border-white/60">
      
      {/* Banner Card */}
      <div className={`relative min-h-[300px] sm:min-h-[340px] md:min-h-[380px] bg-gradient-to-r ${banner.bgGradient} text-white flex flex-col justify-between p-6 sm:p-10 transition-colors duration-1000`}>
        
        {/* Subtle decorative background organic shape */}
        <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
          <svg className="absolute -right-20 -bottom-20 w-[500px] h-[500px]" viewBox="0 0 200 200" fill="currentColor">
            <path d="M45.5,-58.5C59.9,-51.5,73.1,-39.7,78.2,-24.8C83.3,-9.9,80.3,8.1,73.6,24.1C66.8,40.1,56.3,54.1,42.4,63.1C28.5,72.1,11.2,76.2,-4.8,77.9C-20.8,79.5,-35.6,78.7,-48.9,70.8C-62.2,62.9,-74,48,-78.9,31.7C-83.9,15.4,-82.1,-2.3,-75.6,-17.8C-69.1,-33.3,-58,-46.6,-44.6,-53.9C-31.2,-61.2,-15.6,-62.5,0.2,-62.7C15.9,-63,31.1,-65.4,45.5,-58.5Z" transform="translate(100 100)" />
          </svg>
        </div>

        {/* Content & Product Image Split */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center flex-1">
          
          {/* Left Text Content */}
          <div className="md:col-span-7 flex flex-col justify-center">
            
            {/* Top Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3 sm:mb-4">
              <span className={`text-[11px] sm:text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-sm ${banner.tagBg}`}>
                {banner.tag}
              </span>
              <div className="flex items-center gap-1.5 bg-black/25 backdrop-blur-md px-3 py-1 rounded-full text-[11px] sm:text-xs text-amber-300 font-semibold border border-white/10">
                <Tag className="w-3.5 h-3.5" />
                <span>{banner.couponText}</span>
              </div>
            </div>

            {/* Dynamic Headline & Subtitle with Smooth Framer Motion Entrance */}
            <AnimatePresence mode="wait">
              <motion.div
                key={banner.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight sm:leading-[1.15] text-white">
                  {banner.title}
                </h1>
                <p className="text-xs sm:text-base text-white/90 mt-2 sm:mt-3 max-w-xl font-normal leading-relaxed">
                  {banner.subtitle}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Prominent Shop Now CTA */}
            <div className="mt-5 sm:mt-7 flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleCtaClick}
                className="px-6 sm:px-8 py-3 bg-[#FF9F43] hover:bg-[#EA580C] text-slate-950 hover:text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 group"
              >
                <span>{banner.ctaText}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.button>

              <button
                onClick={() => {
                  const catalogEl = document.getElementById('catalog-section');
                  if (catalogEl) catalogEl.scrollIntoView({ behavior: 'smooth' });
                }}
                className="hidden sm:inline-flex px-5 py-3 bg-white/15 hover:bg-white/25 backdrop-blur-md text-white font-bold text-xs sm:text-sm rounded-2xl border border-white/20 transition-all"
              >
                View Catalog
              </button>
            </div>

          </div>

          {/* Right Visual Image */}
          <div className="hidden md:flex md:col-span-5 items-center justify-center relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={banner.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.4 }}
                className="relative w-full aspect-square max-w-[320px] rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20"
              >
                <img
                  src={banner.image}
                  alt={banner.imageAlt}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl text-slate-900 flex items-center justify-between text-xs font-bold shadow-md">
                  <div className="flex items-center gap-1.5">
                    <Leaf className="w-4 h-4 text-[#16803D]" />
                    <span>Farm Fresh & Cleaned</span>
                  </div>
                  <span className="text-[#16803D] font-extrabold">100% Quality</span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

        </div>

        {/* Bottom Bar: Trust Badges & Carousel Dots */}
        <div className="relative z-10 pt-6 mt-4 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Quick Value Props */}
          <div className="flex items-center gap-4 sm:gap-6 text-[11px] sm:text-xs text-white/90 overflow-x-auto no-scrollbar w-full sm:w-auto">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <Zap className="w-3.5 h-3.5 text-[#FF9F43]" />
              <span className="font-semibold">15-25 Mins Express Delivery</span>
            </div>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <ShieldCheck className="w-3.5 h-3.5 text-[#DDF7E5]" />
              <span className="font-semibold">Best Price Kirana Promise</span>
            </div>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <Clock className="w-3.5 h-3.5 text-amber-300" />
              <span className="font-semibold">Open 6 AM - 11 PM</span>
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center gap-2">
            {BANNERS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentIndex === idx ? 'w-7 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

        </div>

      </div>
    </div>
  );
}

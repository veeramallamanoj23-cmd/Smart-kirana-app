import React, { useState, useEffect } from 'react';
import { Sparkles, Clock, ArrowRight, Zap, Tag, ShieldCheck } from 'lucide-react';

const BANNERS = [
  {
    id: 1,
    tag: '⚡ SUPERFAST 15-25 MINS',
    title: 'Apki Apni Kirana Dukan, Now Digital!',
    subtitle: 'Over 500+ fresh daily groceries, dairy & general items delivered in minutes.',
    ctaText: 'Shop Daily Essentials',
    couponCode: 'WELCOME50',
    couponText: 'Use code WELCOME50 for ₹50 OFF',
    bgGradient: 'from-emerald-700 via-kirana-600 to-teal-800',
    accentColor: 'bg-amber-400 text-slate-900',
    categoryTarget: 'groceries-staples'
  },
  {
    id: 2,
    tag: '🥛 MORNING 6 AM TO NIGHT 11 PM',
    title: 'Fresh Milk, Bread, Eggs & Butter',
    subtitle: 'Daily essentials delivered fresh to your door before you brew your morning tea.',
    ctaText: 'Explore Dairy Shelf',
    couponCode: 'FREEDEL',
    couponText: 'Free delivery on orders above ₹149',
    bgGradient: 'from-amber-600 via-yellow-600 to-emerald-700',
    accentColor: 'bg-white text-emerald-800',
    categoryTarget: 'dairy-essentials'
  },
  {
    id: 3,
    tag: '🎉 WEEKEND SNACKS DHAMAKA',
    title: 'Chilled Drinks, Chips & Chocolates',
    subtitle: 'Binge-ready snacks, cold sodas, cookies & candies at discounted prices.',
    ctaText: 'Grab Snacks Now',
    couponCode: 'KIRANA10',
    couponText: 'Get 10% Extra Discount',
    bgGradient: 'from-indigo-800 via-purple-700 to-kirana-700',
    accentColor: 'bg-yellow-400 text-slate-950',
    categoryTarget: 'snacks'
  }
];

export default function HeroBanner({ onSelectCategory }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % BANNERS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const banner = BANNERS[currentIndex];

  return (
    <div className="relative overflow-hidden rounded-3xl shadow-soft my-4 sm:my-6 border border-white/20">
      {/* Banner background */}
      <div className={`p-6 sm:p-10 text-white bg-gradient-to-r ${banner.bgGradient} transition-all duration-700 min-h-[220px] sm:min-h-[260px] flex flex-col justify-between relative`}>
        
        {/* Decorative background shapes */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-10 pointer-events-none flex items-center justify-center">
          <svg className="w-96 h-96 -mr-16" viewBox="0 0 200 200" fill="currentColor">
            <path d="M45.5,-58.5C59.9,-51.5,73.1,-39.7,78.2,-24.8C83.3,-9.9,80.3,8.1,73.6,24.1C66.8,40.1,56.3,54.1,42.4,63.1C28.5,72.1,11.2,76.2,-4.8,77.9C-20.8,79.5,-35.6,78.7,-48.9,70.8C-62.2,62.9,-74,48,-78.9,31.7C-83.9,15.4,-82.1,-2.3,-75.6,-17.8C-69.1,-33.3,-58,-46.6,-44.6,-53.9C-31.2,-61.2,-15.6,-62.5,0.2,-62.7C15.9,-63,31.1,-65.4,45.5,-58.5Z" transform="translate(100 100)" />
          </svg>
        </div>

        {/* Top Badges */}
        <div className="flex flex-wrap items-center gap-2 z-10">
          <span className={`text-[11px] sm:text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-sm ${banner.accentColor}`}>
            {banner.tag}
          </span>
          <div className="flex items-center gap-1.5 bg-black/25 backdrop-blur-md px-3 py-1 rounded-full text-[11px] sm:text-xs text-amber-300 font-semibold border border-white/10">
            <Tag className="w-3.5 h-3.5" />
            <span>{banner.couponText}</span>
          </div>
        </div>

        {/* Middle Content */}
        <div className="my-3 sm:my-4 max-w-2xl z-10">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight sm:leading-snug">
            {banner.title}
          </h2>
          <p className="text-xs sm:text-base text-white/90 mt-2 line-clamp-2 max-w-xl font-normal">
            {banner.subtitle}
          </p>
        </div>

        {/* CTA & Slider Dots */}
        <div className="flex items-center justify-between z-10 pt-2">
          <button
            onClick={() => onSelectCategory(banner.categoryTarget)}
            className="px-4 sm:px-6 py-2 sm:py-2.5 bg-white text-slate-900 hover:bg-amber-400 font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 group"
          >
            <span>{banner.ctaText}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Dots */}
          <div className="flex items-center gap-2">
            {BANNERS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all ${
                  currentIndex === idx ? 'w-6 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'
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

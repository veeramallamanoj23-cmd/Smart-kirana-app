import React from 'react';
import { motion } from 'framer-motion';
import ProductCard from '../product/ProductCard';
import { ArrowRight } from 'lucide-react';

export default function ProductShelf({ 
  title, 
  subtitle, 
  icon, 
  badge, 
  products, 
  onOpenDetail,
  onViewAll,
  maxDisplay = 6
}) {
  const displayItems = products.slice(0, maxDisplay);

  if (displayItems.length === 0) return null;

  return (
    <motion.section 
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35 }}
      className="my-6 sm:my-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 px-1">
        <div className="flex items-center gap-2.5">
          {icon && (
            <div className="w-9 h-9 rounded-2xl bg-[#DDF7E5] text-[#16803D] flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-sm">
              {icon}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-xl font-extrabold text-[#202820] tracking-tight">
                {title}
              </h3>
              {badge && (
                <span className="text-[10px] font-bold bg-[#DDF7E5] text-[#16803D] px-2.5 py-0.5 rounded-full">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>

        {onViewAll && products.length > maxDisplay && (
          <button
            onClick={onViewAll}
            className="text-xs font-bold text-[#16803D] hover:text-[#146c34] flex items-center gap-1 group py-1.5 px-3 rounded-xl hover:bg-[#DDF7E5] transition-colors"
          >
            <span>See all ({products.length})</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {displayItems.map((product) => (
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

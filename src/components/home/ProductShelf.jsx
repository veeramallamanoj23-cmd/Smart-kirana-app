import React from 'react';
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
    <section className="my-6 sm:my-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 px-1">
        <div className="flex items-center gap-2.5">
          {icon && (
            <div className="w-8 h-8 rounded-xl bg-kirana-100 text-kirana-700 flex items-center justify-center font-bold text-base flex-shrink-0">
              {icon}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                {title}
              </h3>
              {badge && (
                <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
        </div>

        {onViewAll && products.length > maxDisplay && (
          <button
            onClick={onViewAll}
            className="text-xs font-bold text-kirana-600 hover:text-kirana-700 flex items-center gap-1 group py-1 px-2 rounded-lg hover:bg-kirana-50 transition-colors"
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
    </section>
  );
}

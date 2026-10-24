import React from 'react';
import { useProducts } from '../../context/ProductContext';

export default function CategoryPills({ selectedCategory, onSelectCategory }) {
  const { categories, products } = useProducts();

  // Helper to count items per category
  const getCategoryCount = (categoryId) => {
    return products.filter(p => p.category === categoryId).length;
  };

  return (
    <div className="my-4 sm:my-6">
      <div className="flex items-center justify-between mb-3 px-1">
        <div>
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
            Shop by Category
          </h3>
          <p className="text-xs text-slate-500">Pick from our organized general store aisles</p>
        </div>
        {selectedCategory && (
          <button
            onClick={() => onSelectCategory(null)}
            className="text-xs font-bold text-kirana-600 hover:text-kirana-700 underline"
          >
            Clear Filter (Show All)
          </button>
        )}
      </div>

      {/* Scrollable pill container */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 overflow-x-auto no-scrollbar py-1 px-1">
        
        {/* All Products button */}
        <button
          onClick={() => onSelectCategory(null)}
          className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs sm:text-sm font-bold transition-all shadow-sm ${
            selectedCategory === null
              ? 'bg-kirana-600 text-white border-kirana-600 shadow-kirana-600/30'
              : 'bg-white text-slate-700 border-slate-200 hover:border-kirana-300 hover:bg-slate-50'
          }`}
        >
          <span className="text-base">🛍️</span>
          <span>All Items</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
            selectedCategory === null ? 'bg-kirana-700 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {products.length}
          </span>
        </button>

        {/* Individual category pills */}
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const count = getCategoryCount(cat.id);

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex-shrink-0 flex items-center gap-2.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl border text-xs sm:text-sm font-bold transition-all shadow-sm ${
                isSelected
                  ? 'bg-kirana-600 text-white border-kirana-600 shadow-kirana-600/30'
                  : 'bg-white text-slate-700 border-slate-200/90 hover:border-kirana-300 hover:bg-kirana-50/40'
              }`}
            >
              <span className="text-base sm:text-lg">{cat.icon}</span>
              <span className="whitespace-nowrap">{cat.shortName}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                isSelected ? 'bg-kirana-700 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}

      </div>
    </div>
  );
}

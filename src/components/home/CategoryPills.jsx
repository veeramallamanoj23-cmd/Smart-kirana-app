import React from 'react';
import { motion } from 'framer-motion';
import { useProducts } from '../../context/ProductContext';
import { Sparkles, Layers, ArrowRight } from 'lucide-react';

export default function CategoryPills({ selectedCategory, onSelectCategory }) {
  const { categories, products } = useProducts();

  // Helper to count items per category
  const getCategoryCount = (categoryId) => {
    return products.filter(p => p.category === categoryId).length;
  };

  return (
    <section className="my-6 sm:my-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-2xl font-extrabold text-[#202820] tracking-tight">
              Shop by Category
            </h2>
            <span className="text-[11px] font-bold bg-[#DDF7E5] text-[#16803D] px-2.5 py-0.5 rounded-full">
              Fresh Aisles
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Vegetables, fruits, fresh milk, daily staples & pantry essentials
          </p>
        </div>

        {selectedCategory && (
          <button
            onClick={() => onSelectCategory(null)}
            className="text-xs sm:text-sm font-bold text-[#16803D] hover:underline flex items-center gap-1 bg-[#DDF7E5]/70 px-3 py-1.5 rounded-xl transition-all"
          >
            <span>Show All Items</span>
            <span className="text-[11px]">✕</span>
          </button>
        )}
      </div>

      {/* Modern Category Cards Row / Grid */}
      <div className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto no-scrollbar py-2 px-1 scroll-smooth">
        
        {/* "All Items" Card */}
        <motion.button
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onSelectCategory(null)}
          className={`flex-shrink-0 w-28 sm:w-32 p-3 sm:p-4 rounded-2xl border text-center flex flex-col items-center justify-between transition-all duration-200 shadow-sm ${
            selectedCategory === null
              ? 'bg-[#16803D] text-white border-[#16803D] shadow-md shadow-[#16803D]/25 ring-2 ring-[#16803D]/20'
              : 'bg-white text-[#202820] border-slate-200 hover:border-[#16803D]/40 hover:bg-[#FAFAF5]'
          }`}
        >
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-2 transition-colors ${
            selectedCategory === null ? 'bg-white/20' : 'bg-[#DDF7E5] text-[#16803D]'
          }`}>
            🛍️
          </div>
          <span className="text-xs sm:text-sm font-extrabold line-clamp-1">
            All Items
          </span>
          <span className={`text-[10px] mt-1 px-2 py-0.5 rounded-full font-bold ${
            selectedCategory === null ? 'bg-[#0f5127] text-white' : 'bg-slate-100 text-slate-500'
          }`}>
            {products.length} Items
          </span>
        </motion.button>

        {/* Individual Category Cards */}
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const count = getCategoryCount(cat.id);

          return (
            <motion.button
              key={cat.id}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex-shrink-0 w-28 sm:w-32 p-3 sm:p-4 rounded-2xl border text-center flex flex-col items-center justify-between transition-all duration-200 shadow-sm ${
                isSelected
                  ? 'bg-[#16803D] text-white border-[#16803D] shadow-md shadow-[#16803D]/25 ring-2 ring-[#16803D]/20'
                  : 'bg-white text-[#202820] border-slate-200 hover:border-[#16803D]/40 hover:bg-[#FAFAF5]'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-2 transition-colors ${
                isSelected ? 'bg-white/20' : 'bg-[#DDF7E5] text-[#16803D]'
              }`}>
                {cat.icon}
              </div>

              <span className="text-xs sm:text-sm font-extrabold line-clamp-1">
                {cat.shortName}
              </span>

              <span className={`text-[10px] mt-1 px-2 py-0.5 rounded-full font-bold ${
                isSelected ? 'bg-[#0f5127] text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {count} {count === 1 ? 'item' : 'items'}
              </span>
            </motion.button>
          );
        })}

      </div>
    </section>
  );
}

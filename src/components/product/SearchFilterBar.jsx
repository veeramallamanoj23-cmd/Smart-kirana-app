import React from 'react';
import { SlidersHorizontal, ArrowUpDown, Check, X, Sparkles } from 'lucide-react';
import { formatCurrency } from '../../lib/upi';

export default function SearchFilterBar({
  sortBy,
  setSortBy,
  inStockOnly,
  setInStockOnly,
  maxPrice,
  setMaxPrice,
  highestCatalogPrice = 700,
  activeCategoryName,
  totalResults,
  onResetFilters
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-3 sm:p-4 my-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
      
      {/* Results summary & Active Tag */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold text-slate-800">
          Showing <span className="text-kirana-600">{totalResults}</span> items
        </span>
        {activeCategoryName && (
          <span className="text-xs bg-kirana-50 text-kirana-800 font-semibold px-2.5 py-0.5 rounded-full border border-kirana-200">
            {activeCategoryName}
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
        
        {/* In-Stock Only Toggle */}
        <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="w-3.5 h-3.5 rounded text-kirana-600 focus:ring-kirana-500 rounded border-slate-300"
          />
          <span>In-Stock Only</span>
        </label>

        {/* Max Price Range Slider */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-50 px-3 py-1 rounded-xl border border-slate-200">
          <span>Up to {formatCurrency(maxPrice)}</span>
          <input
            type="range"
            min="20"
            max={highestCatalogPrice}
            step="10"
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="w-20 sm:w-28 accent-kirana-600 cursor-pointer"
          />
        </div>

        {/* Sort By Dropdown */}
        <div className="flex items-center gap-1.5 text-xs">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-kirana-500 focus:outline-none cursor-pointer"
          >
            <option value="popularity">Popularity / Top Rated</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="discount">Highest Discount</option>
            <option value="newest">Newest First</option>
          </select>
        </div>

        {/* Reset button if filtered */}
        {(inStockOnly || maxPrice < highestCatalogPrice || sortBy !== 'popularity') && (
          <button
            onClick={onResetFilters}
            className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
            title="Reset filters"
          >
            <X className="w-4 h-4" />
          </button>
        )}

      </div>

    </div>
  );
}

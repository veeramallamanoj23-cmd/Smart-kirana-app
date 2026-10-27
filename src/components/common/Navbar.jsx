import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  ShoppingCart, 
  MapPin, 
  ChevronDown, 
  User, 
  ShieldCheck, 
  X, 
  Sparkles, 
  Clock, 
  ArrowRight,
  Package,
  Phone
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { useProducts } from '../../context/ProductContext';
import { formatCurrency } from '../../lib/upi';

export default function Navbar({ 
  onOpenCart, 
  onOpenLocation, 
  onOpenAuth, 
  onSelectProduct,
  onNavigateHome,
  onNavigateAdmin,
  onNavigateOrders,
  isAdminActive = false,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory
}) {
  const { totalItemsCount, subtotal } = useCart();
  const { customer, isAdmin } = useAuth();
  const { settings, isPincodeServiceable } = useStore();
  const { products, categories } = useProducts();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef(null);

  // Filter products for instant autocomplete suggestions
  const filteredSuggestions = searchQuery.trim() 
    ? products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 6)
    : [];

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentPincode = customer?.addresses?.find(a => a.isDefault)?.pincode || '560102';
  const isServiceable = isPincodeServiceable(currentPincode);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm transition-all">
      {/* Top micro announcement bar */}
      <div className="bg-[#16803D] text-white text-xs py-1.5 px-4 font-medium">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 bg-[#FF9F43] text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
              ⚡ 15-25 MINS
            </span>
            <span className="text-white/95">Fresh groceries & farm produce • Free delivery on orders above ₹{settings.freeDeliveryThreshold}</span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-[11px] text-white/90">
            <a 
              href={`tel:${settings.phone || '+919392398990'}`} 
              className="hover:underline hover:text-[#DDF7E5] transition-colors flex items-center gap-1"
              title="Call Store Helpline"
            >
              <Phone className="w-3 h-3 text-[#FF9F43]" />
              <span>Helpline: {settings.phone || '+91 9392398990'}</span>
            </a>
            <span>•</span>
            <span>Daily: {settings.operatingHours}</span>
          </div>
        </div>
      </div>

      {/* Main navigation row */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3 sm:gap-6">
        
        {/* Brand Logo & Name */}
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNavigateHome}
          className="flex items-center gap-2.5 text-left focus:outline-none group flex-shrink-0"
        >
          <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-[#16803D] to-[#0f5127] flex items-center justify-center text-white shadow-md shadow-[#16803D]/25 group-hover:shadow-lg transition-all">
            {/* Custom SVG Kirana Bag Icon */}
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0" stroke="#FF9F43" strokeWidth="2.5"/>
            </svg>
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-[#FF9F43] border-2 border-white rounded-full"></span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-[#202820]">
                Smart<span className="text-[#16803D]">Kirana</span>
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] font-bold text-[#FF9F43] -mt-1 tracking-wider uppercase">
              Apki Apni Dukan
            </p>
          </div>
        </motion.button>

        {/* Location Selector Pill */}
        <button
          onClick={onOpenLocation}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#FAFAF5] hover:bg-[#DDF7E5]/50 rounded-2xl text-left border border-slate-200/80 transition-all text-xs max-w-[220px]"
          title="Change delivery location"
        >
          <div className={`p-1.5 rounded-xl ${isServiceable ? 'bg-[#DDF7E5] text-[#16803D]' : 'bg-red-100 text-red-600'}`}>
            <MapPin className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-1 font-bold text-[#202820] text-[11px]">
              <span>Delivery in 15 mins</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>
            <p className="text-[11px] text-slate-500 truncate">
              {currentPincode ? `PIN: ${currentPincode} • ${isServiceable ? 'Serviceable' : 'Unavailable'}` : 'Set Location'}
            </p>
          </div>
        </button>

        {/* Global Search Bar with Live Dropdown */}
        <div ref={searchRef} className="relative flex-1 max-w-xl">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="Search farm vegetables, fruits, atta, milk, snacks, drinks..."
              className="w-full pl-10 pr-9 py-2 sm:py-2.5 text-xs sm:text-sm bg-[#FAFAF5] border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16803D] focus:border-transparent transition-all placeholder:text-slate-400 text-[#202820]"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          <AnimatePresence>
            {isSearchOpen && searchQuery.trim().length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 right-0 top-full mt-2 bg-white rounded-3xl shadow-elevated border border-slate-100 py-2.5 z-50 overflow-hidden"
              >
                <div className="px-3.5 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Matching Products</span>
                  <span className="text-[#16803D] font-bold">{filteredSuggestions.length} found</span>
                </div>

                {filteredSuggestions.length > 0 ? (
                  <div className="divide-y divide-slate-50">
                    {filteredSuggestions.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          onSelectProduct(item);
                          setIsSearchOpen(false);
                        }}
                        className="px-3.5 py-2.5 flex items-center justify-between hover:bg-[#FAFAF5] cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-10 h-10 object-cover rounded-xl border border-slate-100 bg-[#FAFAF5]" 
                          />
                          <div>
                            <p className="text-xs font-bold text-[#202820] line-clamp-1">{item.name}</p>
                            <p className="text-[10px] text-slate-500">{item.brand} • {item.size}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-extrabold text-[#202820]">{formatCurrency(item.price)}</span>
                          {item.mrp > item.price && (
                            <span className="block text-[10px] line-through text-slate-400">{formatCurrency(item.mrp)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-6 text-center text-slate-500">
                    <p className="text-xs font-bold">No exact matches for "{searchQuery}"</p>
                    <p className="text-[11px] text-slate-400 mt-1">Try searching for vegetables, milk, atta, rice, biscuits, chips</p>
                  </div>
                )}

                {/* Category jump suggestions */}
                <div className="mt-2 pt-2.5 border-t border-slate-100 px-3.5">
                  <p className="text-[10px] text-slate-400 mb-1.5 font-bold uppercase tracking-wider">Browse Aisles:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {categories.slice(0, 6).map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategory(cat.id);
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-[#FAFAF5] hover:bg-[#DDF7E5] hover:text-[#16803D] text-slate-700 transition-colors"
                      >
                        {cat.icon} {cat.shortName}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          
          {/* Admin Switch Link */}
          <button
            onClick={onNavigateAdmin}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-2xl text-xs font-bold transition-all ${
              isAdminActive 
                ? 'bg-[#FF9F43] text-slate-950 shadow-sm' 
                : 'text-slate-600 hover:bg-[#FAFAF5]'
            }`}
            title="Store Admin Dashboard"
          >
            <ShieldCheck className="w-4 h-4 text-[#FF9F43]" />
            <span className="hidden lg:inline">{isAdmin ? 'Admin Portal' : 'Admin'}</span>
          </button>

          {/* Orders Tracking Shortcut */}
          <button
            onClick={onNavigateOrders}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-2xl text-xs font-bold text-slate-700 hover:bg-[#FAFAF5] transition-colors"
            title="Track recent orders"
          >
            <Package className="w-4 h-4 text-[#16803D]" />
            <span className="hidden md:inline">Track Orders</span>
          </button>

          {/* User Account / Login Button */}
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-2xl text-xs font-bold text-slate-700 hover:bg-[#FAFAF5] transition-colors"
          >
            <User className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">
              {customer?.isLoggedIn && customer.name ? customer.name.split(' ')[0] : 'Login'}
            </span>
          </button>

          {/* Blinkit-Style Cart Trigger Pill */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={onOpenCart}
            className={`relative flex items-center gap-2 sm:gap-3 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold shadow-md transition-all ${
              totalItemsCount > 0 
                ? 'bg-[#16803D] hover:bg-[#146c34] text-white shadow-[#16803D]/30 ring-2 ring-[#16803D]/20' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <div className="relative">
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
              {totalItemsCount > 0 && (
                <motion.span 
                  key={totalItemsCount}
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2.5 -right-2.5 w-4 h-4 bg-[#FF9F43] text-slate-950 text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm"
                >
                  {totalItemsCount}
                </motion.span>
              )}
            </div>

            {totalItemsCount > 0 ? (
              <div className="text-left leading-tight hidden xs:block">
                <span className="text-[10px] opacity-90 block font-normal">{totalItemsCount} item{totalItemsCount > 1 ? 's' : ''}</span>
                <span className="text-xs sm:text-sm font-extrabold">{formatCurrency(subtotal)}</span>
              </div>
            ) : (
              <span className="hidden xs:inline">My Cart</span>
            )}
          </motion.button>

        </div>
      </div>

      {/* Mobile Location Sub-bar */}
      <div className="md:hidden px-3 py-1.5 bg-[#FAFAF5] border-t border-slate-100 flex items-center justify-between text-[11px]">
        <button 
          onClick={onOpenLocation}
          className="flex items-center gap-1.5 text-slate-700 truncate"
        >
          <MapPin className="w-3.5 h-3.5 text-[#16803D] flex-shrink-0" />
          <span className="font-bold truncate">
            {currentPincode ? `Delivering to PIN ${currentPincode}` : 'Select Delivery Location'}
          </span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>
        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${isServiceable ? 'bg-[#DDF7E5] text-[#16803D]' : 'bg-red-100 text-red-600'}`}>
          {isServiceable ? '⚡ 15 Mins' : 'Not Serviceable'}
        </span>
      </div>
    </header>
  );
}

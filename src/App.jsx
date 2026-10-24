import React, { useState, useMemo } from 'react';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import LocationModal from './components/common/LocationModal';
import AuthModal from './components/common/AuthModal';
import NotificationToast from './components/common/NotificationToast';
import HeroBanner from './components/home/HeroBanner';
import CategoryPills from './components/home/CategoryPills';
import DealsSection from './components/home/DealsSection';
import ProductShelf from './components/home/ProductShelf';
import ProductCard from './components/product/ProductCard';
import ProductDetailModal from './components/product/ProductDetailModal';
import SearchFilterBar from './components/product/SearchFilterBar';
import CartDrawer from './components/cart/CartDrawer';
import CheckoutPage from './components/checkout/CheckoutPage';
import OrderTrackingPage from './components/orders/OrderTrackingPage';
import OrderHistoryModal from './components/orders/OrderHistoryModal';
import AdminDashboard from './components/admin/AdminDashboard';

import { useProducts } from './context/ProductContext';
import { useCart } from './context/CartContext';
import { useOrders } from './context/OrderContext';
import { useAuth } from './context/AuthContext';
import { useStore } from './context/StoreContext';

export default function App() {
  const { products, categories } = useProducts();
  const { notification, showNotification } = useCart();
  const { activeTrackingId, setActiveTrackingId } = useOrders();
  const { isAdmin } = useAuth();
  const { settings } = useStore();

  // Navigation View: 'store', 'checkout', 'tracking', 'admin'
  const [currentView, setCurrentView] = useState('store');

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sortBy, setSortBy] = useState('popularity');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState(700);

  // Modals & Drawers
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isOrderHistoryOpen, setIsOrderHistoryOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState(null);

  // Highest catalog price for slider
  const highestPrice = useMemo(() => {
    return products.reduce((max, p) => Math.max(max, p.price || 0), 700);
  }, [products]);

  // Main filtered & sorted product list
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      // Search matching name, brand, or category
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesBrand = item.brand.toLowerCase().includes(query);
        const matchesCategory = item.category.toLowerCase().includes(query);
        if (!matchesName && !matchesBrand && !matchesCategory) return false;
      }

      // Category matching
      if (selectedCategory && item.category !== selectedCategory) {
        return false;
      }

      // In stock only filter
      if (inStockOnly && (!item.isAvailable || item.stock <= 0)) {
        return false;
      }

      // Max price filter
      if (item.price > maxPrice) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'discount') {
        const discA = (a.mrp - a.price) / a.mrp;
        const discB = (b.mrp - b.price) / b.mrp;
        return discB - discA;
      }
      if (sortBy === 'newest') return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
      // default popularity / rating
      return (b.rating || 4.5) - (a.rating || 4.5);
    });
  }, [products, searchQuery, selectedCategory, inStockOnly, maxPrice, sortBy]);

  // Curated subsets for Homepage Shelves
  const bestSellerProducts = useMemo(() => {
    return products.filter(p => p.isBestSeller && p.stock > 0);
  }, [products]);

  const dairyAndMorningEssentials = useMemo(() => {
    return products.filter(p => p.category === 'dairy-essentials' && p.stock > 0);
  }, [products]);

  const snacksAndDrinks = useMemo(() => {
    return products.filter(p => (p.category === 'snacks' || p.category === 'cool-drinks') && p.stock > 0);
  }, [products]);

  const householdAndCare = useMemo(() => {
    return products.filter(p => (p.category === 'household' || p.category === 'personal-care') && p.stock > 0);
  }, [products]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setSortBy('popularity');
    setInStockOnly(false);
    setMaxPrice(highestPrice);
  };

  const handleOrderComplete = (newOrderId) => {
    setActiveTrackingId(newOrderId);
    setCurrentView('tracking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeCategoryObj = categories.find(c => c.id === selectedCategory);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-kirana-100 selection:text-kirana-800">
      
      {/* Sticky Global Navigation */}
      <Navbar
        onOpenCart={() => setIsCartOpen(true)}
        onOpenLocation={() => setIsLocationOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onSelectProduct={(prod) => setDetailProduct(prod)}
        onNavigateHome={() => {
          setCurrentView('store');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNavigateAdmin={() => {
          if (isAdmin) {
            setCurrentView('admin');
          } else {
            setIsAuthOpen(true);
          }
        }}
        onNavigateOrders={() => {
          setIsOrderHistoryOpen(true);
        }}
        isAdminActive={currentView === 'admin'}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {currentView === 'store' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            
            {/* Hero Promotional Banners */}
            {!selectedCategory && !searchQuery && (
              <HeroBanner 
                onSelectCategory={(catId) => {
                  setSelectedCategory(catId);
                  window.scrollTo({ top: 380, behavior: 'smooth' });
                }} 
              />
            )}

            {/* Quick Category Icons Bar */}
            <CategoryPills
              selectedCategory={selectedCategory}
              onSelectCategory={(catId) => setSelectedCategory(catId)}
            />

            {/* Lightning Deals section (Only on Home view without active search) */}
            {!selectedCategory && !searchQuery && (
              <DealsSection
                products={products}
                onOpenDetail={(prod) => setDetailProduct(prod)}
                onSelectCategory={(catId) => setSelectedCategory(catId)}
              />
            )}

            {/* Curated Shelf: Best-Selling Groceries */}
            {!selectedCategory && !searchQuery && (
              <ProductShelf
                title="Bestsellers in Your Area"
                subtitle="Most frequently ordered groceries by nearby households"
                icon="🔥"
                badge="Popular"
                products={bestSellerProducts}
                onOpenDetail={(prod) => setDetailProduct(prod)}
                onViewAll={() => setSelectedCategory('groceries-staples')}
              />
            )}

            {/* Curated Shelf: Dairy & Morning Essentials */}
            {!selectedCategory && !searchQuery && (
              <ProductShelf
                title="Fresh Dairy & Morning Essentials"
                subtitle="Fresh milk, eggs, bread & butter delivered daily"
                icon="🥛"
                badge="Daily Fresh"
                products={dairyAndMorningEssentials}
                onOpenDetail={(prod) => setDetailProduct(prod)}
                onViewAll={() => setSelectedCategory('dairy-essentials')}
              />
            )}

            {/* Search & Filter Bar */}
            <div id="catalog-section">
              <SearchFilterBar
                sortBy={sortBy}
                setSortBy={setSortBy}
                inStockOnly={inStockOnly}
                setInStockOnly={setInStockOnly}
                maxPrice={maxPrice}
                setMaxPrice={setMaxPrice}
                highestCatalogPrice={highestPrice}
                activeCategoryName={activeCategoryObj ? `${activeCategoryObj.icon} ${activeCategoryObj.name}` : (searchQuery ? `Search: "${searchQuery}"` : null)}
                totalResults={filteredProducts.length}
                onResetFilters={handleResetFilters}
              />
            </div>

            {/* Main Product Catalog Grid */}
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 my-4">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onOpenDetail={(prod) => setDetailProduct(prod)}
                  />
                ))}
              </div>
            ) : (
              /* Friendly "No Products Found" State */
              <div className="py-16 text-center bg-white rounded-3xl border border-slate-100 p-8 my-6 shadow-sm">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center text-3xl mb-3">
                  🔍
                </div>
                <h3 className="font-extrabold text-slate-900 text-lg">No Products Found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  We couldn't find any items matching your active search or filters. Try clearing filters or searching for staples like atta, milk, chips, or oil.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="mt-5 px-6 py-2.5 bg-kirana-600 hover:bg-kirana-700 text-white font-bold text-xs rounded-2xl shadow-md transition-all"
                >
                  Reset All Filters
                </button>
              </div>
            )}

            {/* Curated Shelf: Cool Drinks & Snacks */}
            {!selectedCategory && !searchQuery && (
              <ProductShelf
                title="Chilled Cool Drinks & Evening Snacks"
                subtitle="Quench your thirst & munch on crisps and noodles"
                icon="🍟"
                badge="Quick Munch"
                products={snacksAndDrinks}
                onOpenDetail={(prod) => setDetailProduct(prod)}
                onViewAll={() => setSelectedCategory('snacks')}
              />
            )}

            {/* Curated Shelf: Household & Personal Care */}
            {!selectedCategory && !searchQuery && (
              <ProductShelf
                title="Household Cleaners & Personal Care"
                subtitle="Detergents, floor cleaners, soaps & shampoos for hygiene"
                icon="🧼"
                badge="Clean & Care"
                products={householdAndCare}
                onOpenDetail={(prod) => setDetailProduct(prod)}
                onViewAll={() => setSelectedCategory('household')}
              />
            )}

          </div>
        )}

        {/* Checkout View */}
        {currentView === 'checkout' && (
          <CheckoutPage
            onBackToShopping={() => setCurrentView('store')}
            onOrderComplete={handleOrderComplete}
          />
        )}

        {/* Order Tracking View */}
        {currentView === 'tracking' && (
          <OrderTrackingPage
            orderId={activeTrackingId}
            onBackToStore={() => setCurrentView('store')}
            onSelectOrder={(id) => setActiveTrackingId(id)}
          />
        )}

        {/* Admin Dashboard View */}
        {currentView === 'admin' && (
          <AdminDashboard
            onBackToStore={() => setCurrentView('store')}
          />
        )}
      </main>

      {/* Footer */}
      <Footer
        onNavigateAdmin={() => {
          if (isAdmin) {
            setCurrentView('admin');
          } else {
            setIsAuthOpen(true);
          }
        }}
      />

      {/* Modals & Slide-out Drawers */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setCurrentView('checkout');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      <LocationModal
        isOpen={isLocationOpen}
        onClose={() => setIsLocationOpen(false)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAdminSuccess={() => {
          setCurrentView('admin');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      <OrderHistoryModal
        isOpen={isOrderHistoryOpen}
        onClose={() => setIsOrderHistoryOpen(false)}
        onSelectOrder={(orderId) => {
          setActiveTrackingId(orderId);
          setCurrentView('tracking');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {detailProduct && (
        <ProductDetailModal
          product={detailProduct}
          onClose={() => setDetailProduct(null)}
        />
      )}

      {/* Global Toast Notification */}
      <NotificationToast
        notification={notification}
        onClose={() => {}}
      />

    </div>
  );
}

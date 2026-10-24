import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Package, 
  ShoppingCart, 
  Settings, 
  Plus, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  Search, 
  LogOut,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useProducts } from '../../context/ProductContext';
import { useOrders, ORDER_STATUSES } from '../../context/OrderContext';
import { useStore } from '../../context/StoreContext';
import { formatCurrency } from '../../lib/upi';
import ProductFormModal from './ProductFormModal';
import AdminOrdersTab from './AdminOrdersTab';
import AdminSettingsTab from './AdminSettingsTab';

export default function AdminDashboard({ onBackToStore }) {
  const { isAdmin, logoutAdmin } = useAuth();
  const { products, categories, adjustStock, toggleProductAvailability, deleteProduct, resetProducts } = useProducts();
  const { orders } = useOrders();
  const { settings } = useStore();

  const [activeTab, setActiveTab] = useState('products'); // 'products', 'orders', 'settings'
  const [productSearch, setProductSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [productToEdit, setProductToEdit] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // If not logged in as admin
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">Admin Authentication Required</h2>
        <p className="text-xs text-slate-500 mt-2">
          You must log in with store administrator credentials to view and manage inventory, orders, and store settings.
        </p>
        <button
          onClick={onBackToStore}
          className="mt-6 px-6 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-2xl"
        >
          Return to Customer Store
        </button>
      </div>
    );
  }

  // Calculate KPIs
  const totalRevenue = orders
    .filter(o => o.orderStatus !== ORDER_STATUSES.CANCELLED)
    .reduce((sum, o) => sum + (o.bill?.total || 0), 0);

  const activeOrdersCount = orders.filter(
    o => o.orderStatus !== ORDER_STATUSES.DELIVERED && o.orderStatus !== ORDER_STATUSES.CANCELLED
  ).length;

  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= 5);
  const outOfStockProducts = products.filter(p => !p.isAvailable || p.stock === 0);

  // Filter products for inventory table
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                          p.brand.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCat = categoryFilter === 'ALL' || p.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const handleOpenAdd = () => {
    setProductToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (p) => {
    setProductToEdit(p);
    setIsFormOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      
      {/* Top Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20 flex-shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Store Owner Dashboard
              </h1>
              <span className="text-[10px] font-black uppercase bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">
                Admin
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Manage inventory, live customer orders, express delivery zones & UPI
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onBackToStore}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Store Front</span>
          </button>
          <button
            onClick={() => {
              logoutAdmin();
              onBackToStore();
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Exit Admin</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 my-6">
        
        {/* Total Revenue */}
        <div className="p-4 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-semibold">
            <span>Total Sales Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-slate-900 block">
            {formatCurrency(totalRevenue)}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">From verified & active orders</span>
        </div>

        {/* Active Orders */}
        <div className="p-4 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-semibold">
            <span>In-Progress Orders</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-amber-600 block">
            {activeOrdersCount}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">Needs packing & delivery</span>
        </div>

        {/* Catalog Items */}
        <div className="p-4 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-semibold">
            <span>Total Products</span>
            <Package className="w-4 h-4 text-kirana-600" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-slate-900 block">
            {products.length}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">Across {categories.length} categories</span>
        </div>

        {/* Low Stock Alerts */}
        <div className="p-4 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-semibold">
            <span>Low Stock / Out</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-rose-600 block">
            {lowStockProducts.length + outOfStockProducts.length}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {lowStockProducts.length} low stock, {outOfStockProducts.length} sold out
          </span>
        </div>

      </div>

      {/* Main Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-3 mb-6 overflow-x-auto no-scrollbar">
        {[
          { key: 'products', label: 'Products & Inventory', icon: <Package className="w-4 h-4" /> },
          { key: 'orders', label: `Orders (${orders.length})`, icon: <ShoppingCart className="w-4 h-4" /> },
          { key: 'settings', label: 'Store Settings & Pincodes', icon: <Settings className="w-4 h-4" /> }
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all ${
              activeTab === t.key
                ? 'bg-kirana-600 text-white shadow-md shadow-kirana-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab 1: Products & Inventory */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          
          {/* Controls: Search, Category filter & Add Product Button */}
          <div className="bg-white rounded-3xl border border-slate-100 p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            
            <div className="flex items-center gap-3 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-sm">
                <input
                  type="text"
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  placeholder="Search by title or brand..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-kirana-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-kirana-500 font-semibold cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={resetProducts}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
                title="Reset catalog to initial sample data"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset Seed</span>
              </button>

              <button
                onClick={handleOpenAdd}
                className="px-4 py-2 bg-kirana-600 hover:bg-kirana-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            </div>

          </div>

          {/* Products Table */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Price / MRP</th>
                    <th className="py-3 px-3">Stock Units</th>
                    <th className="py-3 px-3">Quick Adjust</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map(p => {
                    const isLow = p.stock > 0 && p.stock <= 5;
                    const isOut = !p.isAvailable || p.stock === 0;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        
                        {/* Thumbnail & Name */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-10 h-10 object-cover rounded-xl border border-slate-100 flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate max-w-xs">{p.name}</p>
                              <p className="text-[10px] text-slate-400">{p.brand} • {p.size}</p>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-3 text-slate-600 font-medium">
                          {categories.find(c => c.id === p.category)?.shortName || p.category}
                        </td>

                        {/* Price */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="font-extrabold text-slate-900">{formatCurrency(p.price)}</span>
                          {p.mrp > p.price && (
                            <span className="text-[10px] text-slate-400 line-through ml-1">{formatCurrency(p.mrp)}</span>
                          )}
                        </td>

                        {/* Stock */}
                        <td className="py-3 px-3">
                          <span className={`font-mono font-bold px-2 py-0.5 rounded-md ${
                            isOut ? 'bg-rose-100 text-rose-800' : isLow ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'
                          }`}>
                            {p.stock} units
                          </span>
                        </td>

                        {/* Quick stock adjusters */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1 font-bold">
                            <button
                              onClick={() => adjustStock(p.id, -5)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[10px]"
                              title="Decrease 5"
                            >
                              -5
                            </button>
                            <button
                              onClick={() => adjustStock(p.id, 10)}
                              className="px-2 py-1 bg-kirana-50 hover:bg-kirana-100 text-kirana-800 rounded-md text-[10px]"
                              title="Add 10"
                            >
                              +10
                            </button>
                          </div>
                        </td>

                        {/* Availability switch */}
                        <td className="py-3 px-3">
                          <button
                            onClick={() => toggleProductAvailability(p.id)}
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-colors ${
                              p.isAvailable && p.stock > 0
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                            }`}
                          >
                            {p.isAvailable && p.stock > 0 ? 'Active' : 'Unavailable'}
                          </button>
                        </td>

                        {/* Actions: Edit / Delete */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="p-1.5 text-slate-600 hover:text-kirana-600 hover:bg-kirana-50 rounded-lg transition-colors"
                              title="Edit product"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Delete "${p.name}" from catalog?`)) {
                                  deleteProduct(p.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-3 border-t border-slate-100 text-center text-xs text-slate-400">
              Showing {filteredProducts.length} of {products.length} products
            </div>
          </div>

        </div>
      )}

      {/* Tab 2: Orders & Dispatch Management */}
      {activeTab === 'orders' && (
        <AdminOrdersTab />
      )}

      {/* Tab 3: Store Settings & Serviceable Areas */}
      {activeTab === 'settings' && (
        <AdminSettingsTab />
      )}

      {/* Product Add/Edit Modal */}
      {isFormOpen && (
        <ProductFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          productToEdit={productToEdit}
        />
      )}

    </div>
  );
}

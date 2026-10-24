import React, { useState, useEffect } from 'react';
import { X, Upload, Sparkles, Check, AlertCircle } from 'lucide-react';
import { useProducts } from '../../context/ProductContext';

export default function ProductFormModal({ isOpen, onClose, productToEdit }) {
  const { categories, addProduct, updateProduct } = useProducts();

  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: categories[0]?.id || 'groceries-staples',
    size: '',
    price: '',
    mrp: '',
    stock: '',
    image: '',
    deliveryTime: '15-20 mins',
    description: '',
    isAvailable: true,
    isDeal: false,
    isBestSeller: false
  });

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        name: productToEdit.name || '',
        brand: productToEdit.brand || '',
        category: productToEdit.category || 'groceries-staples',
        size: productToEdit.size || '',
        price: productToEdit.price || '',
        mrp: productToEdit.mrp || '',
        stock: productToEdit.stock !== undefined ? productToEdit.stock : '',
        image: productToEdit.image || '',
        deliveryTime: productToEdit.deliveryTime || '15-20 mins',
        description: productToEdit.description || '',
        isAvailable: productToEdit.isAvailable !== undefined ? productToEdit.isAvailable : true,
        isDeal: productToEdit.isDeal || false,
        isBestSeller: productToEdit.isBestSeller || false
      });
    } else {
      setFormData({
        name: '',
        brand: '',
        category: categories[0]?.id || 'groceries-staples',
        size: '1 kg',
        price: '',
        mrp: '',
        stock: '25',
        image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
        deliveryTime: '15-20 mins',
        description: '',
        isAvailable: true,
        isDeal: false,
        isBestSeller: false
      });
    }
  }, [productToEdit, categories]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    const priceNum = Number(formData.price);
    const mrpNum = Number(formData.mrp || formData.price);
    const stockNum = Number(formData.stock || 0);

    if (!formData.name.trim() || !formData.brand.trim() || isNaN(priceNum) || priceNum <= 0) {
      alert('Please fill out all required product fields with valid numbers');
      return;
    }

    const payload = {
      ...formData,
      price: priceNum,
      mrp: Math.max(priceNum, mrpNum),
      stock: stockNum,
      isAvailable: formData.isAvailable && stockNum > 0
    };

    if (productToEdit) {
      updateProduct(productToEdit.id, payload);
    } else {
      addProduct(payload);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-elevated border border-slate-100 p-5 sm:p-7 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
              {productToEdit ? 'Edit Kirana Product' : 'Add New Kirana Product'}
            </h3>
            <p className="text-xs text-slate-500">
              Configure product details, price, discount, and inventory stock
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 my-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700">Product Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Aashirvaad Shudh Chakki Atta"
                className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-kirana-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Brand Name *</label>
              <input
                type="text"
                required
                value={formData.brand}
                onChange={e => setFormData({ ...formData, brand: e.target.value })}
                placeholder="e.g. Aashirvaad, Amul, Tata"
                className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-kirana-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700">Category *</label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-kirana-500 cursor-pointer"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Pack / Size *</label>
              <input
                type="text"
                required
                value={formData.size}
                onChange={e => setFormData({ ...formData, size: e.target.value })}
                placeholder="e.g. 1 kg, 500 g, 750 ml, Pack of 4"
                className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-kirana-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700">Selling Price (₹) *</label>
              <input
                type="number"
                required
                min="1"
                step="0.5"
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: e.target.value })}
                placeholder="245"
                className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-kirana-500 font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">MRP (₹)</label>
              <input
                type="number"
                min="1"
                step="0.5"
                value={formData.mrp}
                onChange={e => setFormData({ ...formData, mrp: e.target.value })}
                placeholder="290"
                className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-kirana-500 text-slate-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Stock Units *</label>
              <input
                type="number"
                required
                min="0"
                value={formData.stock}
                onChange={e => setFormData({ ...formData, stock: e.target.value })}
                placeholder="30"
                className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-kirana-500 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">Image URL</label>
            <input
              type="url"
              value={formData.image}
              onChange={e => setFormData({ ...formData, image: e.target.value })}
              placeholder="https://..."
              className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-kirana-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">Description</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Product details, ingredients, certifications..."
              className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-kirana-500"
            />
          </div>

          {/* Badges / switches */}
          <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-100 text-xs">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.isAvailable}
                onChange={e => setFormData({ ...formData, isAvailable: e.target.checked })}
                className="w-4 h-4 text-kirana-600 rounded"
              />
              <span className="font-semibold text-slate-700">Available for Ordering</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.isDeal}
                onChange={e => setFormData({ ...formData, isDeal: e.target.checked })}
                className="w-4 h-4 text-amber-500 rounded"
              />
              <span className="font-semibold text-slate-700">Mark as Lightning Deal</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.isBestSeller}
                onChange={e => setFormData({ ...formData, isBestSeller: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <span className="font-semibold text-slate-700">Mark as Best-Seller</span>
            </label>
          </div>

          <div className="pt-3 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-kirana-600 hover:bg-kirana-700 text-white text-xs font-bold rounded-xl shadow-md"
            >
              {productToEdit ? 'Save Changes' : 'Add to Catalog'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}

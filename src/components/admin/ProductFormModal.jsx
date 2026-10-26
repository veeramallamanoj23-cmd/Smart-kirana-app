import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Upload, 
  Sparkles, 
  Check, 
  AlertCircle, 
  Image as ImageIcon, 
  Trash2, 
  RotateCcw,
  Tag,
  Barcode,
  Package,
  Layers,
  Percent,
  CheckCircle2
} from 'lucide-react';
import { useProducts } from '../../context/ProductContext';
import { api } from '../../lib/api';

const COMMON_UNITS = [
  '1 kg', '500 g', '250 g', '100 g', 
  '1 L', '500 ml', '200 ml', 
  '1 Packet', '1 Piece', 'Pack of 2', 'Pack of 4', 'Box'
];

export default function ProductFormModal({ isOpen, onClose, productToEdit }) {
  const { categories, addProduct, updateProduct } = useProducts();
  const fileInputRef = useRef(null);

  const initialFormState = {
    name: '',
    brand: '',
    category: categories[0]?.id || 'groceries-staples',
    size: '1 kg',
    price: '',
    mrp: '',
    discount: '',
    stock: '25',
    sku: '',
    image: '',
    description: '',
    deliveryTime: '15-20 mins',
    isAvailable: true,
    isDeal: false,
    isBestSeller: false
  };

  const [formData, setFormData] = useState(initialFormState);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        name: productToEdit.name || '',
        brand: productToEdit.brand || '',
        category: productToEdit.category || categories[0]?.id || 'groceries-staples',
        size: productToEdit.size || '',
        price: productToEdit.price !== undefined ? String(productToEdit.price) : '',
        mrp: productToEdit.mrp !== undefined ? String(productToEdit.mrp) : '',
        discount: productToEdit.discount !== undefined ? String(productToEdit.discount) : '',
        stock: productToEdit.stock !== undefined ? String(productToEdit.stock) : '0',
        sku: productToEdit.sku || '',
        image: productToEdit.image || '',
        description: productToEdit.description || '',
        deliveryTime: productToEdit.deliveryTime || '15-20 mins',
        isAvailable: productToEdit.isAvailable !== undefined ? productToEdit.isAvailable : true,
        isDeal: productToEdit.isDeal || false,
        isBestSeller: productToEdit.isBestSeller || false
      });
      setImagePreview(productToEdit.image || '');
      setSelectedFile(null);
    } else {
      setFormData(initialFormState);
      setImagePreview('');
      setSelectedFile(null);
    }
    setFormError('');
    setFormSuccess('');
  }, [productToEdit, isOpen, categories]);

  if (!isOpen) return null;

  // Auto-compute discount % when price and MRP change
  const handlePriceChange = (priceVal) => {
    setFormData(prev => {
      const priceNum = parseFloat(priceVal);
      const mrpNum = parseFloat(prev.mrp);
      let autoDiscount = prev.discount;
      if (priceNum > 0 && mrpNum > priceNum) {
        autoDiscount = Math.round(((mrpNum - priceNum) / mrpNum) * 100).toString();
      }
      return { ...prev, price: priceVal, discount: autoDiscount };
    });
  };

  const handleMrpChange = (mrpVal) => {
    setFormData(prev => {
      const mrpNum = parseFloat(mrpVal);
      const priceNum = parseFloat(prev.price);
      let autoDiscount = prev.discount;
      if (priceNum > 0 && mrpNum > priceNum) {
        autoDiscount = Math.round(((mrpNum - priceNum) / mrpNum) * 100).toString();
      }
      return { ...prev, mrp: mrpVal, discount: autoDiscount };
    });
  };

  // Image File Selection with Validation
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate MIME types
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setFormError('Please select a valid image file (JPEG, PNG, or WEBP).');
      return;
    }

    // Validate size (max 5 MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setFormError(`Image file is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 5 MB.`);
      return;
    }

    setFormError('');
    setSelectedFile(file);

    // Read and create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setImagePreview('');
    setFormData(prev => ({ ...prev, image: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleResetForm = () => {
    setFormData(initialFormState);
    setImagePreview('');
    setSelectedFile(null);
    setFormError('');
    setFormSuccess('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    // Field validation
    const name = formData.name.trim();
    const brand = formData.brand.trim() || 'Store Brand';
    const price = parseFloat(formData.price);
    const mrp = parseFloat(formData.mrp || formData.price);
    const stock = parseInt(formData.stock, 10);

    if (!name) {
      setFormError('Product Name is required.');
      return;
    }
    if (isNaN(price) || price <= 0) {
      setFormError('Please enter a valid Selling Price greater than ₹0.');
      return;
    }
    if (isNaN(stock) || stock < 0) {
      setFormError('Available Stock cannot be negative.');
      return;
    }

    setIsUploading(true);
    let finalImageUrl = formData.image || imagePreview || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80';

    try {
      // If a new file was chosen, upload to persistent storage
      if (selectedFile && imagePreview.startsWith('data:')) {
        const uploadRes = await api.adminUploadImage({
          imageBase64: imagePreview,
          filename: selectedFile.name,
          mimeType: selectedFile.type
        });

        if (uploadRes.success && uploadRes.url) {
          finalImageUrl = uploadRes.url;
        } else {
          console.warn('[UPLOAD_WARN] Image upload failed on server, using data preview:', uploadRes.message);
        }
      }

      const payload = {
        name,
        brand,
        category: formData.category,
        size: formData.size.trim() || '1 Unit',
        price,
        mrp: Math.max(price, mrp),
        discount: formData.discount ? parseInt(formData.discount, 10) : (mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0),
        stock,
        sku: formData.sku.trim() || `SKU-${Date.now().toString().slice(-6)}`,
        image: finalImageUrl,
        description: formData.description.trim() || `${name} - Fresh and authentic grocery staple.`,
        deliveryTime: formData.deliveryTime || '15-20 mins',
        isAvailable: formData.isAvailable && stock > 0,
        isDeal: Boolean(formData.isDeal),
        isBestSeller: Boolean(formData.isBestSeller)
      };

      if (productToEdit) {
        await updateProduct(productToEdit.id, payload);
        setFormSuccess('Product updated successfully!');
      } else {
        await addProduct(payload);
        setFormSuccess('Product created and published to customer storefront!');
      }

      setTimeout(() => {
        setIsUploading(false);
        onClose();
      }, 600);

    } catch (err) {
      setIsUploading(false);
      setFormError(err.message || 'Failed to save product to database.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-elevated border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-kirana-100 text-kirana-700 flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                {productToEdit ? 'Edit Product Details' : 'Add New Kirana Product'}
              </h3>
              <p className="text-xs text-slate-500">
                Direct store catalog management without editing source code
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5">
          
          {/* Notifications */}
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{formSuccess}</span>
            </div>
          )}

          {/* Section 1: Product Photo Upload & Preview */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
            <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span>Product Photo Upload *</span>
              <span className="text-[11px] text-slate-500 font-normal">Supports JPEG, PNG, WEBP (Max 5 MB)</span>
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Photo Preview Thumbnail */}
              <div className="w-28 h-28 rounded-2xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner relative group">
                {imagePreview ? (
                  <>
                    <img 
                      src={imagePreview} 
                      alt="Product Preview" 
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute inset-0 bg-slate-900/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      title="Remove image"
                    >
                      <Trash2 className="w-5 h-5 text-rose-300" />
                    </button>
                  </>
                ) : (
                  <div className="text-center p-2 text-slate-400">
                    <ImageIcon className="w-7 h-7 mx-auto mb-1 text-slate-300" />
                    <span className="text-[10px] block leading-tight">No photo uploaded</span>
                  </div>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex-1 space-y-2 w-full">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleFileChange}
                  className="hidden"
                  id="product-photo-file-input"
                />

                <div className="flex flex-wrap gap-2">
                  <label
                    htmlFor="product-photo-file-input"
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{imagePreview ? 'Replace Photo' : 'Upload From Device / Camera'}</span>
                  </label>

                  {imagePreview && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="px-3 py-2 bg-white border border-slate-200 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="pt-1">
                  <span className="text-[11px] text-slate-500 block mb-1 font-medium">Or paste image web link:</span>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={e => {
                      setFormData({ ...formData, image: e.target.value });
                      setImagePreview(e.target.value);
                    }}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl font-mono text-slate-700 focus:ring-2 focus:ring-kirana-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Basic Product Identification */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700">Product Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Aashirvaad Shudh Chakki Atta"
                className="w-full mt-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-kirana-500 font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Brand Name</label>
              <input
                type="text"
                value={formData.brand}
                onChange={e => setFormData({ ...formData, brand: e.target.value })}
                placeholder="e.g. Aashirvaad, Amul, Tata, Local"
                className="w-full mt-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-kirana-500"
              />
            </div>
          </div>

          {/* Category & Unit Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700">Product Category *</label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full mt-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-kirana-500 font-semibold cursor-pointer"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Unit / Pack Size *</label>
              <input
                type="text"
                required
                value={formData.size}
                onChange={e => setFormData({ ...formData, size: e.target.value })}
                placeholder="e.g. 1 kg, 500 ml, 1 Packet, Piece"
                className="w-full mt-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-kirana-500 font-medium"
              />
              <div className="flex gap-1.5 flex-wrap mt-1.5">
                {COMMON_UNITS.slice(0, 6).map(u => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setFormData({ ...formData, size: u })}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-medium"
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing, MRP, Discount & Stock */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700">Selling Price (₹) *</label>
              <input
                type="number"
                required
                min="0.5"
                step="0.5"
                value={formData.price}
                onChange={e => handlePriceChange(e.target.value)}
                placeholder="245"
                className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-kirana-500 font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">MRP (₹)</label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={formData.mrp}
                onChange={e => handleMrpChange(e.target.value)}
                placeholder="290"
                className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-kirana-500 text-slate-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Discount (%)</label>
              <input
                type="number"
                min="0"
                max="95"
                value={formData.discount}
                onChange={e => setFormData({ ...formData, discount: e.target.value })}
                placeholder="15"
                className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-kirana-500 font-semibold text-kirana-700"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Available Stock *</label>
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

          {/* Barcode / SKU & Delivery Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Barcode className="w-3.5 h-3.5 text-slate-400" />
                <span>Barcode or SKU (Optional)</span>
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={e => setFormData({ ...formData, sku: e.target.value })}
                placeholder="e.g. 8901030382910"
                className="w-full mt-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-kirana-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Express Delivery SLA</label>
              <input
                type="text"
                value={formData.deliveryTime}
                onChange={e => setFormData({ ...formData, deliveryTime: e.target.value })}
                placeholder="15-20 mins"
                className="w-full mt-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-kirana-500"
              />
            </div>
          </div>

          {/* Product Description */}
          <div>
            <label className="text-xs font-bold text-slate-700">Product Description</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Freshly milled whole wheat atta. Rich in dietary fiber, 0% maida..."
              className="w-full mt-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-kirana-500"
            />
          </div>

          {/* Availability & Highlighting Badges */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3 text-xs">
            <span className="font-bold text-slate-800 block">Catalog Visibility & Badges:</span>
            
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.isAvailable}
                  onChange={e => setFormData({ ...formData, isAvailable: e.target.checked })}
                  className="w-4 h-4 text-kirana-600 rounded cursor-pointer"
                />
                <span className="font-semibold text-slate-700">Available for Ordering</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.isDeal}
                  onChange={e => setFormData({ ...formData, isDeal: e.target.checked })}
                  className="w-4 h-4 text-amber-500 rounded cursor-pointer"
                />
                <span className="font-semibold text-slate-700">Mark as Lightning Deal 🔥</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.isBestSeller}
                  onChange={e => setFormData({ ...formData, isBestSeller: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                />
                <span className="font-semibold text-slate-700">Mark as Best-Seller ⭐</span>
              </label>
            </div>
          </div>

          {/* Action Buttons: Save Product, Reset Form, Cancel */}
          <div className="pt-2 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={handleResetForm}
              disabled={isUploading}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Form</span>
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={isUploading}
                className="flex-1 sm:flex-none px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isUploading}
                className="flex-1 sm:flex-none px-6 py-2.5 bg-kirana-600 hover:bg-kirana-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving to Store...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{productToEdit ? 'Save Changes' : 'Save Product'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}

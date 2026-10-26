import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_PRODUCTS } from '../data/products';
import { CATEGORIES } from '../data/categories';
import { storage } from '../lib/storage';
import { api } from '../lib/api';

const ProductContext = createContext();

export function ProductProvider({ children }) {
  const [products, setProducts] = useState(() => {
    return storage.get('products', INITIAL_PRODUCTS);
  });

  const [categories, setCategories] = useState(() => {
    return storage.get('categories', CATEGORIES);
  });

  // Sync with server database on mount
  useEffect(() => {
    api.getProducts().then(res => {
      if (res.success && res.products && res.products.length > 0) {
        setProducts(res.products);
      }
    }).catch(err => {
      console.warn('[PRODUCT_SYNC_WARN] Server fetch failed, using cached store:', err.message);
    });
  }, []);

  useEffect(() => {
    storage.set('products', products);
  }, [products]);

  useEffect(() => {
    storage.set('categories', categories);
  }, [categories]);

  // Add new product (Persists to server DB and updates live customer catalog)
  const addProduct = async (productData) => {
    const tempId = `prod-${Date.now()}`;
    const payload = {
      ...productData,
      id: productData.id || tempId,
      rating: 5.0,
      reviewsCount: 1,
      isAvailable: productData.stock > 0
    };

    try {
      const res = await api.adminAddProduct(payload);
      const saved = (res.success && res.product) ? res.product : payload;
      setProducts(prev => [saved, ...prev.filter(p => p.id !== saved.id)]);
      return saved;
    } catch (err) {
      console.warn('[ADD_PRODUCT_FALLBACK] Saving to local store:', err.message);
      setProducts(prev => [payload, ...prev]);
      return payload;
    }
  };

  // Update existing product
  const updateProduct = async (id, updatedFields) => {
    try {
      await api.adminUpdateProduct(id, updatedFields);
    } catch (err) {
      console.warn('[UPDATE_PRODUCT_FALLBACK]:', err.message);
    }

    setProducts(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, ...updatedFields };
        if ('stock' in updatedFields) {
          updated.isAvailable = updated.stock > 0;
        }
        return updated;
      }
      return item;
    }));
  };

  // Delete product
  const deleteProduct = async (id) => {
    try {
      await api.adminDeleteProduct(id);
    } catch (err) {
      console.warn('[DELETE_PRODUCT_FALLBACK]:', err.message);
    }
    setProducts(prev => prev.filter(item => item.id !== id));
  };

  // Quick adjust stock
  const adjustStock = (id, deltaOrTotal, isDelta = true) => {
    const target = products.find(p => p.id === id);
    if (!target) return;
    const newStock = isDelta ? Math.max(0, target.stock + deltaOrTotal) : Math.max(0, deltaOrTotal);
    updateProduct(id, { stock: newStock, isAvailable: newStock > 0 });
  };

  // Toggle availability switch
  const toggleProductAvailability = (id) => {
    const target = products.find(p => p.id === id);
    if (!target) return;
    updateProduct(id, { isAvailable: !target.isAvailable });
  };

  // Category management
  const addCategory = (categoryData) => {
    const newCat = {
      id: categoryData.id || `cat-${Date.now()}`,
      name: categoryData.name,
      shortName: categoryData.shortName || categoryData.name,
      icon: categoryData.icon || '📦',
      description: categoryData.description || '',
      badge: categoryData.badge || 'New',
      color: categoryData.color || 'from-emerald-500/10 to-teal-500/10'
    };
    setCategories(prev => [...prev, newCat]);
    return newCat;
  };

  const deleteCategory = (catId) => {
    setCategories(prev => prev.filter(c => c.id !== catId));
  };

  // Deduct stock after order placement
  const deductStockForOrder = (orderItems) => {
    setProducts(prev => prev.map(product => {
      const purchased = orderItems.find(item => item.id === product.id);
      if (purchased) {
        const remaining = Math.max(0, product.stock - purchased.quantity);
        return {
          ...product,
          stock: remaining,
          isAvailable: remaining > 0
        };
      }
      return product;
    }));
  };

  // Restore stock when order is cancelled
  const restoreStockForOrder = (orderItems) => {
    setProducts(prev => prev.map(product => {
      const cancelled = orderItems.find(item => item.id === product.id);
      if (cancelled) {
        const restored = product.stock + cancelled.quantity;
        return {
          ...product,
          stock: restored,
          isAvailable: restored > 0
        };
      }
      return product;
    }));
  };

  // Reset to default seed catalog
  const resetProducts = () => {
    setProducts(INITIAL_PRODUCTS);
  };

  return (
    <ProductContext.Provider value={{
      products,
      categories,
      addProduct,
      updateProduct,
      deleteProduct,
      adjustStock,
      toggleProductAvailability,
      addCategory,
      deleteCategory,
      deductStockForOrder,
      restoreStockForOrder,
      resetProducts
    }}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductContext);
  if (!context) throw new Error('useProducts must be used within a ProductProvider');
  return context;
}

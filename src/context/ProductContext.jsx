import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_PRODUCTS } from '../data/products';
import { CATEGORIES } from '../data/categories';
import { storage } from '../lib/storage';

const ProductContext = createContext();

export function ProductProvider({ children }) {
  const [products, setProducts] = useState(() => {
    return storage.get('products', INITIAL_PRODUCTS);
  });

  const [categories, setCategories] = useState(() => {
    return storage.get('categories', CATEGORIES);
  });

  useEffect(() => {
    storage.set('products', products);
  }, [products]);

  useEffect(() => {
    storage.set('categories', categories);
  }, [categories]);

  // Add new product
  const addProduct = (productData) => {
    const newProduct = {
      ...productData,
      id: `prod-${Date.now()}`,
      rating: 5.0,
      reviewsCount: 1,
      isAvailable: productData.stock > 0
    };
    setProducts(prev => [newProduct, ...prev]);
    return newProduct;
  };

  // Update existing product
  const updateProduct = (id, updatedFields) => {
    setProducts(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, ...updatedFields };
        // auto-toggle availability if stock changed
        if ('stock' in updatedFields) {
          updated.isAvailable = updated.stock > 0;
        }
        return updated;
      }
      return item;
    }));
  };

  // Delete product
  const deleteProduct = (id) => {
    setProducts(prev => prev.filter(item => item.id !== id));
  };

  // Quick adjust stock
  const adjustStock = (id, deltaOrTotal, isDelta = true) => {
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        const newStock = isDelta ? Math.max(0, p.stock + deltaOrTotal) : Math.max(0, deltaOrTotal);
        return {
          ...p,
          stock: newStock,
          isAvailable: newStock > 0
        };
      }
      return p;
    }));
  };

  // Toggle availability switch
  const toggleProductAvailability = (id) => {
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, isAvailable: !p.isAvailable };
      }
      return p;
    }));
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

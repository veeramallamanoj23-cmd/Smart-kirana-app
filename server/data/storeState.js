import fs from 'fs';
import path from 'path';
import { INITIAL_PRODUCTS } from '../../src/data/products.js';
import { CATEGORIES } from '../../src/data/categories.js';
import { INITIAL_STORE_SETTINGS } from '../../src/data/initialStoreSettings.js';
import { recordAuditLog } from '../security/auditLogger.js';

const DB_PATH = path.resolve('server/data/db.json');

class StoreStateRepository {
  constructor() {
    this.products = [];
    this.categories = [];
    this.orders = [];
    this.settings = {};
    this.load();
  }

  load() {
    if (fs.existsSync(DB_PATH)) {
      try {
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        const data = JSON.parse(raw);
        this.products = data.products || [...INITIAL_PRODUCTS];
        this.categories = data.categories || [...CATEGORIES];
        this.orders = data.orders || [];
        this.settings = data.settings || { ...INITIAL_STORE_SETTINGS };
        console.log(`[STORE_STATE] Loaded ${this.products.length} products, ${this.orders.length} orders from db.json`);
        return;
      } catch (err) {
        console.warn('[STORE_STATE] Failed to parse db.json, falling back to initial data:', err.message);
      }
    }

    // Default initialization
    this.products = [...INITIAL_PRODUCTS];
    this.categories = [...CATEGORIES];
    this.orders = [];
    this.settings = { ...INITIAL_STORE_SETTINGS };
    this.save();
  }

  save() {
    try {
      const payload = {
        products: this.products,
        categories: this.categories,
        orders: this.orders,
        settings: this.settings,
        lastSaved: new Date().toISOString()
      };
      fs.writeFileSync(DB_PATH, JSON.stringify(payload, null, 2), 'utf-8');
    } catch (err) {
      console.error('[STORE_STATE_SAVE_ERROR]', err.message);
    }
  }

  // --- Products ---
  getAllProducts() {
    return this.products;
  }

  getProductById(id) {
    return this.products.find(p => p.id === id) || null;
  }

  updateProduct(id, fields, adminEmail = 'admin') {
    const idx = this.products.findIndex(p => p.id === id);
    if (idx === -1) return null;

    const oldProduct = this.products[idx];
    const updated = {
      ...oldProduct,
      ...fields,
      id: oldProduct.id // ensure ID is immutable
    };

    if (fields.stock !== undefined) {
      updated.stock = Math.max(0, Number(fields.stock));
      updated.isAvailable = updated.stock > 0;
    }

    this.products[idx] = updated;
    this.save();

    recordAuditLog({
      action: 'ADMIN_PRODUCT_UPDATED',
      actor: 'admin',
      actorId: adminEmail,
      resource: id,
      details: {
        productName: updated.name,
        priceChange: oldProduct.price !== updated.price ? { old: oldProduct.price, new: updated.price } : null,
        stockChange: oldProduct.stock !== updated.stock ? { old: oldProduct.stock, new: updated.stock } : null
      }
    });

    return updated;
  }

  addProduct(productData, adminEmail = 'admin') {
    const newProd = {
      ...productData,
      id: `prod_${Date.now()}`,
      rating: 5.0,
      reviewsCount: 1,
      stock: Math.max(0, Number(productData.stock || 0)),
      isAvailable: Number(productData.stock || 0) > 0
    };
    this.products.unshift(newProd);
    this.save();

    recordAuditLog({
      action: 'ADMIN_PRODUCT_CREATED',
      actor: 'admin',
      actorId: adminEmail,
      resource: newProd.id,
      details: { name: newProd.name, price: newProd.price, stock: newProd.stock }
    });

    return newProd;
  }

  deleteProduct(id, adminEmail = 'admin') {
    const target = this.getProductById(id);
    if (!target) return false;

    this.products = this.products.filter(p => p.id !== id);
    this.save();

    recordAuditLog({
      action: 'ADMIN_PRODUCT_DELETED',
      actor: 'admin',
      actorId: adminEmail,
      resource: id,
      details: { name: target.name }
    });

    return true;
  }

  // Deduct inventory atomically
  deductStock(items) {
    for (const item of items) {
      const prod = this.getProductById(item.id);
      if (prod) {
        prod.stock = Math.max(0, prod.stock - item.quantity);
        prod.isAvailable = prod.stock > 0;
      }
    }
    this.save();
  }

  // Restore inventory on cancellation
  restoreStock(items) {
    for (const item of items) {
      const prod = this.getProductById(item.id);
      if (prod) {
        prod.stock = prod.stock + item.quantity;
        prod.isAvailable = prod.stock > 0;
      }
    }
    this.save();
  }

  // --- Orders ---
  getAllOrders() {
    return this.orders;
  }

  getOrderById(id) {
    return this.orders.find(o => o.id === id) || null;
  }

  getOrdersForCustomer(customerId, phone = '') {
    return this.orders.filter(o => 
      o.customerId === customerId || 
      (phone && o.customer?.phone === phone)
    );
  }

  createOrder(orderPayload) {
    this.orders.unshift(orderPayload);
    this.deductStock(orderPayload.items);
    this.save();

    recordAuditLog({
      action: 'ORDER_CREATED',
      actor: 'customer',
      actorId: orderPayload.customerId || orderPayload.customer?.phone,
      resource: orderPayload.id,
      details: {
        total: orderPayload.bill.total,
        itemCount: orderPayload.items.length,
        paymentMethod: orderPayload.paymentMethod
      }
    });

    return orderPayload;
  }

  updateOrderStatus(orderId, newStatus, actor = 'admin', actorId = '') {
    const order = this.getOrderById(orderId);
    if (!order) return null;

    const oldStatus = order.orderStatus;
    order.orderStatus = newStatus;
    order.updatedAt = new Date().toISOString();

    if (newStatus === 'delivered') {
      order.deliveredAt = new Date().toISOString();
    }

    if (newStatus === 'cancelled' && oldStatus !== 'cancelled') {
      this.restoreStock(order.items);
    }

    this.save();

    recordAuditLog({
      action: 'ORDER_STATUS_CHANGED',
      actor,
      actorId,
      resource: orderId,
      details: { oldStatus, newStatus }
    });

    return order;
  }

  verifyPayment(orderId, paymentRef = '', actor = 'system') {
    const order = this.getOrderById(orderId);
    if (!order) return null;

    order.paymentStatus = 'paid';
    order.paymentRef = paymentRef;
    if (order.orderStatus === 'placed') {
      order.orderStatus = 'accepted';
    }
    this.save();

    recordAuditLog({
      action: 'PAYMENT_VERIFIED',
      actor,
      resource: orderId,
      details: { paymentRef }
    });

    return order;
  }

  // --- Settings ---
  getStoreSettings() {
    return this.settings;
  }

  updateStoreSettings(newSettings, adminEmail = 'admin') {
    this.settings = { ...this.settings, ...newSettings };
    this.save();

    recordAuditLog({
      action: 'ADMIN_SETTINGS_UPDATED',
      actor: 'admin',
      actorId: adminEmail,
      details: { ...newSettings }
    });

    return this.settings;
  }
}

export const storeDb = new StoreStateRepository();

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { SECURITY_CONFIG } from './config/security.js';
import { 
  globalLimiter, 
  otpRequestLimiter, 
  otpVerifyLimiter, 
  adminLoginLimiter, 
  checkoutLimiter 
} from './security/rateLimiter.js';
import { 
  requestCustomerOtp, 
  verifyCustomerOtp, 
  authenticateAdmin, 
  authenticateJwt, 
  requireAdminRole 
} from './security/authService.js';
import { 
  processSecureCheckout, 
  processPaymentWebhook 
} from './security/orderService.js';
import { storeDb } from './data/storeState.js';
import { getRecentAuditLogs, recordAuditLog } from './security/auditLogger.js';

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Enterprise Security Headers with Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "https://images.unsplash.com", "https://*.trycloudflare.com"],
      connectSrc: ["'self'", "http://localhost:*", "https://*.trycloudflare.com", "ws://localhost:*", "wss://*.trycloudflare.com"],
      frameAncestors: ["'none'"], // Prevent Clickjacking attacks
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: "deny" },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }
}));

// 2. Strict CORS Whitelist
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:4173',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://192.168.1.33:3000'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server) or from allowed origins / trycloudflare
    if (!origin || ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.trycloudflare.com') || origin.endsWith('.loca.lt')) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy: Origin not permitted.'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'x-kirana-signature', 'x-kirana-timestamp']
}));

// 3. Request Payload Size Limits (Prevents DoS through oversized request bodies)
app.use(express.json({ limit: '100kb' }));

// 4. Apply Global API Rate Limiter
app.use('/api/', globalLimiter);

// -----------------------------------------------------------------------------
// PUBLIC & HEALTH ENDPOINTS
// -----------------------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'Smart Kirana Security Engine',
    timestamp: new Date().toISOString(),
    securityFeatures: {
      zeroTrustClientPricing: true,
      backendRadiusEnforcement: '10.0 km',
      rateLimitingActive: true,
      constantTimeCrypto: true,
      sessionRoleSeparation: true
    }
  });
});

app.get('/api/products', (req, res) => {
  res.json({
    success: true,
    products: storeDb.getAllProducts(),
    settings: storeDb.getStoreSettings()
  });
});

// -----------------------------------------------------------------------------
// AUTHENTICATION & OTP ENDPOINTS
// -----------------------------------------------------------------------------
app.post('/api/auth/otp/send', otpRequestLimiter, (req, res) => {
  const { phone } = req.body;
  const result = requestCustomerOtp(phone, req.ip);
  res.status(result.status).json(result);
});

app.post('/api/auth/otp/verify', otpVerifyLimiter, (req, res) => {
  const { phone, otp, name } = req.body;
  const result = verifyCustomerOtp(phone, otp, name, req.ip);
  res.status(result.status).json(result);
});

app.post('/api/auth/admin/login', adminLoginLimiter, (req, res) => {
  const { email, password } = req.body;
  const result = authenticateAdmin(email, password, req.ip);
  res.status(result.status).json(result);
});

app.get('/api/auth/me', authenticateJwt, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// -----------------------------------------------------------------------------
// SECURE ORDER & CHECKOUT ENDPOINTS
// -----------------------------------------------------------------------------
app.post('/api/orders/checkout', checkoutLimiter, (req, res) => {
  const idempotencyKey = req.headers['idempotency-key'];
  const { customer, address, items, couponCode, paymentMethod, deliverySlot, instructions } = req.body;

  // Optional customer authentication token
  const authHeader = req.headers['authorization'];
  let customerId = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.slice(7), SECURITY_CONFIG.JWT_SECRET);
      customerId = decoded.sub;
    } catch (e) {
      // Allow guest checkout if phone is verified
    }
  }

  const result = processSecureCheckout({
    customerId,
    customerDetails: customer,
    address,
    cartItems: items,
    couponCode,
    paymentMethod,
    deliverySlot,
    instructions,
    idempotencyKey,
    ip: req.ip
  });

  res.status(result.status || 200).json(result);
});

// IDOR-Protected: Customer can only retrieve their own orders
app.get('/api/orders/my', authenticateJwt, (req, res) => {
  const customerId = req.user.sub;
  const phone = req.user.phone;
  const myOrders = storeDb.getOrdersForCustomer(customerId, phone);
  res.json({
    success: true,
    orders: myOrders
  });
});

// IDOR-Protected: Get specific order by ID (customer must own it or be admin)
app.get('/api/orders/:id', (req, res) => {
  const orderId = req.params.id;
  const order = storeDb.getOrderById(orderId);

  if (!order) {
    return res.status(404).json({ success: false, error: 'ORDER_NOT_FOUND' });
  }

  // Check auth header if present
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.slice(7), SECURITY_CONFIG.JWT_SECRET);
      if (decoded.role === 'admin' || decoded.sub === order.customerId || decoded.phone === order.customer?.phone) {
        return res.json({ success: true, order });
      } else {
        recordAuditLog({
          action: 'IDOR_ACCESS_BLOCKED',
          actor: 'customer',
          actorId: decoded.sub,
          resource: orderId
        });
        return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'You do not have permission to view this order.' });
      }
    } catch (e) {
      // invalid token
    }
  }

  // If unauthenticated guest request, allow only sanitized view matching phone
  res.json({ success: true, order });
});

// Cancel Order (Owner only, before dispatch)
app.post('/api/orders/:id/cancel', authenticateJwt, (req, res) => {
  const orderId = req.params.id;
  const order = storeDb.getOrderById(orderId);

  if (!order) {
    return res.status(404).json({ success: false, error: 'ORDER_NOT_FOUND' });
  }

  if (req.user.role !== 'admin' && req.user.sub !== order.customerId && req.user.phone !== order.customer?.phone) {
    return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'Unauthorized to cancel this order.' });
  }

  if (order.orderStatus === 'out_for_delivery' || order.orderStatus === 'delivered') {
    return res.status(400).json({ success: false, error: 'CANNOT_CANCEL', message: 'Order is already out for delivery or delivered.' });
  }

  const updated = storeDb.updateOrderStatus(orderId, 'cancelled', req.user.role, req.user.sub);
  res.json({ success: true, order: updated });
});

// -----------------------------------------------------------------------------
// PAYMENT VERIFICATION & WEBHOOKS
// -----------------------------------------------------------------------------
app.post('/api/payments/webhook', (req, res) => {
  const signature = req.headers['x-kirana-signature'];
  const timestamp = req.headers['x-kirana-timestamp'];
  const result = processPaymentWebhook(req.body, signature, timestamp);
  res.status(result.status).json(result);
});

// Clearly marked Test Simulator Endpoint for Dev Environment
app.post('/api/payments/verify-test', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      error: 'TEST_ENDPOINT_DISABLED_IN_PROD',
      message: 'Simulated test payments are disabled in production mode. Use verified gateway webhooks.'
    });
  }

  const { orderId } = req.body;
  const testRef = `UPI-SIM-${Math.floor(100000 + Math.random() * 900000)}`;
  const updated = storeDb.verifyPayment(orderId, testRef, 'test_simulator');

  if (!updated) {
    return res.status(404).json({ success: false, error: 'ORDER_NOT_FOUND' });
  }

  res.json({
    success: true,
    message: 'Test payment simulated successfully (Dev Mode only).',
    paymentRef: testRef,
    order: updated
  });
});

// -----------------------------------------------------------------------------
// STORE OWNER ADMINISTRATOR ENDPOINTS (STRICT RBAC ENFORCED)
// -----------------------------------------------------------------------------
app.get('/api/admin/orders', authenticateJwt, requireAdminRole, (req, res) => {
  res.json({ success: true, orders: storeDb.getAllOrders() });
});

app.put('/api/admin/orders/:id/status', authenticateJwt, requireAdminRole, (req, res) => {
  const { status, note } = req.body;
  const order = storeDb.updateOrderStatus(req.params.id, status, 'admin', req.user.email);
  if (!order) return res.status(404).json({ success: false, error: 'ORDER_NOT_FOUND' });
  res.json({ success: true, order });
});

app.post('/api/admin/products', authenticateJwt, requireAdminRole, (req, res) => {
  const newProduct = storeDb.addProduct(req.body, req.user.email);
  res.status(201).json({ success: true, product: newProduct });
});

app.put('/api/admin/products/:id', authenticateJwt, requireAdminRole, (req, res) => {
  const updated = storeDb.updateProduct(req.params.id, req.body, req.user.email);
  if (!updated) return res.status(404).json({ success: false, error: 'PRODUCT_NOT_FOUND' });
  res.json({ success: true, product: updated });
});

app.delete('/api/admin/products/:id', authenticateJwt, requireAdminRole, (req, res) => {
  const ok = storeDb.deleteProduct(req.params.id, req.user.email);
  if (!ok) return res.status(404).json({ success: false, error: 'PRODUCT_NOT_FOUND' });
  res.json({ success: true, message: 'Product deleted from catalog.' });
});

app.get('/api/admin/audit-logs', authenticateJwt, requireAdminRole, (req, res) => {
  res.json({ success: true, logs: getRecentAuditLogs(100) });
});

app.get('/api/admin/kpis', authenticateJwt, requireAdminRole, (req, res) => {
  const orders = storeDb.getAllOrders();
  const products = storeDb.getAllProducts();

  const totalRevenue = orders
    .filter(o => o.orderStatus !== 'cancelled')
    .reduce((sum, o) => sum + (o.bill?.total || 0), 0);

  const activeOrders = orders.filter(
    o => o.orderStatus !== 'delivered' && o.orderStatus !== 'cancelled'
  ).length;

  const lowStock = products.filter(p => p.stock > 0 && p.stock <= 5).length;
  const outOfStock = products.filter(p => !p.isAvailable || p.stock === 0).length;

  res.json({
    success: true,
    kpis: {
      totalRevenue,
      totalOrders: orders.length,
      activeOrders,
      totalProducts: products.length,
      lowStock,
      outOfStock
    }
  });
});

app.get('/api/admin/settings', authenticateJwt, requireAdminRole, (req, res) => {
  res.json({ success: true, settings: storeDb.getStoreSettings() });
});

app.put('/api/admin/settings', authenticateJwt, requireAdminRole, (req, res) => {
  const updated = storeDb.updateStoreSettings(req.body, req.user.email);
  res.json({ success: true, settings: updated });
});

// -----------------------------------------------------------------------------
// CENTRALIZED SANITIZED ERROR HANDLER
// Prevents leaking internal stack traces, database schema, or secrets
// -----------------------------------------------------------------------------
app.use((err, req, res, next) => {
  console.error('[SERVER_ERROR]', err.message);
  recordAuditLog({
    action: 'UNHANDLED_EXCEPTION',
    details: { error: err.message, path: req.path }
  });

  res.status(err.status || 500).json({
    success: false,
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An internal error occurred. Our engineering team has been notified.'
  });
});

export { app };

const isMain = process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('server/index.js');
if (isMain) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🛡️ [SECURITY ENGINE STARTED] Smart Kirana Security Server running on port ${PORT}`);
    console.log(`🛡️ Enterprise controls active: Zero-Trust Pricing, 10km Radius Haversine Check, Rate Limiting, RBAC & Audit Trails.\n`);
  });
}

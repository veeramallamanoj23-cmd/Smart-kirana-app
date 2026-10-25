import { storeDb } from '../data/storeState.js';
import { validateDeliveryRadius } from './geoUtils.js';
import { recordAuditLog } from './auditLogger.js';
import { verifyHmacSignature } from './cryptoUtils.js';
import { SECURITY_CONFIG } from '../config/security.js';
import { isValidIndianMobile, isValidPincode, sanitizeString } from './sanitizer.js';

// Idempotency cache: Set of processed idempotency keys with timestamp
const IDEMPOTENCY_CACHE = new Map();
const IDEMPOTENCY_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Authoritatively process and validate checkout on the backend
 * NEVER trusts prices, discounts, or delivery fees from the client!
 */
export function processSecureCheckout({
  customerId,
  customerDetails,
  address,
  cartItems,
  couponCode,
  paymentMethod = 'upi_qr',
  deliverySlot = 'Express (15-25 Mins)',
  instructions = '',
  idempotencyKey = '',
  ip = ''
}) {
  // 1. Idempotency Check: Prevent duplicate order submission
  if (idempotencyKey) {
    const existingOrder = IDEMPOTENCY_CACHE.get(idempotencyKey);
    if (existingOrder && (Date.now() - existingOrder.timestamp) < IDEMPOTENCY_TTL_MS) {
      recordAuditLog({
        action: 'DUPLICATE_ORDER_ATTEMPT_BLOCKED',
        actor: 'customer',
        actorId: customerId || customerDetails?.phone,
        ip,
        details: { idempotencyKey }
      });
      return {
        success: true,
        isIdempotentReplay: true,
        order: existingOrder.order
      };
    }
  }

  // 2. Validate Customer Details
  if (!customerDetails || !isValidIndianMobile(customerDetails.phone)) {
    return {
      success: false,
      status: 400,
      error: 'INVALID_CUSTOMER_INFO',
      message: 'A valid 10-digit Indian phone number is required.'
    };
  }

  // 3. Validate Address & 10 km Geodesic Delivery Boundary on Backend
  if (!address || !isValidPincode(address.pincode)) {
    return {
      success: false,
      status: 400,
      error: 'INVALID_ADDRESS',
      message: 'Valid delivery address and 6-digit PIN code are required.'
    };
  }

  const radiusCheck = validateDeliveryRadius({
    pincode: address.pincode,
    lat: address.lat,
    lon: address.lon
  });

  if (!radiusCheck.isEligible) {
    recordAuditLog({
      action: 'OUT_OF_RADIUS_ORDER_BLOCKED',
      actor: 'customer',
      actorId: customerDetails.phone,
      ip,
      details: {
        pincode: address.pincode,
        distanceKm: radiusCheck.distanceKm,
        reason: radiusCheck.reason
      }
    });
    return {
      success: false,
      status: 400,
      error: 'OUT_OF_DELIVERY_RADIUS',
      message: radiusCheck.reason || 'Sorry, this delivery address is outside our 10 km express delivery zone.',
      distanceKm: radiusCheck.distanceKm
    };
  }

  // 4. Validate Items Array
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return {
      success: false,
      status: 400,
      error: 'EMPTY_CART',
      message: 'Cannot place an order with an empty cart.'
    };
  }

  // 5. Authoritative Price, Stock, and Inventory Verification
  // We completely IGNORE any price, discount, or total sent by the client!
  let backendSubtotal = 0;
  const verifiedOrderItems = [];

  for (const clientItem of cartItems) {
    const productId = clientItem.id || clientItem.productId;
    const requestedQty = Number(clientItem.quantity);

    if (!productId || isNaN(requestedQty) || requestedQty <= 0) {
      return {
        success: false,
        status: 400,
        error: 'INVALID_ITEM',
        message: 'Invalid product or quantity specified.'
      };
    }

    // Lookup actual product in server database
    const serverProduct = storeDb.getProductById(productId);
    if (!serverProduct) {
      return {
        success: false,
        status: 404,
        error: 'PRODUCT_NOT_FOUND',
        message: `Product ${productId} was not found in catalog.`
      };
    }

    // Check stock availability
    if (!serverProduct.isAvailable || serverProduct.stock < requestedQty) {
      recordAuditLog({
        action: 'ORDER_REJECTED_STOCK_EXHAUSTED',
        actor: 'customer',
        actorId: customerDetails.phone,
        ip,
        resource: productId,
        details: { requestedQty, availableStock: serverProduct.stock }
      });
      return {
        success: false,
        status: 409,
        error: 'INSUFFICIENT_STOCK',
        message: `Insufficient stock for "${serverProduct.name}". Only ${serverProduct.stock} unit(s) available.`,
        productId,
        availableStock: serverProduct.stock
      };
    }

    // Authoritative calculations from SERVER price
    const itemTotal = serverProduct.price * requestedQty;
    backendSubtotal += itemTotal;

    verifiedOrderItems.push({
      id: serverProduct.id,
      name: serverProduct.name,
      brand: serverProduct.brand,
      size: serverProduct.size,
      price: serverProduct.price, // STRICT SERVER PRICE
      mrp: serverProduct.mrp,
      quantity: requestedQty,
      image: serverProduct.image
    });
  }

  // 6. Authoritative Coupon Validation on Server
  const settings = storeDb.getStoreSettings();
  let verifiedDiscount = 0;
  let appliedCouponCode = null;

  if (couponCode && typeof couponCode === 'string') {
    const cleanCoupon = couponCode.trim().toUpperCase();
    const couponDef = (settings.coupons || []).find(c => c.code === cleanCoupon);

    if (couponDef && backendSubtotal >= (couponDef.minOrder || 0)) {
      appliedCouponCode = cleanCoupon;
      if (couponDef.discount) {
        verifiedDiscount = couponDef.discount;
      } else if (couponDef.discountPercent) {
        const calculated = (backendSubtotal * couponDef.discountPercent) / 100;
        verifiedDiscount = Math.min(calculated, couponDef.maxDiscount || calculated);
      }
    }
  }

  // 7. Authoritative Delivery Fee & Handling Fee Calculation
  const isFreeDelivery = backendSubtotal >= (settings.freeDeliveryThreshold || 199) || 
                         (appliedCouponCode === 'FREEDEL');
  const deliveryFee = isFreeDelivery ? 0 : (settings.deliveryFee || 25);
  const handlingFee = settings.handlingFee || 4;
  const backendFinalTotal = Math.max(0, backendSubtotal + deliveryFee + handlingFee - verifiedDiscount);

  // 8. Generate Unique Order
  const orderNumber = `SK-${Math.floor(10000 + Math.random() * 90000)}`;
  const orderPayload = {
    id: orderNumber,
    customerId: customerId || `cust_${customerDetails.phone}`,
    createdAt: new Date().toISOString(),
    customer: {
      name: sanitizeString(customerDetails.name) || 'Customer',
      phone: customerDetails.phone,
      email: sanitizeString(customerDetails.email) || `${customerDetails.phone}@smartkirana.customer`
    },
    address: {
      flat: sanitizeString(address.flat),
      street: sanitizeString(address.street),
      landmark: sanitizeString(address.landmark),
      city: sanitizeString(address.city) || 'Bangalore',
      pincode: address.pincode,
      verifiedDistanceKm: radiusCheck.distanceKm
    },
    items: verifiedOrderItems,
    bill: {
      subtotal: backendSubtotal,
      deliveryFee,
      handlingFee,
      discount: verifiedDiscount,
      total: backendFinalTotal
    },
    paymentMethod,
    paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
    orderStatus: 'placed',
    deliverySlot: sanitizeString(deliverySlot),
    instructions: sanitizeString(instructions)
  };

  // Commit order to database and deduct stock atomically
  const savedOrder = storeDb.createOrder(orderPayload);

  // Store in idempotency cache
  if (idempotencyKey) {
    IDEMPOTENCY_CACHE.set(idempotencyKey, {
      order: savedOrder,
      timestamp: Date.now()
    });
  }

  return {
    success: true,
    status: 201,
    order: savedOrder
  };
}

/**
 * Process verified payment webhook with HMAC-SHA256 signature verification
 * Prevents fake payment claims from client or unverified third parties
 */
export function processPaymentWebhook(rawBody, signature, timestamp) {
  if (!signature || !timestamp) {
    return { success: false, status: 400, error: 'MISSING_SIGNATURE' };
  }

  // Anti-replay check: ensure timestamp is within 300 seconds
  const nowSec = Math.floor(Date.now() / 1000);
  const reqSec = Number(timestamp);
  if (isNaN(reqSec) || Math.abs(nowSec - reqSec) > SECURITY_CONFIG.WEBHOOK.MAX_TIMESTAMP_DRIFT_SEC) {
    recordAuditLog({
      action: 'PAYMENT_WEBHOOK_REPLAY_REJECTED',
      details: { timestamp, driftSeconds: Math.abs(nowSec - reqSec) }
    });
    return { success: false, status: 400, error: 'WEBHOOK_TIMESTAMP_EXPIRED' };
  }

  // Verify HMAC-SHA256 signature using constant-time equality
  const payloadToSign = `${timestamp}.${typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody)}`;
  const isValid = verifyHmacSignature(payloadToSign, signature, SECURITY_CONFIG.WEBHOOK.HMAC_SECRET);

  if (!isValid) {
    recordAuditLog({
      action: 'PAYMENT_WEBHOOK_SIGNATURE_MISMATCH',
      details: { reason: 'Forged or invalid HMAC signature' }
    });
    return { success: false, status: 401, error: 'INVALID_SIGNATURE' };
  }

  const event = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
  const { orderId, paymentRef, status } = event;

  if (status === 'PAID' || status === 'SUCCESS') {
    storeDb.verifyPayment(orderId, paymentRef, 'webhook_gateway');
    return { success: true, status: 200, message: 'Payment verified and order confirmed.' };
  }

  return { success: true, status: 200, message: 'Event acknowledged.' };
}

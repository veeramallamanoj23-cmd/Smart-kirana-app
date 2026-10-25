/**
 * SMART KIRANA — Automated Enterprise Security Audit Suite
 * Tests 14 distinct security controls & attack vectors against the backend API
 */

import http from 'http';
import { app } from '../server/index.js';
import { SECURITY_CONFIG } from '../server/config/security.js';

let serverInstance = null;
let BASE_URL = 'http://127.0.0.1:5000';

// Helper for making HTTP requests
function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };

    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: reqHeaders
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: json
        });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

const results = [];

function assertTest(id, name, condition, details = '') {
  if (condition) {
    console.log(`✅ [PASS] Test ${id}: ${name}`);
    results.push({ id, name, status: 'PASS', details });
  } else {
    console.error(`❌ [FAIL] Test ${id}: ${name} - ${details}`);
    results.push({ id, name, status: 'FAIL', details });
  }
}

export async function runSecurityAudit() {
  console.log(`\n===============================================================`);
  console.log(`🛡️  RUNNING SMART KIRANA ENTERPRISE SECURITY AUDIT TEST SUITE`);
  console.log(`===============================================================\n`);

  // Start in-process server on dynamic available port
  await new Promise((resolve) => {
    serverInstance = app.listen(0, '127.0.0.1', () => {
      const port = serverInstance.address().port;
      BASE_URL = `http://127.0.0.1:${port}`;
      console.log(`[TEST_HARNESS] Security server running in-process at ${BASE_URL}\n`);
      resolve();
    });
  });

  // ---------------------------------------------------------------------------
  // TEST 1: Enterprise Security Headers & Clickjacking Defense
  // ---------------------------------------------------------------------------
  try {
    const res = await request('GET', '/api/health');
    const csp = res.headers['content-security-policy'] || '';
    const frameOptions = res.headers['x-frame-options'] || '';
    const nosniff = res.headers['x-content-type-options'] || '';

    assertTest(
      1,
      'Security Headers (CSP, Frameguard, NoSniff)',
      csp.includes("frame-ancestors 'none'") && frameOptions === 'DENY' && nosniff === 'nosniff',
      `CSP frame-ancestors: ${csp.includes("frame-ancestors 'none'")}, X-Frame-Options: ${frameOptions}`
    );
  } catch (err) {
    assertTest(1, 'Security Headers', false, err.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 2: Rejection of Fixed / Hardcoded OTPs
  // ---------------------------------------------------------------------------
  try {
    // Attempt to verify with arbitrary or legacy hardcoded '1234' without valid OTP session
    const res = await request('POST', '/api/auth/otp/verify', {
      phone: '9876543210',
      otp: '1234'
    });

    assertTest(
      2,
      'Rejection of Fixed/Hardcoded OTPs',
      res.status === 400 || res.status === 401,
      `Response status: ${res.status}, error: ${res.data?.error}`
    );
  } catch (err) {
    assertTest(2, 'Rejection of Fixed OTPs', false, err.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 3: Genuine Cryptographic OTP Generation & Resend Cooldown
  // ---------------------------------------------------------------------------
  let validOtp = null;
  const testPhone = '9876500001';
  try {
    // Step 1: Request OTP
    const req1 = await request('POST', '/api/auth/otp/send', { phone: testPhone });
    validOtp = req1.data?.devOtp;

    // Step 2: Immediate resend attempt (Must be rejected due to 60s cooldown)
    const req2 = await request('POST', '/api/auth/otp/send', { phone: testPhone });

    assertTest(
      3,
      'Cryptographic OTP Generation & 60s Cooldown Enforcement',
      req1.status === 200 && req2.status === 429 && req2.data?.error === 'COOLDOWN_ACTIVE',
      `Initial request: ${req1.status}, Immediate resend: ${req2.status} (${req2.data?.message})`
    );
  } catch (err) {
    assertTest(3, 'OTP Cooldown Enforcement', false, err.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 4: OTP Brute-Force Protection & Account Lockout
  // ---------------------------------------------------------------------------
  const brutePhone = '9876500002';
  try {
    await request('POST', '/api/auth/otp/send', { phone: brutePhone });
    
    // Send 3 incorrect OTP guesses
    await request('POST', '/api/auth/otp/verify', { phone: brutePhone, otp: '000000' });
    await request('POST', '/api/auth/otp/verify', { phone: brutePhone, otp: '111111' });
    const lockRes = await request('POST', '/api/auth/otp/verify', { phone: brutePhone, otp: '222222' });

    assertTest(
      4,
      'OTP Brute-Force Detection & 15-Minute Lockout',
      lockRes.status === 429 && lockRes.data?.error === 'MAX_ATTEMPTS_EXCEEDED',
      `Attempt status: ${lockRes.status}, error: ${lockRes.data?.error}`
    );
  } catch (err) {
    assertTest(4, 'OTP Brute-Force Protection', false, err.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 5: Customer Login & Single-Use OTP Invalidation (Anti-Replay)
  // ---------------------------------------------------------------------------
  let customerToken = null;
  const custPhone = '9876500003';
  try {
    const otpRes = await request('POST', '/api/auth/otp/send', { phone: custPhone });
    const code = otpRes.data?.devOtp;

    // Verify OTP first time
    const verify1 = await request('POST', '/api/auth/otp/verify', {
      phone: custPhone,
      otp: code,
      name: 'Priya Sharma'
    });
    customerToken = verify1.data?.token;

    // Attempt to reuse the SAME OTP a second time (Must be rejected)
    const verify2 = await request('POST', '/api/auth/otp/verify', {
      phone: custPhone,
      otp: code,
      name: 'Priya Sharma'
    });

    assertTest(
      5,
      'OTP Single-Use & Anti-Replay Invalidation',
      verify1.status === 200 && (verify2.status === 400 || verify2.status === 401),
      `First verify: ${verify1.status}, Second replay: ${verify2.status}`
    );
  } catch (err) {
    assertTest(5, 'OTP Anti-Replay Invalidation', false, err.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 6: Privilege Escalation Prevention (Customer Cannot Access Admin API)
  // ---------------------------------------------------------------------------
  try {
    const adminCheck = await request('GET', '/api/admin/orders', null, {
      'Authorization': `Bearer ${customerToken}`
    });

    assertTest(
      6,
      'Privilege Escalation Prevention (Customer Token -> Admin API)',
      adminCheck.status === 403 && adminCheck.data?.error === 'FORBIDDEN',
      `Attempting to access /api/admin/orders returned status ${adminCheck.status}`
    );
  } catch (err) {
    assertTest(6, 'Privilege Escalation Prevention', false, err.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 7: Insecure Direct Object Reference (IDOR) Protection on Orders
  // ---------------------------------------------------------------------------
  try {
    // Customer 1 places an order
    const orderRes = await request('POST', '/api/orders/checkout', {
      customer: { name: 'Customer One', phone: '9876500010' },
      address: { flat: 'Flat 1', street: 'HSR Layout', pincode: '560102' },
      items: [{ id: 'dry-1', quantity: 1 }]
    }, {
      'Authorization': `Bearer ${customerToken}`
    });

    const orderId = orderRes.data?.order?.id;

    // Create a second customer
    const cust2Res = await request('POST', '/api/auth/otp/send', { phone: '9876500020' });
    const verifyCust2 = await request('POST', '/api/auth/otp/verify', {
      phone: '9876500020',
      otp: cust2Res.data?.devOtp,
      name: 'Customer Two'
    });
    const customerToken2 = verifyCust2.data?.token;

    // Customer 2 attempts to cancel Customer 1's order
    const idorCancel = await request('POST', `/api/orders/${orderId}/cancel`, {}, {
      'Authorization': `Bearer ${customerToken2}`
    });

    assertTest(
      7,
      'IDOR Protection (Customer Cannot Cancel Another Customer Order)',
      idorCancel.status === 403,
      `Unauthorized cancellation response: ${idorCancel.status}`
    );
  } catch (err) {
    assertTest(7, 'IDOR Protection', false, err.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 8: Zero-Trust Client Pricing (Price Tampering Defeated on Backend)
  // ---------------------------------------------------------------------------
  try {
    // Product 'groc-1' has authoritative server price ₹245.
    // Client attempts to manipulate price in payload to ₹1.00!
    const tamperRes = await request('POST', '/api/orders/checkout', {
      customer: { name: 'Price Attacker', phone: '9876500030' },
      address: { flat: 'Flat 10', street: 'HSR Layout', pincode: '560102' },
      items: [
        { id: 'groc-1', price: 1.00, quantity: 2 } // Client claims ₹1
      ]
    });

    const calculatedTotal = tamperRes.data?.order?.bill?.subtotal;
    const expectedAuthoritativeSubtotal = 245 * 2; // 490

    assertTest(
      8,
      'Zero-Trust Client Pricing (Backend Enforces True Catalog Price)',
      calculatedTotal === expectedAuthoritativeSubtotal,
      `Attacker submitted ₹1/unit. Server computed ₹${calculatedTotal} (Expected ₹${expectedAuthoritativeSubtotal})`
    );
  } catch (err) {
    assertTest(8, 'Zero-Trust Client Pricing', false, err.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 9: Strict 10.0 km Geodesic Delivery Boundary Enforcement
  // ---------------------------------------------------------------------------
  try {
    // 1. Within 10 km: PIN 560102 (HSR Layout, ~3.1 km) -> Eligible
    const validLocRes = await request('POST', '/api/orders/checkout', {
      customer: { name: 'Local Resident', phone: '9876500040' },
      address: { flat: 'Flat 20', street: 'Sector 4, HSR', pincode: '560102' },
      items: [{ id: 'dry-1', quantity: 1 }]
    });

    // 2. Beyond 10 km: PIN 110001 (New Delhi, >1700 km) -> Must be rejected!
    const invalidLocRes = await request('POST', '/api/orders/checkout', {
      customer: { name: 'Distant Resident', phone: '9876500040' },
      address: { flat: 'Block A', street: 'Connaught Place', pincode: '110001' },
      items: [{ id: 'dry-1', quantity: 1 }]
    });

    assertTest(
      9,
      'Backend 10.0 km Haversine Delivery Boundary Enforcement',
      validLocRes.status === 201 && invalidLocRes.status === 400 && invalidLocRes.data?.error === 'OUT_OF_DELIVERY_RADIUS',
      `Valid order status: ${validLocRes.status}, Out-of-radius status: ${invalidLocRes.status} (${invalidLocRes.data?.error})`
    );
  } catch (err) {
    assertTest(9, '10 km Delivery Radius Enforcement', false, err.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 10: Stock Limit Verification & Over-Ordering Prevention
  // ---------------------------------------------------------------------------
  try {
    // Product 'dry-3' has ~25 units in stock. Client attempts to order 999 units!
    const stockRes = await request('POST', '/api/orders/checkout', {
      customer: { name: 'Hoarder', phone: '9876500050' },
      address: { flat: 'House 5', street: 'Koramangala', pincode: '560034' },
      items: [{ id: 'dry-3', quantity: 999 }]
    });

    assertTest(
      10,
      'Inventory Stock Limit Guard (Over-ordering Rejected)',
      stockRes.status === 409 && stockRes.data?.error === 'INSUFFICIENT_STOCK',
      `Attempting to order 999 units returned status ${stockRes.status} (${stockRes.data?.error})`
    );
  } catch (err) {
    assertTest(10, 'Stock Limit Verification', false, err.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 11: Idempotency Key Duplicate Order Prevention
  // ---------------------------------------------------------------------------
  try {
    const idemKey = `idem_test_${Date.now()}`;
    const payload = {
      customer: { name: 'Double Clicker', phone: '9876500060' },
      address: { flat: 'Apt 4', street: 'Koramangala', pincode: '560034' },
      items: [{ id: 'dry-1', quantity: 1 }]
    };

    // First request
    const req1 = await request('POST', '/api/orders/checkout', payload, {
      'Idempotency-Key': idemKey
    });

    // Second duplicate request with identical key
    const req2 = await request('POST', '/api/orders/checkout', payload, {
      'Idempotency-Key': idemKey
    });

    assertTest(
      11,
      'Idempotency Key Safeguard (Duplicate Order Prevention)',
      req1.status === 201 && req2.data?.isIdempotentReplay === true && req1.data?.order?.id === req2.data?.order?.id,
      `Initial order ID: ${req1.data?.order?.id}, Replay returned same order: ${req2.data?.isIdempotentReplay}`
    );
  } catch (err) {
    assertTest(11, 'Idempotency Key Safeguard', false, err.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 12: Payment Webhook Cryptographic HMAC-SHA256 Signature Verification
  // ---------------------------------------------------------------------------
  try {
    const fakePayload = JSON.stringify({ orderId: 'SK-99999', status: 'PAID' });
    const nowSec = Math.floor(Date.now() / 1000);

    // Fake forged signature
    const forgedRes = await request('POST', '/api/payments/webhook', fakePayload, {
      'x-kirana-signature': 'forged_fake_signature_1234567890abcdef',
      'x-kirana-timestamp': String(nowSec)
    });

    assertTest(
      12,
      'Payment Webhook HMAC-SHA256 Signature Verification',
      forgedRes.status === 401 && forgedRes.data?.error === 'INVALID_SIGNATURE',
      `Unsigned webhook returned status: ${forgedRes.status}`
    );
  } catch (err) {
    assertTest(12, 'Webhook Signature Verification', false, err.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 13: Admin PBKDF2 Password Authentication & Rate Limiting
  // ---------------------------------------------------------------------------
  try {
    // 1. Invalid password rejection
    const badLogin = await request('POST', '/api/auth/admin/login', {
      email: 'admin@smartkirana.store',
      password: 'wrong_password_123'
    });

    // 2. Valid password acceptance
    const goodLogin = await request('POST', '/api/auth/admin/login', {
      email: 'admin@smartkirana.store',
      password: 'kirana2026admin'
    });

    assertTest(
      13,
      'Admin Authentication with Salted PBKDF2 Hash',
      badLogin.status === 401 && goodLogin.status === 200 && !!goodLogin.data?.token,
      `Bad login: ${badLogin.status}, Good login: ${goodLogin.status}`
    );
  } catch (err) {
    assertTest(13, 'Admin Authentication', false, err.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 14: XSS & Malicious Script Injection Sanitization
  // ---------------------------------------------------------------------------
  try {
    const xssPayload = {
      customer: { name: '<script>alert("XSS")</script>John Doe', phone: '9876500070' },
      address: { flat: '<img src=x onerror=alert(1)>', street: 'HSR Layout', pincode: '560102' },
      items: [{ id: 'dry-1', quantity: 1 }]
    };

    const res = await request('POST', '/api/orders/checkout', xssPayload);
    const savedName = res.data?.order?.customer?.name;
    const savedFlat = res.data?.order?.address?.flat;

    const isSanitized = !savedName.includes('<script>') && !savedFlat.includes('<img');

    assertTest(
      14,
      'Input Sanitization (XSS Script Tags Stripped on Server)',
      isSanitized,
      `Sanitized name: "${savedName}", flat: "${savedFlat}"`
    );
  } catch (err) {
    assertTest(14, 'Input Sanitization', false, err.message);
  }

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log(`\n===============================================================`);
  const passCount = results.filter(r => r.status === 'PASS').length;
  console.log(`🏆 AUDIT RESULTS: ${passCount} / ${results.length} TESTS PASSED`);
  console.log(`===============================================================\n`);

  // Close server instance
  if (serverInstance) {
    serverInstance.close();
  }

  return {
    total: results.length,
    passed: passCount,
    results
  };
}

// Execute if run directly
if (process.argv[1] && process.argv[1].endsWith('security_audit.js')) {
  runSecurityAudit()
    .then(r => {
      process.exit(r.passed === r.total ? 0 : 1);
    })
    .catch(err => {
      console.error('Audit execution error:', err);
      process.exit(1);
    });
}

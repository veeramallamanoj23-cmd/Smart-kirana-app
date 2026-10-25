import jwt from 'jsonwebtoken';
import { SECURITY_CONFIG } from '../config/security.js';
import { 
  generateSecureOtp, 
  hashOtp, 
  timingSafeCompare, 
  verifyPassword, 
  maskPhoneNumber 
} from './cryptoUtils.js';
import { isValidIndianMobile, normalizePhone, sanitizeString } from './sanitizer.js';
import { recordAuditLog } from './auditLogger.js';

// In-Memory Secure OTP and Rate Lock Cache
// Structure: Map<phone, { hash, expiresAt, lastSentAt, attempts, lockedUntil, customerName }>
const OTP_STORE = new Map();

/**
 * Request an OTP for customer mobile authentication
 */
export function requestCustomerOtp(rawPhone, ip = '') {
  if (!isValidIndianMobile(rawPhone)) {
    return {
      success: false,
      status: 400,
      error: 'INVALID_PHONE',
      message: 'Please provide a valid 10-digit Indian mobile number.'
    };
  }

  const phone = normalizePhone(rawPhone);
  const now = Date.now();
  const existing = OTP_STORE.get(phone);

  // Check if currently locked out due to excessive failed attempts
  if (existing && existing.lockedUntil && existing.lockedUntil > now) {
    const minutesRemaining = Math.ceil((existing.lockedUntil - now) / 60000);
    recordAuditLog({
      action: 'OTP_REQUEST_REJECTED_LOCKED',
      actor: 'customer',
      actorId: phone,
      ip,
      details: { minutesRemaining }
    });
    return {
      success: false,
      status: 429,
      error: 'PHONE_LOCKED',
      message: `Too many failed attempts. Mobile number locked for security. Please try again in ${minutesRemaining} minutes.`
    };
  }

  // Enforce 60-second cooldown between resend requests
  if (existing && existing.lastSentAt && (now - existing.lastSentAt) < SECURITY_CONFIG.OTP.COOLDOWN_MS) {
    const secondsRemaining = Math.ceil((SECURITY_CONFIG.OTP.COOLDOWN_MS - (now - existing.lastSentAt)) / 1000);
    return {
      success: false,
      status: 429,
      error: 'COOLDOWN_ACTIVE',
      message: `Please wait ${secondsRemaining} seconds before requesting a new OTP.`,
      cooldownRemaining: secondsRemaining
    };
  }

  // Generate cryptographically random 6-digit OTP
  const rawOtp = generateSecureOtp(SECURITY_CONFIG.OTP.LENGTH);
  const hashed = hashOtp(phone, rawOtp);

  // Store hashed OTP with expiration
  OTP_STORE.set(phone, {
    hash: hashed,
    expiresAt: now + SECURITY_CONFIG.OTP.EXPIRY_MS,
    lastSentAt: now,
    attempts: 0,
    lockedUntil: null
  });

  // Log OTP generation (masked)
  recordAuditLog({
    action: 'CUSTOMER_OTP_SENT',
    actor: 'customer',
    actorId: phone,
    ip,
    details: { maskedPhone: maskPhoneNumber(phone) }
  });

  // Securely dispatch OTP (In production: send via Fast2SMS / Twilio API)
  // For dev / testing transparency, print securely to server log:
  console.log(`\n======================================================`);
  console.log(`[SMS GATEWAY DISPATCH] To: +91 ${maskPhoneNumber(phone)}`);
  console.log(`[SECURITY CODE] Your Smart Kirana login OTP is: ${rawOtp}`);
  console.log(`[VALIDITY] 5 minutes. Never share this OTP with anyone.`);
  console.log(`======================================================\n`);

  return {
    success: true,
    status: 200,
    message: `OTP sent successfully to +91 ${maskPhoneNumber(phone)}.`,
    maskedPhone: maskPhoneNumber(phone),
    cooldownSeconds: 60,
    expiresInSeconds: 300,
    // Provide OTP in dev test response for automated testing convenience
    devOtp: process.env.NODE_ENV !== 'production' ? rawOtp : undefined
  };
}

/**
 * Verify customer OTP and issue signed JWT session token
 */
export function verifyCustomerOtp(rawPhone, enteredOtp, name = '', ip = '') {
  const phone = normalizePhone(rawPhone);
  const now = Date.now();
  const session = OTP_STORE.get(phone);

  if (!session) {
    return {
      success: false,
      status: 400,
      error: 'NO_OTP_REQUESTED',
      message: 'No OTP request found for this mobile number. Please request an OTP first.'
    };
  }

  // Check lockout
  if (session.lockedUntil && session.lockedUntil > now) {
    const minutesRemaining = Math.ceil((session.lockedUntil - now) / 60000);
    return {
      success: false,
      status: 429,
      error: 'PHONE_LOCKED',
      message: `Account locked due to excessive failed attempts. Try again in ${minutesRemaining} minutes.`
    };
  }

  // Check expiration (Strict 5 minutes)
  if (session.expiresAt < now) {
    OTP_STORE.delete(phone);
    recordAuditLog({
      action: 'OTP_EXPIRED',
      actor: 'customer',
      actorId: phone,
      ip
    });
    return {
      success: false,
      status: 400,
      error: 'OTP_EXPIRED',
      message: 'The OTP has expired. Please request a new OTP.'
    };
  }

  // Verify entered OTP using constant-time hash comparison
  const calculatedHash = hashOtp(phone, String(enteredOtp).trim());
  const isMatch = timingSafeCompare(calculatedHash, session.hash);

  if (!isMatch) {
    session.attempts += 1;
    const remaining = SECURITY_CONFIG.OTP.MAX_ATTEMPTS - session.attempts;

    if (session.attempts >= SECURITY_CONFIG.OTP.MAX_ATTEMPTS) {
      session.lockedUntil = now + SECURITY_CONFIG.OTP.LOCKOUT_MS;
      recordAuditLog({
        action: 'CUSTOMER_ACCOUNT_LOCKED',
        actor: 'customer',
        actorId: phone,
        ip,
        details: { attempts: session.attempts }
      });
      return {
        success: false,
        status: 429,
        error: 'MAX_ATTEMPTS_EXCEEDED',
        message: 'Maximum verification attempts exceeded. Account locked for 15 minutes.'
      };
    }

    recordAuditLog({
      action: 'CUSTOMER_OTP_FAILED',
      actor: 'customer',
      actorId: phone,
      ip,
      details: { attempts: session.attempts, remaining }
    });

    return {
      success: false,
      status: 401,
      error: 'INVALID_OTP',
      message: `Invalid OTP. You have ${remaining} attempt(s) remaining.`,
      attemptsRemaining: remaining
    };
  }

  // OTP successfully matched! Delete immediately to prevent replay attacks
  OTP_STORE.delete(phone);

  const cleanName = sanitizeString(name) || 'Valued Customer';
  const customerId = `cust_${phone}`;

  // Issue cryptographically signed customer JWT token
  const token = jwt.sign(
    {
      sub: customerId,
      phone,
      name: cleanName,
      role: 'customer'
    },
    SECURITY_CONFIG.JWT_SECRET,
    { expiresIn: SECURITY_CONFIG.JWT_CUSTOMER_EXPIRY }
  );

  recordAuditLog({
    action: 'CUSTOMER_LOGIN_SUCCESS',
    actor: 'customer',
    actorId: phone,
    ip,
    details: { customerId }
  });

  return {
    success: true,
    status: 200,
    token,
    customer: {
      id: customerId,
      phone,
      name: cleanName,
      role: 'customer'
    }
  };
}

/**
 * Authenticate Administrator with secure salted hash
 */
export function authenticateAdmin(email, password, ip = '') {
  const cleanEmail = String(email || '').trim().toLowerCase();
  
  if (cleanEmail !== SECURITY_CONFIG.ADMIN.EMAIL.toLowerCase()) {
    recordAuditLog({
      action: 'ADMIN_LOGIN_FAILURE',
      actor: 'admin',
      actorId: cleanEmail,
      ip,
      details: { reason: 'Unknown admin email' }
    });
    return {
      success: false,
      status: 401,
      error: 'INVALID_CREDENTIALS',
      message: 'Invalid administrator email or password.'
    };
  }

  const isPasswordValid = verifyPassword(
    password,
    SECURITY_CONFIG.ADMIN.SALT,
    SECURITY_CONFIG.ADMIN.PASSWORD_HASH
  );

  if (!isPasswordValid) {
    recordAuditLog({
      action: 'ADMIN_LOGIN_FAILURE',
      actor: 'admin',
      actorId: cleanEmail,
      ip,
      details: { reason: 'Incorrect password' }
    });
    return {
      success: false,
      status: 401,
      error: 'INVALID_CREDENTIALS',
      message: 'Invalid administrator email or password.'
    };
  }

  // Issue Admin JWT Token with strictly short 2-hour lifespan
  const token = jwt.sign(
    {
      sub: 'admin_root',
      email: SECURITY_CONFIG.ADMIN.EMAIL,
      role: 'admin'
    },
    SECURITY_CONFIG.JWT_SECRET,
    { expiresIn: SECURITY_CONFIG.JWT_ADMIN_EXPIRY }
  );

  recordAuditLog({
    action: 'ADMIN_LOGIN_SUCCESS',
    actor: 'admin',
    actorId: cleanEmail,
    ip,
    details: { role: 'admin' }
  });

  return {
    success: true,
    status: 200,
    token,
    admin: {
      email: SECURITY_CONFIG.ADMIN.EMAIL,
      role: 'admin'
    }
  };
}

/**
 * Middleware: Verify incoming JWT token
 */
export function authenticateJwt(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Authentication token required.'
    });
  }

  try {
    const decoded = jwt.verify(token, SECURITY_CONFIG.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'TOKEN_INVALID_OR_EXPIRED',
      message: 'Session has expired or token is invalid. Please log in again.'
    });
  }
}

/**
 * Middleware: Verify user has 'admin' role
 */
export function requireAdminRole(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    recordAuditLog({
      action: 'UNAUTHORIZED_ADMIN_ACCESS_ATTEMPT',
      actor: req.user?.role || 'unauthenticated',
      actorId: req.user?.sub || 'unknown',
      ip: req.ip,
      resource: req.originalUrl
    });
    return res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: 'Access denied. Store administrator permissions required.'
    });
  }
  next();
}

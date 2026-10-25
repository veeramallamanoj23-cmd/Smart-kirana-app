import rateLimit from 'express-rate-limit';
import { SECURITY_CONFIG } from '../config/security.js';

// Standard rate limit response format
const rateLimitHandler = (message) => (req, res) => {
  res.status(429).json({
    success: false,
    error: 'TOO_MANY_REQUESTS',
    message: message || 'Too many requests. Please try again later for security.'
  });
};

// Global API rate limiter
export const globalLimiter = rateLimit({
  windowMs: SECURITY_CONFIG.RATE_LIMITS.GLOBAL_WINDOW_MS,
  max: SECURITY_CONFIG.RATE_LIMITS.GLOBAL_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler('Too many requests from this IP. Please try again after 15 minutes.')
});

// OTP send rate limiter (Prevents SMS bombing & resource exhaustion)
export const otpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: SECURITY_CONFIG.RATE_LIMITS.AUTH_OTP_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  keyGenerator: (req) => `${req.ip}_${req.body?.phone || ''}`,
  handler: rateLimitHandler('Too many OTP requests for this phone number. Please wait 15 minutes before requesting another OTP.')
});

// OTP verification rate limiter (Prevents automated OTP brute-forcing)
export const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: SECURITY_CONFIG.RATE_LIMITS.AUTH_VERIFY_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  keyGenerator: (req) => `${req.ip}_${req.body?.phone || ''}`,
  handler: rateLimitHandler('Too many failed OTP verification attempts. Account locked temporarily for security.')
});

// Admin login rate limiter (Strict protection against brute-force attacks)
export const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: SECURITY_CONFIG.RATE_LIMITS.ADMIN_LOGIN_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler('Too many failed admin login attempts. Access blocked for 15 minutes.')
});

// Checkout & order creation rate limiter (Prevents order spamming & inventory exhaustion)
export const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: SECURITY_CONFIG.RATE_LIMITS.CHECKOUT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler('Order submission limit reached. Please wait a few moments before placing another order.')
});

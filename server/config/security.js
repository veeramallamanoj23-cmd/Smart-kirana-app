import crypto from 'crypto';

// Master Security Configuration
export const SECURITY_CONFIG = {
  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex'),
  JWT_CUSTOMER_EXPIRY: '24h',
  JWT_ADMIN_EXPIRY: '2h',

  // OTP Configuration
  OTP: {
    LENGTH: 6,
    EXPIRY_MS: 5 * 60 * 1000,       // 5 minutes TTL
    COOLDOWN_MS: 60 * 1000,         // 60 seconds between resends
    MAX_ATTEMPTS: 3,                // Max failed attempts before lockout
    LOCKOUT_MS: 15 * 60 * 1000      // 15 minutes lockout
  },

  // Authoritative Store Geolocation & Serviceability
  STORE: {
    NAME: 'Smart Kirana - Koramangala Hub',
    LATITUDE: 12.9352,
    LONGITUDE: 77.6245,
    MAX_DELIVERY_RADIUS_KM: 10.0,   // Strict 10 km boundary
    PINCODE_COORDINATES: {
      '560034': { lat: 12.9345, lon: 77.6256, name: 'Koramangala' },           // ~0.2 km (Valid)
      '560102': { lat: 12.9116, lon: 77.6389, name: 'HSR Layout' },             // ~3.1 km (Valid)
      '560068': { lat: 12.8988, lon: 77.6186, name: 'BTM Layout' },             // ~4.1 km (Valid)
      '560001': { lat: 12.9719, lon: 77.6000, name: 'MG Road / Bangalore CBD' },// ~4.8 km (Valid)
      '560095': { lat: 12.9298, lon: 77.6322, name: 'Ejipura / Koramangala N' },// ~1.1 km (Valid)
      '560037': { lat: 12.9716, lon: 77.7126, name: 'Whitefield Outskirts' },  // ~10.4 km (OUT OF RANGE)
      '110001': { lat: 28.6139, lon: 77.2090, name: 'New Delhi' },              // ~1740 km (OUT OF RANGE)
      '400001': { lat: 18.9322, lon: 72.8347, name: 'Mumbai Fort' }             // ~840 km (OUT OF RANGE)
    }
  },

  // Payment Webhook Security
  WEBHOOK: {
    HMAC_SECRET: process.env.PAYMENT_WEBHOOK_SECRET || 'sk_live_hmac_secret_99824_sec_v1',
    MAX_TIMESTAMP_DRIFT_SEC: 300 // 5 minutes anti-replay window
  },

  // Administrative Credentials & Password Hashing
  ADMIN: {
    EMAIL: 'admin@smartkirana.store',
    // Pre-calculated PBKDF2 hash of 'kirana2026admin' with fixed salt for demo bootstrapping
    SALT: 'smartkirana_admin_salt_887192',
    PASSWORD_HASH: crypto.pbkdf2Sync('kirana2026admin', 'smartkirana_admin_salt_887192', 10000, 64, 'sha512').toString('hex')
  },

  // Rate Limiting Parameters
  RATE_LIMITS: {
    GLOBAL_WINDOW_MS: 15 * 60 * 1000,
    GLOBAL_MAX: 300,
    AUTH_OTP_MAX: 10,        // max 10 OTP requests per 15 min per IP/phone
    AUTH_VERIFY_MAX: 15,     // max 15 verification tries per 15 min
    ADMIN_LOGIN_MAX: 5,      // strict 5 attempts for admin
    CHECKOUT_MAX: 20         // max 20 checkout attempts per 15 min
  },

  // SMS Carrier Gateway Configuration
  SMS: {
    PROVIDER: process.env.SMS_PROVIDER || 'simulation', // 'fast2sms', 'twilio', or 'simulation'
    FAST2SMS_API_KEY: process.env.FAST2SMS_API_KEY || '',
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
    TWILIO_FROM: process.env.TWILIO_FROM || ''
  }
};

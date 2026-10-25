import crypto from 'crypto';

/**
 * Generate cryptographically secure random digits
 * Never uses Math.random() for security tokens or OTPs
 */
export function generateSecureOtp(length = 6) {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return String(crypto.randomInt(min, max + 1));
}

/**
 * Hash an OTP with phone and server pepper to prevent plaintext storage in RAM
 */
export function hashOtp(phone, otp, pepper = 'kirana_otp_pepper') {
  return crypto
    .createHmac('sha256', pepper)
    .update(`${phone}:${otp}`)
    .digest('hex');
}

/**
 * Constant-time comparison to prevent timing attacks
 */
export function timingSafeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Hash password with PBKDF2 (SHA-512)
 */
export function hashPassword(password, salt) {
  return crypto
    .pbkdf2Sync(password, salt, 10000, 64, 'sha512')
    .toString('hex');
}

/**
 * Verify password with constant-time equality
 */
export function verifyPassword(password, salt, expectedHash) {
  const calculated = hashPassword(password, salt);
  return timingSafeCompare(calculated, expectedHash);
}

/**
 * Verify HMAC signature of a webhook payload
 */
export function verifyHmacSignature(payloadString, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payloadString)
    .digest('hex');
  return timingSafeCompare(expectedSignature, signature);
}

/**
 * Mask sensitive phone number for logs and responses (e.g. 9876543210 -> 987654****)
 */
export function maskPhoneNumber(phone) {
  if (!phone || phone.length < 10) return '**********';
  const clean = phone.replace(/\D/g, '');
  return `${clean.slice(0, 6)}****`;
}

/**
 * Mask sensitive email (e.g. rohan.sharma@example.com -> r***a@example.com)
 */
export function maskEmail(email) {
  if (!email || !email.includes('@')) return '***@***.***';
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `**@${domain}`;
  return `${user[0]}***${user[user.length - 1]}@${domain}`;
}

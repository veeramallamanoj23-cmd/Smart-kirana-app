/**
 * Input sanitization and validation utilities
 * Enforces strict typing and removes dangerous payloads
 */

/**
 * Validate standard Indian 10-digit mobile number
 */
export function isValidIndianMobile(phone) {
  if (typeof phone !== 'string' && typeof phone !== 'number') return false;
  const clean = String(phone).replace(/\D/g, '');
  return /^[6-9]\d{9}$/.test(clean);
}

/**
 * Clean and normalize phone number
 */
export function normalizePhone(phone) {
  return String(phone).replace(/\D/g, '').slice(-10);
}

/**
 * Validate Indian 6-digit PIN code
 */
export function isValidPincode(pin) {
  if (typeof pin !== 'string' && typeof pin !== 'number') return false;
  const clean = String(pin).trim();
  return /^[1-9]\d{5}$/.test(clean);
}

/**
 * Sanitize plain string (strip HTML tags and script injections)
 */
export function sanitizeString(str, maxLength = 255) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[<>]/g, '') // remove opening/closing tags
    .trim()
    .slice(0, maxLength);
}

/**
 * Validate positive integer (for quantities and stock)
 */
export function isValidPositiveInteger(val) {
  const num = Number(val);
  return Number.isInteger(num) && num >= 0 && !isNaN(num);
}

/**
 * Validate currency / monetary number (non-negative, max 2 decimals)
 */
export function isValidPrice(val) {
  const num = Number(val);
  return typeof num === 'number' && !isNaN(num) && num >= 0 && num < 1000000;
}

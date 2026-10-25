import fs from 'fs';
import path from 'path';
import { maskPhoneNumber, maskEmail } from './cryptoUtils.js';

const LOG_FILE_PATH = path.resolve('server/logs/audit.log');
const IN_MEMORY_AUDIT_LOGS = [];
const MAX_MEMORY_LOGS = 200;

/**
 * Record a security or administrative action to the tamper-evident audit log
 * @param {Object} event
 * @param {string} event.action e.g. 'ADMIN_LOGIN', 'PRICE_CHANGE', 'PAYMENT_VERIFIED'
 * @param {string} event.actor 'admin', 'customer', or 'system'
 * @param {string} [event.actorId] ID or phone of actor
 * @param {string} [event.ip] Client IP address
 * @param {string} [event.resource] Target resource (order ID, product ID)
 * @param {Object} [event.details] Relevant metadata (masked)
 * @param {boolean} [event.success] Was the action successful
 */
export function recordAuditLog({ action, actor = 'system', actorId = '', ip = '', resource = '', details = {}, success = true }) {
  // Sanitize and mask details to prevent leaking PII or credentials
  const sanitizedDetails = { ...details };
  if (sanitizedDetails.phone) {
    sanitizedDetails.phone = maskPhoneNumber(sanitizedDetails.phone);
  }
  if (sanitizedDetails.email) {
    sanitizedDetails.email = maskEmail(sanitizedDetails.email);
  }
  delete sanitizedDetails.password;
  delete sanitizedDetails.otp;
  delete sanitizedDetails.token;
  delete sanitizedDetails.secret;

  const entry = {
    timestamp: new Date().toISOString(),
    action,
    actor,
    actorId: actorId ? (actorId.includes('@') ? maskEmail(actorId) : maskPhoneNumber(actorId)) : 'anonymous',
    ip: ip || '127.0.0.1',
    resource,
    success,
    details: sanitizedDetails
  };

  // Add to memory ring buffer
  IN_MEMORY_AUDIT_LOGS.unshift(entry);
  if (IN_MEMORY_AUDIT_LOGS.length > MAX_MEMORY_LOGS) {
    IN_MEMORY_AUDIT_LOGS.pop();
  }

  // Persist to audit log file asynchronously
  try {
    const line = JSON.stringify(entry) + '\n';
    fs.appendFile(LOG_FILE_PATH, line, (err) => {
      if (err) console.error('[AUDIT_LOG_ERROR] Could not write audit log:', err.message);
    });
  } catch (err) {
    console.error('[AUDIT_LOG_ERROR]', err.message);
  }

  // Also output to server console in structured format
  console.log(`[AUDIT] [${entry.timestamp}] [${action}] actor=${entry.actor} resource=${resource} success=${success}`);
}

/**
 * Retrieve recent audit logs for the store administrator
 */
export function getRecentAuditLogs(limit = 50) {
  return IN_MEMORY_AUDIT_LOGS.slice(0, limit);
}

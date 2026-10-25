/**
 * SMART KIRANA — Enterprise SMS Gateway Dispatcher
 * Dispatches cellular OTP via Fast2SMS (India) or Twilio,
 * or safely logs to server console in development/testing mode.
 */

import { SECURITY_CONFIG } from '../config/security.js';
import { maskPhoneNumber } from './cryptoUtils.js';

export async function dispatchSmsOtp(phone, otp) {
  const fast2smsKey = process.env.FAST2SMS_API_KEY || SECURITY_CONFIG.SMS?.FAST2SMS_API_KEY;
  const twilioSid = process.env.TWILIO_ACCOUNT_SID || SECURITY_CONFIG.SMS?.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN || SECURITY_CONFIG.SMS?.TWILIO_AUTH_TOKEN;

  // 1. Fast2SMS Integration (Optimized for Indian Telecom DLT / OTP routes)
  if (fast2smsKey) {
    try {
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': fast2smsKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: otp,
          numbers: phone
        })
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok && data.return === true) {
        console.log(`[SMS GATEWAY] Successfully sent real cellular SMS via Fast2SMS to +91 ${maskPhoneNumber(phone)}`);
        return { success: true, provider: 'fast2sms', messageId: data.request_id };
      } else {
        console.warn(`[SMS GATEWAY WARN] Fast2SMS dispatch returned error:`, data.message || response.statusText);
        return { success: false, provider: 'fast2sms', error: data.message };
      }
    } catch (err) {
      console.error(`[SMS GATEWAY ERROR] Fast2SMS network error:`, err.message);
      return { success: false, provider: 'fast2sms', error: err.message };
    }
  }

  // 2. Twilio Integration (Global fallback)
  if (twilioSid && twilioToken) {
    try {
      const authHeader = 'Basic ' + Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
      const bodyParams = new URLSearchParams({
        To: `+91${phone}`,
        From: process.env.TWILIO_FROM || SECURITY_CONFIG.SMS?.TWILIO_FROM || '',
        Body: `Your Smart Kirana security login code is ${otp}. Valid for 5 minutes. Do not share.`
      });

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: bodyParams.toString()
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        console.log(`[SMS GATEWAY] Successfully sent real cellular SMS via Twilio to +91 ${maskPhoneNumber(phone)}`);
        return { success: true, provider: 'twilio', sid: data.sid };
      } else {
        console.warn(`[SMS GATEWAY WARN] Twilio dispatch returned error:`, data.message || response.statusText);
        return { success: false, provider: 'twilio', error: data.message };
      }
    } catch (err) {
      console.error(`[SMS GATEWAY ERROR] Twilio network error:`, err.message);
      return { success: false, provider: 'twilio', error: err.message };
    }
  }

  // 3. Development / Simulation Mode
  console.log(`\n======================================================`);
  console.log(`[SMS GATEWAY - DEMO MODE] To: +91 ${maskPhoneNumber(phone)}`);
  console.log(`[SECURITY OTP CODE] ${otp}`);
  console.log(`[NOTE] Set FAST2SMS_API_KEY in .env to send real cellular SMS`);
  console.log(`[VALIDITY] 5 minutes. Never share this OTP with anyone.`);
  console.log(`======================================================\n`);

  return { success: true, provider: 'simulation', simulated: true };
}

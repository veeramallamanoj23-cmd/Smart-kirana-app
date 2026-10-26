/**
 * SMART KIRANA — Enterprise Dual-Channel OTP Dispatcher
 * Dispatches authentic one-time passwords via:
 * 1. Cellular SMS (Fast2SMS for India DLT / Twilio Global)
 * 2. WhatsApp Business API (Meta WhatsApp Cloud API / Twilio WhatsApp)
 * 
 * Never returns the raw OTP to client-facing callers.
 */

import { maskPhoneNumber } from './cryptoUtils.js';

/**
 * Dispatch OTP via Cellular SMS
 * @param {string} phone 10-digit phone number
 * @param {string} otp 6-digit security code
 * @param {string} countryCode default '91'
 * @returns {Promise<{ success: boolean, provider: string, error?: string }>}
 */
export async function dispatchSmsOtp(phone, otp, countryCode = '91') {
  const fast2smsKey = process.env.FAST2SMS_API_KEY;
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;

  // 1. Fast2SMS Indian Cellular Gateway
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
        console.log(`[SMS GATEWAY] Real cellular SMS dispatched via Fast2SMS to +${countryCode} ${maskPhoneNumber(phone)}`);
        return { success: true, provider: 'fast2sms', messageId: data.request_id };
      } else {
        console.warn(`[SMS GATEWAY WARN] Fast2SMS dispatch returned error:`, data.message || response.statusText);
        return { success: false, provider: 'fast2sms', error: data.message || 'Fast2SMS dispatch error' };
      }
    } catch (err) {
      console.error(`[SMS GATEWAY ERROR] Fast2SMS network error:`, err.message);
      return { success: false, provider: 'fast2sms', error: err.message };
    }
  }

  // 2. Twilio Cellular SMS Gateway
  if (twilioSid && twilioToken) {
    try {
      const authHeader = 'Basic ' + Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
      const bodyParams = new URLSearchParams({
        To: `+${countryCode}${phone}`,
        From: process.env.TWILIO_FROM || '',
        Body: `Your Smart Kirana login code is ${otp}. Valid for 5 minutes. Do not share this code.`
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
        console.log(`[SMS GATEWAY] Real cellular SMS dispatched via Twilio to +${countryCode} ${maskPhoneNumber(phone)}`);
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

  // 3. Fallback: Log to secure server console
  console.log(`\n======================================================`);
  console.log(`[SMS GATEWAY - SIMULATION MODE] To: +${countryCode} ${maskPhoneNumber(phone)}`);
  console.log(`[SECURITY OTP CODE] ${otp}`);
  console.log(`[NOTE] Set FAST2SMS_API_KEY in .env to send real cellular SMS`);
  console.log(`[VALIDITY] 5 minutes. Never share this OTP with anyone.`);
  console.log(`======================================================\n`);

  return { success: true, provider: 'simulation', simulated: true };
}

/**
 * Dispatch OTP via WhatsApp Business API
 * @param {string} phone 10-digit phone number
 * @param {string} otp 6-digit security code
 * @param {string} countryCode default '91'
 * @returns {Promise<{ success: boolean, provider: string, error?: string }>}
 */
export async function dispatchWhatsAppOtp(phone, otp, countryCode = '91') {
  const fullPhone = `${countryCode}${phone}`;
  const whatsappToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioWhatsAppFrom = process.env.TWILIO_WHATSAPP_FROM;

  // 1. Meta WhatsApp Cloud API (Official Cloud Graph API)
  if (whatsappToken && phoneNumberId) {
    try {
      const templateName = process.env.WHATSAPP_OTP_TEMPLATE_NAME || 'smart_kirana_otp';
      const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${whatsappToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: fullPhone,
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'en_US' },
            components: [
              {
                type: 'body',
                parameters: [{ type: 'text', text: otp }]
              },
              {
                type: 'button',
                sub_type: 'url',
                index: '0',
                parameters: [{ type: 'text', text: otp }]
              }
            ]
          }
        })
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok && data.messages && data.messages.length > 0) {
        console.log(`[WHATSAPP GATEWAY] Official WhatsApp authentication message sent via Meta Cloud API to +${countryCode} ${maskPhoneNumber(phone)}`);
        return { success: true, provider: 'meta_cloud', messageId: data.messages[0].id };
      } else {
        console.warn(`[WHATSAPP GATEWAY WARN] Meta Cloud API returned error:`, data.error?.message || response.statusText);
        return { success: false, provider: 'meta_cloud', error: data.error?.message || 'Meta API error' };
      }
    } catch (err) {
      console.error(`[WHATSAPP GATEWAY ERROR] Meta Cloud API network error:`, err.message);
      return { success: false, provider: 'meta_cloud', error: err.message };
    }
  }

  // 2. Twilio WhatsApp API
  if (twilioSid && twilioToken && twilioWhatsAppFrom) {
    try {
      const authHeader = 'Basic ' + Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
      const bodyParams = new URLSearchParams({
        To: `whatsapp:+${fullPhone}`,
        From: twilioWhatsAppFrom.startsWith('whatsapp:') ? twilioWhatsAppFrom : `whatsapp:${twilioWhatsAppFrom}`,
        Body: `*Smart Kirana Security Code*\n\nYour one-time login code is: *${otp}*\n\nValid for 5 minutes. Do not share this code with anyone.`
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
        console.log(`[WHATSAPP GATEWAY] WhatsApp OTP dispatched via Twilio to +${countryCode} ${maskPhoneNumber(phone)}`);
        return { success: true, provider: 'twilio_whatsapp', sid: data.sid };
      } else {
        console.warn(`[WHATSAPP GATEWAY WARN] Twilio WhatsApp dispatch returned error:`, data.message || response.statusText);
        return { success: false, provider: 'twilio_whatsapp', error: data.message };
      }
    } catch (err) {
      console.error(`[WHATSAPP GATEWAY ERROR] Twilio WhatsApp network error:`, err.message);
      return { success: false, provider: 'twilio_whatsapp', error: err.message };
    }
  }

  // 3. Fallback: Log to secure server console with instructions
  console.log(`\n======================================================`);
  console.log(`[WHATSAPP GATEWAY - SIMULATION MODE] To: +${countryCode} ${maskPhoneNumber(phone)}`);
  console.log(`[SECURITY OTP CODE] ${otp}`);
  console.log(`[CHANNEL] WhatsApp Business Messaging`);
  console.log(`[NOTE] Set WHATSAPP_ACCESS_TOKEN & WHATSAPP_PHONE_NUMBER_ID in .env for Meta Cloud API`);
  console.log(`[OR] Set TWILIO_WHATSAPP_FROM in .env for Twilio WhatsApp`);
  console.log(`[VALIDITY] 5 minutes. Never share this OTP with anyone.`);
  console.log(`======================================================\n`);

  return { success: true, provider: 'simulation', simulated: true };
}

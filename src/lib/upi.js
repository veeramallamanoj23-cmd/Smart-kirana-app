import QRCode from 'qrcode';

/**
 * Builds the official NPCI standard UPI payment URI
 * @param {Object} params
 * @param {string} params.vpa Payee UPI ID (e.g., smartkirana@okhdfcbank)
 * @param {string} params.name Payee Name (e.g., Smart Kirana Store)
 * @param {number} params.amount Exact payable amount
 * @param {string} params.orderId Unique Order reference ID
 * @param {string} [params.note] Payment description
 * @returns {string} upi://pay?...
 */
export function buildUpiUri({ vpa, name, amount, orderId, note }) {
  const cleanAmount = Number(amount).toFixed(2);
  const cleanNote = note || `Smart Kirana Order ${orderId}`;
  
  const params = new URLSearchParams({
    pa: vpa.trim(),
    pn: name.trim(),
    am: cleanAmount,
    tr: orderId,
    tn: cleanNote,
    cu: 'INR'
  });

  return `upi://pay?${params.toString()}`;
}

/**
 * Generates a Data URL for the QR code image
 * @param {string} text Text or UPI URI
 * @returns {Promise<string>} Base64 image Data URL
 */
export async function generateQrDataUrl(text) {
  try {
    return await QRCode.toDataURL(text, {
      width: 280,
      margin: 2,
      color: {
        dark: '#064e3b', // Deep brand forest green
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
    return '';
  }
}

/**
 * Format number into Indian Rupee format
 * @param {number} amount 
 * @returns {string} e.g. ₹1,249
 */
export function formatCurrency(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

const QRCode = require('qrcode');

/**
 * Generate standard UPI string and QR Data URL
 */
async function generatePaymentQr(amount, sessionCode, locationName = 'ParkSmart') {
  // UPI Standard format:
  // upi://pay?pa=<VPA>&pn=<PayeeName>&am=<Amount>&cu=INR&tn=<Note>
  const vpa = process.env.UPI_VPA || 'smartparking@icici';
  const payeeName = encodeURIComponent(process.env.UPI_PAYEE_NAME || locationName);
  const note = encodeURIComponent(`Parking Bill ${sessionCode}`);
  const formattedAmount = Number(amount).toFixed(2);

  const upiUrl = `upi://pay?pa=${vpa}&pn=${payeeName}&am=${formattedAmount}&cu=INR&tn=${note}`;

  try {
    const qrDataUrl = await QRCode.toDataURL(upiUrl, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 280,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });

    return {
      upiUrl,
      qrDataUrl,
      amount: formattedAmount,
      vpa,
      sessionCode,
    };
  } catch (error) {
    console.error('[QR Generation Error]:', error);
    throw new Error('Failed to generate payment QR code');
  }
}

module.exports = {
  generatePaymentQr,
};

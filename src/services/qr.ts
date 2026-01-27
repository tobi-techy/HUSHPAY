import QRCode from 'qrcode';
import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config';

const client = require('twilio')(config.twilio.accountSid, config.twilio.authToken);

// Configure Cloudinary
if (config.cloudinary.cloudName) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
  });
}

export async function sendWalletQR(phone: string, walletAddress: string): Promise<void> {
  console.log(`[sendWalletQR] Sending wallet to ${phone}`);
  
  try {
    // Generate QR code as buffer
    const qrBuffer = await QRCode.toBuffer(walletAddress, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    console.log(`[sendWalletQR] QR code generated`);

    // Upload to Cloudinary if configured
    if (config.cloudinary.cloudName) {
      console.log(`[sendWalletQR] Uploading to Cloudinary...`);
      
      const uploadResult = await new Promise<string>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'hushpay-qr', resource_type: 'image' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result!.secure_url);
          }
        ).end(qrBuffer);
      });

      console.log(`[sendWalletQR] Uploaded to: ${uploadResult}`);

      // Send with image
      const result = await client.messages.create({
        body: `Your wallet address:\n${walletAddress}`,
        from: `whatsapp:${config.twilio.whatsappNumber}`,
        to: `whatsapp:${phone}`,
        mediaUrl: [uploadResult]
      });

      console.log(`[sendWalletQR] Message sent with QR, SID: ${result.sid}`);
    } else {
      // Fallback to text only
      console.log(`[sendWalletQR] Cloudinary not configured, sending text only`);
      const result = await client.messages.create({
        body: `Your wallet address:\n\n${walletAddress}\n\nCopy this to receive payments.`,
        from: `whatsapp:${config.twilio.whatsappNumber}`,
        to: `whatsapp:${phone}`
      });
      
      console.log(`[sendWalletQR] Message sent, SID: ${result.sid}`);
    }
  } catch (err) {
    console.error('[sendWalletQR] Error:', err);
    // Fallback to text only
    try {
      await client.messages.create({
        body: `Your wallet address:\n${walletAddress}`,
        from: `whatsapp:${config.twilio.whatsappNumber}`,
        to: `whatsapp:${phone}`
      });
    } catch {}
  }
}

export async function generateQRCode(data: string): Promise<string> {
  return await QRCode.toDataURL(data, {
    width: 400,
    margin: 2,
  });
}

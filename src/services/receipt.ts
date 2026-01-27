import { createCanvas } from 'canvas';
import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config';
import QRCode from 'qrcode';

interface ReceiptData {
  amount: number;
  token: string;
  recipient: string;
  txSignature: string;
  timestamp: string;
  isPrivate: boolean;
  isAnonymous: boolean;
  isCrossChain?: boolean;
}

export async function generateReceipt(data: ReceiptData): Promise<string | null> {
  if (!config.cloudinary.cloudName) {
    console.log('[generateReceipt] Cloudinary not configured, skipping receipt');
    return null;
  }

  try {
    const canvas = createCanvas(600, 800);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, 600, 800);

    // Header
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Arial';
    ctx.fillText('HushPay Receipt', 50, 80);

    ctx.fillStyle = '#888888';
    ctx.font = '18px Arial';
    ctx.fillText('Quiet money moves 🤫', 50, 120);

    // Divider
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 150);
    ctx.lineTo(550, 150);
    ctx.stroke();

    // Amount
    ctx.fillStyle = '#00ff88';
    ctx.font = 'bold 48px Arial';
    const amountText = data.isPrivate ? '[PRIVATE]' : `${data.amount} ${data.token}`;
    ctx.fillText(amountText, 50, 220);

    // Details
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    
    ctx.fillText('To:', 50, 280);
    ctx.fillStyle = '#cccccc';
    ctx.font = '18px Arial';
    const recipientText = data.isAnonymous ? '[ANONYMOUS]' : data.recipient;
    ctx.fillText(recipientText, 50, 310);

    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.fillText('Date:', 50, 360);
    ctx.fillStyle = '#cccccc';
    ctx.font = '18px Arial';
    ctx.fillText(data.timestamp, 50, 390);

    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.fillText('Transaction:', 50, 440);
    ctx.fillStyle = '#cccccc';
    ctx.font = '14px Arial';
    ctx.fillText(data.txSignature.slice(0, 32) + '...', 50, 470);

    // Privacy badge
    if (data.isPrivate || data.isAnonymous || data.isCrossChain) {
      ctx.fillStyle = '#ff00ff';
      ctx.fillRect(50, 510, 250, 40);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px Arial';
      const badge = data.isCrossChain ? '🌉 CROSS-CHAIN' : data.isPrivate ? '🔒 PRIVATE' : '👤 ANONYMOUS';
      ctx.fillText(badge, 70, 537);
    }

    // QR Code
    const qrDataUrl = await QRCode.toDataURL(`https://solscan.io/tx/${data.txSignature}`, {
      width: 200,
      margin: 0,
    });
    
    const qrImage = await loadImage(qrDataUrl);
    ctx.drawImage(qrImage, 200, 580, 200, 200);

    ctx.fillStyle = '#888888';
    ctx.font = '14px Arial';
    ctx.fillText('Scan to view on Solscan', 220, 760);

    // Convert to buffer
    const buffer = canvas.toBuffer('image/png');

    // Upload to Cloudinary
    const uploadResult = await new Promise<string>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'hushpay-receipts', resource_type: 'image' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result!.secure_url);
        }
      ).end(buffer);
    });

    console.log(`[generateReceipt] Receipt uploaded: ${uploadResult}`);
    return uploadResult;
  } catch (err) {
    console.error('[generateReceipt] Error:', err);
    return null;
  }
}

async function loadImage(dataUrl: string): Promise<any> {
  const { loadImage } = await import('canvas');
  return loadImage(dataUrl);
}

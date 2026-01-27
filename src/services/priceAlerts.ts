import axios from 'axios';
import { db } from './database';
import { sendWhatsApp } from './twilio';

interface PriceAlert {
  phone: string;
  token: string;
  targetPrice: number;
  condition: 'above' | 'below';
}

const alerts: PriceAlert[] = [];
let priceCheckInterval: NodeJS.Timeout | null = null;

export function addPriceAlert(phone: string, token: string, targetPrice: number, condition: 'above' | 'below'): void {
  // Remove existing alert for same phone/token
  const index = alerts.findIndex(a => a.phone === phone && a.token.toUpperCase() === token.toUpperCase());
  if (index >= 0) {
    alerts.splice(index, 1);
  }

  alerts.push({ phone, token: token.toUpperCase(), targetPrice, condition });

  // Start price checking if not already running
  if (!priceCheckInterval) {
    startPriceChecking();
  }
}

export function removePriceAlert(phone: string, token: string): boolean {
  const index = alerts.findIndex(a => a.phone === phone && a.token.toUpperCase() === token.toUpperCase());
  if (index >= 0) {
    alerts.splice(index, 1);
    return true;
  }
  return false;
}

export function getPriceAlerts(phone: string): PriceAlert[] {
  return alerts.filter(a => a.phone === phone);
}

async function getCurrentPrice(token: string): Promise<number | null> {
  try {
    const tokenIds: Record<string, string> = {
      'SOL': 'solana',
      'USDC': 'usd-coin',
      'USDT': 'tether',
      'USD1': 'usd1',
    };

    const coinId = tokenIds[token.toUpperCase()];
    if (!coinId) return null;

    const { data } = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`);
    return data[coinId]?.usd || null;
  } catch {
    return null;
  }
}

async function checkPrices(): Promise<void> {
  if (alerts.length === 0) {
    stopPriceChecking();
    return;
  }

  const checkedTokens = new Set<string>();
  const triggeredAlerts: PriceAlert[] = [];

  for (const alert of alerts) {
    if (checkedTokens.has(alert.token)) continue;
    checkedTokens.add(alert.token);

    const currentPrice = await getCurrentPrice(alert.token);
    if (!currentPrice) continue;

    // Check all alerts for this token
    for (const a of alerts.filter(x => x.token === alert.token)) {
      const triggered = 
        (a.condition === 'above' && currentPrice >= a.targetPrice) ||
        (a.condition === 'below' && currentPrice <= a.targetPrice);

      if (triggered) {
        triggeredAlerts.push(a);
        try {
          await sendWhatsApp(
            a.phone,
            `🔔 Price Alert!\n\n${a.token} is now $${currentPrice.toFixed(2)}\n(Target: ${a.condition} $${a.targetPrice})`
          );
        } catch (err) {
          console.error('Failed to send price alert:', err);
        }
      }
    }
  }

  // Remove triggered alerts
  for (const alert of triggeredAlerts) {
    removePriceAlert(alert.phone, alert.token);
  }
}

function startPriceChecking(): void {
  if (priceCheckInterval) return;
  
  // Check prices every 5 minutes
  priceCheckInterval = setInterval(checkPrices, 5 * 60 * 1000);
  
  // Initial check
  checkPrices();
}

function stopPriceChecking(): void {
  if (priceCheckInterval) {
    clearInterval(priceCheckInterval);
    priceCheckInterval = null;
  }
}

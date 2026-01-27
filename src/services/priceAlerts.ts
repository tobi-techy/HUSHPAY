import axios from 'axios';
import { db } from './database';
import { sendWhatsApp } from './twilio';

let priceCheckInterval: NodeJS.Timeout | null = null;

export function addPriceAlert(phone: string, token: string, targetPrice: number, condition: 'above' | 'below'): void {
  db.addPriceAlert(phone, token, targetPrice, condition);
  if (!priceCheckInterval) startPriceChecking();
}

export function removePriceAlert(phone: string, token: string): boolean {
  db.removePriceAlert(phone, token);
  return true;
}

export function getPriceAlerts(phone: string) {
  return db.getPriceAlerts(phone);
}

async function getCurrentPrice(token: string): Promise<number | null> {
  try {
    const tokenIds: Record<string, string> = {
      'SOL': 'solana', 'USDC': 'usd-coin', 'USDT': 'tether', 'USD1': 'usd1',
    };
    const coinId = tokenIds[token.toUpperCase()];
    if (!coinId) return null;
    const { data } = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`);
    return data[coinId]?.usd || null;
  } catch { return null; }
}

async function checkPrices(): Promise<void> {
  const alerts = db.getAllPriceAlerts();
  if (alerts.length === 0) { stopPriceChecking(); return; }

  const priceCache: Record<string, number> = {};

  for (const alert of alerts) {
    if (!priceCache[alert.token]) {
      const price = await getCurrentPrice(alert.token);
      if (price) priceCache[alert.token] = price;
    }
    const currentPrice = priceCache[alert.token];
    if (!currentPrice) continue;

    const triggered = (alert.condition === 'above' && currentPrice >= alert.targetPrice) ||
                      (alert.condition === 'below' && currentPrice <= alert.targetPrice);

    if (triggered) {
      try {
        await sendWhatsApp(alert.phone, `🔔 Price Alert!\n\n${alert.token} is now $${currentPrice.toFixed(2)}\n(Target: ${alert.condition} $${alert.targetPrice})`);
      } catch {}
      db.removePriceAlert(alert.phone, alert.token);
    }
  }
}

function startPriceChecking(): void {
  if (priceCheckInterval) return;
  priceCheckInterval = setInterval(checkPrices, 5 * 60 * 1000);
  checkPrices();
}

function stopPriceChecking(): void {
  if (priceCheckInterval) { clearInterval(priceCheckInterval); priceCheckInterval = null; }
}

export function initPriceAlerts(): void {
  if (db.getAllPriceAlerts().length > 0) startPriceChecking();
}

export { priceCheckInterval };

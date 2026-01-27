import axios from 'axios';
import { config } from '../config';

const HELIUS_API = 'https://api.helius.xyz/v0';

let webhookId: string | null = null;

export async function registerWalletForNotifications(walletAddress: string): Promise<void> {
  if (!config.helius.apiKey) return;

  try {
    if (!webhookId) {
      // Create webhook if doesn't exist
      const { data } = await axios.post(`${HELIUS_API}/webhooks?api-key=${config.helius.apiKey}`, {
        webhookURL: `${config.server.baseUrl}/webhook/helius`,
        transactionTypes: ['TRANSFER'],
        accountAddresses: [walletAddress],
        webhookType: 'enhanced',
      });
      webhookId = data.webhookID;
    } else {
      // GET existing webhook to get current addresses
      const { data: existing } = await axios.get(`${HELIUS_API}/webhooks/${webhookId}?api-key=${config.helius.apiKey}`);
      const currentAddresses: string[] = existing.accountAddresses || [];
      
      // Only add if not already registered
      if (!currentAddresses.includes(walletAddress)) {
        // PUT with combined addresses (PUT replaces entire config)
        await axios.put(`${HELIUS_API}/webhooks/${webhookId}?api-key=${config.helius.apiKey}`, {
          webhookURL: `${config.server.baseUrl}/webhook/helius`,
          transactionTypes: ['TRANSFER'],
          accountAddresses: [...currentAddresses, walletAddress],
          webhookType: 'enhanced',
        });
      }
    }
  } catch (err: any) {
    console.error('Helius webhook error:', err.response?.data || err.message);
  }
}

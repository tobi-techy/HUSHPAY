import axios from 'axios';
import { config } from '../config';

export async function screenAddress(address: string): Promise<{ allowed: boolean; reason?: string }> {
  if (!config.range.apiKey) return { allowed: true }; // Skip if no API key

  try {
    const response = await axios.post(
      'https://api.range.org/v1/screen',
      { address },
      { headers: { 'Authorization': `Bearer ${config.range.apiKey}` } }
    );
    const risk = response.data.risk || 'low';
    if (risk === 'high' || risk === 'severe') {
      return { allowed: false, reason: 'Address flagged for compliance' };
    }
    return { allowed: true };
  } catch {
    return { allowed: true }; // Fail open for hackathon
  }
}

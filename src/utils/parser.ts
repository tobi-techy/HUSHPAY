import { Command } from '../types';

export function parseCommand(text: string): Command {
  const normalized = text.toLowerCase().trim();

  if (normalized === 'help' || normalized === 'start') {
    return { type: 'help' };
  }

  if (normalized === 'balance' || normalized === 'bal') {
    return { type: 'balance' };
  }

  if (normalized === 'receipt' || normalized === 'receipts' || normalized === 'history') {
    return { type: 'receipt' };
  }

  const sendPattern = /send\s+(\d+\.?\d*)\s+(\w+)\s+to\s+(\+?\d+)/i;
  const match = text.match(sendPattern);
  
  if (match) {
    const [, amount, token, phone] = match;
    return {
      type: 'send',
      amount: parseFloat(amount),
      token: token.toUpperCase(),
      recipientPhone: phone.startsWith('+') ? phone : `+${phone}`,
    };
  }

  return { type: 'unknown' };
}

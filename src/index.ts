import express from 'express';
import { config } from './config';
import { db } from './services/database';
import { chat } from './services/ai';
import { getOrCreateUser, getBalance, getKeypair } from './services/wallet';
import { screenAddress } from './services/range';
import { privateTransfer } from './services/shadowwire';
import { sendSms } from './services/twilio';
import type { PaymentIntent } from './types';

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const WELCOME_MSG = `Welcome to HushPay! 🤫

Send private payments via text. Your wallet is ready.

Try:
• "send 50 usd1 to +1234567890"
• "what's my balance?"
• "show my receipts"

Amounts are hidden on-chain. Quiet money moves.`;

// Twilio SMS webhook
app.post('/sms', async (req, res) => {
  const from = req.body.From;
  const body = req.body.Body?.trim() || '';

  console.log(`SMS from ${from}: ${body}`);

  try {
    // Get or create user
    const { user, isNew } = await getOrCreateUser(from);

    // Send welcome message for new users
    if (isNew) {
      res.type('text/xml').send(`<Response><Message>${WELCOME_MSG}</Message></Response>`);
      return;
    }

    // Check for pending transfer confirmation
    const isConfirm = /^(yes|confirm|y)$/i.test(body);
    if (isConfirm) {
      const pending = db.getPendingTransfer(from);
      if (pending) {
        const reply = await executeTransfer(from, pending);
        res.type('text/xml').send(`<Response><Message>${reply}</Message></Response>`);
        return;
      }
    }

    // Process with AI
    const { reply, intent } = await chat(from, body);

    // Handle intents
    let response = reply;

    if (intent?.action === 'check_balance') {
      const { sol, usd1 } = await getBalance(user.walletAddress);
      response = `Your balance:\n• ${usd1.toFixed(2)} USD1\n• ${sol.toFixed(4)} SOL\n\nWallet: ${user.walletAddress.slice(0, 8)}...`;
      db.saveMessage(from, 'assistant', response);
    } else if (intent?.action === 'get_receipts') {
      const transfers = db.getTransfers(from, 5);
      if (transfers.length === 0) {
        response = "No payments yet. Send your first one!";
      } else {
        response = "Recent payments:\n" + transfers.map(t => {
          const dir = t.senderPhone === from ? '→' : '←';
          const other = t.senderPhone === from ? t.recipientPhone : t.senderPhone;
          return `${dir} ${t.amount} ${t.token} ${other.slice(-4)} (${t.status})`;
        }).join('\n');
      }
      db.saveMessage(from, 'assistant', response);
    } else if (intent?.action === 'send_payment') {
      const p = intent as PaymentIntent;
      db.savePendingTransfer(from, p.recipientPhone, p.amount, p.token);
      // reply already set by AI
    }

    res.type('text/xml').send(`<Response><Message>${response}</Message></Response>`);
  } catch (err) {
    console.error('Error:', err);
    res.type('text/xml').send(`<Response><Message>Something went wrong. Try again.</Message></Response>`);
  }
});

async function executeTransfer(senderPhone: string, pending: { recipientPhone: string; amount: number; token: string }): Promise<string> {
  const sender = db.getUser(senderPhone);
  if (!sender) return 'Error: User not found';

  // Get or create recipient
  const { user: recipient } = await getOrCreateUser(pending.recipientPhone);

  // Screen addresses
  const senderScreen = await screenAddress(sender.walletAddress);
  const recipientScreen = await screenAddress(recipient.walletAddress);

  if (!senderScreen.allowed) return `Transfer blocked: ${senderScreen.reason}`;
  if (!recipientScreen.allowed) return `Transfer blocked: ${recipientScreen.reason}`;

  // Create transfer record
  const transferId = db.createTransfer(senderPhone, pending.recipientPhone, pending.amount, pending.token);

  // Execute private transfer
  const keypair = getKeypair(sender);
  const result = await privateTransfer(keypair, recipient.walletAddress, pending.amount, pending.token);

  if (result.success) {
    db.updateTransfer(transferId, 'confirmed', result.txSignature);

    // Notify recipient
    try {
      await sendSms(pending.recipientPhone, `You received ${pending.amount} ${pending.token} from ${senderPhone.slice(-4)}! 🎉\n\nText "balance" to check.`);
    } catch {}

    return `✓ Sent ${pending.amount} ${pending.token} to ${pending.recipientPhone}\n\nTx: ${result.txSignature?.slice(0, 16)}...`;
  } else {
    db.updateTransfer(transferId, 'failed');
    console.error('Transfer failed:', result.error);
    return `Transfer failed: ${result.error}`;
    return `Transfer failed: ${result.error}`;
  }
}

// Helius webhook for tx confirmations
app.post('/webhook/helius', async (req, res) => {
  const events = req.body;
  for (const event of Array.isArray(events) ? events : [events]) {
    console.log('Helius webhook:', event.type, event.signature);
    // TODO: Update transfer status and notify users
  }
  res.sendStatus(200);
});

// Health check
app.get('/', (req, res) => res.send('HushPay SMS Bot Running'));

app.listen(config.server.port, () => {
  console.log(`HushPay running on port ${config.server.port}`);
});

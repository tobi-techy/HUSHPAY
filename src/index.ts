import express from 'express';
import { config } from './config';
import { db } from './services/database';
import { chat } from './services/ai';
import { getOrCreateUser, getBalance, getKeypair } from './services/wallet';
import { screenAddress } from './services/range';
import { privateTransfer } from './services/shadowwire';
import { getPrivateBalance, depositToPrivate, anonymousSend } from './services/privacycash';
import { sendSms, sendWhatsApp, sendTypingIndicator } from './services/twilio';
import type { PaymentIntent, AnonSendIntent, DepositIntent, WithdrawIntent } from './types';

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const WELCOME_MSG = `Welcome to HushPay! 🤫

Your wallet is ready. Two ways to send:
• "send 1 sol to +234..." (amount hidden)
• "send anon 1 sol to [wallet]" (sender hidden)

Commands: balance, deposit, withdraw, receipts, help`;

async function handleMessage(from: string, body: string, channel: 'sms' | 'whatsapp'): Promise<string> {
  const { user, isNew } = await getOrCreateUser(from);

  if (isNew) return WELCOME_MSG;

  // Check for pending action confirmation
  const isConfirm = /^(yes|confirm|y)$/i.test(body);
  if (isConfirm) {
    const pending = db.getPendingAction(from);
    if (pending) {
      return await executePendingAction(from, pending, channel);
    }
  }

  const { reply, intent } = await chat(from, body);
  let response = reply;

  if (intent?.action === 'check_balance') {
    const { sol, usd1 } = await getBalance(user.walletAddress);
    const privateSol = await getPrivateBalance(user.encryptedPrivateKey, 'SOL');
    response = `Your balance:\n\n📊 Public:\n• ${sol.toFixed(4)} SOL\n• ${usd1.toFixed(2)} USD1\n\n🔒 Private Pool:\n• ${privateSol.toFixed(4)} SOL\n\nWallet: ${user.walletAddress.slice(0, 8)}...`;
    db.saveMessage(from, 'assistant', response);
  } else if (intent?.action === 'get_wallet') {
    response = `Your wallet address:\n${user.walletAddress}`;
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
    db.savePendingAction(from, 'send_payment', { recipientPhone: p.recipientPhone, amount: p.amount, token: p.token });
  } else if (intent?.action === 'anon_send') {
    const p = intent as AnonSendIntent;
    db.savePendingAction(from, 'anon_send', { recipientWallet: p.recipientWallet, amount: p.amount, token: p.token });
  } else if (intent?.action === 'deposit') {
    const p = intent as DepositIntent;
    db.savePendingAction(from, 'deposit', { amount: p.amount, token: p.token });
  } else if (intent?.action === 'withdraw') {
    const p = intent as WithdrawIntent;
    db.savePendingAction(from, 'withdraw', { amount: p.amount, token: p.token });
  }

  return response;
}

async function executePendingAction(phone: string, pending: { action: string; data: any }, channel: 'sms' | 'whatsapp'): Promise<string> {
  const user = db.getUser(phone);
  if (!user) return 'Error: User not found';

  db.clearPendingAction(phone);

  if (pending.action === 'send_payment') {
    return await executeSendPayment(phone, user, pending.data, channel);
  } else if (pending.action === 'anon_send') {
    return await executeAnonSend(user, pending.data);
  } else if (pending.action === 'deposit') {
    return await executeDeposit(user, pending.data);
  } else if (pending.action === 'withdraw') {
    return await executeWithdraw(user, pending.data);
  }

  return 'Unknown action';
}

async function executeSendPayment(senderPhone: string, sender: any, data: { recipientPhone: string; amount: number; token: string }, channel: 'sms' | 'whatsapp'): Promise<string> {
  const { user: recipient } = await getOrCreateUser(data.recipientPhone);

  const senderScreen = await screenAddress(sender.walletAddress);
  const recipientScreen = await screenAddress(recipient.walletAddress);
  if (!senderScreen.allowed) return `Transfer blocked: ${senderScreen.reason}`;
  if (!recipientScreen.allowed) return `Transfer blocked: ${recipientScreen.reason}`;

  const transferId = db.createTransfer(senderPhone, data.recipientPhone, data.amount, data.token);
  const keypair = getKeypair(sender);
  const result = await privateTransfer(keypair, recipient.walletAddress, data.amount, data.token);

  if (result.success) {
    db.updateTransfer(transferId, 'confirmed', result.txSignature);
    try {
      const notify = channel === 'whatsapp' ? sendWhatsApp : sendSms;
      await notify(data.recipientPhone, `💰 You received ${data.amount} ${data.token}!\nFrom: ${senderPhone.slice(-4)}\n\nText "balance" to check.`);
    } catch {}
    return `✓ Sent ${data.amount} ${data.token} to ${data.recipientPhone}\nAmount: [PRIVATE]\nTx: ${result.txSignature?.slice(0, 16)}...`;
  } else {
    db.updateTransfer(transferId, 'failed');
    return `Transfer failed: ${result.error}`;
  }
}

async function executeAnonSend(user: any, data: { recipientWallet: string; amount: number; token: string }): Promise<string> {
  const result = await anonymousSend(user.encryptedPrivateKey, data.amount, data.recipientWallet, data.token);

  if (result.success) {
    return `✓ Sent ${data.amount} ${data.token} anonymously\nSender: [UNTRACEABLE]\nTx: ${result.txSignature?.slice(0, 16)}...`;
  } else {
    return `Anonymous send failed: ${result.error}`;
  }
}

async function executeDeposit(user: any, data: { amount: number; token: string }): Promise<string> {
  const result = await depositToPrivate(user.encryptedPrivateKey, data.amount, data.token);

  if (result.success) {
    const newBalance = await getPrivateBalance(user.encryptedPrivateKey, data.token);
    return `✓ Deposited ${data.amount} ${data.token} to private pool\nPrivate balance: ${newBalance.toFixed(4)} ${data.token}`;
  } else {
    return `Deposit failed: ${result.error}`;
  }
}

async function executeWithdraw(user: any, data: { amount: number; token: string }): Promise<string> {
  const { withdrawFromPrivate } = await import('./services/privacycash');
  const result = await withdrawFromPrivate(user.encryptedPrivateKey, data.amount, user.walletAddress, data.token);

  if (result.success) {
    return `✓ Withdrew ${data.amount} ${data.token} to public wallet\nTx: ${result.txSignature?.slice(0, 16)}...`;
  } else {
    return `Withdraw failed: ${result.error}`;
  }
}

// SMS webhook
app.post('/sms', async (req, res) => {
  const from = req.body.From;
  const body = req.body.Body?.trim() || '';
  console.log(`SMS from ${from}: ${body}`);

  try {
    const response = await handleMessage(from, body, 'sms');
    res.type('text/xml').send(`<Response><Message>${response}</Message></Response>`);
  } catch (err) {
    console.error('SMS Error:', err);
    res.type('text/xml').send(`<Response><Message>Something went wrong. Try again.</Message></Response>`);
  }
});

// WhatsApp webhook
app.post('/whatsapp', async (req, res) => {
  const from = req.body.From?.replace('whatsapp:', '') || '';
  const body = req.body.Body?.trim() || '';
  console.log(`WhatsApp from ${from}: ${body}`);

  // Send immediate empty response, then process async
  res.sendStatus(200);

  try {
    await sendTypingIndicator(from);
    const response = await handleMessage(from, body, 'whatsapp');
    await sendWhatsApp(from, response);
  } catch (err) {
    console.error('WhatsApp Error:', err);
    await sendWhatsApp(from, 'Something went wrong. Try again.');
  }
});

// Helius webhook
app.post('/webhook/helius', async (req, res) => {
  try {
    const events = Array.isArray(req.body) ? req.body : [req.body];
    for (const event of events) {
      if (event.type === 'TRANSFER' && event.nativeTransfers?.length) {
        for (const transfer of event.nativeTransfers) {
          const user = db.getUserByWallet(transfer.toUserAccount);
          if (user) {
            const amount = (transfer.amount / 1e9).toFixed(4);
            try { await sendWhatsApp(user.phone, `💰 You received ${amount} SOL!\n\nText "balance" to check.`); } catch {}
          }
        }
      }
    }
  } catch (err) {
    console.error('Helius webhook error:', err);
  }
  res.sendStatus(200);
});

app.get('/', (req, res) => res.send('HushPay Running'));

app.listen(config.server.port, () => {
  console.log(`HushPay running on port ${config.server.port}`);
});
